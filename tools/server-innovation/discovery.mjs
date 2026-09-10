import { readFileSync, writeFileSync, mkdirSync, existsSync, openSync, closeSync, unlinkSync, renameSync, realpathSync } from 'node:fs';
import { resolve, join, relative, isAbsolute, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assert, digest, safePath } from '../portfolio-audit/scripts/github.mjs';
import { inspectSnapshot, overlap } from '../portfolio-audit/scripts/cycle.mjs';
import { catalog as seeds, plan, draftProtocol, evaluate, protocolDigest, validateCatalog } from './innovation.mjs';
import { runProbes } from './probes.mjs';

export const discoveryConfig = JSON.parse(readFileSync(new URL('./discovery.config.json', import.meta.url)));
export const limits = Object.freeze({ signals: 40, new_candidates: 4, open_candidates: 12, candidates: 240, feedback: 100 });
const operators = ['invert', 'combine', 'remove', 'vary', 'explain'];
const json = x => JSON.stringify(x, null, 2) + '\n';
const read = p => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const date = x => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x) && Number.isFinite(Date.parse(x));
const text = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 4000;
const norm = x => x.normalize('NFKC').toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[\s\p{P}\p{S}]/gu, '');
const id = (prefix, value) => prefix + digest(value).slice(0, 16);
const clean = x => String(x).replace(/[\r\n|`<>\[\]]/g, ' ');
const fromSource = (snapshot, repo, path) => snapshot.repositories.find(r => r.full_name === repo)?.files[path];
const protectedPath = p => ['LEARNINGS.md', '.local', '.git', 'docs/evidence', 'docs/engineer-career'].some(q => overlap(p.toLowerCase(), q.toLowerCase())) || /(?:^|\/)(?:\.env(?:\.|$)|secrets?(?:\/|$))/i.test(p);
const themes = [
  ['recovery', /復旧|recover|restart|RTO|healthy/i], ['integrity', /復元|バックアップ|整合|backup|restore/i],
  ['reproduction', /冪等|構築|再実行|Ansible|再現/i], ['observability', /監視|ログ|欠測|metric|scrape/i],
  ['handover', /引き渡|引き継|説明|質問|理解/i], ['access', /認証|権限|秘密|auth|401|公開ポート/i]
];
const themeOf = x => themes.find(([, re]) => re.test(x))?.[0] ?? 'workflow';
const triggerOf = x => /FAIL|不一致|誤り|欠陥|失敗|食い違/i.test(x) ? 'failure' :
  /未確認|未採録|不明|限定|未完了|NOT RUN|NOT_RUN|保証.*ない/i.test(x) ? 'uncertainty' :
    /繰り返|手動|手作業|転記|再実行|再確認/i.test(x) ? 'friction' : null;

export function emptyRegistry() {
  return { schema_version: 2, candidates: [], feedback: [], dismissals: [], rounds: [], last_collection: null };
}
export function validateRegistry(state) {
  assert(state?.schema_version === 2 && ['candidates', 'feedback', 'dismissals', 'rounds'].every(k => Array.isArray(state[k])), 'Invalid discovery registry');
  assert(state.candidates.length <= limits.candidates && state.feedback.length <= limits.feedback, 'Registry capacity reached; archive with review');
  const seen = new Set();
  for (const c of state.candidates) {
    validateCatalog({ schema_version: 1, experiments: [c] }, discoveryConfig);
    assert(!seen.has(c.id) && hash(c.novelty_key) && hash(c.source_sha256) && operators.concat('custom').includes(c.operator), 'Invalid candidate registry identity'); seen.add(c.id);
    assert(c.paths.every(p => !protectedPath(p)), 'Generated candidate targets a protected record');
    assert(Array.isArray(c.observed_revisions) && c.observed_revisions.length > 0 && c.observed_revisions.every(x => /^[a-f0-9]{40}$/.test(x)), 'Missing verified candidate revisions');
    assert(['OPEN', 'SUPERSEDED'].includes(c.registry_status) && text(c.signal_id) && date(c.created_at), 'Invalid candidate registry state');
  }
  const feedbackIds = new Set();
  for (const f of state.feedback) {
    assert(hash(f.id) && !feedbackIds.has(f.id) && hash(f.protocol_sha256) && hash(f.results_sha256), 'Invalid feedback identity'); feedbackIds.add(f.id);
    assert(seen.has(f.candidate_id) || seeds.experiments.some(x => x.id === f.candidate_id), 'Unknown feedback candidate');
    assert(['PROMISING', 'ITERATE', 'REJECT', 'NOT_READY', 'INCONCLUSIVE'].includes(f.decision) && date(f.recorded_at) && safePath(f.archive), 'Invalid feedback record');
  }
  for (const d of state.dismissals) assert(seen.has(d.candidate_id) && text(d.reason) && date(d.recorded_at), 'Invalid dismissal');
  assert(state.rounds.every(x => hash(x)), 'Invalid discovery round history');
}

function signal(snapshot, repo, path, line, kind, origin = 'text', extra = {}) {
  const f = fromSource(snapshot, repo, path), marker = f.text.split('\n')[line];
  const excerpt = marker.trim().slice(0, 1200), theme = themeOf(path + ' ' + excerpt);
  return { id: id('SIG-', `${repo}:${path}:${kind}:${norm(excerpt)}`), repository: repo, source_path: path,
    source_sha256: f.sha256, source: f.url, marker, source_line: line + 1, excerpt, theme, kind, origin,
    question: `「${clean(excerpt).slice(0, 110)}」の条件や期待と実際の差をどう確かめるか。`, ...extra };
}

export function extractSignals(snapshot, probes) {
  const found = [];
  for (const r of snapshot.repositories) for (const [path, f] of Object.entries(r.files)) {
    if (f.missing || !/\.(?:md|html)$/.test(path)) continue;
    const lines = f.text.split('\n'); let fenced = false;
    const counts = new Map(); for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1);
    lines.forEach((line, index) => {
      if (/^\s*```/.test(line)) { fenced = !fenced; return; }
      if (fenced || line.length < 18 || line.length > 1200 || counts.get(line) !== 1 || /^\s*(?:#|<|\[)/.test(line)) return;
      const kind = triggerOf(line); if (kind) found.push(signal(snapshot, r.full_name, path, index, kind));
    });
  }
  for (const p of probes.probes) {
    if (!p.finding || p.model_status !== 'SUPPORTED') continue;
    const f = fromSource(snapshot, p.repository, p.source_path);
    if (!f || f.sha256 !== p.source_sha256) continue;
    const lines = f.text.split('\n');
    // Find a unique non-comment source line to anchor the proposal without executing it.
    const line = lines.findIndex(x => x.trim() && !x.trim().startsWith('#') && lines.filter(y => y === x).length === 1);
    if (line < 0) continue;
    const evidenceKey = digest(JSON.stringify({ id: p.id, source_sha256: p.source_sha256, model_status: p.model_status, cases: p.cases }));
    found.unshift(signal(snapshot, p.repository, p.source_path, line, 'counterexample', 'probe', {
      id: id('SIG-', evidenceKey), theme: 'recovery', question: p.question, probe_id: p.id, evidence_key: evidenceKey,
      excerpt: `ローカルモデルの比較で ${p.cases.filter(c => c.result === 'MISMATCH').length} 件の不一致: ${p.question}`
    }));
  }
  const unique = new Map();
  for (const s of found) if (!unique.has(s.id)) unique.set(s.id, s);
  return [...unique.values()].sort((a, b) => (a.origin === 'probe' ? 0 : 1) - (b.origin === 'probe' ? 0 : 1) ||
    a.repository.localeCompare(b.repository) || a.source_path.localeCompare(b.source_path) || a.source_line - b.source_line).slice(0, limits.signals);
}

const latestFeedback = state => [...new Map(state.feedback.map(f => [f.protocol_sha256, f])).values()];
const terminal = f => f.decision !== 'NOT_READY';
const closedIds = (state, context) => [...new Set([...context.closed, ...latestFeedback(state).filter(terminal).map(f => f.candidate_id),
  ...state.dismissals.map(d => d.candidate_id), ...state.candidates.filter(c => c.registry_status === 'SUPERSEDED').map(c => c.id)])];

export function strategy(state) {
  const completed = latestFeedback(state).filter(terminal);
  return operators.map(operator => {
    const experiments = completed.filter(f => state.candidates.find(c => c.id === f.candidate_id)?.operator === operator);
    const promising = experiments.filter(f => f.decision === 'PROMISING').length;
    const rejected = experiments.filter(f => f.decision === 'REJECT').length;
    const generated = state.candidates.filter(c => c.operator === operator).length;
    return { operator, generated, evaluated: experiments.length, promising, rejected,
      weight: (1 + promising) / (2 + experiments.length + rejected) + 1 / (1 + generated) };
  }).sort((a, b) => b.weight - a.weight || operators.indexOf(a.operator) - operators.indexOf(b.operator));
}

function makeCandidate(s, operator, now, partner, parent = null, custom = null) {
  const quote = clean(s.excerpt).slice(0, 100);
  const actions = {
    invert: ['前提を逆にして誤成功を探す', '成功に必要な前提を一つずつ外した反例と、正しく成功する対照例を比較する。', '定義した反例の検出率', 'percent', 'higher', 20],
    combine: ['別の観点を結び見落としを探す', `${partner ? partner.theme : '期待値と実出力'}の観点と、元の判定の対応表を作り、単独判定との見落としを比較する。`, '結果判定の所要時間', 'seconds', 'lower', 20],
    remove: ['確認作業を一つ置き換える', '手動確認や転記を一工程だけ自動採録へ置き換え、同じ確認条件で時間と誤りを比較する。', '確認作業時間', 'seconds', 'lower', 20],
    vary: ['条件を一つ変えて成立範囲を探す', '入力値・順序・初期状態のうち一条件だけを変え、同じ成功条件で境界と成立範囲を比較する。', '境界ケースの検出率', 'percent', 'higher', 20],
    explain: ['期待と実測の違いを説明可能にする', '期待・実測・未確認を別欄で対応付け、元の記録から判定する方法と正答・時間を比較する。', '根拠確認の所要時間', 'seconds', 'lower', 20],
    custom: ['独自仮説', '', '', '', '', 0]
  };
  const [label, change, name, unit, direction, target_percent] = actions[operator];
  const novelty = digest(`${s.repository}:${s.source_path}:${s.id}:${operator}:${parent?.id ?? ''}:${custom ? norm(custom.hypothesis) : ''}`);
  const followup = parent ? parent.decision === 'PROMISING' ? '前回有望だった方法の成立範囲を調べるため、別の初期入力または実施順序を一条件だけ変える。' :
    parent.decision === 'REJECT' ? '前回失敗した条件を保持し、必要な前提を一つずつ戻して悪化の原因を識別する。' :
      '前回目標に届かなかった原因を調べるため、観測の粒度と作業工程を対応付けて一条件だけ比較する。' : '';
  return { id: id('INV-', `${novelty}:${s.source_sha256}`), title: `${label}: ${quote.slice(0, 45)}`,
    priority: s.origin === 'probe' || s.kind === 'failure' ? 1 : 2, value: s.origin === 'probe' ? 5 : 3, learning: 5,
    preparation_minutes: 25, marker: s.marker,
    hypothesis: `${parent ? `${parent.candidate_id} の ${parent.decision} を受けた追試。${followup}` : ''}「${quote}」を出発点に、${label}ことで、${name}を改善できる可能性がある。`,
    change: followup + change, paths: /^(?:scripts|tools)\//.test(s.source_path) ? [s.source_path] : [`tools/innovation-lab/${s.theme}`], metric: { name, unit, direction, target_percent },
    rollback: '比較用の変更だけを旧版へ戻す。出典・全試行・失敗の記録は保持する。',
    ...(custom ?? {}), repository: s.repository, source_path: s.source_path, source_sha256: s.source_sha256,
    operator, signal_id: s.id, novelty_key: novelty, registry_status: 'OPEN', created_at: now,
    research_question: s.question, parent_candidate: parent?.candidate_id ?? null,
    related_sources: partner ? [{ id: partner.id, source: partner.source, source_sha256: partner.source_sha256 }] : [],
    observed_revisions: [s.source.split('/blob/')[1].split('/')[0]],
    provenance: { source: s.source, source_line: s.source_line, origin: s.origin, evidence_key: s.evidence_key ?? null,
      qualification: 'Grounded question or local-model discrepancy, not a verified current server defect.' }, generator_version: 1 };
}

function nearDuplicate(candidate, existing) {
  if (existing.novelty_key === candidate.novelty_key || norm(existing.hypothesis) === norm(candidate.hypothesis)) return true;
  if (candidate.parent_candidate !== existing.parent_candidate) return false;
  if (candidate.repository !== existing.repository || candidate.source_path !== existing.source_path || candidate.operator !== existing.operator) return false;
  const grams = x => { const s = norm(x); return new Set(Array.from({ length: Math.max(0, s.length - 2) }, (_, i) => s.slice(i, i + 3))); };
  const a = grams(candidate.hypothesis), b = grams(existing.hypothesis);
  const common = [...a].filter(x => b.has(x)).length;
  return common / Math.max(1, a.size + b.size - common) >= 0.9;
}

export function discover(snapshot, context, original = emptyRegistry(), { now = new Date().toISOString(), proposals = [] } = {}) {
  validateRegistry(original);
  assert(context?.schema_version === 1 && typeof context.occupied === 'boolean' && Array.isArray(context.closed) && date(context.reviewed_at), 'Invalid work context');
  assert(Object.keys(context).sort().join() === ['schema_version', 'reviewed_at', 'occupied', 'closed'].sort().join(), 'Unknown work context field');
  assert(date(now) && Date.parse(now) >= Date.parse(context.reviewed_at) && Date.parse(now) - Date.parse(context.reviewed_at) <= 86400000, 'Refresh work context within 24 hours');
  const complete = inspectSnapshot(snapshot, discoveryConfig, now);
  const state = structuredClone(original);
  const probes = complete ? runProbes(snapshot) : { schema_version: 1, execution_scope: 'local-model', runtime_status: 'NOT_RUN', probes: [] };
  const signals = complete ? extractSignals(snapshot, probes) : [];
  const added = [], skipped = [];
  const roundKey = digest(JSON.stringify({ observed_at: snapshot.observed_at, heads: snapshot.repositories.map(r => r.head_sha),
    sources: snapshot.repositories.map(r => Object.values(r.files).map(f => f.sha256 ?? 'missing')), complete,
    feedback: state.feedback.map(f => f.id), dismissals: state.dismissals, closed: [...context.closed].sort(), proposals }));
  if (complete) for (const c of state.candidates) {
    if (fromSource(snapshot, c.repository, c.source_path)?.sha256 !== c.source_sha256) c.registry_status = 'SUPERSEDED';
    else {
      const head = snapshot.repositories.find(r => r.full_name === c.repository).head_sha;
      if (!c.observed_revisions.includes(head)) c.observed_revisions.push(head);
    }
  }
  const closed = new Set(closedIds(state, context));
  const available = () => state.candidates.filter(c => c.registry_status === 'OPEN' && !closed.has(c.id));
  const eligibleHistory = () => state.candidates.filter(c => c.registry_status !== 'SUPERSEDED');
  const add = c => {
    validateCatalog({ schema_version: 1, experiments: [c] }, discoveryConfig);
    assert(c.paths.every(p => !protectedPath(p)), 'Generated candidate targets a protected record');
    if (added.length >= limits.new_candidates || available().length >= limits.open_candidates || state.candidates.length >= limits.candidates) { skipped.push({ id: c.id, reason: 'CAPACITY' }); return; }
    if (state.candidates.some(x => x.id === c.id) || eligibleHistory().some(x => nearDuplicate(c, x))) { skipped.push({ id: c.id, reason: 'DUPLICATE' }); return; }
    state.candidates.push(c); added.push(c.id);
  };
  const weights = strategy(state);
  if (complete && !state.rounds.includes(roundKey)) {
    assert(Array.isArray(proposals) && proposals.length <= 4, 'At most four custom proposals per cycle');
    for (const p of proposals) {
      assert(p && Object.keys(p).sort().join() === ['signal_id', 'title', 'hypothesis', 'change', 'paths', 'metric', 'rollback'].sort().join(), 'Invalid custom proposal fields');
      const s = signals.find(s => s.id === p.signal_id); assert(s, 'Custom proposal requires a current collected signal');
      assert([p.title, p.hypothesis, p.change, p.rollback].every(text), 'Missing custom proposal text');
      const { signal_id: ignored, ...custom } = p; add(makeCandidate(s, 'custom', now, null, null, custom));
    }
    // An outcome supplies a new question and deliberately chooses a different method.
    for (const f of latestFeedback(state).filter(terminal)) {
      const parent = state.candidates.find(c => c.id === f.candidate_id) ?? seeds.experiments.find(c => c.id === f.candidate_id);
      const s = signals.find(x => x.id === parent?.signal_id) ?? signals.find(x => x.repository === parent?.repository && x.source_path === parent?.source_path);
      if (!s) continue;
      const next = f.decision === 'PROMISING' ? 'vary' : f.decision === 'REJECT' ? 'invert' : 'combine';
      const method = next === parent.operator ? 'explain' : next;
      add(makeCandidate({ ...s, question: `${f.decision}: ${f.reason} この結果を説明する条件をどう識別するか。` }, method, now, null, f));
    }
    // Rotate through underused operators and different themes. No dependence on the fixed eight seeds.
    for (const s of signals) {
      for (const { operator } of weights) {
        const partner = operator === 'combine' ? signals.find(x => x.theme !== s.theme && x.repository === s.repository) : null;
        if (operator === 'combine' && !partner) continue;
        add(makeCandidate(s, operator, now, partner));
        if (added.length >= limits.new_candidates || available().length >= limits.open_candidates) break;
      }
      if (added.length >= limits.new_candidates || available().length >= limits.open_candidates) break;
    }
    state.rounds.push(roundKey);
  }
  state.last_collection = complete ? 'COMPLETE_FOR_CONFIGURED_SCOPE' : 'NEEDS_REFRESH';
  const experiments = { schema_version: 1, experiments: [...seeds.experiments, ...state.candidates] };
  const allClosed = closedIds(state, context);
  const p = plan(snapshot, { now, occupied: context.occupied, closed: allClosed, experiments, collectionConfig: discoveryConfig });
  const needsResearch = complete && !available().length && !added.length;
  const questions = complete ? [
    ...probes.probes.filter(p => p.model_status === 'MODEL_UNSUPPORTED').map(p => ({ kind: 'MODEL_REVIEW', question: `${p.source_path} の更新版にモデルが対応しているか確認し、必要な反例を追加する。`, source: fromSource(snapshot, p.repository, p.source_path)?.url ?? null })),
    ...(needsResearch || !signals.length ? [{ kind: 'RESEARCH_REQUIRED', question: '未収集の実測記録・新しい条件・別方式の根拠を読み、まだ比べていない前提を一つ探す。根拠がなければ新案の数を増やさない。', source: null }] : []),
    ...signals.slice(0, 3).map(s => ({ kind: 'CUSTOM_HYPOTHESIS', signal_id: s.id, question: s.question, source: s.source }))
  ] : [{ kind: 'NEEDS_REFRESH', question: '不完全な取得を再確認する。古い原本で新しい変更を準備しない。', source: null }];
  const result = { schema_version: 2, evaluated_at: now, collection_status: state.last_collection, added, skipped,
    discovery_status: !complete ? 'NEEDS_REFRESH' : available().length >= limits.open_candidates ? 'BACKLOG_FULL' : needsResearch ? 'RESEARCH_REQUIRED' : 'DISCOVERED',
    signals, probes, strategy: strategy(state), questions, plan: p, authorization: 'NONE', runtime_status: 'NOT_RUN',
    limits, round_key: roundKey };
  result.fingerprint = digest(JSON.stringify({ status: result.discovery_status, collection: state.last_collection,
    candidates: state.candidates.map(c => [c.id, c.registry_status]), feedback: state.feedback.map(f => f.id),
    questions: questions.map(q => ({ ...q, source: q.source?.replace(/\/blob\/[a-f0-9]{40}\//, '/blob/observed/') ?? null })), plan: p.fingerprint }));
  validateRegistry(state);
  return { state, result };
}

function bytesInside(root, name) {
  assert(safePath(name), 'Unsafe archive path');
  const base = realpathSync(root), target = realpathSync(resolve(base, name)), rel = relative(base, target);
  assert(rel && !rel.startsWith('..') && !isAbsolute(rel), 'Archive escapes state root');
  const b = readFileSync(target); assert(b.length <= 4 * 1024 * 1024, 'Input exceeds 4 MiB'); return b;
}
function load(root) {
  if (!existsSync(join(root, 'latest.json'))) {
    assert(!existsSync(join(root, 'runs')) && !existsSync(join(root, 'feedback')), 'Missing latest pointer with existing history; recover explicitly');
    return { state: emptyRegistry(), latest: null };
  }
  const latest = read(join(root, 'latest.json'));
  assert(latest?.schema_version === 2 && hash(latest.state_sha256) && hash(latest.fingerprint), 'Invalid discovery pointer');
  const bytes = bytesInside(root, latest.state_path); assert(digest(bytes) === latest.state_sha256, 'Discovery state integrity mismatch');
  const state = JSON.parse(bytes); validateRegistry(state);
  // Recheck archived result/evidence before it can influence any future strategy.
  for (const f of state.feedback) {
    const archived = JSON.parse(bytesInside(root, f.archive));
    assert(protocolDigest(archived.protocol) === f.protocol_sha256 && digest(json(archived.results)) === f.results_sha256, 'Feedback archive integrity mismatch');
    const evidence = join(root, dirname(f.archive), 'evidence');
    const verdict = evaluate(archived.protocol, archived.results, evidence, f.recorded_at);
    assert(verdict.decision === f.decision && verdict.data_kind === 'measured', 'Archived feedback no longer verifies');
  }
  return { state, latest };
}
function withLock(root, operation) {
  mkdirSync(root, { recursive: true });
  const lock = join(root, 'discovery.lock'), fd = openSync(lock, 'wx');
  try { writeFileSync(fd, json({ pid: process.pid, started_at: new Date().toISOString() })); return operation(); }
  finally { closeSync(fd); unlinkSync(lock); }
}
export function discoveryMarkdown(result) {
  return ['# 自律的な発火点の探索結果', '', `日時: ${result.evaluated_at} / ${result.collection_status} / ${result.discovery_status}`,
    '', `新規候補: ${result.added.length} / 準備候補: ${result.plan.selected ?? 'なし'} / 実機試験: NOT RUN`, '',
    '## 能動的に試したこと', '', '採録したソースに対応するローカルモデルで条件を変えました。対象サーバーは操作していません。', '',
    '| プローブ | モデル | ケース数 | 不一致 |', '| --- | --- | --- | --- |',
    ...result.probes.probes.map(p => `| ${clean(p.id)} | ${p.model_status} | ${p.cases.length} | ${p.cases.filter(c => c.result === 'MISMATCH').length} |`), '',
    '## 自動登録した新しい仮説', '', ...result.plan.queue.filter(c => result.added.includes(c.id)).flatMap(c => [
      `### ${c.id}: ${clean(c.title)}`, '', c.hypothesis, '', `方法: ${c.operator} / 状態: ${c.state}`, '',
      `変更案: ${c.change}`, '', `[原本](${c.source})`, '']),
    '## 次に探索する問い', '', ...result.questions.map(q => `- ${clean(q.kind)}: ${clean(q.question)}${q.signal_id ? ' (' + q.signal_id + ')' : ''}`), '',
    '## 次の探索方法の重み', '', '| 方法 | 生成履歴 | 実測評価 | 有望 | 棄却 | 重み |', '| --- | --- | --- | --- | --- | --- |',
    ...result.strategy.map(s => `| ${s.operator} | ${s.generated} | ${s.evaluated} | ${s.promising} | ${s.rejected} | ${s.weight.toFixed(3)} |`), '',
    '重みは探索配分のための値です。能力・安全性・成功確率の認定ではありません。文章一致とモデルの反例は、実機の欠陥を断定する証拠とは区別します。', ''].join('\n');
}
function persist(root, state, result, previous, kind = 'cycle') {
  const dir = join('runs', randomUUID()).replaceAll('\\', '/'), run = join(root, dir); mkdirSync(run, { recursive: true });
  const stateBytes = json(state); writeFileSync(join(run, 'state.json'), stateBytes, { flag: 'wx' });
  writeFileSync(join(run, 'result.json'), json(result), { flag: 'wx' });
  if (kind === 'cycle') {
    writeFileSync(join(run, 'report.md'), discoveryMarkdown(result), { flag: 'wx' });
    writeFileSync(join(run, 'catalog.json'), json({ schema_version: 1, experiments: [...seeds.experiments, ...state.candidates] }), { flag: 'wx' });
    const selected = result.plan.queue.find(c => c.id === result.plan.selected);
    if (selected && (previous?.selected !== selected.id || previous?.selected_base_sha !== selected.base_sha))
      writeFileSync(join(run, 'protocol.draft.json'), json(draftProtocol(selected, result.evaluated_at)), { flag: 'wx' });
  }
  const pointer = { schema_version: 2, kind, evaluated_at: result.evaluated_at, fingerprint: result.fingerprint,
    state_path: dir + '/state.json', state_sha256: digest(stateBytes), result_path: dir + '/result.json',
    report_path: kind === 'cycle' ? dir + '/report.md' : previous?.report_path ?? null,
    selected: result.plan?.selected ?? null, selected_base_sha: result.plan?.queue.find(c => c.id === result.plan.selected)?.base_sha ?? null,
    notify: previous?.fingerprint !== result.fingerprint };
  const temp = join(root, '.latest-' + randomUUID()); writeFileSync(temp, json(pointer), { flag: 'wx' }); renameSync(temp, join(root, 'latest.json'));
  return pointer;
}
export function runDiscovery({ snapshot, context, outputDir, proposals = [], now = new Date().toISOString() }) {
  return withLock(outputDir, () => { const { state, latest } = load(outputDir); const next = discover(snapshot, context, state, { proposals, now });
    return persist(outputDir, next.state, next.result, latest); });
}
export function recordFeedback({ outputDir, protocol, results, evidenceDir, now = new Date().toISOString() }) {
  return withLock(outputDir, () => {
    const { state, latest } = load(outputDir);
    const candidate = state.candidates.find(c => c.id === protocol.candidate_id) ?? seeds.experiments.find(c => c.id === protocol.candidate_id);
    assert(candidate, 'Feedback candidate is not registered');
    assert(protocol.repository === candidate.repository && protocol.hypothesis === candidate.hypothesis && protocol.intervention === candidate.change,
      'Feedback protocol does not describe the registered candidate');
    assert(['name', 'unit', 'direction'].every(k => protocol.metric[k] === candidate.metric[k]), 'Feedback metric differs from the registered candidate');
    if (candidate.provenance) assert(candidate.observed_revisions.includes(protocol.baseline_sha), 'Feedback baseline differs from the collected candidate revisions');
    const verdict = evaluate(protocol, results, evidenceDir, now);
    assert(verdict.data_kind === 'measured' && verdict.decision !== 'DEMO_ONLY', 'Synthetic results cannot update the real discovery strategy');
    const resultHash = digest(json(results)), protocolHash = protocolDigest(protocol), key = digest(protocolHash + resultHash);
    if (state.feedback.some(f => f.id === key)) return { ...latest, duplicate_feedback: true, notify: false };
    assert(!state.feedback.some(f => f.protocol_sha256 === protocolHash && terminal(f)), 'A terminal experiment cannot be rewritten; register a new experiment');
    assert(state.feedback.length < limits.feedback, 'Feedback capacity reached');
    const archiveDir = 'feedback/' + randomUUID(), archive = archiveDir + '/input.json', destination = join(outputDir, archiveDir);
    mkdirSync(join(destination, 'evidence'), { recursive: true });
    for (const name of new Set(['context.json', ...results.runs.filter(r => r.artifact).map(r => r.artifact.path)])) {
      const bytes = bytesInside(evidenceDir, name), target = join(destination, 'evidence', name);
      mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes, { flag: 'wx' });
    }
    writeFileSync(join(outputDir, archive), json({ protocol, results }), { flag: 'wx' });
    // Verify the copy, not just the original input, before making it part of learning history.
    assert(evaluate(protocol, results, join(destination, 'evidence'), now).decision === verdict.decision, 'Copied feedback verification failed');
    state.feedback.push({ id: key, candidate_id: candidate.id, protocol_sha256: protocolHash, results_sha256: resultHash,
      decision: verdict.decision, reason: verdict.reason, recorded_at: now, archive });
    validateRegistry(state);
    return persist(outputDir, state, { evaluated_at: now, fingerprint: digest(json(state)), verdict, strategy: strategy(state) }, latest, 'feedback');
  });
}
export function dismissCandidate({ outputDir, candidateId, reason, now = new Date().toISOString() }) {
  return withLock(outputDir, () => {
    const { state, latest } = load(outputDir); assert(state.candidates.some(c => c.id === candidateId) && text(reason) && date(now), 'Candidate and dismissal reason required');
    if (state.dismissals.some(d => d.candidate_id === candidateId)) return { ...latest, notify: false, duplicate_dismissal: true };
    state.dismissals.push({ candidate_id: candidateId, reason, recorded_at: now });
    return persist(outputDir, state, { evaluated_at: now, fingerprint: digest(json(state)), candidate_id: candidateId }, latest, 'dismissal');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2); let result;
    if (command === 'cycle') {
      assert(args.length === 3 || args.length === 4, 'Usage: discovery.mjs cycle SNAPSHOT CONTEXT STATE_DIR [PROPOSALS]');
      const custom = args[3] ? read(args[3]) : { schema_version: 1, proposals: [] };
      assert(custom.schema_version === 1 && Array.isArray(custom.proposals), 'Invalid proposals document');
      result = runDiscovery({ snapshot: read(args[0]), context: read(args[1]), outputDir: resolve(args[2]), proposals: custom.proposals });
      const saved = read(join(resolve(args[2]), result.result_path)); if (saved.collection_status === 'NEEDS_REFRESH') process.exitCode = 3;
    } else if (command === 'feedback') {
      assert(args.length === 4, 'Usage: discovery.mjs feedback STATE_DIR REGISTERED RESULTS EVIDENCE_DIR');
      result = recordFeedback({ outputDir: resolve(args[0]), protocol: read(args[1]), results: read(args[2]), evidenceDir: resolve(args[3]) });
    } else if (command === 'dismiss') {
      assert(args.length === 3, 'Usage: discovery.mjs dismiss STATE_DIR CANDIDATE_ID REASON');
      result = dismissCandidate({ outputDir: resolve(args[0]), candidateId: args[1], reason: args[2] });
    } else throw Error('Commands: cycle, feedback, dismiss');
    process.stdout.write(json(result));
  } catch (error) { process.stderr.write(`Discovery stopped: ${error.message}\n`); process.exitCode = 2; }
}
