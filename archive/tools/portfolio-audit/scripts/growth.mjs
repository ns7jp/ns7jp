import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { safe, validate as validateCareer, context as careerContext, plan as careerPlan } from './career.mjs';
import { learningSnapshot } from '../../../scripts/server-engineer.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BASE = '.local/autonomous-growth';
const PROFILE = '.local/engineer-career/profile.json';
const FOLLOWUPS = BASE + '/followups.json';
const SETTINGS = BASE + '/settings.json';
const DAY = 86400000;
const WINDOWS = [1, 7, 28];
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const check = (condition, message) => { if (!condition) throw Error(message); };
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function keys(value, names, label) {
  check(object(value) && Object.keys(value).sort().join('|') === names.sort().join('|'), label + ': invalid fields');
}
function instant(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value), 'UTC timestamp required');
  const date = new Date(value);
  check(Number.isFinite(date.getTime()) && date.toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z'), 'Invalid calendar timestamp');
  return date.getTime();
}
function read(root, relative) {
  const file = safe(root, relative), stat = fs.statSync(file);
  check(stat.isFile() && stat.size > 0 && stat.size <= 10 * 1024 * 1024, 'Input must be a nonempty file <= 10 MiB');
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}
function save(root, relative, content, exclusive = false) {
  const target = safe(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true }); safe(root, relative);
  if (exclusive) fs.writeFileSync(target, content, { flag: 'wx', mode: 0o600 });
  else {
    const temporary = target + '.' + randomUUID() + '.tmp';
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, target);
  }
}
const validUuid = value => typeof value === 'string' && UUID.test(value);

export function validateFollowups(input, snapshot, now, root) {
  keys(input, ['schema_version', 'learner_id', 'recalls', 'review_requests'], 'followups');
  check(input.schema_version === 1 && Array.isArray(input.recalls) && Array.isArray(input.review_requests), 'Invalid followup schema');
  check(input.recalls.length <= 1000 && input.review_requests.length <= 1000, 'Too many followup records');
  if (!snapshot) {
    check(input.learner_id === null && input.recalls.length === 0 && input.review_requests.length === 0, 'Connect the matching learner before using recorded followups');
    return;
  }
  check(input.learner_id === snapshot.learner_id || (input.learner_id === null && input.recalls.length === 0 && input.review_requests.length === 0), 'Followups belong to a different learner');
  const at = instant(now), attempts = new Map(snapshot.attempts.map(a => [a.id, a])), ids = new Set();
  const record = entry => {
    check(validUuid(entry.id) && !ids.has(entry.id), 'Duplicate or invalid followup ID'); ids.add(entry.id);
    check(typeof entry.record_ref === 'string' && entry.record_ref.startsWith(BASE + '/records/'), 'Followup requires a private record reference');
    check(typeof entry.record_sha256 === 'string' && /^[a-f0-9]{64}$/.test(entry.record_sha256), 'Record SHA-256 required');
    const body = read(root, entry.record_ref);
    check(body.trim() && hash(body) === entry.record_sha256, 'Followup record missing, empty or changed');
  };
  let previous = 0;
  const explainedDates = new Map();
  for (const r of input.recalls) {
    keys(r, ['id','attempt_id','interval_days','performed_at','result','assistance','record_ref','record_sha256'], 'recall'); record(r);
    const a = attempts.get(r.attempt_id);
    check(a && a.result === 'PASS', 'Recall must reference an existing PASS attempt');
    check(WINDOWS.includes(r.interval_days), 'Recall interval must be 1, 7 or 28');
    const performed = instant(r.performed_at), due = instant(a.performed_at) + r.interval_days * DAY;
    check(performed >= due && performed <= at && performed >= previous, 'Recall occurred before due time, out of order, or in future'); previous = performed;
    check(['EXPLAINED','GAP','BLOCKED'].includes(r.result) && ['guided','ai','independent'].includes(r.assistance), 'Invalid recall observation');
    if (r.result === 'EXPLAINED' && r.assistance === 'independent') {
      const key = r.attempt_id + ':' + r.performed_at.slice(0, 10);
      check(!explainedDates.has(key) || explainedDates.get(key) === r.interval_days, 'One UTC day cannot satisfy multiple spaced recall intervals');
      explainedDates.set(key, r.interval_days);
    }
  }
  previous = 0;
  for (const r of input.review_requests) {
    keys(r, ['id','stage_id','attempt_ids','requested_at','next_check_at','record_ref','record_sha256'], 'review request'); record(r);
    const stage = snapshot.curriculum.stages.find(s => s.id === r.stage_id);
    check(stage && Array.isArray(r.attempt_ids) && r.attempt_ids.length === 4 && new Set(r.attempt_ids).size === 4, 'Invalid review request binding');
    const requested = instant(r.requested_at);
    check(requested >= previous && requested <= at && instant(r.next_check_at) >= requested, 'Invalid review request times'); previous = requested;
    r.attempt_ids.forEach((id, i) => check(attempts.get(id)?.criterion === stage.criteria[i].id && instant(attempts.get(id).recorded_at) <= requested, 'Review request must bind recorded attempts in criterion order'));
  }
}

const candidate = (rule, criterion, title, minutes, document, attempt_ids = [], extra = {}) =>
  ({ id: rule + ':' + (criterion ?? 'learner'), rule, criterion, title, minutes, document, attempt_ids, ...extra });

export function choose(snapshot, followups, now) {
  const at = instant(now), reminders = [], candidates = [];
  if (!snapshot) return { candidates: [candidate('CONNECT_LEARNER', null, '既存の本人用SE台帳IDを確認し、現在地を接続する', 20, 'docs/server-engineer/tracker-guide.md')], reminders, states: [] };
  const latest = new Map(); for (const a of snapshot.attempts) latest.set(a.criterion, a); // Append order is authoritative.
  const stage = snapshot.stages.find(s => s.status !== 'PASS');
  if (!stage) candidates.push(candidate('ADVANCED_SELECTION', null, '確認済みの範囲と実際の不足から既存BX課題を一つ選ぶ', 30, 'docs/server-engineer/advanced/README.md'));
  else {
    const definition = snapshot.curriculum.stages.find(s => s.id === stage.id);
    const doc = definition.document;
    if (stage.status === 'READY FOR REVIEW') {
      const request = followups.review_requests.findLast(r => r.stage_id === stage.id && JSON.stringify(r.attempt_ids) === JSON.stringify(stage.attemptIds));
      if (!request) candidates.push(candidate('PREPARE_REVIEW', stage.id, '最新の4条件をそろえて評価者への依頼を準備する', 20, 'docs/server-engineer/assessment.md', stage.attemptIds));
      else {
        reminders.push({ rule: 'REVIEW_WAIT', stage: stage.id, due_at: request.next_check_at, request_id: request.id });
        if (instant(request.next_check_at) <= at) candidates.push(candidate('REVIEW_FOLLOWUP', stage.id, '実際の依頼の状況を確認する。送信・承認は別の本人判断', 15, 'docs/server-engineer/assessment.md', stage.attemptIds, { due_at: request.next_check_at }));
      }
    } else if (stage.status === 'REVIEW REJECTED') {
      candidates.push(candidate('REVIEW_FEEDBACK', stage.id, '評価者が指摘した内容を原本で読み、補習を一つ決める', 30, 'docs/server-engineer/assessment.md', stage.attemptIds, { review_id: stage.reviewId }));
    } else {
      const gaps = definition.criteria.flatMap(c => {
        const a = latest.get(c.id);
        if (!a) return [candidate('FIRST_ATTEMPT', c.id, c.title + '：予想・実行・判定の準備をする', 60, doc)];
        if (a.result === 'FAIL') {
          const trailing = [];
          for (const item of snapshot.attempts.filter(item => item.criterion === c.id).reverse()) { if (item.result !== 'FAIL') break; trailing.push(item); }
          const repeated = new Set(trailing.map(item => item.session)).size >= 2;
          return [candidate(repeated ? 'CHANGE_METHOD_OR_ASK' : 'INVESTIGATE_FAILURE', c.id,
            repeated ? '別セッションでもFAILが続いているため、観測方法を変えるか相談する' : '失敗の事実と仮説を分け、識別する確認を一つ選ぶ',
            repeated ? 30 : 60, 'docs/autonomous-growth/practice.md', [a.id])];
        }
        if (a.result === 'BLOCKED') return [candidate('RESOLVE_PRECONDITION', c.id, '未充足の環境・対象・確認者などの前提を整理する', 20, doc, [a.id])];
        if (c.environment === 'vm' && !['vm','physical','cloud'].includes(a.environment) || c.environment === 'runtime' && !['container','vm','physical','cloud'].includes(a.environment))
          return [candidate('REQUIRED_ENVIRONMENT', c.id, '正本が要求する環境で確認するための準備をする', 30, doc, [a.id])];
        if (c.independent && a.assistance !== 'independent') return [candidate('INDEPENDENT_RETRY', c.id, '支援を使った回を残し、別の独力試行を準備する', 60, doc, [a.id])];
        return [];
      });
      const order = ['CHANGE_METHOD_OR_ASK','INVESTIGATE_FAILURE','RESOLVE_PRECONDITION','REQUIRED_ENVIRONMENT','INDEPENDENT_RETRY','FIRST_ATTEMPT'];
      gaps.sort((a, b) => order.indexOf(a.rule) - order.indexOf(b.rule) || a.id.localeCompare(b.id));
      if (gaps.length) candidates.push(gaps[0]);
      else if (stage.id === 'SE07' && stage.status === 'REQUIREMENTS NOT MET') candidates.push(candidate('SEPARATE_REBUILD', 'SE07-C2', '別UTC日・別セッションと変更条件を正本で確認する', 30, doc, stage.attemptIds));
      else candidates.push(candidate('CHECK_REQUIREMENTS', stage.id, '正本の未充足条件を確認し、次の段階は保留する', 20, doc, stage.attemptIds));
    }
  }
  const due = [];
  for (const a of latest.values()) {
    if (a.result !== 'PASS') continue;
    for (const days of WINDOWS) {
      const recall = followups.recalls.findLast(r => r.attempt_id === a.id && r.interval_days === days);
      if (recall?.result === 'EXPLAINED' && recall.assistance === 'independent') continue;
      const due_at = new Date(instant(a.performed_at) + days * DAY).toISOString();
      const completedAnotherIntervalToday = followups.recalls.some(r => r.attempt_id === a.id && r.interval_days !== days &&
        r.result === 'EXPLAINED' && r.assistance === 'independent' && r.performed_at.slice(0, 10) === now.slice(0, 10));
      if (completedAnotherIntervalToday) {
        const nextDay = new Date(now.slice(0, 10) + 'T00:00:00Z').getTime() + DAY;
        reminders.push({ rule: 'RECALL_NOT_BEFORE', stage: a.criterion, due_at: new Date(Math.max(nextDay, instant(due_at))).toISOString(), original_due_at: due_at });
        break;
      }
      if (instant(due_at) <= at) due.push(candidate('RECALL', a.criterion, '手順を閉じて目的・予想・根拠・戻し方を再説明する', 15,
        'docs/autonomous-growth/practice.md', [a.id], { id: 'RECALL:' + a.id + ':' + days, due_at, interval_days: days, last_observation: recall?.result ?? 'NOT RECORDED' }));
      break; // Only the first unfinished window for this attempt, never three catch-up credits at once.
    }
  }
  due.sort((a, b) => a.due_at.localeCompare(b.due_at) || a.id.localeCompare(b.id));
  if (due.length) candidates.push(due[0]);
  return { candidates, reminders, states: snapshot.stages.map(s => ({ id: s.id, status: s.status })) };
}

export function actionSignature(action) {
  return hash(json(['id','title','kind','phase','minutes','owner','depends_on','reference','done_when'].map(key => action[key])));
}
export function allocate(selection, week, now, boundActionId = null) {
  const slot = week.selected.find(a => a.id === boundActionId && a.kind === 'technical' && a.owner === 'human');
  let remaining = slot?.minutes ?? 0;
  const actions = [], deferred = [];
  for (const item of selection.candidates) {
    if (item.minutes <= remaining) { actions.push(item); remaining -= item.minutes; }
    else deferred.push({ ...item, reason: slot ? 'DOES_NOT_FIT_TECHNICAL_SLOT' : 'NO_TECHNICAL_SLOT' });
  }
  return { schema_version: 1, generated_at: now, actions, deferred, reminders: selection.reminders,
    learner_states: selection.states, career_action_id: slot?.id ?? null,
    career_planned_minutes: week.planned_minutes, technical_slot_minutes: slot?.minutes ?? 0,
    growth_minutes: actions.reduce((n, a) => n + a.minutes, 0), remaining_technical_minutes: remaining,
    additional_weekly_minutes: 0, external_actions_allowed: false, se_record_writes_allowed: false,
    note: '既存キャリア計画の技術枠の内訳。実践・再説明は本人が行い、SEの評価は正本のまま。' };
}
export function signature(result) {
  const { generated_at, ...semantic } = result;
  return hash(json(semantic));
}
export function render(result) {
  const clean = x => String(x).replace(/[\r\n|]/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return ['# 自律型成長の次の一手', '', `作成: ${result.generated_at}`, '', result.note, '',
    `接続状態: ${result.binding_status ?? 'explicit allocation'}`, '',
    `技術枠: ${result.technical_slot_minutes}分 / 今回の内訳: ${result.growth_minutes}分 / 週への追加: 0分`, '',
    '| 課題 | 分 | 根拠ID | 期限（UTC） |', '| --- | --- | --- | --- |',
    ...result.actions.map(a => `| ${clean(a.title)} | ${a.minutes} | ${a.attempt_ids.join(', ') || '未接続・未実施または次の選択'} | ${a.due_at ?? '未設定'} |`), '',
    '## 保留と確認', '', ...result.deferred.map(a => '- ' + clean(a.title) + ': ' + a.reason + ' / 期限: ' + (a.due_at ?? '未設定')),
    ...result.reminders.map(r => `- ${r.rule === 'REVIEW_WAIT' ? '評価者への実際の依頼の確認日' : '再説明の次回可能時刻'}: ${r.stage} / ${r.due_at}`), '',
    '## 正本の段階', '', ...(result.learner_states.length ? result.learner_states.map(s => '- ' + s.id + ': ' + s.status) : ['本人のSE台帳は未接続です。']), '',
    '未接続は本人の能力不足を意味しません。再確認期限の経過で過去のPASSを消しません。',
    'この計画は本人の実施記録ではありません。連続FAILは同一原因の断定ではありません。', ''].join('\n');
}

export async function readInputs(root, now) {
  const profileRaw = read(root, PROFILE), profile = JSON.parse(profileRaw);
  validateCareer(profile, now, root);
  const followupRaw = fs.existsSync(safe(root, FOLLOWUPS)) ? read(root, FOLLOWUPS) : null;
  const followups = followupRaw ? JSON.parse(followupRaw) : { schema_version: 1, learner_id: null, recalls: [], review_requests: [] };
  const learner = profile.connections.learner_id;
  const snapshot = learner ? learningSnapshot(root, learner, new Date(now)) : null;
  validateFollowups(followups, snapshot, now, root);
  const signals = await careerContext(profile, root, now);
  const week = careerPlan(profile, signals, now, root);
  const settingsRaw = fs.existsSync(safe(root, SETTINGS)) ? read(root, SETTINGS) : null;
  const settings = settingsRaw ? JSON.parse(settingsRaw) : { schema_version: 1, career_action_id: null, action_signature: null };
  keys(settings, ['schema_version','career_action_id','action_signature'], 'growth settings');
  check(settings.schema_version === 1 && (settings.career_action_id === null && settings.action_signature === null ||
    typeof settings.career_action_id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(settings.career_action_id) &&
    typeof settings.action_signature === 'string' && /^[a-f0-9]{64}$/.test(settings.action_signature)), 'Invalid growth slot binding');
  const bound = profile.actions.find(a => a.id === settings.career_action_id);
  const bindingValid = bound && actionSignature(bound) === settings.action_signature;
  const result = allocate(choose(snapshot, followups, now), week, now, bindingValid ? bound.id : null);
  result.binding_status = settings.career_action_id === null ? 'NOT_BOUND' : bindingValid ? 'BOUND' : 'ACTION_CHANGED_REBIND_REQUIRED';
  const verify = () => {
    check(hash(read(root, PROFILE)) === hash(profileRaw), 'Career profile changed during growth planning');
    const current = fs.existsSync(safe(root, FOLLOWUPS)) ? read(root, FOLLOWUPS) : null;
    check(current === followupRaw, 'Followups changed during growth planning');
    check((fs.existsSync(safe(root, SETTINGS)) ? read(root, SETTINGS) : null) === settingsRaw, 'Growth slot binding changed during planning');
    if (snapshot) {
      const latest = learningSnapshot(root, learner, new Date(now));
      check(latest.ledger_hash === snapshot.ledger_hash && latest.curriculum_hash === snapshot.curriculum_hash, 'Learning sources changed during growth planning');
    }
    validateFollowups(followups, snapshot, now, root);
  };
  verify();
  return { result, verify, snapshot, followups };
}

export async function execute(argv, { root = ROOT, now = () => new Date().toISOString(), loader = readInputs } = {}) {
  const [command, ...args] = argv;
  if (!command || command === '--help') return 'Usage: node tools/portfolio-audit/scripts/growth.mjs check | plan | bind-slot ACTION_ID | record-hash PRIVATE_RECORD\nUses existing career profile and validated SE ledger; never writes SE records or calls the network.\n';
  const at = now(); instant(at);
  if (command === 'record-hash') {
    check(args.length === 1 && args[0].startsWith(BASE + '/records/'), 'Provide one private growth record');
    const body = read(root, args[0]); check(body.trim(), 'Empty growth record');
    return json({ record_ref: args[0], record_sha256: hash(body), meaning: 'Content identity only, not authentication of actual practice' });
  }
  check(['check','plan','bind-slot'].includes(command) && (command === 'bind-slot' ? args.length === 1 : args.length === 0), 'Unknown growth command');
  if (command === 'check') { const { result } = await loader(root, at); return json({ state: 'INPUT_VALID', learner_connected: result.learner_states.length > 0, binding_status: result.binding_status, technical_slot_minutes: result.technical_slot_minutes }); }
  const directory = safe(root, BASE); fs.mkdirSync(directory, { recursive: true });
  const lock = safe(root, BASE + '/plan.lock'), fd = fs.openSync(lock, 'wx');
  try {
    fs.writeFileSync(fd, json({ pid: process.pid, at }));
    if (command === 'bind-slot') {
      const raw = read(root, PROFILE), profile = JSON.parse(raw); validateCareer(profile, at, root);
      const action = profile.actions.find(a => a.id === args[0]);
      check(action && action.kind === 'technical' && action.owner === 'human' && ['BACKLOG','ACTIVE'].includes(action.status), 'Choose an existing unfinished human technical action');
      check(read(root, PROFILE) === raw, 'Career profile changed while binding');
      const binding = { schema_version: 1, career_action_id: action.id, action_signature: actionSignature(action) };
      save(root, SETTINGS, json(binding));
      return json({ ...binding, note: 'Explicit slot binding only; no career/SE records or weekly minutes changed.' });
    }
    const { result, verify } = await loader(root, at);
    const latestPath = BASE + '/latest.json';
    const previous = fs.existsSync(safe(root, latestPath)) ? JSON.parse(read(root, latestPath)) : null;
    check(!previous || previous.schema_version === 1 && /^[a-f0-9]{64}$/.test(previous.signature) && instant(previous.at) <= instant(at), 'Invalid or newer previous growth state');
    const folder = BASE + '/plans/' + at.replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8);
    verify();
    save(root, folder + '/plan.json', json(result)); save(root, folder + '/plan.md', render(result));
    const latest = { schema_version: 1, at, signature: signature(result), notify: previous?.signature !== signature(result),
      report: folder + '/plan.md', plan: folder + '/plan.json', se_record_writes_allowed: false, external_actions_allowed: false };
    save(root, latestPath, json(latest));
    return json(latest);
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(await execute(process.argv.slice(2))); }
  catch (error) { process.stderr.write('Growth planner stopped: ' + error.message + '\n'); process.exitCode = 2; }
}
