// Read-only outcome review over the existing career plan and portfolio loop.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { safe, plan, context } from '../portfolio-audit/scripts/career.mjs';
import { statusView, STAMP, main as loopMain, runLoop } from '../portfolio-loop/loop.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REVIEW = '.local/autonomous-prosperity/review.json';
const PROFILE = '.local/engineer-career/profile.json';
const BASE = '.local/autonomous-prosperity';
const DAY = 86400000;
const check = (ok, message) => { if (!ok) throw Error(message); };
const hash = data => createHash('sha256').update(data).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const actionMeaning = actions => actions.map(({ code, title }) => ({ code, title }));
const text = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 500 && !/[\x00-\x1f\x7f]/.test(x);
const number = x => typeof x === 'number' && Number.isFinite(x);
function keys(x, names, label) {
  check(x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).sort().join('|') === [...names].sort().join('|'), `${label}: invalid fields`);
}
function instant(x) {
  check(typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(x), 'UTC timestamp required');
  const n = Date.parse(x);
  check(Number.isFinite(n) && new Date(n).toISOString().replace('.000Z', 'Z') === x.replace('.000Z', 'Z'), 'Invalid date');
  return n;
}
function read(root, relative) {
  const p = safe(root, relative), stat = fs.statSync(p);
  check(stat.isFile() && stat.size > 0 && stat.size <= 2 * 1024 * 1024, 'Input must be a nonempty file <= 2 MiB');
  return fs.readFileSync(p);
}
const parse = bytes => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));

export function validateReview(review, profile, now, readEvidence) {
  keys(review, ['schema_version', 'updated_at', 'data_kind', 'load', 'observations'], 'review');
  check(review.schema_version === 1 && ['measured', 'synthetic'].includes(review.data_kind), 'Invalid review version or data kind');
  check(instant(review.updated_at) <= instant(now), 'Future review');
  check(['normal', 'reduced', 'paused', 'unknown'].includes(review.load), 'Invalid load');
  check(Array.isArray(review.observations) && review.observations.length <= 100, 'At most 100 observations');
  const ids = new Set(), samples = new Set();
  for (const o of review.observations) {
    keys(o, ['id', 'action_id', 'observed_at', 'metric', 'unit', 'context_key', 'environment', 'before', 'after', 'direction', 'min_delta', 'guardrail_ok', 'evidence_ref', 'evidence_sha256'], 'observation');
    check(typeof o.id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(o.id) && !ids.has(o.id), 'Invalid or duplicate observation ID'); ids.add(o.id);
    check(profile.actions.some(a => a.id === o.action_id), 'Unknown career action');
    check(instant(o.observed_at) <= instant(review.updated_at), 'Observation newer than review');
    for (const key of ['metric', 'unit', 'context_key', 'environment']) check(text(o[key]), `Invalid ${key}`);
    check(number(o.before) && number(o.after) && number(o.min_delta) && o.min_delta > 0, 'Finite measurements and positive min_delta required');
    check(['lower', 'higher'].includes(o.direction) && typeof o.guardrail_ok === 'boolean', 'Invalid direction or guardrail');
    check(typeof o.evidence_ref === 'string' && o.evidence_ref.startsWith('.local/engineer-career/records/'), 'Evidence must reference private career records');
    check(typeof o.evidence_sha256 === 'string' && /^[a-f0-9]{64}$/.test(o.evidence_sha256), 'Invalid evidence hash');
    check(!samples.has(o.evidence_sha256), 'Duplicate evidence content'); samples.add(o.evidence_sha256);
    const evidence = readEvidence(o.evidence_ref);
    check(evidence.toString('utf8').trim().length > 0 && hash(evidence) === o.evidence_sha256, 'Evidence missing, empty or changed');
  }
  return review;
}

export function assessOutcomes(review, now) {
  if (!review || review.data_kind === 'synthetic') return [];
  const groups = new Map();
  for (const o of review.observations) {
    if (instant(now) - instant(o.observed_at) > 28 * DAY) continue;
    const key = JSON.stringify([o.action_id, o.metric, o.unit, o.context_key, o.environment, o.direction, o.min_delta]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, observations]) => {
    const rows = observations.sort((a, b) => instant(b.observed_at) - instant(a.observed_at) || a.id.localeCompare(b.id));
    // One sample per UTC day; repeated edits on the same day cannot establish repetition.
    const days = new Set();
    const recent = rows.filter(o => { const d = o.observed_at.slice(0, 10); if (days.has(d)) return false; days.add(d); return true; }).slice(0, 2);
    const delta = o => (o.after - o.before) * (o.direction === 'higher' ? 1 : -1);
    const state = rows.some(o => !o.guardrail_ok) ? 'REVIEW_HARM'
      : recent.some(o => delta(o) <= -o.min_delta) ? 'CHANGE_METHOD'
      : recent.length < 2 ? 'MEASURE_AGAIN'
      : recent.every(o => delta(o) >= o.min_delta) ? 'CONSIDER_REUSE' : 'REVIEW_HYPOTHESIS';
    return { action_id: rows[0].action_id, metric: rows[0].metric, unit: rows[0].unit, environment: rows[0].environment,
      context_key: rows[0].context_key, state, evidence_ids: recent.map(o => o.id), guardrail_failure_ids: rows.filter(o => !o.guardrail_ok).map(o => o.id) };
  });
}

const MESSAGES = {
  CONNECT_PROFILE: '既存キャリア台帳を接続する。本人の技能や就業状態は未判定。',
  PAUSED: '新規着手を止め、本人が再開条件を確認する。',
  REVIEW_LOAD: '負荷が未確認または増加。既存計画の縮小を本人と確認する。',
  REFRESH_REVIEW: '週次振り返り枠で成果と負荷の確認日を更新する。',
  FIX_LOOP: '既存ループのロック・破損を調査する。',
  REFRESH_AUDIT: '既存ループで最新の監査を取得する。',
  REVIEW_PLAN: '既存計画の警告・接続・時間上限を確認する。',
  REVIEW_EXISTING: '既存ループの判断待ちを先に扱う。',
  REVIEW_HARM: '悪化した品質条件を調査し、拡大を保留する。',
  READY: '既存の選択済み行動の中で、成果確認を続ける。',
};

export function decide({ profile, career, loop, review, now }) {
  instant(now);
  const outcomes = assessOutcomes(review, now);
  let state = 'READY';
  if (!profile) state = 'CONNECT_PROFILE';
  else if (profile.load_mode === 'paused' || (review?.data_kind === 'measured' && review.load === 'paused')) state = 'PAUSED';
  else if (review?.data_kind === 'measured' && (review.load === 'unknown' || (review.load === 'reduced' && profile.load_mode === 'normal'))) state = 'REVIEW_LOAD';
  else if (!review || review.data_kind !== 'measured' || instant(now) - instant(review.updated_at) > 7 * DAY) state = 'REFRESH_REVIEW';
  else if (loop.locks.length || loop.problems.length) state = 'FIX_LOOP';
  else if (!loop.audit.fresh || !loop.last_run || loop.last_run.synthetic || loop.last_run.demo || loop.last_run.outcome !== 'PROCESSED'
    || instant(loop.last_run.evaluated_at) > instant(now) || instant(now) - instant(loop.last_run.evaluated_at) > DAY) state = 'REFRESH_AUDIT';
  else if (career.warnings.length || profile.weekly_minutes === null || profile.weekly_minutes > 600) state = 'REVIEW_PLAN';
  else if (loop.next_actions.some(a => !['NO_CHANGE', 'RESEARCH', 'PREPARE_CANDIDATE', 'REGISTER_PROTOCOL'].includes(a.code))) state = 'REVIEW_EXISTING';
  else if (outcomes.some(o => o.state === 'REVIEW_HARM')) state = 'REVIEW_HARM';
  const reviewSlot = career?.selected.find(a => a.id === 'weekly-review');
  const reviewMinutes = state === 'PAUSED' ? 0 : Math.min(15, reviewSlot?.minutes ?? 0);
  const semantic = { state, message: MESSAGES[state], data_kind: review?.data_kind ?? 'unknown',
    budget: career ? { weekly_minutes: career.weekly_minutes, effective_minutes: career.effective_minutes,
      commitments_minutes: career.commitments_minutes, reserve_minutes: career.reserve_minutes, planned_minutes: career.planned_minutes,
      unallocated_minutes: career.unallocated_minutes, prosperity_review_minutes: reviewMinutes, review_is_subset_of: 'weekly-review', added_minutes: 0 } : null,
    selected_action_ids: state === 'READY' ? career.selected.filter(a => a.id !== 'weekly-review').map(a => a.id) : [],
    selected_actions: state === 'READY' ? career.selected.filter(a => a.id !== 'weekly-review') : [],
    outcomes, upstream_actions: loop?.next_actions ?? [], warnings: career?.warnings ?? [],
    review_slot_available: reviewMinutes > 0, ...STAMP };
  const next_action = state === 'READY'
    ? { code: 'FOLLOW_EXISTING_PLAN', title: semantic.selected_actions[0]?.title ?? '今週は新しい主行動を追加しない。',
      action_id: semantic.selected_action_ids[0] ?? null, done_when: semantic.selected_actions[0]?.done_when ?? null }
    : { code: state, title: MESSAGES[state], upstream: state === 'REVIEW_EXISTING' ? semantic.upstream_actions[0] ?? null : null };
  return { schema_version: 1, evaluated_at: now, ...semantic, next_action,
    signature: hash(json({ ...semantic, upstream_actions: actionMeaning(semantic.upstream_actions) })) };
}

export async function run({ root = ROOT, now = new Date().toISOString() } = {}) {
  root = path.resolve(root);
  if (!fs.existsSync(safe(root, PROFILE))) return decide({ profile: null, career: null, loop: null, review: null, now });
  const profileBytes = read(root, PROFILE), profile = parse(profileBytes);
  const signals = await context(profile, root, now);
  const career = plan(profile, signals, now, root);
  const loop = statusView(root, now);
  const reviewBytes = fs.existsSync(safe(root, REVIEW)) ? read(root, REVIEW) : null;
  const review = reviewBytes ? validateReview(parse(reviewBytes), profile, now, ref => read(root, ref)) : null;
  const result = decide({ profile, career, loop, review, now });
  check(hash(read(root, PROFILE)) === hash(profileBytes), 'Profile changed while reading; rerun');
  check(reviewBytes === null ? !fs.existsSync(safe(root, REVIEW)) : hash(read(root, REVIEW)) === hash(reviewBytes), 'Review changed while reading; rerun');
  return { ...result, input_sha256: { profile: hash(profileBytes), review: reviewBytes ? hash(reviewBytes) : null } };
}

function atomic(root, relative, value) {
  const target = safe(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temporary, json(value), { flag: 'wx', mode: 0o600 });
  fs.renameSync(temporary, target);
}
async function locked(root, action) {
  fs.mkdirSync(safe(root, BASE), { recursive: true });
  const lock = safe(root, BASE + '/run.lock');
  const fd = fs.openSync(lock, 'wx');
  try { fs.writeFileSync(fd, json({ pid: process.pid })); return await action(); }
  finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}

// A single run performs only the existing authorized local pipeline and GitHub GET collection.
// Check-ins remain explicit human input. No synthesized outcome, approval or skill record is written.
export async function cycle({ root = ROOT, offline, proposals = [], occupied = false, free = false, now = () => new Date().toISOString() } = {}) {
  root = path.resolve(root);
  return locked(root, async () => {
    const previousPath = safe(root, BASE + '/latest.json');
    const previous = fs.existsSync(previousPath) ? parse(read(root, BASE + '/latest.json')) : null;
    check(!previous || (previous.schema_version === 1 && /^[a-f0-9]{64}$/.test(previous.signature)), 'Invalid previous prosperity report');
    const before = await run({ root, now: now() }); // Validate private input before the existing loop can write.
    let upstream = null;
    if (before.state !== 'PAUSED') upstream = await runLoop({ root, offline, proposals, occupied, free, now });
    const result = await run({ root, now: now() });
    const upstreamSignature = hash(json(upstream ? { outcome: upstream.outcome, next_actions: actionMeaning(upstream.next_actions),
      occupied: upstream.context.occupied, closed: upstream.context.closed, basis: upstream.context.basis,
      findings: upstream.audit.findings, errors: upstream.audit.errors, intake_errors: upstream.intake.errors } : null));
    const signature = hash(result.signature + upstreamSignature);
    const report = { ...result, signature, notify: previous?.signature !== signature || (upstream?.intake.taken.length ?? 0) > 0,
      loop_outcome: upstream?.outcome ?? 'NOT_RUN' };
    atomic(root, BASE + '/latest.json', report);
    return { ...report, loop_summary: upstream };
  });
}

export async function checkIn(root, load, now = new Date().toISOString()) {
  check(['normal', 'reduced', 'paused'].includes(load), 'check-in requires normal, reduced or paused');
  return locked(root, async () => {
    const profile = parse(read(root, PROFILE));
    const old = fs.existsSync(safe(root, REVIEW)) ? validateReview(parse(read(root, REVIEW)), profile, now, ref => read(root, ref)) : null;
    check(!old || old.data_kind === 'measured', 'Synthetic review cannot become a personal record');
    const review = { schema_version: 1, updated_at: now, data_kind: 'measured', load, observations: old?.observations ?? [] };
    validateReview(review, profile, now, ref => read(root, ref));
    atomic(root, REVIEW, review);
    return { ...STAMP, load, message: '本人が入力した負荷確認を保存。成果の数値や技能合否は追加していません。' };
  });
}

export function render(result) {
  return ['自律繁栄システム（判断の提案）', `状態: ${result.state}`, result.message,
    ...(result.loop_outcome ? [`既存ループ: ${result.loop_outcome}`] : []),
    ...(result.next_action ? [`次の行動: ${result.next_action.upstream?.title ?? result.next_action.title}`,
      ...(result.next_action.upstream?.command ? [`実行例: ${result.next_action.upstream.command}`] : []),
      ...(result.next_action.upstream?.detail ? [`対象: ${result.next_action.upstream.detail}`] : []),
      ...(result.next_action.done_when ? [`完了条件: ${result.next_action.done_when}`] : [])] : []),
    ...(['REFRESH_REVIEW', 'REVIEW_LOAD'].includes(result.state) ? ['本人の負荷を確認して入力: node tools/portfolio-loop/loop.mjs check-in normal|reduced|paused', 'normal=通常 / reduced=減らす / paused=停止（3つから1つを指定）'] : []),
    `入力: ${result.data_kind} / 技能・実機実行: NOT RUN`,
    result.budget ? `既存計画 ${result.budget.planned_minutes} 分 / 振り返り内 ${result.budget.prosperity_review_minutes} 分 / 追加 0 分` : '時間枠: 未接続',
    `成果の比較: ${result.outcomes.length} 組`, ...result.outcomes.map(o => `  ${o.action_id} / ${o.metric}: ${o.state}`),
    'authorization: NONE / publication_allowed: false / external_actions_allowed: false / se_record_writes_allowed: false / runtime_status: NOT_RUN', ''].join('\n');
}

export async function execute(argv) {
  const { values, positionals } = parseArgs({ args: argv, options: { root: { type: 'string' }, json: { type: 'boolean' }, offline: { type: 'string' } }, allowPositionals: true, strict: true });
  const [command, ...rest] = positionals, root = path.resolve(values.root ?? ROOT);
  check(!values.offline || command === 'run', '--offline is only valid with run');
  if (command === 'init') {
    check(rest.length === 0, 'init takes no arguments; default ceiling is 10 hours, existing profile is preserved');
    const r = await loopMain(['init', '10', '--root', root, ...(values.json ? ['--json'] : [])]);
    return r.text;
  }
  if (command === 'check-in') {
    check(rest.length === 1, 'check-in requires one load value');
    const result = await checkIn(root, rest[0]);
    return values.json ? json(result) : result.message + '\n';
  }
  check(rest.length === 0 && ['status', 'run'].includes(command), 'Usage: prosperity.mjs init|status|run|check-in normal|reduced|paused [--root PATH] [--json] [--offline FILE]');
  const result = command === 'run' ? await cycle({ root, offline: values.offline ? parse(fs.readFileSync(path.resolve(values.offline))) : undefined }) : await run({ root });
  if (command === 'run' && result.loop_outcome === 'NEEDS_REFRESH') process.exitCode = 3;
  return values.json ? json(result) : command === 'run' && !result.notify ? '変化なし。新しい判断依頼はありません。\n' : render(result);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(await execute(process.argv.slice(2))); }
  catch (error) { process.stderr.write(`Prosperity stopped: ${error.message}\n`); process.exitCode = 2; }
}
