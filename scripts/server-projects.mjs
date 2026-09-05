#!/usr/bin/env node
/** Local project records and attestations. No network, deployment or payment operations. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 10 * 1024 * 1024;
const DAY = 86_400_000;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const ROLES = ['sponsor', 'sponsor', 'technical', 'change', 'change', 'customer', 'operations', 'sponsor'];
const ASSISTANCE = ['guided', 'ai', 'independent'];
const STATES = ['TODO', 'DOING', 'BLOCKED', 'DONE'];
const closedTask = task => ['DONE', 'WITHDRAWN'].includes(task.state);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sha = data => createHash('sha256').update(data).digest('hex');
const stageIndex = id => /^PJ0[0-7]$/.test(id) ? Number(id.slice(2)) : -1;
const stageId = index => `PJ0${index}`;
const caseBase = id => `.local/server-projects/${id}`;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export const HELP = `サーバー案件台帳 / Node.js 22以上 / 外部送信・サーバー操作なし
共通: --project <小文字英数字と_-の案件ID>
init --project ID --title TEXT --owner ID --mode training|work --priority 1|2|3 --due YYYY-MM-DD
record --project ID --criterion PJ00-C1 --result PASS|FAIL|BLOCKED --target TEXT
  --assistance guided|ai|independent --evidence RELPATH --sanitized --note TEXT [--performed-at UTCISO]
review --project ID --stage PJ00 --reviewer ID --role sponsor|technical|change|customer|operations
  --decision APPROVE|REJECT --evidence RELPATH --sanitized --note TEXT
task-add --project ID --task ID --stage PJ00 --title TEXT --owner ID --hours N --due YYYY-MM-DD [--depends ID,ID]
task-update --project ID --task ID --state TODO|DOING|BLOCKED|DONE --remaining N --reason TEXT
  [--evidence RELPATH --sanitized]  (DONE時は証跡必須、remaining=0)
task-reassign --project ID --task ID --owner ID --reason TEXT
task-withdraw --project ID --task ID --reviewer ID --role sponsor --reason TEXT --evidence RELPATH --sanitized
reprioritize --project ID --priority 1|2|3 --reason TEXT
hold|resume|cancel --project ID --reason TEXT
reschedule --project ID --due YYYY-MM-DD --reason TEXT [--task ID]
invalidate --project ID --from PJ00 --reason TEXT --evidence RELPATH --sanitized
report --project ID [--json]
check [--project ID]
board [--capacity N] [--wip-limit N] [--json]

実行例: node scripts/server-projects.mjs init --project demo-a --title "研修用監視VM1台" --owner learner --mode training --priority 2 --due 2026-09-30
証跡はリポジトリ内の秘匿化済み相対パス。--sanitizedは申告で、自動除去ではありません。
優先度1が最優先。期日はUTC暦日。未来の実施時刻は禁止。初期状態は全24条件NOT RUN。
boardの残作業は全期間の総量。capacityは任意の週計画参考で、自動配分や約束の変更をしません。
詳しくは docs/server-projects/tracker-guide.md
`;

function keys(value, expected, label) {
  assert(object(value) && same(Object.keys(value).sort(), [...expected].sort()), `${label}: invalid or missing fields`);
}
function text(value, label, max = 8000) {
  assert(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), `${label}: non-empty text required (max ${max})`);
}
function id(value, label) {
  assert(typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(value), `${label}: use a bounded lowercase ID, 1-64 letters/digits/_/-; no reserved names`);
}
function number(value, label, { zero = true, integer = false } = {}) {
  assert(typeof value === 'number' && Number.isFinite(value) && value >= (zero ? 0 : Number.MIN_VALUE) && value <= 1_000_000 && (!integer || Number.isSafeInteger(value)), `${label}: ${zero ? 'non-negative' : 'positive'} ${integer ? 'integer' : 'number'} required (max 1000000)`);
}
function numeric(value, label, options) {
  assert(typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value), `${label}: numeric argument required`);
  const result = Number(value); number(result, label, options); return result;
}
function date(value, label) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), `${label}: YYYY-MM-DD required`);
  const result = new Date(`${value}T00:00:00.000Z`);
  assert(!Number.isNaN(result.getTime()) && result.toISOString().slice(0, 10) === value, `${label}: invalid calendar date`);
  return result.getTime();
}
function instant(value, label) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value), `${label}: UTC ISO timestamp required`);
  const result = new Date(value);
  assert(!Number.isNaN(result.getTime()) && result.toISOString() === value.replace(/(?<!\.\d{3})Z$/, '.000Z'), `${label}: invalid calendar timestamp`);
  return result.getTime();
}
function overdue(due, at) { return Math.max(0, Math.floor((date(at.slice(0, 10), 'current date') - date(due, 'due')) / DAY)); }
function safe(root, relative) {
  assert(typeof relative === 'string' && relative && !path.isAbsolute(relative) && !path.win32.isAbsolute(relative), 'Path must be repository-relative');
  const parts = relative.split(/[\\/]/);
  assert(parts.every(part => part && part !== '.' && part !== '..' && !/[:\x00-\x1f]/.test(part) && !/[. ]$/.test(part)), 'Unsafe path: traversal or ambiguous component');
  const target = path.resolve(root, ...parts);
  assert(target.startsWith(root + path.sep), 'Path escapes repository');
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const stat = fs.lstatSync(current);
      assert(!stat.isSymbolicLink(), `Symlink/junction forbidden: ${relative}`);
      assert(current === target || stat.isDirectory(), `Non-directory ancestor: ${relative}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}
function directory(root, relative) {
  const parts = relative.split('/');
  for (let index = 1; index <= parts.length; index++) {
    const target = safe(root, parts.slice(0, index).join('/'));
    if (!fs.existsSync(target)) fs.mkdirSync(target, { mode: 0o700 });
    assert(fs.statSync(target).isDirectory(), `Not a directory: ${target}`);
  }
}
function bytes(root, relative) {
  const target = safe(root, relative);
  assert(fs.existsSync(target), `Missing file: ${relative}`);
  const stat = fs.statSync(target);
  assert(stat.isFile() && stat.size <= LIMIT, `Regular file <=10 MiB required: ${relative}`);
  const content = fs.readFileSync(target);
  assert(content.length <= LIMIT, `File exceeds 10 MiB: ${relative}`);
  return content;
}
function json(root, relative) {
  try { return JSON.parse(bytes(root, relative).toString('utf8').replace(/^\uFEFF/, '')); }
  catch (error) { throw new Error(`Cannot read ${relative}: ${error.message}`); }
}

export function loadWorkflow(root, { documents = false } = {}) {
  const workflow = json(root, 'docs/server-projects/workflow.json');
  keys(workflow, ['schemaVersion', 'version', 'title', 'stages'], 'workflow');
  assert(workflow.schemaVersion === 1, 'Unsupported workflow schemaVersion');
  text(workflow.version, 'workflow version', 100); text(workflow.title, 'workflow title', 200);
  assert(Array.isArray(workflow.stages) && workflow.stages.length === 8, 'Workflow requires PJ00-PJ07');
  const paths = new Set();
  workflow.stages.forEach((stage, index) => {
    keys(stage, ['id', 'title', 'document', 'reviewRole', 'prerequisites', 'criteria'], 'workflow stage');
    assert(stage.id === stageId(index) && stage.reviewRole === ROLES[index], 'Invalid stage order or review role');
    text(stage.title, 'stage title', 200);
    assert(same(stage.prerequisites, index ? [stageId(index - 1)] : []), 'Invalid prerequisite chain');
    assert(typeof stage.document === 'string' && stage.document.startsWith('docs/server-projects/stages/') && stage.document.endsWith('.md') && !paths.has(stage.document), 'Invalid or duplicate stage document');
    safe(root, stage.document); paths.add(stage.document);
    assert(Array.isArray(stage.criteria) && stage.criteria.length === 3, 'Three criteria per stage required');
    const document = documents ? bytes(root, stage.document).toString('utf8') : '';
    stage.criteria.forEach((criterion, criterionIndex) => {
      keys(criterion, ['id', 'title'], 'criterion');
      assert(criterion.id === `${stage.id}-C${criterionIndex + 1}`, 'Unknown or duplicate criterion');
      text(criterion.title, 'criterion title', 300);
      if (documents) assert(new RegExp(`(?<![A-Z0-9-])${criterion.id}(?![A-Z0-9-])`).test(document), `Missing criterion ${criterion.id} in ${stage.document}`);
    });
  });
  return workflow;
}
function evidenceShape(root, base, evidence, verify) {
  keys(evidence, ['path', 'sha256', 'bytes', 'originalName', 'sanitized'], 'evidence');
  assert(typeof evidence.path === 'string' && /^evidence\/[a-f0-9-]{36}\.bin$/.test(evidence.path) && UUID.test(evidence.path.slice(9, -4)), 'Evidence path must stay in project evidence folder');
  assert(typeof evidence.sha256 === 'string' && /^[a-f0-9]{64}$/.test(evidence.sha256), 'Invalid evidence SHA-256');
  assert(Number.isSafeInteger(evidence.bytes) && evidence.bytes > 0 && evidence.bytes <= LIMIT && evidence.sanitized === true, 'Non-empty sanitized evidence required');
  text(evidence.originalName, 'evidence basename', 255);
  assert(!/[\\/:]/.test(evidence.originalName), 'Evidence originalName must be a basename');
  if (verify) {
    const content = bytes(root, `${base}/${evidence.path}`);
    assert(content.length === evidence.bytes && sha(content) === evidence.sha256, `Evidence changed: ${evidence.path}`);
    assert(content.toString('utf8').trim(), `Empty evidence: ${evidence.path}`);
  }
}
function invalidate(state, index) { for (let cursor = index; cursor < 8; cursor++) state.generations[cursor]++; }
function requireFreshRecords(state, index, seq) {
  invalidate(state, index);
  for (let cursor = index; cursor < 8; cursor++) state.requiredAfter[cursor] = seq;
}

export function stagesFor(workflow, state) {
  const stages = [];
  for (const [index, stage] of workflow.stages.entries()) {
    const attempts = stage.criteria.map(criterion => state.attempts.get(criterion.id));
    const staleCriteria = stage.criteria.filter((criterion, criterionIndex) => attempts[criterionIndex] && attempts[criterionIndex].seq <= state.requiredAfter[index]);
    const attemptIds = attempts.map(attempt => attempt?.id ?? null);
    const openTasks = [...state.tasks.values()].filter(task => task.stage === stage.id && !closedTask(task));
    const upstreamReviewIds = stages.map(previous => previous.status === 'PASS' ? previous.reviewId : null);
    const reviews = state.reviews.filter(review => review.data.stage === stage.id);
    const review = reviews.findLast(item => item.data.generation === state.generations[index] && same(item.data.attemptIds, attemptIds) && same(item.data.upstreamReviewIds, upstreamReviewIds));
    const problems = [];
    for (const [criterionIndex, criterion] of stage.criteria.entries()) if (attempts[criterionIndex]?.data.result !== 'PASS') problems.push(`${criterion.id}: ${attempts[criterionIndex]?.data.result ?? 'NOT RUN'}`);
    for (const criterion of staleCriteria) problems.push(`${criterion.id}: 採用変更の失効イベント後に新しい確認記録が必要`);
    if (openTasks.length) problems.push(`未完作業: ${openTasks.map(task => `${task.id}(${task.state})`).join(', ')}`);
    if (index && stages.some(previous => previous.status !== 'PASS')) problems.push('全先行工程の有効なPASSが必要');
    let status;
    if (attempts.every(attempt => !attempt)) status = 'NOT RUN';
    else if (staleCriteria.length) status = 'NEEDS RECHECK';
    else if (attempts.some(attempt => attempt?.data.result === 'FAIL')) status = 'FAIL';
    else if (attempts.some(attempt => attempt?.data.result === 'BLOCKED')) status = 'BLOCKED';
    else if (attempts.some(attempt => !attempt)) status = 'IN PROGRESS';
    else if (openTasks.length) status = 'OPEN TASKS';
    else if (stages.some(previous => previous.status !== 'PASS')) status = 'WAITING PREREQUISITE';
    else if (!review) status = 'READY FOR REVIEW';
    else status = review.data.decision === 'APPROVE' ? 'PASS' : 'REVIEW REJECTED';
    if (reviews.length && !review) problems.push('旧承認は失効: 最新試行・作業・変更・全先行承認を再確認');
    if (status === 'READY FOR REVIEW') problems.push(`必要な確認役: ${stage.reviewRole}。実際の確認記録を添付`);
    if (status === 'REVIEW REJECTED') problems.push(`差戻し: ${review.data.note}`);
    stages.push({ id: stage.id, title: stage.title, document: stage.document, status, problems, attemptIds, generation: state.generations[index], upstreamReviewIds, reviewId: review?.id ?? null, openTasks: openTasks.map(task => task.id) });
  }
  return stages;
}
function active(state) { assert(state.lifecycle === 'ACTIVE', `Project is ${state.lifecycle}; work mutations require ACTIVE`); }

/** Replay also validates the conditions that held when each historical approval was entered. */
export function validateLedger(root, workflow, ledger, project, now = new Date(), { verifyEvidence = true } = {}) {
  keys(ledger, ['schemaVersion', 'workflowVersion', 'workflowHash', 'project', 'createdAt', 'events'], 'ledger');
  assert(ledger.schemaVersion === 1, 'Unsupported ledger schemaVersion');
  assert(ledger.workflowVersion === workflow.version && ledger.workflowHash === sha(JSON.stringify(workflow)), 'Workflow changed: preserve ledger and plan an explicit migration');
  keys(ledger.project, ['id', 'title', 'owner', 'mode', 'priority', 'originalDue'], 'project');
  id(project, 'project'); assert(ledger.project.id === project, 'Project ID mismatch');
  id(ledger.project.owner, 'owner'); text(ledger.project.title, 'title', 300);
  assert(['training', 'work'].includes(ledger.project.mode), 'Invalid project mode');
  assert([1, 2, 3].includes(ledger.project.priority), 'Invalid priority'); date(ledger.project.originalDue, 'originalDue');
  let previousAt = instant(ledger.createdAt, 'createdAt');
  assert(previousAt <= now.getTime(), 'Created timestamp is in the future');
  assert(Array.isArray(ledger.events), 'events array required');
  const state = { project: ledger.project, priority: ledger.project.priority, due: ledger.project.originalDue, lifecycle: 'ACTIVE', lifecycleReason: '', attempts: new Map(), tasks: new Map(), reviews: [], generations: Array(8).fill(0), requiredAfter: Array(8).fill(0), reschedules: [], invalidations: [] };
  const eventIds = new Set(); const evidencePaths = new Set();
  const knownCriteria = new Set(workflow.stages.flatMap(stage => stage.criteria.map(criterion => criterion.id)));
  const verify = evidence => {
    evidenceShape(root, caseBase(project), evidence, verifyEvidence);
    assert(!evidencePaths.has(evidence.path), 'Evidence copies must be unique per event'); evidencePaths.add(evidence.path);
  };
  for (const [index, event] of ledger.events.entries()) {
    keys(event, ['id', 'seq', 'at', 'type', 'data'], 'event');
    assert(UUID.test(event.id) && !eventIds.has(event.id) && event.seq === index + 1, 'Invalid event ID, duplicate event or non-contiguous sequence');
    eventIds.add(event.id);
    const at = instant(event.at, 'event at');
    assert(at >= previousAt && at <= now.getTime(), 'Event timestamps out of order or in future'); previousAt = at;
    const data = event.data;
    assert(state.lifecycle !== 'CANCELLED', 'Cancelled projects are terminal; later events forbidden');
    switch (event.type) {
      case 'record': {
        active(state); keys(data, ['criterion', 'result', 'target', 'assistance', 'performedAt', 'note', 'evidence'], 'record');
        assert(knownCriteria.has(data.criterion), `Unknown criterion: ${data.criterion}`);
        assert(['PASS', 'FAIL', 'BLOCKED'].includes(data.result), 'Invalid result');
        text(data.target, 'target', 1000); text(data.note, 'note');
        assert(ASSISTANCE.includes(data.assistance), 'Invalid assistance');
        assert(instant(data.performedAt, 'performedAt') <= at, 'performedAt cannot be in future');
        verify(data.evidence); state.attempts.set(data.criterion, event); invalidate(state, stageIndex(data.criterion.slice(0, 4))); break;
      }
      case 'review': {
        active(state); keys(data, ['stage', 'reviewer', 'role', 'decision', 'note', 'attemptIds', 'generation', 'upstreamReviewIds', 'evidence'], 'review');
        const stage = stagesFor(workflow, state).find(item => item.id === data.stage);
        assert(stage, 'Unknown review stage'); id(data.reviewer, 'reviewer');
        assert(data.reviewer !== ledger.project.owner, 'Self-review forbidden: reviewer must differ from project owner');
        assert(data.role === ROLES[stageIndex(data.stage)], `Required review role: ${ROLES[stageIndex(data.stage)]}`);
        assert(['APPROVE', 'REJECT'].includes(data.decision), 'Invalid review decision'); text(data.note, 'review note');
        assert(stage.attemptIds.every(Boolean), 'Review requires all criterion records');
        assert(same(data.attemptIds, stage.attemptIds) && data.generation === stage.generation && same(data.upstreamReviewIds, stage.upstreamReviewIds), 'Review binding must match latest attempts, generation and ALL upstream approvals');
        if (data.decision === 'APPROVE') assert(['READY FOR REVIEW', 'REVIEW REJECTED', 'PASS'].includes(stage.status), `Cannot approve: ${stage.status}; ${stage.problems.join('; ')}`);
        verify(data.evidence); state.reviews.push(event); break;
      }
      case 'task-add': {
        active(state); keys(data, ['task', 'stage', 'title', 'owner', 'hours', 'due', 'depends'], 'task-add');
        id(data.task, 'task'); id(data.owner, 'task owner'); text(data.title, 'task title', 300);
        assert(!state.tasks.has(data.task), 'Task ID already exists'); assert(stageIndex(data.stage) >= 0, 'Unknown task stage');
        number(data.hours, 'hours', { zero: false }); date(data.due, 'task due');
        assert(Array.isArray(data.depends) && new Set(data.depends).size === data.depends.length, 'Invalid or duplicate task dependencies');
        for (const dependency of data.depends) { id(dependency, 'dependency'); assert(state.tasks.has(dependency) && state.tasks.get(dependency).state !== 'WITHDRAWN' && stageIndex(state.tasks.get(dependency).stage) <= stageIndex(data.stage), 'Dependencies must be existing tasks that are not WITHDRAWN, in the same or an earlier stage; cycles/forward references forbidden'); }
        state.tasks.set(data.task, { id: data.task, stage: data.stage, title: data.title, owner: data.owner, hours: data.hours, remaining: data.hours, originalDue: data.due, due: data.due, depends: [...data.depends], state: 'TODO', reason: '', lastEventId: event.id });
        invalidate(state, stageIndex(data.stage)); break;
      }
      case 'task-update': {
        active(state); keys(data, ['task', 'state', 'remaining', 'reason', 'evidence'], 'task-update');
        const task = state.tasks.get(data.task); assert(task, 'Unknown task'); assert(STATES.includes(data.state), 'Invalid task state');
        assert(task.state !== 'WITHDRAWN', 'WITHDRAWN tasks are terminal; create a new planned task');
        number(data.remaining, 'remaining'); text(data.reason, 'reason');
        if (['DOING', 'DONE'].includes(data.state)) assert(task.depends.every(dependency => state.tasks.get(dependency).state === 'DONE'), 'All dependencies must be DONE before DOING or DONE');
        if (data.state === 'DONE') {
          assert(data.remaining === 0, 'DONE requires remaining=0'); assert(data.evidence, 'DONE requires evidence');
        } else {
          assert(data.remaining > 0, 'Unfinished task requires positive remaining hours');
          if (task.state === 'DONE') assert(![...state.tasks.values()].some(item => item.depends.includes(task.id) && ['DONE', 'DOING'].includes(item.state)), 'Reopen DONE dependants first and pause DOING dependants before reopening this dependency');
        }
        if (data.evidence !== null) verify(data.evidence);
        task.state = data.state; task.remaining = data.remaining; task.reason = data.reason; task.lastEventId = event.id;
        invalidate(state, stageIndex(task.stage)); break;
      }
      case 'task-reassign': {
        active(state); keys(data, ['task', 'oldOwner', 'newOwner', 'reason'], 'task-reassign');
        const task = state.tasks.get(data.task); assert(task, 'Unknown task'); id(data.newOwner, 'new task owner'); text(data.reason, 'reason');
        assert(task.state !== 'WITHDRAWN', 'WITHDRAWN tasks are terminal; create a new planned task');
        assert(data.oldOwner === task.owner && data.newOwner !== task.owner, 'Task reassignment must preserve old owner and change owner');
        task.owner = data.newOwner; task.reason = data.reason; task.lastEventId = event.id; invalidate(state, stageIndex(task.stage)); break;
      }
      case 'task-withdraw': {
        active(state); keys(data, ['task', 'reviewer', 'role', 'oldState', 'oldRemaining', 'reason', 'evidence'], 'task-withdraw');
        const task = state.tasks.get(data.task); assert(task, 'Unknown task');
        assert(!closedTask(task), 'Only unfinished tasks may be withdrawn; DONE history must not be erased and WITHDRAWN is terminal');
        id(data.reviewer, 'withdrawal reviewer'); assert(data.reviewer !== ledger.project.owner, 'Self-review forbidden: withdrawal reviewer must differ from project owner');
        assert(data.role === 'sponsor', 'Task withdrawal requires sponsor role'); text(data.reason, 'reason');
        assert(data.oldState === task.state && data.oldRemaining === task.remaining, 'Withdrawal must preserve old task state and remaining hours');
        assert(![...state.tasks.values()].some(item => item.depends.includes(task.id) && item.state !== 'WITHDRAWN'), 'Withdraw all non-WITHDRAWN dependants first before this task');
        verify(data.evidence); task.state = 'WITHDRAWN'; task.remaining = 0; task.reason = data.reason; task.lastEventId = event.id;
        requireFreshRecords(state, stageIndex(task.stage), event.seq); break;
      }
      case 'reprioritize': {
        keys(data, ['oldPriority', 'newPriority', 'reason'], 'reprioritize'); text(data.reason, 'reason');
        assert(data.oldPriority === state.priority && [1, 2, 3].includes(data.newPriority) && data.newPriority !== state.priority, 'Priority change must preserve old priority and choose a different value 1-3');
        state.priority = data.newPriority; break;
      }
      case 'hold':
      case 'resume':
      case 'cancel': {
        keys(data, ['reason'], event.type); text(data.reason, 'reason');
        if (event.type === 'hold') { active(state); state.lifecycle = 'ON HOLD'; }
        if (event.type === 'resume') { assert(state.lifecycle === 'ON HOLD', 'resume requires ON HOLD'); state.lifecycle = 'ACTIVE'; }
        if (event.type === 'cancel') state.lifecycle = 'CANCELLED';
        state.lifecycleReason = data.reason; break;
      }
      case 'reschedule': {
        keys(data, ['task', 'oldDue', 'newDue', 'originalDue', 'overdueDays', 'reason'], 'reschedule'); text(data.reason, 'reason');
        const task = data.task === null ? null : state.tasks.get(data.task);
        assert(data.task === null || task, 'Unknown rescheduled task');
        assert(task?.state !== 'WITHDRAWN', 'WITHDRAWN tasks are terminal; create a new planned task');
        const oldDue = task?.due ?? state.due;
        assert(data.oldDue === oldDue && data.originalDue === (task?.originalDue ?? ledger.project.originalDue), 'Reschedule must preserve original and previous due');
        date(data.newDue, 'newDue'); assert(data.newDue !== oldDue, 'New due must differ from current due');
        assert(data.overdueDays === overdue(oldDue, event.at), 'Reschedule overdue history mismatch');
        if (task) task.due = data.newDue; else state.due = data.newDue;
        state.reschedules.push(event); invalidate(state, task ? stageIndex(task.stage) : 1); break;
      }
      case 'invalidate': {
        active(state); keys(data, ['from', 'reason', 'evidence'], 'invalidate'); assert(stageIndex(data.from) >= 0, 'Unknown invalidation stage');
        text(data.reason, 'reason'); verify(data.evidence); requireFreshRecords(state, stageIndex(data.from), event.seq);
        state.invalidations.push(event); break;
      }
      default: throw new Error(`Unknown event type: ${event.type}`);
    }
  }
  state.stages = stagesFor(workflow, state);
  state.status = state.lifecycle !== 'ACTIVE' ? state.lifecycle : state.stages.every(stage => stage.status === 'PASS') && [...state.tasks.values()].every(closedTask) ? 'COMPLETED' : 'ACTIVE';
  return state;
}

function parse(argv) {
  if (!argv.length || argv.includes('--help') || argv[0] === 'help') return { command: 'help', options: {} };
  const [command, ...args] = argv;
  const allowed = {
    init: ['project', 'title', 'owner', 'mode', 'priority', 'due'],
    record: ['project', 'criterion', 'result', 'target', 'assistance', 'evidence', 'sanitized', 'note', 'performed-at'],
    review: ['project', 'stage', 'reviewer', 'role', 'decision', 'evidence', 'sanitized', 'note'],
    'task-add': ['project', 'task', 'stage', 'title', 'owner', 'hours', 'due', 'depends'],
    'task-update': ['project', 'task', 'state', 'remaining', 'reason', 'evidence', 'sanitized'],
    'task-reassign': ['project', 'task', 'owner', 'reason'], reprioritize: ['project', 'priority', 'reason'],
    'task-withdraw': ['project', 'task', 'reviewer', 'role', 'reason', 'evidence', 'sanitized'],
    hold: ['project', 'reason'], resume: ['project', 'reason'], cancel: ['project', 'reason'],
    reschedule: ['project', 'due', 'reason', 'task'], invalidate: ['project', 'from', 'reason', 'evidence', 'sanitized'],
    report: ['project', 'json'], check: ['project'], board: ['capacity', 'wip-limit', 'json'],
  };
  assert(Object.hasOwn(allowed, command), `Unknown command: ${command}`);
  const options = Object.create(null);
  for (let index = 0; index < args.length; index++) {
    const token = args[index]; const key = token.slice(2);
    assert(token.startsWith('--') && allowed[command].includes(key), `Unknown option: ${token}`);
    assert(!Object.hasOwn(options, key), `Duplicate option: ${token}`);
    if (['sanitized', 'json'].includes(key)) options[key] = true;
    else { assert(args[index + 1] !== undefined && !args[index + 1].startsWith('--'), `Value required: ${token}`); options[key] = args[++index]; }
  }
  if (command !== 'board' && (command !== 'check' || options.project !== undefined)) id(options.project, 'project');
  return { command, options };
}
function preparedEvidence(root, options, pending) {
  assert(options.sanitized === true, '--sanitized acknowledgement required');
  assert(typeof options.evidence === 'string', '--evidence required');
  const content = bytes(root, options.evidence);
  assert(content.length && content.toString('utf8').trim(), 'Empty evidence is not accepted');
  const evidence = { path: `evidence/${randomUUID()}.bin`, sha256: sha(content), bytes: content.length, originalName: path.basename(options.evidence.replaceAll('\\', '/')), sanitized: true };
  pending.push({ evidence, content }); return evidence;
}
function save(root, base, ledger, pending = []) {
  const content = `${JSON.stringify(ledger, null, 2)}\n`;
  assert(Buffer.byteLength(content) <= LIMIT, 'Ledger would exceed 10 MiB; preserve it and plan explicit archival/migration');
  const written = []; const temporary = safe(root, `${base}/project-${randomUUID()}.tmp`);
  try {
    if (pending.length) directory(root, `${base}/evidence`);
    for (const item of pending) {
      const destination = safe(root, `${base}/${item.evidence.path}`);
      fs.writeFileSync(destination, item.content, { flag: 'wx', mode: 0o600 }); written.push(destination);
    }
    fs.writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, safe(root, `${base}/project.json`));
  } catch (error) { for (const destination of written) fs.unlinkSync(destination); throw error; }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function locked(root, base, action) {
  directory(root, base); const lock = safe(root, `${base}/write.lock`); let descriptor;
  try { descriptor = fs.openSync(lock, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Project is locked; verify whether another writer is active before touching write.lock'); throw error; }
  try { fs.writeSync(descriptor, `${process.pid}\n`); return action(); }
  finally { fs.closeSync(descriptor); fs.unlinkSync(lock); }
}
function summary(state, at) {
  const next = state.stages.find(stage => stage.status !== 'PASS');
  const tasks = [...state.tasks.values()]; const open = tasks.filter(task => !closedTask(task));
  return { ...state.project, priority: state.priority, originalPriority: state.project.priority, status: state.status, due: state.due, currentOverdueDays: overdue(state.due, at), originalOverdueDays: overdue(state.project.originalDue, at), rescheduleCount: state.reschedules.length,
    currentStage: next?.id ?? null, nextDocument: next?.document ?? null, blockers: state.lifecycle !== 'ACTIVE' ? [state.lifecycleReason, ...next?.problems ?? []] : next?.problems ?? [],
    doing: tasks.filter(task => task.state === 'DOING').length, openTasks: open.length, remainingHours: open.reduce((total, task) => total + task.remaining, 0),
    doneTasks: tasks.filter(task => task.state === 'DONE').length, withdrawnTasks: tasks.filter(task => task.state === 'WITHDRAWN').length,
    tasks, stages: state.stages, basis: 'local recorded evidence and role attestations; no customer authentication, deployment authority or actual production operation' };
}
function reportText(value) {
  const next = value.status === 'ON HOLD' ? '保留理由と再開条件を確認してresumeする' : value.status === 'CANCELLED' ? '取消記録を保管する。成功完了ではない' : value.currentStage ? `${value.currentStage}: ${value.blockers[0] ?? '必要な確認記録を揃える'} / ${value.nextDocument}` : '記録上の終結条件を充足。作業のDONEと承認済みWITHDRAWNを分けて、保管・契約事務と照合する';
  return [`次の行動: ${next}`, `${value.id} ${value.title} / ${value.mode} / ${value.status} / 主担当 ${value.owner}`,
    `優先度${value.priority}（初期${value.originalPriority}）/ 現期限 ${value.due}（超過${value.currentOverdueDays}日）/ 元期限 ${value.originalDue} / 期限変更${value.rescheduleCount}件`,
    `未完作業 ${value.openTasks} / DOING ${value.doing} / DONE ${value.doneTasks} / WITHDRAWN ${value.withdrawnTasks} / 残作業総量 ${value.remainingHours}時間（全期間）`,
    ...value.stages.map(stage => `${stage.id} ${stage.title}: ${stage.status}${stage.problems.length ? ` — ${stage.problems.join('; ')}` : ''}`),
    ...value.tasks.map(task => `作業 ${task.id} [${task.stage}] ${task.state} / ${task.owner} / 残${task.remaining}h / 期限${task.due} / ${task.reason || task.title}`),
    '判定は記録の整合性と確認役の申告に基づきます。実顧客の本人性・契約承諾・本番権限・実作業は認証しません。'].join('\n');
}

export function execute(argv, { root = ROOT, now = () => new Date() } = {}) {
  const { command, options } = parse(argv);
  if (command === 'help') return HELP;
  root = fs.realpathSync(root);
  const time = now(); assert(time instanceof Date && !Number.isNaN(time.getTime()), 'Invalid current time');
  const at = time.toISOString();
  const workflow = loadWorkflow(root, { documents: command === 'check' });
  const read = project => { const ledger = json(root, `${caseBase(project)}/project.json`); return { ledger, state: validateLedger(root, workflow, ledger, project, time) }; };
  if (command === 'check' && !options.project) return `OK: workflow ${workflow.version}, 8 documents, 24 criteria. Project records NOT CHECKED (use --project).`;
  if (command === 'check') { const { ledger } = read(options.project); return `OK: ${options.project} record integrity, ${ledger.events.length} events. Actual delivery and reviewer identity NOT VERIFIED.`; }
  if (command === 'report') { const value = summary(read(options.project).state, at); return options.json ? JSON.stringify(value, null, 2) : reportText(value); }
  if (command === 'board') {
    const capacity = options.capacity === undefined ? null : numeric(options.capacity, 'capacity', { zero: false });
    const wipLimit = options['wip-limit'] === undefined ? 2 : numeric(options['wip-limit'], 'wip-limit', { zero: false, integer: true });
    const base = safe(root, '.local/server-projects'); const projects = [];
    if (fs.existsSync(base)) {
      assert(fs.statSync(base).isDirectory(), 'Projects base is not a directory');
      for (const entry of fs.readdirSync(base)) { id(entry, 'project directory'); const entryPath = safe(root, `.local/server-projects/${entry}`); assert(fs.statSync(entryPath).isDirectory(), 'Unexpected entry in projects base'); projects.push(summary(read(entry).state, at)); }
    }
    projects.sort((a, b) => a.priority - b.priority || a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
    const unfinished = projects.filter(project => !['CANCELLED', 'COMPLETED'].includes(project.status));
    const doing = unfinished.reduce((total, project) => total + project.doing, 0);
    const remainingHours = unfinished.reduce((total, project) => total + project.remainingHours, 0);
    const value = { at, projects, doing, wipLimit, aboveWipReference: doing > wipLimit, remainingHours, weeklyCapacityReference: capacity, basis: 'remainingHours is all unfinished work including held projects, not a weekly allocation; cancelled projects excluded; references never change commitments' };
    if (options.json) return JSON.stringify(value, null, 2);
    return [`案件一覧 ${projects.length}件 / 優先度1が最優先 / 期限はUTC暦日`, ...projects.map(project => `${project.id} | P${project.priority} | ${project.status} | 期限${project.due} 超過${project.currentOverdueDays}日 | ${project.currentStage ?? '全工程PASS'} | DOING ${project.doing} | 残${project.remainingHours}h | ${project.blockers[0] ?? '阻害記録なし'}`),
      `DOING合計 ${doing} / WIP参考 ${wipLimit}${doing > wipLimit ? '（参考値超過）' : ''}`, `未完案件の残作業総量 ${remainingHours}時間（保留を含む全期間、取消を除く）`,
      `週の計画capacity参考: ${capacity === null ? '未設定' : `${capacity}時間` }。残総量を週の利用率に換算せず、配分・納期・担当は自動変更しません。`].join('\n');
  }
  const base = caseBase(options.project);
  let initialProject;
  if (command === 'init') {
    id(options.owner, 'owner'); text(options.title, 'title', 300); date(options.due, 'due');
    assert(['training', 'work'].includes(options.mode), 'mode must be training or work');
    const priority = numeric(options.priority, 'priority', { zero: false, integer: true }); assert([1, 2, 3].includes(priority), 'priority must be 1, 2 or 3');
    initialProject = { id: options.project, title: options.title, owner: options.owner, mode: options.mode, priority, originalDue: options.due };
  } else assert(fs.existsSync(safe(root, `${base}/project.json`)), `Missing project ledger: ${options.project}`);
  return locked(root, base, () => {
    if (command === 'init') {
      assert(!fs.existsSync(safe(root, `${base}/project.json`)), 'Project already exists; init never overwrites');
      const ledger = { schemaVersion: 1, workflowVersion: workflow.version, workflowHash: sha(JSON.stringify(workflow)), project: initialProject, createdAt: at, events: [] };
      validateLedger(root, workflow, ledger, options.project, time); save(root, base, ledger);
      return `Created ${base}/project.json. All 8 stages / 24 criteria NOT RUN; no tasks or approvals.`;
    }
    const { ledger, state } = read(options.project); const pending = [];
    const evidence = () => preparedEvidence(root, options, pending);
    let data;
    if (command === 'record') data = { criterion: options.criterion, result: options.result, target: options.target, assistance: options.assistance, performedAt: options['performed-at'] ?? at, note: options.note, evidence: evidence() };
    if (command === 'review') {
      const stage = state.stages.find(item => item.id === options.stage); assert(stage, 'Unknown review stage');
      data = { stage: options.stage, reviewer: options.reviewer, role: options.role, decision: options.decision, note: options.note, attemptIds: stage.attemptIds, generation: stage.generation, upstreamReviewIds: stage.upstreamReviewIds, evidence: evidence() };
    }
    if (command === 'task-add') data = { task: options.task, stage: options.stage, title: options.title, owner: options.owner, hours: numeric(options.hours, 'hours', { zero: false }), due: options.due, depends: options.depends === undefined ? [] : options.depends.split(',') };
    if (command === 'task-update') {
      assert(options.evidence !== undefined || options.sanitized === undefined, '--sanitized without --evidence is invalid');
      data = { task: options.task, state: options.state, remaining: numeric(options.remaining, 'remaining'), reason: options.reason, evidence: options.evidence === undefined ? null : evidence() };
    }
    if (command === 'task-reassign') {
      const task = state.tasks.get(options.task); assert(task, 'Unknown task');
      data = { task: options.task, oldOwner: task.owner, newOwner: options.owner, reason: options.reason };
    }
    if (command === 'task-withdraw') {
      const task = state.tasks.get(options.task); assert(task, 'Unknown task');
      data = { task: options.task, reviewer: options.reviewer, role: options.role, oldState: task.state, oldRemaining: task.remaining, reason: options.reason, evidence: evidence() };
    }
    if (command === 'reprioritize') data = { oldPriority: state.priority, newPriority: numeric(options.priority, 'priority', { zero: false, integer: true }), reason: options.reason };
    if (['hold', 'resume', 'cancel'].includes(command)) data = { reason: options.reason };
    if (command === 'reschedule') {
      const task = options.task === undefined ? null : state.tasks.get(options.task); assert(options.task === undefined || task, 'Unknown rescheduled task');
      const oldDue = task?.due ?? state.due;
      data = { task: options.task ?? null, oldDue, newDue: options.due, originalDue: task?.originalDue ?? state.project.originalDue, overdueDays: overdue(oldDue, at), reason: options.reason };
    }
    if (command === 'invalidate') data = { from: options.from, reason: options.reason, evidence: evidence() };
    assert(data, 'Unsupported mutation');
    const event = { id: randomUUID(), seq: ledger.events.length + 1, at, type: command, data };
    ledger.events.push(event);
    const updated = validateLedger(root, workflow, ledger, options.project, time, { verifyEvidence: false });
    save(root, base, ledger, pending);
    return `Recorded ${command} event ${event.seq} (${event.id}). ${options.project}: ${updated.status}. ${summary(updated, at).currentStage ?? 'All stages PASS'}.`;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(execute(process.argv.slice(2))); }
  catch (error) { console.error(`ERROR: ${error.message}\nUse --help for usage.`); process.exitCode = 1; }
}
