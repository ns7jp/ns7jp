import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { digest, blobHash } from '../../portfolio-audit/scripts/github.mjs';
import { catalog, draftProtocol, register, protocolDigest } from '../innovation.mjs';
import { discoveryConfig, limits, emptyRegistry, extractSignals, discover, strategy,
  runDiscovery, recordFeedback, dismissCandidate, validateRegistry } from '../discovery.mjs';
import { D1_SOURCE_PATH, D1_MODEL_SOURCE_SHA256 } from '../probes.mjs';

const now = '2026-09-09T01:00:00Z';
const cli = fileURLToPath(new URL('../discovery.mjs', import.meta.url));
const json = value => JSON.stringify(value, null, 2) + '\n';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const temp = () => mkdtempSync(join(tmpdir(), 'innovation-discovery-fixture-'));
// Reviewed D-1 source copied as inert bytes; never imported or executed.
const reviewedD1Source = "#!/usr/bin/env bash\r\n# D-1: プロセスダウン → 自動復旧演習\r\n#\r\n# 指定したサービスのコンテナを SIGKILL し、`/healthz` 200 が復活するまでの\r\n# 所要時間を計測する。月次演習の自動ランナー。\r\n#\r\n# 使い方:\r\n#   scripts/drills/d1-process-down.sh [--service app] [--healthz URL] [--timeout 300]\r\n#                                      [--project-dir /opt/server-monitor]\r\n#\r\n# 出力:\r\n#   人間向けサマリーを stdout、機械可読 JSON を最終行に \"RESULT_JSON=\" で出力。\r\n#   Slack 演習チャンネルへのコピペとログ作成の双方に使える。\r\n\r\nset -euo pipefail\r\n\r\nSERVICE=\"app\"\r\nHEALTHZ_URL=\"http://127.0.0.1:8080/healthz\"\r\nTIMEOUT_SECONDS=300\r\nPROJECT_DIR=\".\"\r\n\r\nusage() {\r\n  cat <<EOF\r\nUsage: $0 [--service SERVICE] [--healthz URL] [--timeout SECONDS] [--project-dir DIR]\r\n\r\n  --service   compose サービス名 (default: app)\r\n  --healthz   復旧判定用の URL (default: http://127.0.0.1:8080/healthz)\r\n  --timeout   復旧待ち上限秒 (default: 300)\r\n  --project-dir  compose.yaml がある directory (default: current directory)\r\n  --help      このヘルプ\r\nEOF\r\n}\r\n\r\nwhile [[ $# -gt 0 ]]; do\r\n  case \"$1\" in\r\n    --service)  SERVICE=\"$2\"; shift 2 ;;\r\n    --healthz)  HEALTHZ_URL=\"$2\"; shift 2 ;;\r\n    --timeout)  TIMEOUT_SECONDS=\"$2\"; shift 2 ;;\r\n    --project-dir) PROJECT_DIR=\"$2\"; shift 2 ;;\r\n    --help|-h)  usage; exit 0 ;;\r\n    *) echo \"unknown arg: $1\" >&2; usage; exit 1 ;;\r\n  esac\r\ndone\r\n\r\nlog() {\r\n  printf '[%s] %s\\n' \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\" \"$*\"\r\n}\r\n\r\nrequire_cmd() {\r\n  command -v \"$1\" >/dev/null 2>&1 || { echo \"missing command: $1\" >&2; exit 1; }\r\n}\r\n\r\nrequire_cmd docker\r\nrequire_cmd curl\r\nrequire_cmd sudo\r\n\r\n# docker compose v2 plugin を想定（v1 docker-compose も後方互換）\r\nif docker compose version >/dev/null 2>&1; then\r\n  COMPOSE=(docker compose --project-directory \"$PROJECT_DIR\")\r\nelif command -v docker-compose >/dev/null 2>&1; then\r\n  COMPOSE=(docker-compose --project-directory \"$PROJECT_DIR\")\r\nelse\r\n  echo \"docker compose plugin が見つからない\" >&2\r\n  exit 1\r\nfi\r\n\r\nlog \"サービス: $SERVICE  healthz: $HEALTHZ_URL  timeout: ${TIMEOUT_SECONDS}s\"\r\n\r\n# 0. 事前確認: サービスが稼働しており healthz が 200 を返すこと\r\nlog \"事前確認: ${HEALTHZ_URL}\"\r\nif ! curl -fsS --max-time 5 \"$HEALTHZ_URL\" >/dev/null; then\r\n  log \"事前確認 NG: ${HEALTHZ_URL} が 200 を返さない。compose を起動してから再実行する。\"\r\n  exit 2\r\nfi\r\n\r\nCID=$(\"${COMPOSE[@]}\" ps -q \"$SERVICE\")\r\nif [[ -z \"$CID\" ]]; then\r\n  echo \"コンテナが見つからない: ${SERVICE}\" >&2\r\n  exit 2\r\nfi\r\n\r\nrestart_count() {\r\n  docker inspect -f '{{.RestartCount}}' \"$CID\"\r\n}\r\n\r\nBEFORE_RESTART=$(restart_count)\r\nlog \"事前 restart_count(${SERVICE})=${BEFORE_RESTART}\"\r\n\r\n# 1. 障害発生: コンテナ内部の PID 1 を、ホスト側の名前空間から直接 kill する。\r\n#\r\n# `docker compose kill` / `docker kill` は Docker Engine の kill API を経由するため\r\n# 実際にプロセスは死ぬが、デーモン内部で「手動停止」フラグが立ち、unless-stopped に\r\n# よる自動復旧が無効化されてしまう（Docker の仕様。再起動ポリシーは「明示的に\r\n# stop/kill された」場合と「予期せず落ちた」場合を区別しており、Engine の kill/stop\r\n# API を通ったものはすべて前者として扱われる）。\r\n# 代わりに `docker exec <container> kill -9 1` のように PID 名前空間の内側から送っても、\r\n# カーネルが「同一名前空間内から init(PID 1) へ送られた、ハンドラ未設定のシグナル」を\r\n# 黙って破棄するため、そもそも届かない（man 7 pid_namespaces）。\r\n# 両方を回避するため、コンテナプロセスのホスト側 PID に対して直接 kill(1) を実行する。\r\nHOST_PID=$(docker inspect -f '{{.State.Pid}}' \"$CID\")\r\nKILL_TS_EPOCH=$(date -u +%s)\r\nlog \"障害発生: kill -9 ${HOST_PID} (${SERVICE} のホスト側 PID)\"\r\nsudo kill -9 \"$HOST_PID\"\r\n\r\n# 2. 復旧待ち\r\nATTEMPT=0\r\nSUCCESS=0\r\nRECOVER_TS_EPOCH=0\r\nwhile :; do\r\n  ATTEMPT=$((ATTEMPT + 1))\r\n  if curl -fsS --max-time 3 \"$HEALTHZ_URL\" >/dev/null 2>&1; then\r\n    SUCCESS=1\r\n    RECOVER_TS_EPOCH=$(date -u +%s)\r\n    break\r\n  fi\r\n  NOW_EPOCH=$(date -u +%s)\r\n  ELAPSED=$((NOW_EPOCH - KILL_TS_EPOCH))\r\n  if [[ \"$ELAPSED\" -ge \"$TIMEOUT_SECONDS\" ]]; then\r\n    log \"タイムアウト: ${TIMEOUT_SECONDS} 秒以内に復旧しなかった\"\r\n    break\r\n  fi\r\n  if (( ATTEMPT % 5 == 0 )); then\r\n    log \"復旧待ち... ${ELAPSED}s 経過 (attempts=${ATTEMPT})\"\r\n  fi\r\n  sleep 1\r\ndone\r\n\r\n# 3. 計測結果\r\nif [[ \"$SUCCESS\" -eq 1 ]]; then\r\n  RECOVER_SECONDS=$((RECOVER_TS_EPOCH - KILL_TS_EPOCH))\r\n  log \"復旧完了: ${RECOVER_SECONDS} 秒\"\r\nelse\r\n  RECOVER_SECONDS=-1\r\nfi\r\n\r\n# 4. ポストチェック: restart count とコンテナ状態\r\nAFTER_RESTART=$(restart_count)\r\nlog \"事後 restart_count(${SERVICE})=${AFTER_RESTART}\"\r\n\r\n# 5. 評価\r\nRTO_TARGET=300   # 設計書: RTO 5 分以内\r\nif [[ \"$SUCCESS\" -eq 1 && \"$RECOVER_SECONDS\" -le \"$RTO_TARGET\" ]]; then\r\n  VERDICT=\"PASS\"\r\nelse\r\n  VERDICT=\"FAIL\"\r\nfi\r\n\r\n# 6. サマリー\r\nKILL_TS_ISO=$(date -u -d \"@$KILL_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \\\r\n  || date -u -r \"$KILL_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ')\r\nRECOVER_TS_ISO=\"n/a\"\r\nif [[ \"$RECOVER_TS_EPOCH\" -gt 0 ]]; then\r\n  RECOVER_TS_ISO=$(date -u -d \"@$RECOVER_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \\\r\n    || date -u -r \"$RECOVER_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ')\r\nfi\r\n\r\ncat <<SUMMARY\r\n\r\n================ D-1 drill summary ================\r\nservice           : $SERVICE\r\nhealthz           : $HEALTHZ_URL\r\nkill_at           : $KILL_TS_ISO\r\nrecover_at        : $RECOVER_TS_ISO\r\nrecover_seconds   : $RECOVER_SECONDS\r\nrto_target_seconds: $RTO_TARGET\r\nrestart_count     : $BEFORE_RESTART -> $AFTER_RESTART\r\nverdict           : $VERDICT\r\n===================================================\r\n\r\n次の手順:\r\n1. このサマリーを Slack 演習チャンネルに貼る (docs/incident-comms.md)\r\n2. docs/drill-template.md をコピーして docs/drills/logs/$(date -u +%Y-%m-%d)-D-1.md を作る\r\n3. 発見事項と改善アクションを記入して PR\r\n\r\nSUMMARY\r\n\r\nprintf 'RESULT_JSON={\"service\":\"%s\",\"verdict\":\"%s\",\"recover_seconds\":%s,\"rto_target_seconds\":%s,\"restart_count_before\":\"%s\",\"restart_count_after\":\"%s\",\"kill_at\":\"%s\",\"recover_at\":\"%s\"}\\n' \\\r\n  \"$SERVICE\" \"$VERDICT\" \"$RECOVER_SECONDS\" \"$RTO_TARGET\" \"$BEFORE_RESTART\" \"$AFTER_RESTART\" \"$KILL_TS_ISO\" \"$RECOVER_TS_ISO\"\r\n\r\n[[ \"$VERDICT\" == \"PASS\" ]]\r\n";
const recoveryLine = '復旧作業では手動の再確認を繰り返しており、同じ判断に時間がかかる。';
const backupLine = 'バックアップ復元の結果と元データの整合性について、比較条件は未確認である。';
const handoverLine = '引き渡し時の説明と確認結果に不一致があり、判断に使った根拠を共有できていない。';
function context(at = now, closed = catalog.experiments.map(c => c.id)) {
  return { schema_version: 1, reviewed_at: at, occupied: false, closed };
}
function setSource(snapshot, repository, path, text) {
  const repo = snapshot.repositories.find(r => r.full_name === repository);
  repo.files[path] = { text, sha256: digest(text), blob_sha: blobHash(Buffer.from(text)),
    url: `https://github.com/${repository}/blob/${repo.head_sha}/${path}` };
}
// Every source and every outcome below is an isolated test fixture. No VM or server is used.
function snapshot(at = now, { probe = false, signals = true } = {}) {
  const value = { schema_version: 2, observed_at: at, completed_at: at, kind: 'github-api-read-only',
    collection_complete: true, errors: [], repositories: discoveryConfig.repositories.map(spec => ({
      ...spec, head_sha: 'a'.repeat(40), tree_paths: [...spec.files], open_prs: [],
      ci_runs: [{ head_sha: 'a'.repeat(40), status: 'completed', conclusion: 'success' }], files: {}
    })) };
  for (const spec of discoveryConfig.repositories) for (const path of spec.files) setSource(value, spec.full_name, path, '# Inert fixture');
  setSource(value, 'ns7jp/server', 'docs/evidence/README.md', catalog.experiments.map(c => c.marker).join('\n'));
  if (signals) {
    setSource(value, 'ns7jp/server', 'README.md', '# Fixture\n' + recoveryLine);
    setSource(value, 'ns7jp/server', 'docs/backup-restore.md', '# Fixture\n' + backupLine);
    setSource(value, 'ns7jp/ns7jp', 'docs/target-roles.md', '# Fixture\n' + handoverLine);
  }
  if (probe) setSource(value, 'ns7jp/server', D1_SOURCE_PATH, reviewedD1Source);
  return value;
}
function saved(root, pointer = read(join(root, 'latest.json'))) {
  return { pointer, state: read(join(root, pointer.state_path)), result: read(join(root, pointer.result_path)) };
}
function started(at = now) {
  const root = temp(), source = snapshot(at);
  runDiscovery({ snapshot: source, context: context(at), outputDir: root, now: at });
  return { root, source, ...saved(root) };
}
// These constructed values intentionally exercise the measured-input validator. They are
// synthetic test data, confined to temporary folders, and never saved to real learning state.
function measurement(candidate, { decision = 'PROMISING', dataKind = 'measured', at = now } = {}) {
  const root = temp(), end = Date.parse(at), stamp = offset => new Date(end + offset * 60000).toISOString();
  const manifest = json({ fixture_only: true, environment: 'synthetic unit fixture', load: 'fixed' });
  writeFileSync(join(root, 'context.json'), manifest);
  const draft = draftProtocol({ ...candidate, base_sha: 'a'.repeat(40) }, stamp(-30));
  Object.assign(draft, { candidate_sha: 'b'.repeat(40), environment_id: 'synthetic-unit-fixture',
    context_sha256: digest(manifest), scope: 'UNIT FIXTURE ONLY; no server execution' });
  const protocol = register(draft, stamp(-29)), runs = [];
  for (let pair = 1; pair <= 3; pair++) for (const variant of ['baseline', 'candidate']) {
    const candidateValue = candidate.metric.direction === 'higher' ? 130 : 70;
    const value = variant === 'baseline' ? 100 : candidateValue;
    const artifactPath = `${pair}-${variant}.json`, bytes = json({ fixture_only: true, pair, variant, value });
    writeFileSync(join(root, artifactPath), bytes);
    const minute = -25 + pair * 2 + (variant === 'candidate' ? 1 : 0);
    runs.push({ pair, variant, revision: protocol[variant + '_sha'], environment_id: protocol.environment_id,
      context_sha256: protocol.context_sha256, started_at: stamp(minute), finished_at: stamp(minute + 0.5), status: 'PASS', value,
      guardrails: { functional_acceptance: 1, data_integrity: 1, unexpected_exposure: 0 }, artifact: { path: artifactPath, sha256: digest(bytes) } });
  }
  if (decision === 'REJECT') runs[0].guardrails.data_integrity = 0;
  if (decision === 'NOT_READY') runs.pop();
  return { protocol, results: { schema_version: 1, protocol_sha256: protocolDigest(protocol), data_kind: dataKind, runs }, evidenceDir: root };
}
function feedback(run, options = {}) {
  const candidate = run.state.candidates.find(c => c.operator === 'invert') ?? run.state.candidates[0];
  const input = measurement(candidate, options);
  const pointer = recordFeedback({ outputDir: run.root, ...input, now });
  return { candidate, input, ...saved(run.root, pointer) };
}
function custom(signal, overrides = {}) {
  return { signal_id: signal.id, title: '独自の対応表比較', hypothesis: '時系列と担当者の対応表を追加すると原因調査の所要時間を短縮できる。',
    change: '同じ記録を使い、担当者欄の有無だけを変えて判定時間を比較する。', paths: [signal.source_path],
    metric: { name: '原因判定時間', unit: 'seconds', direction: 'lower', target_percent: 15 },
    rollback: '比較用の担当者欄だけを戻し、全記録を保存する。', ...overrides };
}

test('text signals preserve exact provenance and classify friction, uncertainty and failure', () => {
  const source = snapshot(), signals = extractSignals(source, { probes: [] });
  for (const [excerpt, kind, theme] of [[recoveryLine, 'friction', 'recovery'], [backupLine, 'uncertainty', 'integrity'], [handoverLine, 'failure', 'handover']]) {
    const signal = signals.find(s => s.excerpt === excerpt); assert.ok(signal);
    const file = source.repositories.find(r => r.full_name === signal.repository).files[signal.source_path];
    assert.equal(signal.kind, kind); assert.equal(signal.theme, theme); assert.equal(signal.source_sha256, file.sha256);
    assert.equal(file.text.split('\n')[signal.source_line - 1], signal.marker); assert.equal(signal.source, file.url);
  }
});
test('ambiguous repeated lines, fenced code and markup do not manufacture text signals', () => {
  const source = snapshot(now, { signals: false });
  setSource(source, 'ns7jp/server', 'README.md', ['# ' + recoveryLine, recoveryLine, recoveryLine, '```', backupLine, '```', '<p>' + handoverLine + '</p>'].join('\n'));
  const signals = extractSignals(source, { probes: [] }); assert.equal(signals.length, 0);
});
test('active modeled counterexamples become grounded questions while server execution remains NOT_RUN', () => {
  assert.equal(digest(reviewedD1Source.replace(/\r\n/g, '\n')), D1_MODEL_SOURCE_SHA256);
  const x = discover(snapshot(now, { probe: true, signals: false }), context(), emptyRegistry(), { now });
  assert.ok(x.result.probes.probes.every(p => p.model_status === 'SUPPORTED' && p.cases.length > 0));
  assert.ok(x.result.signals.some(s => s.origin === 'probe' && s.kind === 'counterexample' && /^[a-f0-9]{64}$/.test(s.evidence_key)));
  assert.ok(x.state.candidates.some(c => c.provenance.origin === 'probe'));
  assert.equal(x.result.runtime_status, 'NOT_RUN'); assert.equal(x.result.authorization, 'NONE');
  assert.ok(x.result.plan.queue.every(c => c.runtime_status === 'NOT_RUN' && c.publication_allowed === false));
});
test('finishing all eight seeds replenishes new candidates and creates an existing-format draft', () => {
  const run = started(); assert.equal(run.result.added.length, limits.new_candidates);
  assert.match(run.pointer.selected, /^INV-[a-f0-9]{16}$/);
  assert.ok(run.result.plan.queue.filter(c => catalog.experiments.some(s => s.id === c.id)).every(c => c.state === 'CLOSED_BY_RECORD'));
  const draft = read(join(run.root, dirname(run.pointer.state_path), 'protocol.draft.json'));
  assert.equal(draft.candidate_id, run.pointer.selected); assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.environment_id, 'NOT SET'); assert.equal(draft.registered_at, null);
});
test('operators diversify across fresh rounds while discovery does not mutate its input registry', () => {
  const initial = emptyRegistry(), first = discover(snapshot(), context(), initial, { now });
  assert.deepEqual(initial, emptyRegistry());
  const later = '2026-09-09T01:01:00Z', second = discover(snapshot(later), context(later), first.state, { now: later });
  assert.ok(new Set(second.state.candidates.map(c => c.operator)).size >= 3);
  assert.equal(first.state.candidates.length, 4); assert.equal(second.state.candidates.length, 8);
});
test('the same snapshot has stable candidates, fingerprints and notification identity', () => {
  const run = started(), before = json(run.state);
  const pointer = runDiscovery({ snapshot: run.source, context: context(), outputDir: run.root, now });
  const repeated = saved(run.root, pointer);
  assert.equal(pointer.notify, false); assert.equal(pointer.fingerprint, run.pointer.fingerprint);
  assert.deepEqual(repeated.result.added, []); assert.equal(json(repeated.state), before);
  const drafts = readdirSync(join(run.root, 'runs')).filter(path => existsSync(join(run.root, 'runs', path, 'protocol.draft.json')));
  assert.equal(drafts.length, 1);
});
test('an unrelated HEAD update stays quiet and its unchanged source revision can support feedback', () => {
  const root = temp(); let source, at;
  for (let round = 0; round < 3; round++) {
    at = `2026-09-09T01:0${round}:00Z`; source = snapshot(at);
    runDiscovery({ snapshot: source, context: context(at), outputDir: root, now: at });
  }
  const before = saved(root), candidate = before.state.candidates[0];
  for (const repo of source.repositories) {
    repo.head_sha = 'c'.repeat(40); repo.ci_runs[0].head_sha = repo.head_sha;
    for (const [path, file] of Object.entries(repo.files)) file.url = `https://github.com/${repo.full_name}/blob/${repo.head_sha}/${path}`;
  }
  const pointer = runDiscovery({ snapshot: source, context: context(at), outputDir: root, now: at });
  assert.equal(pointer.notify, false); assert.equal(pointer.fingerprint, before.pointer.fingerprint);
  assert.deepEqual(saved(root).state.candidates.find(c => c.id === candidate.id).observed_revisions, ['a'.repeat(40), 'c'.repeat(40)]);
  const input = measurement(candidate, { at }); input.protocol.baseline_sha = 'c'.repeat(40);
  input.results.runs.filter(r => r.variant === 'baseline').forEach(r => { r.revision = input.protocol.baseline_sha; });
  input.results.protocol_sha256 = protocolDigest(input.protocol);
  recordFeedback({ outputDir: root, ...input, now: at });
  assert.equal(saved(root).state.feedback[0].decision, 'PROMISING');
});
test('backlog growth is bounded and a fresh round cannot exceed the configured open limit', () => {
  let state = emptyRegistry(), last;
  for (let round = 0; round < 6; round++) {
    const at = `2026-09-09T01:0${round}:00Z`;
    last = discover(snapshot(at), context(at), state, { now: at }); state = last.state;
    assert.ok(last.result.added.length <= limits.new_candidates); assert.ok(state.candidates.length <= limits.open_candidates);
  }
  assert.equal(state.candidates.length, limits.open_candidates); assert.equal(last.result.discovery_status, 'BACKLOG_FULL');
  assert.deepEqual(last.result.added, []);
});
test('signal and retained-candidate limits bound work when evidence or history grows', () => {
  const source = snapshot(), text = Array.from({ length: 70 }, (_, i) => `復旧記録 ${i} の期待時間と手動で採録した実出力には未確認の差がある。`).join('\n');
  setSource(source, 'ns7jp/server', 'README.md', text);
  assert.equal(extractSignals(source, { probes: [] }).length, limits.signals);
  const initial = discover(source, context(), emptyRegistry(), { now }).state;
  const candidate = initial.candidates[0], full = emptyRegistry();
  full.candidates = Array.from({ length: limits.candidates }, (_, i) => ({ ...structuredClone(candidate),
    id: 'INV-' + digest('candidate-limit-' + i).slice(0, 16), novelty_key: digest('novelty-limit-' + i) }));
  const allClosed = [...catalog.experiments.map(c => c.id), ...full.candidates.map(c => c.id)];
  const next = discover(source, context(now, allClosed), full, { now });
  assert.equal(next.state.candidates.length, limits.candidates); assert.deepEqual(next.result.added, []);
  assert.equal(next.result.discovery_status, 'RESEARCH_REQUIRED'); assert.ok(next.result.skipped.some(s => s.reason === 'CAPACITY'));
});
test('context closure releases backlog capacity even when collected sources have not changed', () => {
  let state = emptyRegistry(), source, at;
  for (let round = 0; round < 3; round++) {
    at = `2026-09-09T01:0${round}:00Z`; source = snapshot(at);
    state = discover(source, context(at), state, { now: at }).state;
  }
  const closed = [...catalog.experiments.map(c => c.id), ...state.candidates.map(c => c.id)];
  const next = discover(source, context(at, closed), state, { now: at });
  assert.ok(next.result.added.length > 0); assert.ok(next.result.added.every(id => !closed.includes(id)));
});
test('stale or incomplete collection produces no signals, proposals or selection', () => {
  for (const source of [snapshot('2026-09-07T01:00:00Z'), { ...snapshot(), collection_complete: false }]) {
    const x = discover(source, context(), emptyRegistry(), { now });
    assert.equal(x.result.collection_status, 'NEEDS_REFRESH'); assert.equal(x.result.discovery_status, 'NEEDS_REFRESH');
    assert.deepEqual(x.result.signals, []); assert.deepEqual(x.result.added, []); assert.equal(x.result.plan.selected, null);
    assert.equal(x.state.candidates.length, 0);
  }
});
test('empty evidence returns a research question instead of invented candidates', () => {
  const x = discover(snapshot(now, { signals: false }), context(), emptyRegistry(), { now });
  assert.equal(x.result.discovery_status, 'RESEARCH_REQUIRED'); assert.deepEqual(x.result.added, []);
  assert.ok(x.result.questions.some(q => q.kind === 'RESEARCH_REQUIRED'));
});
test('occupied weekly work still discovers questions but cannot prepare another experiment', () => {
  const x = discover(snapshot(), { ...context(), occupied: true }, emptyRegistry(), { now });
  assert.ok(x.result.added.length > 0); assert.equal(x.result.plan.selected, null);
});
test('custom proposals must cite a current signal and preserve its collected source', () => {
  const source = snapshot(), signal = extractSignals(source, { probes: [] })[0], proposal = custom(signal);
  const x = discover(source, context(), emptyRegistry(), { now, proposals: [proposal] });
  const candidate = x.state.candidates.find(c => c.operator === 'custom'); assert.ok(candidate);
  assert.equal(candidate.hypothesis, proposal.hypothesis); assert.equal(candidate.signal_id, signal.id);
  assert.equal(candidate.source_sha256, signal.source_sha256); assert.equal(candidate.marker, signal.marker);
  assert.throws(() => discover(source, context(), emptyRegistry(), { now, proposals: [{ ...proposal, signal_id: 'SIG-unknown' }] }), /current collected signal/);
  assert.throws(() => discover(source, context(), emptyRegistry(), { now, proposals: [{ ...proposal, source_sha256: '0'.repeat(64) }] }), /proposal fields/);
});
test('duplicate custom hypotheses and unsafe intervention paths are rejected or skipped', () => {
  const source = snapshot(), proposal = custom(extractSignals(source, { probes: [] })[0]);
  const x = discover(source, context(), emptyRegistry(), { now, proposals: [proposal, { ...proposal, title: '別の見出し' }] });
  assert.equal(x.state.candidates.filter(c => c.operator === 'custom').length, 1);
  assert.ok(x.result.skipped.some(s => s.reason === 'DUPLICATE'));
  assert.throws(() => discover(source, context(), emptyRegistry(), { now, proposals: [{ ...proposal, paths: ['../outside.md'] }] }), /candidate paths/);
  assert.throws(() => discover(source, context(), emptyRegistry(), { now, proposals: Array(5).fill(proposal) }), /four custom/);
});
test('custom changes cannot target the author learning log or recorded evidence', () => {
  const source = snapshot(), proposal = custom(extractSignals(source, { probes: [] })[0]);
  for (const path of ['LEARNINGS.md', 'docs/evidence/README.md']) {
    assert.throws(() => discover(source, context(), emptyRegistry(), { now, proposals: [{ ...proposal, paths: [path] }] }), /protected record/);
  }
});
test('PROMISING feedback changes strategy and creates a different method linked to its parent', () => {
  const run = started(), before = strategy(run.state), learned = feedback(run);
  assert.equal(learned.state.feedback[0].decision, 'PROMISING');
  const method = learned.candidate.operator;
  assert.ok(strategy(learned.state).find(s => s.operator === method).weight > before.find(s => s.operator === method).weight);
  const next = discover(run.source, context(), learned.state, { now });
  const child = next.state.candidates.find(c => c.parent_candidate === learned.candidate.id);
  assert.ok(child); assert.equal(child.operator, 'vary'); assert.match(child.research_question, /PROMISING/);
  assert.equal(next.result.plan.queue.find(c => c.id === learned.candidate.id).state, 'CLOSED_BY_RECORD');
});
test('REJECT feedback reduces method weight and turns the failed result into a new question', () => {
  const run = started(), before = strategy(run.state), learned = feedback(run, { decision: 'REJECT' });
  const method = learned.candidate.operator;
  assert.ok(strategy(learned.state).find(s => s.operator === method).weight < before.find(s => s.operator === method).weight);
  const next = discover(run.source, context(), learned.state, { now });
  const child = next.state.candidates.find(c => c.parent_candidate === learned.candidate.id);
  assert.ok(child); assert.notEqual(child.operator, method); assert.match(child.research_question, /REJECT/);
});
test('NOT_READY preserves the open experiment without learning a success or a failure', () => {
  const run = started(), before = strategy(run.state), learned = feedback(run, { decision: 'NOT_READY' });
  assert.equal(learned.state.feedback[0].decision, 'NOT_READY'); assert.deepEqual(strategy(learned.state), before);
  const next = discover(run.source, context(), learned.state, { now });
  assert.ok(!next.state.candidates.some(c => c.parent_candidate === learned.candidate.id));
  assert.equal(next.result.plan.queue.find(c => c.id === learned.candidate.id).state, 'PREPARABLE');
});
test('synthetic feedback cannot be persisted as real learning', () => {
  const run = started(), input = measurement(run.state.candidates[0], { dataKind: 'synthetic' });
  const before = readFileSync(join(run.root, 'latest.json'), 'utf8');
  assert.throws(() => recordFeedback({ outputDir: run.root, ...input, now }), /Synthetic results/);
  assert.equal(readFileSync(join(run.root, 'latest.json'), 'utf8'), before); assert.equal(saved(run.root).state.feedback.length, 0);
});
test('feedback cannot substitute a different hypothesis, repository, metric or unobserved baseline', () => {
  const run = started(), candidate = run.state.candidates[0];
  for (const [field, value, error] of [
    ['hypothesis', 'A different fixture hypothesis', /registered candidate/],
    ['repository', candidate.repository === 'ns7jp/server' ? 'ns7jp/ns7jp' : 'ns7jp/server', /registered candidate/],
    ['intervention', 'An unrelated fixture intervention', /registered candidate/],
    ['baseline_sha', 'd'.repeat(40), /collected candidate revisions/]
  ]) {
    const input = measurement(candidate); input.protocol[field] = value;
    input.results.protocol_sha256 = protocolDigest(input.protocol);
    assert.throws(() => recordFeedback({ outputDir: run.root, ...input, now }), error);
  }
  const input = measurement(candidate); input.protocol.metric.unit = 'unrelated-unit'; input.results.protocol_sha256 = protocolDigest(input.protocol);
  assert.throws(() => recordFeedback({ outputDir: run.root, ...input, now }), /metric differs/);
  assert.equal(saved(run.root).state.feedback.length, 0);
});
test('the same result cannot be learned twice or rewrite a terminal experiment', () => {
  const run = started(), learned = feedback(run), count = readdirSync(join(run.root, 'runs')).length;
  const second = recordFeedback({ outputDir: run.root, ...learned.input, now });
  assert.equal(second.duplicate_feedback, true); assert.equal(second.notify, false);
  assert.equal(saved(run.root).state.feedback.length, 1); assert.equal(readdirSync(join(run.root, 'runs')).length, count);
  const changed = structuredClone(learned.input.results); changed.runs[0].guardrails.data_integrity = 0;
  assert.throws(() => recordFeedback({ outputDir: run.root, ...learned.input, results: changed, now }), /terminal experiment/);
});
test('an incomplete protocol can later finish, while strategy counts its latest terminal result once', () => {
  const run = started(), candidate = run.state.candidates[0], input = measurement(candidate);
  const incomplete = { ...input.results, runs: input.results.runs.slice(0, -1) };
  recordFeedback({ outputDir: run.root, ...input, results: incomplete, now });
  recordFeedback({ outputDir: run.root, ...input, now });
  const state = saved(run.root).state; assert.equal(state.feedback.length, 2);
  const method = strategy(state).find(s => s.operator === candidate.operator);
  assert.equal(method.evaluated, 1); assert.equal(method.promising, 1);
});
test('source updates supersede grounded candidates and re-anchor new hypotheses', () => {
  const run = started(), old = run.state.candidates[0], source = structuredClone(run.source);
  const file = source.repositories.find(r => r.full_name === old.repository).files[old.source_path];
  setSource(source, old.repository, old.source_path, file.text + '\nAdditional reviewed source context.');
  const x = discover(source, context(), run.state, { now });
  assert.equal(x.state.candidates.find(c => c.id === old.id).registry_status, 'SUPERSEDED');
  assert.equal(x.result.plan.queue.find(c => c.id === old.id).state, 'CLOSED_BY_RECORD');
  assert.ok(x.state.candidates.some(c => c.source_path === old.source_path && c.id !== old.id && c.source_sha256 !== old.source_sha256));
});
test('forged collection, registry bytes and archive paths stop without replacing the pointer', () => {
  const forged = snapshot(); forged.repositories[0].files['README.md'].text += '\nforged';
  assert.throws(() => discover(forged, context(), emptyRegistry(), { now }), /integrity/);
  const run = started(), before = readFileSync(join(run.root, 'latest.json'), 'utf8');
  writeFileSync(join(run.root, run.pointer.state_path), '{}');
  assert.throws(() => runDiscovery({ snapshot: run.source, context: context(), outputDir: run.root, now }), /state integrity/);
  assert.equal(readFileSync(join(run.root, 'latest.json'), 'utf8'), before);
  const outside = started(); writeFileSync(join(outside.root, 'latest.json'), json({ ...outside.pointer, state_path: '../outside.json' }));
  assert.throws(() => runDiscovery({ snapshot: outside.source, context: context(), outputDir: outside.root, now }), /Unsafe archive path/);
});
test('a missing latest pointer never silently restarts a registry that already has history', () => {
  const run = started(), before = readdirSync(join(run.root, 'runs')).length;
  unlinkSync(join(run.root, 'latest.json'));
  assert.throws(() => runDiscovery({ snapshot: run.source, context: context(), outputDir: run.root, now }), /Missing latest pointer with existing history/);
  assert.equal(readdirSync(join(run.root, 'runs')).length, before); assert.equal(existsSync(join(run.root, 'latest.json')), false);
});
test('changed archived evidence cannot affect a future strategy', () => {
  const run = started(), learned = feedback(run), archive = learned.state.feedback[0].archive;
  const artifact = learned.input.results.runs[0].artifact.path;
  writeFileSync(join(run.root, dirname(archive), 'evidence', artifact), 'changed archive evidence');
  const before = readFileSync(join(run.root, 'latest.json'), 'utf8');
  assert.throws(() => runDiscovery({ snapshot: run.source, context: context(), outputDir: run.root, now }), /Artifact hash mismatch/);
  assert.equal(readFileSync(join(run.root, 'latest.json'), 'utf8'), before);
});
test('changed feedback input and artifact traversal cannot enter or alter learning history', () => {
  const run = started(), learned = feedback(run), path = join(run.root, learned.state.feedback[0].archive), archive = read(path);
  archive.results.runs[0].value = 0; writeFileSync(path, json(archive));
  assert.throws(() => runDiscovery({ snapshot: run.source, context: context(), outputDir: run.root, now }), /archive integrity/);
  const other = started(), input = measurement(other.state.candidates[0]);
  input.results.runs[0].artifact.path = '../outside.json';
  assert.throws(() => recordFeedback({ outputDir: other.root, ...input, now }), /Unsafe artifact path/);
  assert.equal(saved(other.root).state.feedback.length, 0);
});
test('locks serialize cycle, feedback and dismissal without overwriting a held lock', () => {
  const run = started(), input = measurement(run.state.candidates[0]), lockPath = join(run.root, 'discovery.lock');
  writeFileSync(lockPath, 'owned by another fixture process');
  const attempts = [() => runDiscovery({ snapshot: run.source, context: context(), outputDir: run.root, now }),
    () => recordFeedback({ outputDir: run.root, ...input, now }),
    () => dismissCandidate({ outputDir: run.root, candidateId: run.state.candidates[0].id, reason: 'fixture dismissal', now })];
  for (const attempt of attempts) assert.throws(attempt, /EEXIST/);
  assert.equal(readFileSync(lockPath, 'utf8'), 'owned by another fixture process');
});
test('dismissal requires a known candidate and reason, records once, and closes the proposal', () => {
  const run = started(), candidateId = run.state.candidates[0].id;
  assert.throws(() => dismissCandidate({ outputDir: run.root, candidateId, reason: '', now }), /reason required/);
  assert.throws(() => dismissCandidate({ outputDir: run.root, candidateId: 'INV-unknown', reason: 'fixture', now }), /reason required/);
  dismissCandidate({ outputDir: run.root, candidateId, reason: 'fixture has insufficient practical relevance', now });
  const repeated = dismissCandidate({ outputDir: run.root, candidateId, reason: 'same fixture decision', now });
  assert.equal(repeated.duplicate_dismissal, true); assert.equal(saved(run.root).state.dismissals.length, 1);
  const x = discover(run.source, context(), saved(run.root).state, { now });
  assert.equal(x.result.plan.queue.find(c => c.id === candidateId).state, 'CLOSED_BY_RECORD');
});
test('invalid work context and malformed registry history are rejected', () => {
  assert.throws(() => discover(snapshot(), { ...context(), reviewed_at: '2026-09-07T00:00:00Z' }, emptyRegistry(), { now }), /24 hours/);
  assert.throws(() => discover(snapshot(), { ...context(), execute: true }, emptyRegistry(), { now }), /Unknown work context/);
  const state = emptyRegistry(); state.rounds.push('forged'); assert.throws(() => validateRegistry(state), /round history/);
  const duplicate = started().state; duplicate.candidates.push(duplicate.candidates[0]); assert.throws(() => validateRegistry(duplicate), /registry identity/);
});
test('CLI cycle supports proposals and reports refresh failures; dismiss is reviewable and idempotent', () => {
  const root = temp(), at = new Date().toISOString(), source = snapshot(at), stateDir = join(root, 'state');
  const sourcePath = join(root, 'snapshot.json'), contextPath = join(root, 'context.json'), proposalsPath = join(root, 'proposals.json');
  writeFileSync(sourcePath, json(source)); writeFileSync(contextPath, json(context(at)));
  writeFileSync(proposalsPath, json({ schema_version: 1, proposals: [custom(extractSignals(source, { probes: [] })[0])] }));
  const invoke = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  const created = invoke(['cycle', sourcePath, contextPath, stateDir, proposalsPath]); assert.equal(created.status, 0, created.stderr);
  const pointer = JSON.parse(created.stdout), stored = saved(stateDir, pointer);
  assert.ok(stored.state.candidates.some(c => c.operator === 'custom')); assert.ok(existsSync(join(stateDir, pointer.report_path)));
  const dismissed = invoke(['dismiss', stateDir, pointer.selected, 'CLI fixture: defer until a better comparison is available']);
  assert.equal(dismissed.status, 0, dismissed.stderr); assert.equal(saved(stateDir).state.dismissals.length, 1);
  const duplicate = invoke(['dismiss', stateDir, pointer.selected, 'same decision']); assert.equal(JSON.parse(duplicate.stdout).duplicate_dismissal, true);
  source.collection_complete = false; writeFileSync(sourcePath, json(source));
  const refresh = invoke(['cycle', sourcePath, contextPath, join(root, 'refresh')]); assert.equal(refresh.status, 3, refresh.stderr);
  assert.equal(saved(join(root, 'refresh')).result.discovery_status, 'NEEDS_REFRESH');
  const invalid = invoke(['cycle', sourcePath]); assert.equal(invalid.status, 2); assert.match(invalid.stderr, /Usage:/);
});
test('CLI feedback persists a validated fixture once and refuses synthetic learning', () => {
  const run = started(), candidate = run.state.candidates[0], at = new Date().toISOString(), input = measurement(candidate, { at });
  const protocolPath = join(input.evidenceDir, 'protocol.json'), resultsPath = join(input.evidenceDir, 'results.json');
  writeFileSync(protocolPath, json(input.protocol)); writeFileSync(resultsPath, json(input.results));
  const args = [cli, 'feedback', run.root, protocolPath, resultsPath, input.evidenceDir];
  const first = spawnSync(process.execPath, args, { encoding: 'utf8' }); assert.equal(first.status, 0, first.stderr);
  const again = spawnSync(process.execPath, args, { encoding: 'utf8' }); assert.equal(JSON.parse(again.stdout).duplicate_feedback, true);
  input.results.data_kind = 'synthetic'; writeFileSync(resultsPath, json(input.results));
  const synthetic = spawnSync(process.execPath, args, { encoding: 'utf8' }); assert.equal(synthetic.status, 2); assert.match(synthetic.stderr, /Synthetic results/);
  assert.equal(saved(run.root).state.feedback.length, 1);
});
