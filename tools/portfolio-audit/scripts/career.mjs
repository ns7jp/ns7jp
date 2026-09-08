import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BASE = '.local/engineer-career';
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const identifier = value => typeof value === 'string' && ID.test(value);
const PHASES = ['job-search', 'onboarding', 'growth'];
const hash = text => createHash('sha256').update(text).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const check = (condition, message) => { if (!condition) throw Error(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim() && x.length <= 4000 && !/[\x00-\x1f\x7f]/.test(x);
function keys(value, expected, label) {
  check(object(value) && Object.keys(value).sort().join('|') === expected.sort().join('|'), `${label}: invalid fields`);
}
function instant(value, label) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value), `${label}: UTC timestamp required`);
  const t = new Date(value);
  check(Number.isFinite(t.getTime()) && t.toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z'), `${label}: invalid date`);
  return t.getTime();
}
export function safe(root, relative) {
  check(typeof relative === 'string' && relative && !path.isAbsolute(relative) && !path.win32.isAbsolute(relative), 'Relative path required');
  const parts = relative.split('/');
  check(parts.every(p => p && p !== '.' && p !== '..' && !/[\\:\x00-\x1f]/.test(p) && !/[. ]$/.test(p)), 'Unsafe relative path');
  let cursor = fs.realpathSync(root);
  for (const part of parts) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) || (() => { try { fs.lstatSync(cursor); return true; } catch { return false; } })())
      check(!fs.lstatSync(cursor).isSymbolicLink(), 'Symlink/junction forbidden');
  }
  return cursor;
}
function read(root, relative) {
  const file = safe(root, relative), stat = fs.statSync(file);
  check(stat.isFile() && stat.size > 0 && stat.size <= 2 * 1024 * 1024, 'Input must be a nonempty file <= 2 MiB');
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}
function write(root, relative, content, exclusive = false) {
  const target = safe(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  safe(root, relative);
  if (exclusive) fs.writeFileSync(target, content, { flag: 'wx', mode: 0o600 });
  else {
    const temp = target + '.' + randomUUID() + '.tmp';
    fs.writeFileSync(temp, content, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temp, target);
  }
}
export function validate(input, now, root) {
  keys(input, ['schema_version','updated_at','phase','phase_basis','weekly_minutes','load_mode','commitments_minutes','connections','opportunities','actions'], 'career');
  check(input.schema_version === 1 && PHASES.includes(input.phase) && text(input.phase_basis), 'Invalid planning phase');
  const at = instant(now, 'now');
  check(instant(input.updated_at, 'updated_at') <= at, 'Future planning record');
  check(input.weekly_minutes === null || (Number.isInteger(input.weekly_minutes) && input.weekly_minutes >= 0 && input.weekly_minutes <= 2400), 'Capacity must be null or 0..2400 minutes');
  check(['normal','reduced','paused'].includes(input.load_mode), 'Invalid load mode');
  check(Number.isInteger(input.commitments_minutes) && input.commitments_minutes >= 0 && input.commitments_minutes <= 10080, 'Invalid commitments');
  keys(input.connections, ['learner_id','project_board'], 'connections');
  check(input.connections.learner_id === null || (typeof input.connections.learner_id === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(input.connections.learner_id)), 'Invalid learner ID');
  check(typeof input.connections.project_board === 'boolean', 'Invalid project connection');
  check(Array.isArray(input.actions) && input.actions.length <= 100 && Array.isArray(input.opportunities) && input.opportunities.length <= 100, 'Bounded arrays required');
  const seen = new Set(), urls = new Set();
  const evidence = (ref, required) => {
    check((ref === null && !required) || (typeof ref === 'string' && ref.startsWith(BASE + '/records/')), 'Required record must be under private career records');
    if (ref !== null) check(read(root, ref).trim(), 'Empty outcome record');
  };
  for (const o of input.opportunities) {
    keys(o, ['id','source_url','checked_at','status','required_fit','next_check_at','record_ref'], 'opportunity');
    check(identifier(o.id) && !seen.has(o.id), 'Duplicate or invalid opportunity ID'); seen.add(o.id);
    const u = new URL(o.source_url);
    check(u.protocol === 'https:' && !u.username && !u.password, 'Opportunity needs public HTTPS source');
    u.hash = ''; for (const name of [...u.searchParams.keys()]) if (name.startsWith('utm_')) u.searchParams.delete(name);
    u.pathname = u.pathname.replace(/\/$/, '') || '/'; u.searchParams.sort();
    check(!urls.has(u.href), 'Duplicate opportunity source'); urls.add(u.href);
    check(o.checked_at === null || instant(o.checked_at, 'checked_at') <= at, 'Future opportunity observation');
    check(['DISCOVERED','REVIEWED','SUBMITTED','INTERVIEW','OFFER','CLOSED'].includes(o.status), 'Invalid opportunity status');
    check(['UNKNOWN','MEETS','GAP'].includes(o.required_fit), 'Invalid required fit');
    if (o.next_check_at !== null) instant(o.next_check_at, 'next_check_at');
    evidence(o.record_ref, ['SUBMITTED','INTERVIEW','OFFER','CLOSED'].includes(o.status));
  }
  const opportunities = new Set(seen); seen.clear();
  for (const a of input.actions) {
    keys(a, ['id','title','kind','phase','minutes','priority','owner','status','depends_on','due_at','opportunity_id','requires_fresh_opportunity','evidence_ref','reference','done_when'], 'action');
    check(identifier(a.id) && a.id !== 'weekly-review' && !seen.has(a.id), 'Duplicate or invalid action ID'); seen.add(a.id);
    check(text(a.title) && text(a.done_when) && ['technical','career','communication','workplace'].includes(a.kind), 'Invalid action content');
    check(PHASES.includes(a.phase) && ['human','codex'].includes(a.owner), 'Invalid action phase/owner');
    check(Number.isInteger(a.minutes) && a.minutes > 0 && a.minutes <= 2400 && [1,2,3].includes(a.priority), 'Invalid effort/priority');
    check(['BACKLOG','ACTIVE','BLOCKED','DONE','CANCELLED'].includes(a.status), 'Invalid action status');
    check(Array.isArray(a.depends_on) && a.depends_on.length <= 100 && a.depends_on.every(identifier) && new Set(a.depends_on).size === a.depends_on.length, 'Invalid dependencies');
    if (a.due_at !== null) instant(a.due_at, 'due_at');
    check(a.opportunity_id === null || opportunities.has(a.opportunity_id), 'Unknown opportunity');
    check(typeof a.requires_fresh_opportunity === 'boolean', 'Invalid freshness requirement');
    check(a.reference.startsWith('docs/'), 'Action must refer to an existing document'); read(root, a.reference);
    evidence(a.evidence_ref, a.status === 'DONE');
  }
  const visited = new Set(), visiting = new Set(), actions = new Map(input.actions.map(a => [a.id, a]));
  function visit(id) {
    check(actions.has(id), 'Unknown dependency');
    check(!visiting.has(id), 'Cyclic dependency');
    if (visited.has(id)) return;
    visiting.add(id); for (const dep of actions.get(id).depends_on) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of actions.keys()) visit(id);
}

export async function context(input, root, now) {
  const signals = { learner: { state: 'NOT_CONNECTED' }, projects: { state: 'NOT_CONNECTED' } };
  if (input.connections.learner_id) {
    try {
      const { execute } = await import('../../../scripts/server-engineer.mjs');
      const report = JSON.parse(execute(['report', '--learner', input.connections.learner_id, '--json'], { root, now: () => new Date(now) }));
      signals.learner = { state: 'READ', stages: report.stages.map(s => ({ id: s.id, status: s.status })) };
    } catch { signals.learner = { state: 'UNAVAILABLE', reason: 'SE台帳の未作成・不整合・未対応。正本側で確認する。' }; }
  }
  if (input.connections.project_board) {
    try {
      const { execute } = await import('../../../scripts/server-projects.mjs');
      const report = JSON.parse(execute(['board', '--json'], { root, now: () => new Date(now) }));
      signals.projects = { state: 'READ', count: report.projects.length, doing: report.doing,
        total_remaining_hours: report.remainingHours, note: '全期間の残量。週の割当へ自動換算しない。' };
    } catch { signals.projects = { state: 'UNAVAILABLE', reason: 'PJ台帳を読み取れない。正本側で確認する。' }; }
  }
  return signals;
}

export function plan(input, signals, now, root) {
  validate(input, now, root);
  const warnings = [], deferred = [], at = instant(now, 'now');
  const capacity = input.weekly_minutes;
  const effective = input.load_mode === 'paused' || capacity === null ? 0 : Math.floor(capacity * (input.load_mode === 'reduced' ? 0.5 : 1));
  const reserve = Math.floor(effective * 0.2);
  let available = Math.max(0, effective - reserve - input.commitments_minutes);
  if (capacity === null) warnings.push('CAPACITY_NOT_SET');
  if (input.commitments_minutes > effective - reserve) warnings.push('COMMITMENTS_EXCEED_AVAILABLE_CAPACITY');
  if (at - instant(input.updated_at, 'updated_at') > 28 * 86400000) warnings.push('PLANNING_RECORD_NEEDS_REVIEW');
  for (const [name, signal] of Object.entries(signals)) if (signal.state === 'UNAVAILABLE') warnings.push(name.toUpperCase() + '_UNAVAILABLE');
  const dueOpportunities = input.opportunities.filter(o => o.status !== 'CLOSED' && o.next_check_at && instant(o.next_check_at, 'next_check_at') <= at + 7 * 86400000).map(o => o.id).sort();
  const selected = [];
  const reviewMinutes = Math.min(input.load_mode === 'reduced' ? 30 : 60, available);
  if (reviewMinutes > 0) {
    selected.push({ id: 'weekly-review', title: '実際の結果・負荷・次の一手を振り返る', minutes: reviewMinutes, owner: 'human', kind: 'review', done_when: '実施と未実施、困った点、来週の調整を本人が記録する。' });
    available -= reviewMinutes;
  }
  const map = new Map(input.actions.map(a => [a.id, a]));
  const eligible = [];
  const dueSoon = a => a.due_at && instant(a.due_at, 'due_at') <= at + 7 * 86400000;
  for (const a of input.actions) {
    if (a.phase !== input.phase || ['DONE','CANCELLED'].includes(a.status)) continue;
    let reason = a.status === 'BLOCKED' ? 'BLOCKED' : a.depends_on.some(id => map.get(id).status !== 'DONE') ? 'DEPENDENCY_NOT_DONE' : null;
    const o = input.opportunities.find(o => o.id === a.opportunity_id);
    if (a.requires_fresh_opportunity && (!o || !o.checked_at || at - instant(o.checked_at, 'checked_at') > 14 * 86400000 || o.status === 'CLOSED' || o.required_fit !== 'MEETS')) reason = 'OPPORTUNITY_NEEDS_CONFIRMATION';
    if (a.owner === 'codex') reason = reason ?? 'CODEX_QUEUE_SEPARATE_FROM_HUMAN_TIME';
    if (warnings.includes('PLANNING_RECORD_NEEDS_REVIEW') || (a.kind === 'technical' && warnings.some(w => w.endsWith('_UNAVAILABLE')))) reason = reason ?? 'INPUT_REVIEW_REQUIRED';
    if (reason) {
      deferred.push({ id: a.id, title: a.title, due_at: a.due_at, reason });
      if (dueSoon(a)) warnings.push('DEADLINE_REQUIRES_REPLAN:' + a.id);
    } else eligible.push(a);
  }
  const urgency = a => a.due_at && instant(a.due_at, 'due_at') <= at + 7 * 86400000 ? 0 : a.status === 'ACTIVE' ? 1 : 2;
  eligible.sort((a, b) => urgency(a) - urgency(b) || (urgency(a) === 0 ? a.due_at.localeCompare(b.due_at) : 0) || a.priority - b.priority || a.id.localeCompare(b.id));
  for (const a of eligible) {
    if (selected.filter(x => x.id !== 'weekly-review').length >= 3 || a.minutes > available) {
      deferred.push({ id: a.id, title: a.title, due_at: a.due_at, reason: a.minutes > available ? 'DOES_NOT_FIT_CAPACITY' : 'WIP_LIMIT' });
      if (urgency(a) === 0) warnings.push('DEADLINE_REQUIRES_REPLAN:' + a.id);
      continue;
    }
    selected.push({ id: a.id, title: a.title, due_at: a.due_at, minutes: a.minutes, owner: a.owner, kind: a.kind, done_when: a.done_when, reference: a.reference });
    available -= a.minutes;
  }
  return { schema_version: 1, generated_at: now, phase: input.phase,
    phase_basis: input.phase_basis, weekly_minutes: capacity, effective_minutes: effective,
    reserve_minutes: reserve, commitments_minutes: input.commitments_minutes,
    planned_minutes: selected.reduce((sum, a) => sum + a.minutes, 0), unallocated_minutes: available,
    selected, deferred, warnings: [...new Set(warnings)].sort(), due_opportunities: dueOpportunities,
    opportunity_states: input.opportunities.map(o => ({ id: o.id, status: o.status })),
    signals, external_actions_allowed: false,
    completion_basis: '行動完了は本人記録の参照。SE合格・応募送信・内定・入社・業務承認を自動認定しない。' };
}

export function signature(result) {
  const { generated_at, ...semantic } = result;
  return hash(json(semantic));
}
export function render(result) {
  const escape = x => String(x).replace(/[|\r\n]/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return ['# 就職・定着の週次計画', '', `作成: ${result.generated_at}`, '',
    `計画区分: ${result.phase}。${result.phase_basis}`, '',
    `上限 ${result.weekly_minutes ?? '未設定'}分 / 今週有効 ${result.effective_minutes}分 / 既約束 ${result.commitments_minutes}分 / 新規計画 ${result.planned_minutes}分 / 余白 ${result.reserve_minutes}分 / 未配分 ${result.unallocated_minutes}分`, '',
    '| 行動 | 分 | 期限（UTC） | 完了条件 |', '| --- | --- | --- | --- |',
    ...result.selected.map(a => `| ${escape(a.title)} | ${a.minutes} | ${a.due_at ?? '未設定'} | ${escape(a.done_when)} |`), '',
    '## 確認が必要なこと', '', ...result.warnings.map(w => '- ' + escape(w)),
    ...result.due_opportunities.map(id => '- 次回確認が今週までの機会: ' + id), '',
    '## 保留', '', ...result.deferred.map(x => '- ' + escape(x.title) + ': ' + x.reason + ' / 期限（UTC）: ' + (x.due_at ?? '未設定')), '',
    '## 記録の境界', '', result.completion_basis,
    'このファイルは非公開運用用です。応募先や職場の情報を公開リポジトリへ追加しません。',
    '実際の応募・面接・採用・実務評価は別の本人記録です。生成した計画は未実施です。', ''].join('\n');
}

export async function execute(argv, { root = ROOT, now = () => new Date().toISOString(), loadContext = context } = {}) {
  const [command, ...args] = argv;
  if (!command || command === '--help') return 'Usage: node tools/portfolio-audit/scripts/career.mjs init HOURS | plan | check\nPrivate state: .local/engineer-career/profile.json\nNo network, applications, publication or lab commands.\n';
  const at = now(); instant(at, 'now');
  if (command === 'init') {
    check(args.length === 1 && /^\d+(\.\d+)?$/.test(args[0]), 'init requires weekly hours');
    const input = JSON.parse(read(root, 'tools/portfolio-audit/career.config.example.json'));
    input.weekly_minutes = Number(args[0]) * 60; input.updated_at = at;
    validate(input, at, root);
    write(root, BASE + '/profile.json', json(input), true);
    return 'Created private planning profile. No skills, applications or employment outcomes were recorded.\n';
  }
  check(['plan','check'].includes(command) && args.length === 0, 'Unknown command or arguments');
  async function readPlan() {
    const raw = read(root, BASE + '/profile.json');
    const input = JSON.parse(raw); validate(input, at, root);
    const signals = await loadContext(input, root, at);
    const result = plan(input, signals, at, root);
    check(hash(read(root, BASE + '/profile.json')) === hash(raw), 'Profile changed during planning; rerun with current input');
    return result;
  }
  if (command === 'check') { const result = await readPlan(); return json({ status: 'INPUT_VALID', warnings: result.warnings, signals: result.signals }); }
  const lock = safe(root, BASE + '/plan.lock');
  const fd = fs.openSync(lock, 'wx');
  try {
    fs.writeFileSync(fd, json({ pid: process.pid, at }));
    const result = await readPlan();
    const latestPath = BASE + '/latest.json';
    const previous = fs.existsSync(safe(root, latestPath)) ? JSON.parse(read(root, latestPath)) : null;
    check(!previous || (previous.schema_version === 1 && /^[a-f0-9]{64}$/.test(previous.signature)), 'Invalid previous plan state');
    check(!previous || instant(previous.at, 'previous plan time') <= instant(at, 'now'), 'Refusing to overwrite a newer plan');
    const fingerprint = signature(result), folder = BASE + '/plans/' + at.replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8);
    write(root, folder + '/plan.json', json(result)); write(root, folder + '/plan.md', render(result));
    const latest = { schema_version: 1, at, signature: fingerprint, notify: previous?.signature !== fingerprint,
      report: folder + '/plan.md', plan: folder + '/plan.json', external_actions_allowed: false };
    write(root, latestPath, json(latest));
    return json(latest);
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(await execute(process.argv.slice(2))); }
  catch (error) { process.stderr.write('Career planner stopped: ' + error.message + '\n'); process.exitCode = 2; }
}
