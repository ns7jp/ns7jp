import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync, openSync, closeSync, unlinkSync, renameSync } from 'node:fs';
import { resolve, dirname, join, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assert, digest, safePath, validateConfig } from '../portfolio-audit/scripts/github.mjs';
import { inspectSnapshot, overlap } from '../portfolio-audit/scripts/cycle.mjs';

const config = JSON.parse(readFileSync(new URL('../portfolio-audit/live.config.json', import.meta.url)));
export const catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url)));
const json = x => JSON.stringify(x, null, 2) + '\n';
const read = p => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const sha = x => typeof x === 'string' && /^[a-f0-9]{40}$/.test(x);
const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const candidateId = x => typeof x === 'string' && /^INV-(?:\d{3}|[a-f0-9]{16})$/.test(x);
const protocolId = x => typeof x === 'string' && /^INV-(?:\d{3}|[a-f0-9]{16})-[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const date = x => {
  if (typeof x !== 'string') return false;
  const m = x.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  if (!m || !Number.isFinite(Date.parse(x))) return false;
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate() && hour < 24 && minute < 60 && second < 60;
};
const text = x => typeof x === 'string' && x.trim() && !/NOT SET|TODO/.test(x);
const safeMarkdown = x => String(x).replace(/[\r\n|]/g, ' ').replace(/[<>\[\]`]/g, '');
function fields(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `Invalid ${label}`);
  assert(Object.keys(value).sort().join() === [...keys].sort().join(), `Unknown or missing ${label} fields`);
}

export function validateCatalog(value, collectionConfig = config) {
  validateConfig(collectionConfig);
  assert(value.schema_version === 1 && Array.isArray(value.experiments) && value.experiments.length > 0, 'Invalid catalog');
  const ids = new Set();
  for (const x of value.experiments) {
    assert(candidateId(x.id) && !ids.has(x.id), 'Duplicate or invalid experiment ID'); ids.add(x.id);
    assert(collectionConfig.repositories.some(r => r.full_name === x.repository && r.files.includes(x.source_path)), 'Uncollected catalog source');
    if (Object.hasOwn(x, 'source_sha256')) assert(hash(x.source_sha256), 'Invalid candidate source SHA-256');
    assert([1, 2, 3].includes(x.priority) && [1, 2, 3, 4, 5].includes(x.value) && [1, 2, 3, 4, 5].includes(x.learning), 'Invalid ranking inputs');
    assert(Number.isSafeInteger(x.preparation_minutes) && x.preparation_minutes > 0 && x.preparation_minutes <= 45, 'Invalid preparation budget');
    assert(Array.isArray(x.paths) && x.paths.length && x.paths.every(safePath), 'Invalid candidate paths');
    assert([x.title, x.marker, x.hypothesis, x.change, x.metric.name, x.metric.unit, x.rollback].every(text), 'Missing experiment text');
    assert(['lower', 'higher'].includes(x.metric.direction) && Number.isFinite(x.metric.target_percent) && x.metric.target_percent > 0 && x.metric.target_percent <= 100, 'Invalid target');
  }
}

// The catalog contains hypotheses, not machine-certified defects or achievements.
export function plan(snapshot, { now = new Date().toISOString(), occupied = false, closed = [], experiments = catalog, collectionConfig = config } = {}) {
  validateCatalog(experiments, collectionConfig);
  assert(typeof occupied === 'boolean' && Array.isArray(closed) && closed.every(id => experiments.experiments.some(x => x.id === id)) && new Set(closed).size === closed.length, 'Invalid work context');
  const complete = inspectSnapshot(snapshot, collectionConfig, now);
  const queue = experiments.experiments.map(x => {
    const repo = snapshot.repositories.find(r => r.full_name === x.repository);
    const source = repo?.files[x.source_path];
    const lines = source?.text?.split('\n') ?? [];
    const matching = lines.flatMap((line, index) => line.startsWith(x.marker) ? [index] : []);
    const sourceMatches = !Object.hasOwn(x, 'source_sha256') || source?.sha256 === x.source_sha256;
    const conflict = repo?.open_prs.filter(pr => pr.paths.some(p => x.paths.some(q => overlap(p, q)))).map(p => p.number) ?? [];
    const ci = !repo?.ci_runs.length || repo.ci_runs.some(r => r.status !== 'completed' || r.conclusion !== 'success');
    const state = !complete ? 'NEEDS_REFRESH' : closed.includes(x.id) ? 'CLOSED_BY_RECORD' : matching.length !== 1 || !sourceMatches ? 'SOURCE_REVIEW' :
      conflict.length ? 'EXISTING_PR_REVIEW' : ci ? 'CI_REVIEW' : 'PREPARABLE';
    // Snapshot URLs and HEAD updates are kept as evidence, excluded from notification identity.
    return { ...x, score: Math.round(100 * (2 * x.value + x.learning) / x.preparation_minutes) / 100,
      state, related_prs: conflict, base_sha: repo?.head_sha ?? null,
      source: source?.url ?? null, source_line: matching.length === 1 ? matching[0] + 1 : null,
      source_excerpt: matching.length === 1 ? lines.slice(matching[0], matching[0] + (x.marker.startsWith('## ') ? 7 : 1)).join('\n') : null,
      runtime_status: 'NOT_RUN', publication_allowed: false };
  }).sort((a, b) => a.priority - b.priority || b.score - a.score || a.id.localeCompare(b.id));
  const selected = occupied ? null : queue.find(x => x.state === 'PREPARABLE')?.id ?? null;
  const semantic = { occupied, selected, queue: queue.map(x => ({ id: x.id, state: x.state, related_prs: x.related_prs,
    source_excerpt: x.source_excerpt, hypothesis: x.hypothesis, change: x.change, metric: x.metric, score: x.score, priority: x.priority,
    paths: x.paths, rollback: x.rollback, preparation_minutes: x.preparation_minutes, source_sha256: x.source_sha256 ?? null })) };
  return { schema_version: 1, evaluated_at: now, collection_status: complete ? 'COMPLETE_FOR_CONFIGURED_SCOPE' : 'NEEDS_REFRESH',
    occupied, selected, fingerprint: digest(JSON.stringify(semantic)), queue, authorization: 'NONE',
    selection_meaning: 'One local preparation proposal within the existing weekly budget. No experiment execution or publication authorized.' };
}

export function draftProtocol(candidate, now = new Date().toISOString()) {
  return { schema_version: 1, id: `${candidate.id}-${randomUUID()}`, candidate_id: candidate.id, status: 'DRAFT', registered_at: null,
    hypothesis: candidate.hypothesis, intervention: candidate.change, repository: candidate.repository,
    baseline_sha: candidate.base_sha, candidate_sha: 'NOT SET', environment_id: 'NOT SET', context_sha256: 'NOT SET',
    scope: 'NOT SET', pairs: 3, metric: { ...candidate.metric, max_worst_regression_percent: 0 },
    guardrails: [{ id: 'functional_acceptance', operator: 'eq', target: 1 }, { id: 'data_integrity', operator: 'eq', target: 1 },
      { id: 'unexpected_exposure', operator: 'eq', target: 0 }],
    rollback: candidate.rollback, prepared_at: now };
}

export function validateProtocol(p, registered = true) {
  fields(p, ['schema_version', 'id', 'candidate_id', 'status', 'registered_at', 'hypothesis', 'intervention', 'repository', 'baseline_sha', 'candidate_sha',
    'environment_id', 'context_sha256', 'scope', 'pairs', 'metric', 'guardrails', 'rollback', 'prepared_at'], 'protocol');
  assert(p.schema_version === 1 && protocolId(p.id) && candidateId(p.candidate_id), 'Invalid protocol identity');
  assert(p.id.startsWith(p.candidate_id + '-'), 'Candidate ID does not match protocol ID');
  assert(config.repositories.some(r => r.full_name === p.repository), 'Invalid protocol repository');
  assert(sha(p.baseline_sha) && sha(p.candidate_sha) && p.baseline_sha !== p.candidate_sha, 'Two distinct complete revision SHAs required');
  assert(hash(p.context_sha256) && [p.environment_id, p.scope, p.hypothesis, p.intervention, p.rollback].every(text), 'Complete context and scope required');
  assert(Number.isInteger(p.pairs) && p.pairs >= 3 && p.pairs <= 10, 'Predeclare 3 to 10 pairs');
  fields(p.metric, ['name', 'unit', 'direction', 'target_percent', 'max_worst_regression_percent'], 'metric');
  assert(text(p.metric.name) && text(p.metric.unit) && ['lower', 'higher'].includes(p.metric.direction), 'Invalid metric');
  for (const k of ['target_percent', 'max_worst_regression_percent']) assert(Number.isFinite(p.metric[k]) && p.metric[k] >= 0 && p.metric[k] <= 100, 'Invalid metric threshold');
  assert(p.metric.target_percent > 0, 'A positive improvement target is required');
  assert(Array.isArray(p.guardrails) && p.guardrails.length > 0, 'Guardrails required');
  const ids = new Set();
  for (const g of p.guardrails) {
    fields(g, ['id', 'operator', 'target'], 'guardrail');
    assert(/^[a-z][a-z0-9_]*$/.test(g.id) && !ids.has(g.id), 'Invalid or duplicate guardrail'); ids.add(g.id);
    assert(['eq', 'lte', 'gte'].includes(g.operator) && Number.isFinite(g.target), 'Invalid guardrail condition');
  }
  assert(date(p.prepared_at), 'Invalid preparation time');
  if (registered) assert(p.status === 'REGISTERED' && date(p.registered_at) && Date.parse(p.registered_at) >= Date.parse(p.prepared_at), 'Protocol must be registered before measurement');
  else assert(p.status === 'DRAFT' && p.registered_at === null, 'Expected an unregistered draft');
}

export function register(p, now = new Date().toISOString()) {
  validateProtocol(p, false);
  const result = { ...p, status: 'REGISTERED', registered_at: now };
  validateProtocol(result);
  return result;
}

export const protocolDigest = p => digest(json(p));
const median = values => { const a = [...values].sort((x, y) => x - y), n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };

function artifactDigest(root, path) {
  assert(safePath(path), 'Unsafe artifact path');
  const base = realpathSync(root), target = realpathSync(resolve(base, path));
  const rel = relative(base, target);
  assert(rel && !rel.startsWith('..') && !isAbsolute(rel), 'Artifact escapes evidence root');
  return digest(readFileSync(target));
}

export function evaluate(protocol, results, evidenceRoot, now = new Date().toISOString()) {
  validateProtocol(protocol);
  assert(artifactDigest(evidenceRoot, 'context.json') === protocol.context_sha256, 'Context manifest hash mismatch');
  fields(results, ['schema_version', 'protocol_sha256', 'data_kind', 'runs'], 'results');
  assert(date(now) && results.schema_version === 1 && results.protocol_sha256 === protocolDigest(protocol), 'Protocol digest mismatch');
  assert(['measured', 'synthetic'].includes(results.data_kind) && Array.isArray(results.runs), 'Invalid result data');
  const answer = (decision, reason, statistics = null) => ({ schema_version: 1, protocol_sha256: protocolDigest(protocol),
    decision: results.data_kind === 'synthetic' ? 'DEMO_ONLY' : decision, underlying_decision: decision, reason, statistics,
    data_kind: results.data_kind, evaluated_at: now, authorization: 'NONE', publication_allowed: false,
    limitations: 'Local artifact hashes and declared provenance checked; authenticity and measurement truth require review. No server qualification or causal/statistical proof.' });
  const keys = new Set(), artifacts = new Set();
  for (const r of results.runs) {
    fields(r, ['pair', 'variant', 'revision', 'environment_id', 'context_sha256', 'started_at', 'finished_at', 'status', 'value', 'guardrails', 'artifact'], 'run');
    assert(Number.isInteger(r.pair) && r.pair >= 1 && r.pair <= protocol.pairs && ['baseline', 'candidate'].includes(r.variant), 'Unexpected trial');
    const key = `${r.pair}:${r.variant}`; assert(!keys.has(key), 'Duplicate trial'); keys.add(key);
    assert(r.revision === protocol[r.variant + '_sha'] && r.environment_id === protocol.environment_id && r.context_sha256 === protocol.context_sha256, 'Incomparable revision or environment');
    assert(date(r.started_at) && date(r.finished_at) && Date.parse(r.started_at) >= Date.parse(protocol.registered_at) && Date.parse(r.finished_at) >= Date.parse(r.started_at) && Date.parse(r.finished_at) <= Date.parse(now), 'Invalid measurement interval');
    assert(['PASS', 'FAIL', 'NOT_RUN', 'SKIP_ENV'].includes(r.status), 'Invalid run status');
    assert(r.value === null || (Number.isFinite(r.value) && r.value >= 0), 'Invalid measured value');
    fields(r.guardrails, protocol.guardrails.map(g => g.id), 'guardrail results');
    for (const v of Object.values(r.guardrails)) assert(v === null || Number.isFinite(v), 'Invalid guardrail value');
    if (r.status === 'PASS' || r.status === 'FAIL') {
      fields(r.artifact, ['path', 'sha256'], 'artifact');
      assert(hash(r.artifact.sha256) && artifactDigest(evidenceRoot, r.artifact.path) === r.artifact.sha256, 'Artifact hash mismatch');
      assert(!artifacts.has(r.artifact.sha256), 'Reused trial evidence'); artifacts.add(r.artifact.sha256);
    } else assert(r.artifact === null && r.value === null, 'Unrun trial cannot contain measured values or artifacts');
    if (r.status === 'PASS') assert(r.value !== null && Object.values(r.guardrails).every(Number.isFinite), 'PASS requires complete measured values');
  }
  if (results.runs.some(r => r.status === 'FAIL')) return answer('REJECT', 'A recorded trial failed; do not discard it from the comparison.');
  if (results.runs.length !== protocol.pairs * 2 || results.runs.some(r => r.status !== 'PASS')) return answer('NOT_READY', 'All predeclared baseline and candidate trials must be measured.');
  const ordered = [...results.runs].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
  for (let i = 1; i < ordered.length; i++) assert(Date.parse(ordered[i].started_at) >= Date.parse(ordered[i - 1].finished_at), 'Trials overlap in one environment');
  const breach = results.runs.some(r => protocol.guardrails.some(g => g.operator === 'eq' ? r.guardrails[g.id] !== g.target :
    g.operator === 'lte' ? r.guardrails[g.id] > g.target : r.guardrails[g.id] < g.target));
  if (breach) return answer('REJECT', 'A functional, integrity, or exposure guardrail failed.');
  const baseline = results.runs.filter(r => r.variant === 'baseline').map(r => r.value);
  const candidate = results.runs.filter(r => r.variant === 'candidate').map(r => r.value);
  const b = median(baseline), c = median(candidate);
  if (b === 0) return answer('INCONCLUSIVE', 'Zero baseline cannot support a percentage improvement. Choose another preregistered metric.');
  const lower = protocol.metric.direction === 'lower';
  const gain = (lower ? b - c : c - b) / b * 100;
  const worstB = lower ? Math.max(...baseline) : Math.min(...baseline);
  const worstC = lower ? Math.max(...candidate) : Math.min(...candidate);
  const worstOK = lower ? worstC <= worstB * (1 + protocol.metric.max_worst_regression_percent / 100) : worstC >= worstB * (1 - protocol.metric.max_worst_regression_percent / 100);
  const statistics = { pairs: protocol.pairs, baseline_median: b, candidate_median: c, improvement_percent: gain,
    baseline_worst: worstB, candidate_worst: worstC, unit: protocol.metric.unit };
  if (!worstOK) return answer('REJECT', 'Worst observed value regressed beyond the predeclared limit.', statistics);
  return gain >= protocol.metric.target_percent ? answer('PROMISING', 'Target reached in this small comparison; reviewer and follow-up trial required.', statistics) :
    answer('ITERATE', 'Target not reached. Keep the result and revise the next hypothesis.', statistics);
}

export function markdown(p) {
  return ['# サーバー構築の改善実験キュー', '', `評価: ${p.evaluated_at} / 収集: ${p.collection_status}`,
    '', `準備候補: ${p.selected ?? 'なし'} / 既存作業枠使用中: ${p.occupied} / 実機試験: NOT RUN`, '',
    '| ID | 優先 | 仮説のテーマ | 状態 | 準備分 |', '| --- | --- | --- | --- | --- |',
    ...p.queue.map(x => `| ${x.id} | P${x.priority} | ${safeMarkdown(x.title)} | ${x.state} | ${x.preparation_minutes} |`), '',
    ...p.queue.flatMap(x => [`## ${x.id}: ${safeMarkdown(x.title)}`, '', `仮説: ${x.hypothesis}`, '', `変更案: ${x.change}`, '',
      `測定: ${x.metric.name} (${x.metric.unit}) / 改善目標 ${x.metric.target_percent}%（提案値、実測値ではない）`, '',
      `根拠: ${x.source ? `[採録した資料](${x.source}${x.source_line ? '#L' + x.source_line : ''})` : '収集不全'}`, '',
      `戻し方: ${x.rollback}`, '']), '選択はローカル準備の提案です。本人の技能合格・実機操作・公開の許可ではありません。', ''].join('\n');
}

// One destination lock; immutable runs + atomic pointer. Existing drafts and measurements are never overwritten.
export function savePlan(p, outputDir) {
  mkdirSync(outputDir, { recursive: true });
  const lockPath = join(outputDir, 'innovation.lock');
  const fd = openSync(lockPath, 'wx');
  try {
    writeFileSync(fd, json({ pid: process.pid, started_at: p.evaluated_at }));
    const latestPath = join(outputDir, 'latest.json');
    const previous = existsSync(latestPath) ? read(latestPath) : null;
    if (previous) assert(previous.schema_version === 1 && hash(previous.fingerprint) && text(previous.report), 'Invalid previous state');
    const notify = previous?.fingerprint !== p.fingerprint;
    const runDir = join(outputDir, 'runs', randomUUID()); mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'plan.json'), json(p), { flag: 'wx' });
    writeFileSync(join(runDir, 'report.md'), markdown(p), { flag: 'wx' });
    // Do not create endless copies of an unchanged proposed experiment.
    if (notify && p.selected) writeFileSync(join(runDir, 'protocol.draft.json'), json(draftProtocol(p.queue.find(x => x.id === p.selected), p.evaluated_at)), { flag: 'wx' });
    const latest = { schema_version: 1, evaluated_at: p.evaluated_at, fingerprint: p.fingerprint, notify,
      selected: p.selected, report: join(runDir, 'report.md'), collection_status: p.collection_status };
    const temp = latestPath + '.' + randomUUID(); writeFileSync(temp, json(latest), { flag: 'wx' }); renameSync(temp, latestPath);
    return latest;
  } finally { closeSync(fd); unlinkSync(lockPath); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'plan') {
      assert(args.length === 3 || args.length === 5, 'Usage: innovation.mjs plan SNAPSHOT.json CONTEXT.json OUTPUT_DIR [CATALOG.json LIVE_CONFIG.json]');
      const context = read(args[1]);
      fields(context, ['schema_version', 'reviewed_at', 'occupied', 'closed'], 'work context');
      assert(context.schema_version === 1 && date(context.reviewed_at), 'Invalid context timestamp');
      const now = new Date().toISOString(), age = Date.parse(now) - Date.parse(context.reviewed_at);
      assert(age >= 0 && age <= 24 * 3600000, 'Refresh work context within 24 hours');
      const p = plan(read(args[0]), { now, occupied: context.occupied, closed: context.closed,
        ...(args.length === 5 ? { experiments: read(args[3]), collectionConfig: read(args[4]) } : {}) });
      process.stdout.write(json(savePlan(p, resolve(args[2]))));
      if (p.collection_status === 'NEEDS_REFRESH') process.exitCode = 3;
    } else if (command === 'register') {
      assert(args.length === 2, 'Usage: innovation.mjs register DRAFT.json REGISTERED.json');
      const p = register(read(args[0])); writeFileSync(args[1], json(p), { flag: 'wx' });
      process.stdout.write(json({ protocol_sha256: protocolDigest(p), status: p.status }));
    } else if (command === 'evaluate') {
      assert(args.length === 3, 'Usage: innovation.mjs evaluate REGISTERED.json RESULTS.json EVIDENCE_DIR');
      const result = evaluate(read(args[0]), read(args[1]), args[2]);
      process.stdout.write(json(result));
      if (result.decision !== 'PROMISING') process.exitCode = 3;
    } else throw new Error('Commands: plan, register, evaluate');
  } catch (error) { process.stderr.write(`Innovation stopped: ${error.message}\n`); process.exitCode = 2; }
}
