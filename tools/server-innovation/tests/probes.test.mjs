import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { runProbes, simulateD1Verdict, strictD1Verdict, parseResultLog, D1_SOURCE_PATH, D1_MODEL_SOURCE_SHA256 } from '../probes.mjs';

// Captured source is an inert string fixture. Keeping its bytes here makes tests portable
// without a checkout of ns7jp/server, network access, bash, curl, Docker, or a live VM.
const sourceText = "#!/usr/bin/env bash\r\n# D-1: プロセスダウン → 自動復旧演習\r\n#\r\n# 指定したサービスのコンテナを SIGKILL し、`/healthz` 200 が復活するまでの\r\n# 所要時間を計測する。月次演習の自動ランナー。\r\n#\r\n# 使い方:\r\n#   scripts/drills/d1-process-down.sh [--service app] [--healthz URL] [--timeout 300]\r\n#                                      [--project-dir /opt/server-monitor]\r\n#\r\n# 出力:\r\n#   人間向けサマリーを stdout、機械可読 JSON を最終行に \"RESULT_JSON=\" で出力。\r\n#   Slack 演習チャンネルへのコピペとログ作成の双方に使える。\r\n\r\nset -euo pipefail\r\n\r\nSERVICE=\"app\"\r\nHEALTHZ_URL=\"http://127.0.0.1:8080/healthz\"\r\nTIMEOUT_SECONDS=300\r\nPROJECT_DIR=\".\"\r\n\r\nusage() {\r\n  cat <<EOF\r\nUsage: $0 [--service SERVICE] [--healthz URL] [--timeout SECONDS] [--project-dir DIR]\r\n\r\n  --service   compose サービス名 (default: app)\r\n  --healthz   復旧判定用の URL (default: http://127.0.0.1:8080/healthz)\r\n  --timeout   復旧待ち上限秒 (default: 300)\r\n  --project-dir  compose.yaml がある directory (default: current directory)\r\n  --help      このヘルプ\r\nEOF\r\n}\r\n\r\nwhile [[ $# -gt 0 ]]; do\r\n  case \"$1\" in\r\n    --service)  SERVICE=\"$2\"; shift 2 ;;\r\n    --healthz)  HEALTHZ_URL=\"$2\"; shift 2 ;;\r\n    --timeout)  TIMEOUT_SECONDS=\"$2\"; shift 2 ;;\r\n    --project-dir) PROJECT_DIR=\"$2\"; shift 2 ;;\r\n    --help|-h)  usage; exit 0 ;;\r\n    *) echo \"unknown arg: $1\" >&2; usage; exit 1 ;;\r\n  esac\r\ndone\r\n\r\nlog() {\r\n  printf '[%s] %s\\n' \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\" \"$*\"\r\n}\r\n\r\nrequire_cmd() {\r\n  command -v \"$1\" >/dev/null 2>&1 || { echo \"missing command: $1\" >&2; exit 1; }\r\n}\r\n\r\nrequire_cmd docker\r\nrequire_cmd curl\r\nrequire_cmd sudo\r\n\r\n# docker compose v2 plugin を想定（v1 docker-compose も後方互換）\r\nif docker compose version >/dev/null 2>&1; then\r\n  COMPOSE=(docker compose --project-directory \"$PROJECT_DIR\")\r\nelif command -v docker-compose >/dev/null 2>&1; then\r\n  COMPOSE=(docker-compose --project-directory \"$PROJECT_DIR\")\r\nelse\r\n  echo \"docker compose plugin が見つからない\" >&2\r\n  exit 1\r\nfi\r\n\r\nlog \"サービス: $SERVICE  healthz: $HEALTHZ_URL  timeout: ${TIMEOUT_SECONDS}s\"\r\n\r\n# 0. 事前確認: サービスが稼働しており healthz が 200 を返すこと\r\nlog \"事前確認: ${HEALTHZ_URL}\"\r\nif ! curl -fsS --max-time 5 \"$HEALTHZ_URL\" >/dev/null; then\r\n  log \"事前確認 NG: ${HEALTHZ_URL} が 200 を返さない。compose を起動してから再実行する。\"\r\n  exit 2\r\nfi\r\n\r\nCID=$(\"${COMPOSE[@]}\" ps -q \"$SERVICE\")\r\nif [[ -z \"$CID\" ]]; then\r\n  echo \"コンテナが見つからない: ${SERVICE}\" >&2\r\n  exit 2\r\nfi\r\n\r\nrestart_count() {\r\n  docker inspect -f '{{.RestartCount}}' \"$CID\"\r\n}\r\n\r\nBEFORE_RESTART=$(restart_count)\r\nlog \"事前 restart_count(${SERVICE})=${BEFORE_RESTART}\"\r\n\r\n# 1. 障害発生: コンテナ内部の PID 1 を、ホスト側の名前空間から直接 kill する。\r\n#\r\n# `docker compose kill` / `docker kill` は Docker Engine の kill API を経由するため\r\n# 実際にプロセスは死ぬが、デーモン内部で「手動停止」フラグが立ち、unless-stopped に\r\n# よる自動復旧が無効化されてしまう（Docker の仕様。再起動ポリシーは「明示的に\r\n# stop/kill された」場合と「予期せず落ちた」場合を区別しており、Engine の kill/stop\r\n# API を通ったものはすべて前者として扱われる）。\r\n# 代わりに `docker exec <container> kill -9 1` のように PID 名前空間の内側から送っても、\r\n# カーネルが「同一名前空間内から init(PID 1) へ送られた、ハンドラ未設定のシグナル」を\r\n# 黙って破棄するため、そもそも届かない（man 7 pid_namespaces）。\r\n# 両方を回避するため、コンテナプロセスのホスト側 PID に対して直接 kill(1) を実行する。\r\nHOST_PID=$(docker inspect -f '{{.State.Pid}}' \"$CID\")\r\nKILL_TS_EPOCH=$(date -u +%s)\r\nlog \"障害発生: kill -9 ${HOST_PID} (${SERVICE} のホスト側 PID)\"\r\nsudo kill -9 \"$HOST_PID\"\r\n\r\n# 2. 復旧待ち\r\nATTEMPT=0\r\nSUCCESS=0\r\nRECOVER_TS_EPOCH=0\r\nwhile :; do\r\n  ATTEMPT=$((ATTEMPT + 1))\r\n  if curl -fsS --max-time 3 \"$HEALTHZ_URL\" >/dev/null 2>&1; then\r\n    SUCCESS=1\r\n    RECOVER_TS_EPOCH=$(date -u +%s)\r\n    break\r\n  fi\r\n  NOW_EPOCH=$(date -u +%s)\r\n  ELAPSED=$((NOW_EPOCH - KILL_TS_EPOCH))\r\n  if [[ \"$ELAPSED\" -ge \"$TIMEOUT_SECONDS\" ]]; then\r\n    log \"タイムアウト: ${TIMEOUT_SECONDS} 秒以内に復旧しなかった\"\r\n    break\r\n  fi\r\n  if (( ATTEMPT % 5 == 0 )); then\r\n    log \"復旧待ち... ${ELAPSED}s 経過 (attempts=${ATTEMPT})\"\r\n  fi\r\n  sleep 1\r\ndone\r\n\r\n# 3. 計測結果\r\nif [[ \"$SUCCESS\" -eq 1 ]]; then\r\n  RECOVER_SECONDS=$((RECOVER_TS_EPOCH - KILL_TS_EPOCH))\r\n  log \"復旧完了: ${RECOVER_SECONDS} 秒\"\r\nelse\r\n  RECOVER_SECONDS=-1\r\nfi\r\n\r\n# 4. ポストチェック: restart count とコンテナ状態\r\nAFTER_RESTART=$(restart_count)\r\nlog \"事後 restart_count(${SERVICE})=${AFTER_RESTART}\"\r\n\r\n# 5. 評価\r\nRTO_TARGET=300   # 設計書: RTO 5 分以内\r\nif [[ \"$SUCCESS\" -eq 1 && \"$RECOVER_SECONDS\" -le \"$RTO_TARGET\" ]]; then\r\n  VERDICT=\"PASS\"\r\nelse\r\n  VERDICT=\"FAIL\"\r\nfi\r\n\r\n# 6. サマリー\r\nKILL_TS_ISO=$(date -u -d \"@$KILL_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \\\r\n  || date -u -r \"$KILL_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ')\r\nRECOVER_TS_ISO=\"n/a\"\r\nif [[ \"$RECOVER_TS_EPOCH\" -gt 0 ]]; then\r\n  RECOVER_TS_ISO=$(date -u -d \"@$RECOVER_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \\\r\n    || date -u -r \"$RECOVER_TS_EPOCH\" '+%Y-%m-%dT%H:%M:%SZ')\r\nfi\r\n\r\ncat <<SUMMARY\r\n\r\n================ D-1 drill summary ================\r\nservice           : $SERVICE\r\nhealthz           : $HEALTHZ_URL\r\nkill_at           : $KILL_TS_ISO\r\nrecover_at        : $RECOVER_TS_ISO\r\nrecover_seconds   : $RECOVER_SECONDS\r\nrto_target_seconds: $RTO_TARGET\r\nrestart_count     : $BEFORE_RESTART -> $AFTER_RESTART\r\nverdict           : $VERDICT\r\n===================================================\r\n\r\n次の手順:\r\n1. このサマリーを Slack 演習チャンネルに貼る (docs/incident-comms.md)\r\n2. docs/drill-template.md をコピーして docs/drills/logs/$(date -u +%Y-%m-%d)-D-1.md を作る\r\n3. 発見事項と改善アクションを記入して PR\r\n\r\nSUMMARY\r\n\r\nprintf 'RESULT_JSON={\"service\":\"%s\",\"verdict\":\"%s\",\"recover_seconds\":%s,\"rto_target_seconds\":%s,\"restart_count_before\":\"%s\",\"restart_count_after\":\"%s\",\"kill_at\":\"%s\",\"recover_at\":\"%s\"}\\n' \\\r\n  \"$SERVICE\" \"$VERDICT\" \"$RECOVER_SECONDS\" \"$RTO_TARGET\" \"$BEFORE_RESTART\" \"$AFTER_RESTART\" \"$KILL_TS_ISO\" \"$RECOVER_TS_ISO\"\r\n\r\n[[ \"$VERDICT\" == \"PASS\" ]]\r\n";
const digest = value => createHash('sha256').update(value).digest('hex');
function snapshot(text = sourceText) {
  return { repositories: [{ full_name: 'ns7jp/server', files: { [D1_SOURCE_PATH]: { text, sha256: digest(text) } } }] };
}
const meaningful = result => ({ ...result, probes: result.probes.map(({ elapsed_ms, ...probe }) => probe) });
const baseline = { curl_exit_code: 0, http_status: 200, recover_seconds: 10, restart_count_before: 2, restart_count_after: 3, same_target: true };
function probe(family) { return runProbes(snapshot(), { families: [family] }).probes[0]; }
function resultLog(overrides = {}) {
  return 'RESULT_JSON=' + JSON.stringify({ service: 'app', verdict: 'FAIL', recover_seconds: -1, rto_target_seconds: 300,
    restart_count_before: '2', restart_count_after: '2', kill_at: '2026-01-01T00:00:00Z', recover_at: 'n/a', ...overrides });
}

test('portable source fixture matches the reviewed model fingerprint', () => {
  assert.equal(digest(sourceText.replace(/\r\n/g, '\n')), D1_MODEL_SOURCE_SHA256);
});

test('three executed local models retain server NOT_RUN and source provenance', () => {
  const result = runProbes(snapshot());
  assert.equal(result.schema_version, 1);
  assert.equal(result.execution_scope, 'local-model');
  assert.equal(result.runtime_status, 'NOT_RUN');
  assert.equal(result.probes.length, 3);
  for (const p of result.probes) {
    assert.equal(p.model_status, 'SUPPORTED');
    assert.equal(p.source_sha256, digest(sourceText));
    assert.ok(p.cases.length > 0);
    assert.ok(p.finding);
    assert.ok(Number.isFinite(p.elapsed_ms) && p.elapsed_ms >= 0);
    assert.ok(p.limitations.some(text => text.includes('NOT_RUN')));
  }
});

test('success of captured curl exit predicate is weaker than the proposed HTTP 200 evidence policy', () => {
  const cases = probe('boundary').cases;
  assert.equal(cases.find(c => c.id === 'http-200').result, 'MATCH');
  for (const id of ['http-204-exit-zero', 'http-301-exit-zero']) {
    const c = cases.find(c => c.id === id);
    assert.equal(c.expected.verdict, 'FAIL');
    assert.equal(c.observed.verdict, 'PASS');
    assert.equal(c.result, 'MISMATCH');
  }
});

test('RTO model includes exact boundary, transport failure, and negative-clock counterexample', () => {
  const cases = probe('boundary').cases;
  for (const id of ['rto-299', 'rto-300']) assert.equal(cases.find(c => c.id === id).observed.verdict, 'PASS');
  for (const id of ['rto-301', 'transport-error', 'http-503-exit-22']) assert.equal(cases.find(c => c.id === id).observed.verdict, 'FAIL');
  assert.equal(cases.find(c => c.id === 'negative-clock-delta').result, 'MISMATCH');
});

test('restart and target counterexamples are questions instead of runtime findings', () => {
  const p = probe('counterexample');
  assert.equal(p.cases.find(c => c.id === 'restart-increased').result, 'MATCH');
  for (const id of ['restart-unchanged', 'restart-decreased', 'different-health-target']) assert.equal(p.cases.find(c => c.id === id).result, 'MISMATCH');
  assert.ok(p.limitations.some(text => text.includes('proposed acceptance criterion')));
  assert.ok(p.limitations.some(text => text.includes('does not prove')));
});

test('printf observation model checks special-character boundaries without executing embedded shell text', () => {
  const cases = probe('combination').cases;
  for (const id of ['ordinary', 'shell-text', 'unicode']) assert.equal(cases.find(c => c.id === `result-json-${id}`).result, 'MATCH');
  for (const id of ['quote', 'backslash', 'newline']) {
    const c = cases.find(c => c.id === `result-json-${id}`);
    assert.equal(c.result, 'MISMATCH');
    assert.equal(c.observed.status, 'INVALID');
  }
  assert.ok(probe('combination').limitations.some(text => text.includes('rejected earlier by Docker Compose')));
});

test('uncollected, altered, oversized, and ambiguous source produce no manufactured finding', () => {
  const absent = { repositories: [{ full_name: 'ns7jp/server', files: {} }] };
  const ambiguous = snapshot(); ambiguous.repositories.push(ambiguous.repositories[0]);
  for (const input of [absent, snapshot(sourceText.replace('RTO_TARGET=300', 'RTO_TARGET=500')), snapshot('x'.repeat(1024 * 1024 + 1)), ambiguous]) {
    for (const p of runProbes(input).probes) {
      assert.equal(p.model_status, 'MODEL_UNSUPPORTED');
      assert.equal(p.finding, false);
      assert.deepEqual(p.cases, []);
    }
  }
});

test('source integrity mismatch is unsupported even if the model text is known', () => {
  const input = snapshot(); input.repositories[0].files[D1_SOURCE_PATH].sha256 = '0'.repeat(64);
  const result = runProbes(input);
  assert.ok(result.probes.every(p => p.model_status === 'MODEL_UNSUPPORTED' && !p.finding));
});

test('line endings can change without changing reviewed semantics, retaining the actual captured hash', () => {
  const text = sourceText.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  assert.ok(runProbes(snapshot(text)).probes.every(p => p.model_status === 'SUPPORTED' && p.source_sha256 === digest(text)));
});

test('untrusted source is only hashed and cannot execute JavaScript', () => {
  globalThis.__innovationProbeMustNotExecute = false;
  const hostile = sourceText + '\nglobalThis.__innovationProbeMustNotExecute = true;\n';
  assert.ok(runProbes(snapshot(hostile)).probes.every(p => p.model_status === 'MODEL_UNSUPPORTED'));
  assert.equal(globalThis.__innovationProbeMustNotExecute, false);
  delete globalThis.__innovationProbeMustNotExecute;
});

test('synthetic cases are deterministic for one seed; only elapsed timing is nondeterministic', () => {
  assert.deepEqual(meaningful(runProbes(snapshot(), { seed: 7 })), meaningful(runProbes(snapshot(), { seed: 7 })));
  assert.notDeepEqual(meaningful(runProbes(snapshot(), { seed: 7 })), meaningful(runProbes(snapshot(), { seed: 8 })));
});

test('family filtering has a fixed order and rejects unknown, duplicate, and unbounded inputs', () => {
  assert.deepEqual(runProbes(snapshot(), { families: [] }).probes, []);
  assert.deepEqual(runProbes(snapshot(), { families: ['combination', 'boundary'] }).probes.map(p => p.family), ['boundary', 'combination']);
  for (const families of [['shell'], ['boundary', 'boundary'], 'boundary']) assert.throws(() => runProbes(snapshot(), { families }), /family/);
  for (const seed of [-1, 0.1, Number.NaN, 0x100000000, '1']) assert.throws(() => runProbes(snapshot(), { seed }), /uint32/);
  assert.throws(() => runProbes({}), /repositories/);
});

test('strict parser follows the final structured result rather than an earlier human PASS', () => {
  const result = parseResultLog('preflight verdict: PASS\n' + resultLog() + '\n');
  assert.equal(result.status, 'PARSED');
  assert.equal(result.value.verdict, 'FAIL');
  assert.equal(parseResultLog(resultLog() + '\ntrailing text').status, 'INVALID');
  assert.equal(parseResultLog(resultLog() + '\n' + resultLog()).status, 'INVALID');
});

test('structured log parser rejects malformed or ambiguous evidence and treats strings as data', () => {
  for (const log of ['PASS', 'RESULT_JSON={}', 'RESULT_JSON=null', 'RESULT_JSON=invalid', resultLog({ verdict: 'NOT_RUN' }), 'x'.repeat(16385)]) {
    assert.equal(parseResultLog(log).status, 'INVALID');
  }
  const hostile = '$(touch PROBE_MUST_NOT_EXIST); require("node:fs").writeFileSync("x","x")';
  assert.equal(parseResultLog(resultLog({ service: hostile })).value.service, hostile);
  assert.equal(parseResultLog(resultLog({ verdict: 'PASS' })).status, 'PARSED');
  assert.equal(runProbes(snapshot()).runtime_status, 'NOT_RUN');
});

test('predicate models require typed synthetic data and do not mutate it', () => {
  const input = structuredClone(baseline);
  assert.equal(simulateD1Verdict(input), 'PASS');
  assert.equal(strictD1Verdict(input), 'PASS');
  assert.deepEqual(input, baseline);
  assert.throws(() => simulateD1Verdict({ ...input, curl_exit_code: '0' }), /synthetic/);
  assert.throws(() => strictD1Verdict({ ...input, recover_seconds: Number.NaN }), /synthetic/);
});