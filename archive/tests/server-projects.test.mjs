import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { execute } from '../scripts/server-projects.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(fs.readFileSync(path.join(repository, 'docs/server-projects/workflow.json'), 'utf8').replace(/^\uFEFF/, ''));
const argv = (command, options) => [command, ...Object.entries(options).flatMap(([key, value]) => value === undefined ? [] : value === true ? [`--${key}`] : [`--${key}`, String(value)])];

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'server-projects-test-')));
  t.after(() => {
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('server-projects-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'docs/server-projects/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'incoming'));
  fs.writeFileSync(path.join(root, 'incoming/evidence.txt'), 'Synthetic test data; not an actual project or customer approval.\n');
  fs.writeFileSync(path.join(root, 'docs/server-projects/workflow.json'), JSON.stringify(workflow));
  for (const stage of workflow.stages) fs.writeFileSync(path.join(root, stage.document), stage.criteria.map(item => `## ${item.id}`).join('\n'));
  let clock = new Date('2026-09-08T06:00:00.000Z');
  const run = args => execute(args, { root, now: () => clock });
  const command = (name, options = {}) => run(argv(name, { project: 'demo-a', ...options }));
  const init = (options = {}) => command('init', { title: '架空のテスト案件', owner: 'owner01', mode: 'training', priority: 2, due: '2026-09-05', ...options });
  const record = (criterion = 'PJ00-C1', options = {}) => command('record', { criterion, result: 'PASS', target: 'isolated test target / version A', assistance: 'guided', evidence: 'incoming/evidence.txt', sanitized: true, note: 'Synthetic fixture only', ...options });
  const review = (stage = 'PJ00', options = {}) => command('review', { stage, reviewer: 'reviewer01', role: workflow.stages.find(item => item.id === stage)?.reviewRole, decision: 'APPROVE', evidence: 'incoming/evidence.txt', sanitized: true, note: 'Synthetic test observation, not real attestation', ...options });
  const addTask = (task = 'task-a', options = {}) => command('task-add', { task, stage: 'PJ00', title: 'Test task', owner: 'worker01', hours: 2, due: '2026-09-06', ...options });
  const update = (task = 'task-a', options = {}) => command('task-update', { task, state: 'DOING', remaining: 1, reason: 'Test state update', ...options });
  const done = (task = 'task-a', options = {}) => update(task, { state: 'DONE', remaining: 0, evidence: 'incoming/evidence.txt', sanitized: true, ...options });
  const report = (project = 'demo-a') => JSON.parse(command('report', { project, json: true }));
  const status = stage => report().stages.find(item => item.id === stage).status;
  const ledgerPath = (project = 'demo-a') => path.join(root, `.local/server-projects/${project}/project.json`);
  const read = (project = 'demo-a') => JSON.parse(fs.readFileSync(ledgerPath(project), 'utf8'));
  const rewrite = value => fs.writeFileSync(ledgerPath(), JSON.stringify(value));
  const fill = (stage = 'PJ00') => { for (const item of workflow.stages.find(item => item.id === stage).criteria) record(item.id); };
  const through = (last = 'PJ01') => { for (const stage of workflow.stages) { fill(stage.id); review(stage.id); if (stage.id === last) break; } };
  return { root, run, command, init, record, review, addTask, update, done, report, status, read, rewrite, fill, through, clock: value => { clock = new Date(value); } };
}

test('init creates no achievements, keeps mode and original due, and refuses overwrite', t => {
  const f = fixture(t); assert.match(f.init(), /24 criteria NOT RUN/);
  assert.deepEqual(f.read().events, []); assert.equal(f.report().mode, 'training');
  assert.equal(f.report().originalDue, '2026-09-05'); assert.equal(f.report().status, 'ACTIVE');
  assert.ok(f.report().stages.every(stage => stage.status === 'NOT RUN'));
  assert.throws(() => f.init({ mode: 'work' }), /already exists/);
  assert.equal(f.read().project.mode, 'training');
});

test('invalid IDs, dates, priority and modes cannot create partial project directories', t => {
  const f = fixture(t);
  for (const [options, expected] of [[{ project: '../escape' }, /bounded/], [{ project: 'con' }, /reserved/], [{ owner: '' }, /owner/], [{ due: '2026-02-30' }, /calendar/], [{ priority: 4 }, /priority/], [{ mode: 'production-approved' }, /mode/]]) assert.throws(() => f.init(options), expected);
  assert.throws(() => f.command('hold', { project: 'missing', reason: 'test' }), /Missing project ledger/);
  assert.equal(JSON.parse(f.run(['board', '--json'])).projects.length, 0);
});

test('evidence bytes are copied with SHA and performed time; changing source does not mutate history', t => {
  const f = fixture(t); f.init(); f.record('PJ00-C1', { 'performed-at': '2026-09-07T01:00:00Z' });
  const event = f.read().events[0]; assert.equal(event.data.performedAt, '2026-09-07T01:00:00Z');
  assert.equal(event.data.evidence.sha256.length, 64); assert.equal(event.seq, 1);
  fs.writeFileSync(path.join(f.root, 'incoming/evidence.txt'), 'Updated source');
  assert.match(f.command('check'), /record integrity/); assert.equal(f.status('PJ00'), 'IN PROGRESS');
});

test('unknown criterion, unsupported result, assistance, empty note and CLI typos fail without append', t => {
  const f = fixture(t); f.init();
  assert.throws(() => f.record('PJ00-C4'), /Unknown criterion/);
  for (const options of [{ result: 'NOT RUN' }, { assistance: 'authenticated' }, { note: '' }, { target: '' }]) assert.throws(() => f.record('PJ00-C1', options));
  assert.throws(() => f.command('record', { typo: true }), /Unknown option/);
  assert.throws(() => f.run(['report', '--project', 'demo-a', '--project', 'demo-b']), /Duplicate option/);
  assert.equal(f.read().events.length, 0);
  assert.ok(!fs.existsSync(path.join(f.root, '.local/server-projects/demo-a/evidence')));
});

test('future, invalid-calendar and ambiguous performed timestamps are rejected', t => {
  const f = fixture(t); f.init();
  for (const time of ['2026-09-09T00:00:00Z', '2026-02-30T00:00:00Z', '2026-09-08', '2026-09-08T09:00:00+09:00']) assert.throws(() => f.record('PJ00-C1', { 'performed-at': time }), /future|timestamp/);
  assert.equal(f.read().events.length, 0);
});

test('rejects absolute, traversal and alternate-stream evidence paths', t => {
  const f = fixture(t); f.init();
  for (const evidence of ['../outside', 'incoming/../evidence.txt', 'incoming\\..\\evidence.txt', 'C:\\outside.txt', '/etc/passwd', 'incoming/evidence.txt:secret', 'incoming/evidence.txt.']) assert.throws(() => f.record('PJ00-C1', { evidence }), /relative|Unsafe path|escapes/);
  assert.equal(f.read().events.length, 0);
});

test('rejects symlink/junction source, project directory and board entries', t => {
  const f = fixture(t); f.init();
  fs.symlinkSync(path.join(f.root, 'incoming'), path.join(f.root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => f.record('PJ00-C1', { evidence: 'linked/evidence.txt' }), /Symlink/);
  fs.symlinkSync(path.join(f.root, 'incoming'), path.join(f.root, '.local/server-projects/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => f.init({ project: 'linked' }), /Symlink/);
  assert.throws(() => f.run(['board']), /Symlink/);
});

test('missing, empty, oversized and unsanitized evidence cannot append', t => {
  const f = fixture(t); f.init();
  fs.writeFileSync(path.join(f.root, 'incoming/empty.txt'), ' \n\t');
  fs.writeFileSync(path.join(f.root, 'incoming/large.bin'), Buffer.alloc(10 * 1024 * 1024 + 1, 65));
  for (const [options, expected] of [[{ evidence: undefined }, /--evidence required/], [{ evidence: 'incoming/missing' }, /Missing file/], [{ evidence: 'incoming/empty.txt' }, /Empty evidence/], [{ evidence: 'incoming/large.bin' }, /10 MiB/], [{ sanitized: undefined }, /--sanitized/]]) assert.throws(() => f.record('PJ00-C1', options), expected);
  assert.equal(f.read().events.length, 0);
});

test('changed and missing stored evidence stops report, board, check and later writes', t => {
  const f = fixture(t); f.init(); f.record(); const stored = f.read().events[0].data.evidence.path;
  const file = path.join(f.root, '.local/server-projects/demo-a', stored); fs.writeFileSync(file, 'tampered');
  for (const action of [() => f.report(), () => f.run(['board']), () => f.command('check'), () => f.record()]) assert.throws(action, /Evidence changed/);
  fs.unlinkSync(file); assert.throws(() => f.command('check'), /Missing file/);
});

test('all PASS criteria need role-correct approval by someone other than owner', t => {
  const f = fixture(t); f.init(); f.fill(); assert.equal(f.status('PJ00'), 'READY FOR REVIEW');
  assert.throws(() => f.review('PJ00', { reviewer: 'owner01' }), /Self-review/);
  assert.throws(() => f.review('PJ00', { role: 'technical' }), /Required review role: sponsor/);
  assert.throws(() => f.review('PJ00', { evidence: undefined }), /--evidence/);
  f.review(); assert.equal(f.status('PJ00'), 'PASS');
});

test('review cannot precede all records or approved prerequisites', t => {
  const f = fixture(t); f.init(); f.record(); assert.throws(() => f.review(), /all criterion records/);
  f.fill('PJ01'); assert.equal(f.status('PJ01'), 'WAITING PREREQUISITE');
  assert.throws(() => f.review('PJ01'), /WAITING PREREQUISITE/);
});

test('latest failed or blocked criterion defeats an older approval without deleting history', t => {
  const f = fixture(t); f.init(); f.fill(); f.review();
  f.record('PJ00-C1', { result: 'FAIL' }); assert.equal(f.status('PJ00'), 'FAIL');
  f.record('PJ00-C1', { result: 'BLOCKED' }); assert.equal(f.status('PJ00'), 'BLOCKED');
  assert.equal(f.read().events.filter(event => event.type === 'review').length, 1);
  assert.throws(() => f.review(), /Cannot approve/);
});

test('new record invalidates same and downstream approvals even after upstream is reapproved', t => {
  const f = fixture(t); f.init(); f.through('PJ02'); f.record('PJ00-C1');
  assert.equal(f.status('PJ00'), 'READY FOR REVIEW'); assert.equal(f.status('PJ02'), 'WAITING PREREQUISITE');
  f.review('PJ00'); assert.equal(f.status('PJ01'), 'READY FOR REVIEW');
  f.review('PJ01'); assert.equal(f.status('PJ02'), 'READY FOR REVIEW');
  assert.equal(f.read().events.filter(event => event.type === 'record').length, 10);
});

test('upstream re-review alone changes approval identity and invalidates every later approval binding', t => {
  const f = fixture(t); f.init(); f.through('PJ03');
  const review = f.read().events.findLast(event => event.type === 'review');
  assert.equal(review.data.upstreamReviewIds.length, 3);
  f.review('PJ00'); assert.equal(f.status('PJ01'), 'READY FOR REVIEW');
  f.review('PJ01'); f.review('PJ02'); assert.equal(f.status('PJ03'), 'READY FOR REVIEW');
});

test('review rejection supersedes approval and a new observation is needed', t => {
  const f = fixture(t); f.init(); f.fill(); f.review(); f.review('PJ00', { decision: 'REJECT', note: 'Observed explanation mismatch' });
  assert.equal(f.status('PJ00'), 'REVIEW REJECTED'); f.review(); assert.equal(f.status('PJ00'), 'PASS');
  assert.deepEqual(f.read().events.filter(event => event.type === 'review').map(event => event.data.decision), ['APPROVE', 'REJECT', 'APPROVE']);
});

test('adopted change invalidates from its stage, requires evidence, and preserves earlier stages', t => {
  const f = fixture(t); f.init(); f.through('PJ03');
  assert.throws(() => f.command('invalidate', { from: 'PJ02', reason: 'Accepted scope change' }), /sanitized|evidence/);
  f.command('invalidate', { from: 'PJ02', reason: 'Accepted scope change', evidence: 'incoming/evidence.txt', sanitized: true });
  assert.equal(f.status('PJ01'), 'PASS'); assert.equal(f.status('PJ02'), 'NEEDS RECHECK');
  assert.throws(() => f.review('PJ02'), /NEEDS RECHECK/);
  f.record('PJ02-C1'); assert.equal(f.status('PJ02'), 'NEEDS RECHECK');
  f.record('PJ02-C2'); f.record('PJ02-C3'); f.review('PJ02'); assert.equal(f.status('PJ03'), 'NEEDS RECHECK');
  assert.throws(() => f.review('PJ03'), /NEEDS RECHECK/);
  f.fill('PJ03'); f.review('PJ03'); assert.equal(f.status('PJ03'), 'PASS');
});

test('open tasks block stage approval; completion evidence unlocks only review readiness', t => {
  const f = fixture(t); f.init(); f.fill(); f.addTask(); assert.equal(f.status('PJ00'), 'OPEN TASKS');
  assert.throws(() => f.review(), /OPEN TASKS/); f.done(); assert.equal(f.status('PJ00'), 'READY FOR REVIEW'); f.review();
  f.addTask('task-b'); assert.equal(f.status('PJ00'), 'OPEN TASKS'); assert.equal(f.report().status, 'ACTIVE');
});

test('task DONE requires positive prior work estimate, zero remaining, proof and completed dependencies', t => {
  const f = fixture(t); f.init();
  assert.throws(() => f.addTask('zero', { hours: 0 }), /positive/);
  f.addTask('first'); f.addTask('second', { depends: 'first' });
  assert.throws(() => f.update('second'), /dependencies must be DONE/);
  assert.throws(() => f.done('second'), /dependencies must be DONE/);
  assert.throws(() => f.update('first', { state: 'DONE', remaining: 0 }), /DONE requires evidence/);
  assert.throws(() => f.done('first', { remaining: 1 }), /remaining=0/);
  assert.throws(() => f.update('first', { remaining: 0 }), /positive remaining/);
  f.done('first'); f.done('second'); assert.equal(f.report().openTasks, 0);
});

test('task dependency graph rejects duplicate, unknown, forward-stage and cyclic dependencies', t => {
  const f = fixture(t); f.init(); f.addTask('later', { stage: 'PJ04' });
  assert.throws(() => f.addTask('earlier', { stage: 'PJ00', depends: 'later' }), /earlier stage/);
  assert.throws(() => f.addTask('unknown', { depends: 'not-created' }), /existing tasks/);
  assert.throws(() => f.addTask('cycle', { depends: 'cycle' }), /existing tasks/);
  f.addTask('base'); assert.throws(() => f.addTask('dup', { depends: 'base,base' }), /duplicate task dependencies/);
  assert.throws(() => f.addTask('base'), /already exists/);
});

test('reopening completed work requires reopening completed dependants and invalidates prior approvals', t => {
  const f = fixture(t); f.init(); f.addTask('first'); f.addTask('second', { depends: 'first' }); f.done('first'); f.done('second'); f.through('PJ01');
  assert.throws(() => f.update('first'), /Reopen DONE dependants first/);
  f.update('second'); assert.throws(() => f.update('first'), /pause DOING dependants/);
  f.update('second', { state: 'TODO' }); f.update('first'); assert.equal(f.status('PJ00'), 'OPEN TASKS'); assert.equal(f.status('PJ01'), 'WAITING PREREQUISITE');
  assert.equal(f.report().openTasks, 2);
});

test('hold blocks work updates, resume requires hold, and reasoned cancellation is terminal', t => {
  const f = fixture(t); f.init(); f.addTask();
  assert.throws(() => f.command('resume', { reason: 'Not held' }), /ON HOLD/);
  assert.throws(() => f.command('hold', { reason: '' }), /reason/);
  f.command('hold', { reason: 'Awaiting external prerequisite' }); assert.equal(f.report().status, 'ON HOLD');
  assert.throws(() => f.record(), /require ACTIVE/); assert.throws(() => f.update(), /require ACTIVE/);
  f.command('resume', { reason: 'Actual prerequisite confirmed' }); assert.equal(f.report().status, 'ACTIVE');
  f.command('cancel', { reason: 'Owner records cancellation decision' }); assert.equal(f.report().status, 'CANCELLED');
  for (const action of [() => f.record(), () => f.command('resume', { reason: 'retry' }), () => f.command('reschedule', { due: '2026-09-30', reason: 'retry' })]) assert.throws(action, /Cancelled projects are terminal/);
});

test('rescheduling preserves original/old/new due and overdue history, including multiple changes', t => {
  const f = fixture(t); f.init(); f.through('PJ01');
  f.command('reschedule', { due: '2026-09-20', reason: 'Agreed revised date' });
  assert.equal(f.status('PJ00'), 'PASS'); assert.equal(f.status('PJ01'), 'READY FOR REVIEW');
  f.clock('2026-09-22T06:00:00Z'); f.command('reschedule', { due: '2026-09-30', reason: 'Second agreed date' });
  const events = f.read().events.filter(event => event.type === 'reschedule');
  assert.deepEqual(events.map(event => [event.data.originalDue, event.data.oldDue, event.data.newDue, event.data.overdueDays]), [['2026-09-05', '2026-09-05', '2026-09-20', 3], ['2026-09-05', '2026-09-20', '2026-09-30', 2]]);
  assert.equal(f.report().originalOverdueDays, 17); assert.equal(f.report().currentOverdueDays, 0);
});

test('task due revision is distinct from project deadline and permitted while project is held', t => {
  const f = fixture(t); f.init(); f.addTask(); f.command('hold', { reason: 'Date negotiation' });
  f.command('reschedule', { task: 'task-a', due: '2026-09-12', reason: 'Revised task date agreed' });
  assert.equal(f.report().due, '2026-09-05'); assert.equal(f.report().tasks[0].originalDue, '2026-09-06');
  assert.equal(f.report().tasks[0].due, '2026-09-12'); assert.equal(f.read().events.at(-1).data.overdueDays, 2);
});

test('completion requires eight currently approved stages and zero open tasks; later work reopens it', t => {
  const f = fixture(t); f.init(); f.addTask('closure', { stage: 'PJ07' });
  f.through('PJ06'); f.fill('PJ07'); assert.throws(() => f.review('PJ07'), /OPEN TASKS/);
  f.done('closure'); f.review('PJ07'); assert.equal(f.report().status, 'COMPLETED');
  f.addTask('followup', { stage: 'PJ06' }); assert.equal(f.report().status, 'ACTIVE'); assert.equal(f.status('PJ06'), 'OPEN TASKS');
});

test('board sorts priority/deadlines and distinguishes all-period backlog from weekly capacity', t => {
  const f = fixture(t); f.init(); f.addTask('one', { hours: 12 }); f.update('one', { remaining: 10 });
  f.init({ project: 'demo-b', priority: 1, due: '2026-09-30' }); f.addTask('two', { project: 'demo-b', hours: 5 }); f.update('two', { project: 'demo-b', remaining: 4 });
  f.command('hold', { project: 'demo-b', reason: 'Waiting; outstanding work retained' });
  f.init({ project: 'cancelled', priority: 1 }); f.addTask('old', { project: 'cancelled', hours: 100 }); f.command('cancel', { project: 'cancelled', reason: 'Cancelled, not completed' });
  const board = JSON.parse(f.run(['board', '--capacity', '8', '--wip-limit', '1', '--json']));
  assert.deepEqual(board.projects.map(project => project.id), ['cancelled', 'demo-b', 'demo-a']);
  assert.equal(board.doing, 2); assert.equal(board.aboveWipReference, true); assert.equal(board.remainingHours, 14); assert.equal(board.weeklyCapacityReference, 8);
  assert.ok(!Object.hasOwn(board, 'weeklyUtilization')); assert.match(f.run(['board', '--capacity', '8']), /全期間/);
});

test('reprioritization keeps original and old priorities without invalidating approved scope', t => {
  const f = fixture(t); f.init(); f.through('PJ01');
  f.command('reprioritize', { priority: 1, reason: 'Owner changed queue order only' });
  assert.equal(f.report().priority, 1); assert.equal(f.report().originalPriority, 2); assert.equal(f.status('PJ01'), 'PASS');
  assert.equal(f.read().events.at(-1).data.oldPriority, 2);
  f.command('reprioritize', { priority: 3, reason: 'Queue ordering changed again' });
  assert.equal(f.read().events.at(-1).data.oldPriority, 1); assert.equal(f.read().project.priority, 2);
  assert.throws(() => f.command('reprioritize', { priority: 4, reason: 'invalid' }), /different value 1-3/);
});

test('task reassignment preserves original assignment and invalidates affected downstream reviews', t => {
  const f = fixture(t); f.init(); f.addTask('assignment', { stage: 'PJ01' }); f.done('assignment'); f.through('PJ02');
  f.command('task-reassign', { task: 'assignment', owner: 'new-owner', reason: 'Actual owner handover confirmed' });
  assert.equal(f.status('PJ00'), 'PASS'); assert.equal(f.status('PJ01'), 'READY FOR REVIEW'); assert.equal(f.status('PJ02'), 'WAITING PREREQUISITE');
  assert.equal(f.report().tasks[0].owner, 'new-owner');
  assert.equal(f.read().events[0].data.owner, 'worker01'); assert.equal(f.read().events.at(-1).data.oldOwner, 'worker01');
  assert.throws(() => f.command('task-reassign', { task: 'assignment', owner: 'new-owner', reason: 'same' }), /change owner/);
});

test('withdrawal requires independent sponsor evidence and preserves old state and remaining work', t => {
  const f = fixture(t); f.init(); f.addTask(); f.update();
  const options = { task: 'task-a', reviewer: 'reviewer01', role: 'sponsor', reason: 'Accepted scope reduction', evidence: 'incoming/evidence.txt', sanitized: true };
  assert.throws(() => f.command('task-withdraw', { ...options, reviewer: 'owner01' }), /Self-review/);
  assert.throws(() => f.command('task-withdraw', { ...options, role: 'technical' }), /sponsor role/);
  assert.throws(() => f.command('task-withdraw', { ...options, evidence: undefined }), /evidence/);
  f.command('task-withdraw', options);
  const event = f.read().events.at(-1); assert.equal(event.data.oldState, 'DOING'); assert.equal(event.data.oldRemaining, 1);
  assert.equal(f.report().tasks[0].state, 'WITHDRAWN'); assert.equal(f.report().tasks[0].remaining, 0); assert.equal(f.report().doneTasks, 0); assert.equal(f.report().withdrawnTasks, 1);
  assert.equal(JSON.parse(f.run(['board', '--json'])).remainingHours, 0);
  assert.throws(() => f.update(), /WITHDRAWN tasks are terminal/);
  assert.throws(() => f.addTask('new', { depends: 'task-a' }), /not WITHDRAWN/);
  const corrupt = f.read(); corrupt.events.at(-1).data.oldRemaining = 500; f.rewrite(corrupt); assert.throws(() => f.command('check'), /preserve old task state/);
});

test('withdrawal must proceed from dependants and cannot erase already completed task history', t => {
  const f = fixture(t); f.init(); f.addTask('first'); f.addTask('second', { depends: 'first' });
  const withdraw = task => f.command('task-withdraw', { task, reviewer: 'reviewer01', role: 'sponsor', reason: 'Accepted dependency plan change', evidence: 'incoming/evidence.txt', sanitized: true });
  assert.throws(() => withdraw('first'), /dependants first/); withdraw('second'); withdraw('first');
  assert.equal(f.report().openTasks, 0); assert.equal(f.report().withdrawnTasks, 2);
  f.addTask('completed'); f.done('completed'); assert.throws(() => withdraw('completed'), /DONE history must not be erased/);
});

test('withdrawal forces fresh affected criteria before a reduced-scope project can close', t => {
  const f = fixture(t); f.init(); f.through('PJ07'); f.addTask('reduced', { stage: 'PJ06' });
  f.command('task-withdraw', { task: 'reduced', reviewer: 'reviewer01', role: 'sponsor', reason: 'Actual scope removal confirmed in fixture', evidence: 'incoming/evidence.txt', sanitized: true });
  assert.equal(f.report().status, 'ACTIVE'); assert.equal(f.status('PJ06'), 'NEEDS RECHECK');
  assert.throws(() => f.review('PJ06'), /NEEDS RECHECK/);
  f.fill('PJ06'); f.review('PJ06'); assert.equal(f.status('PJ07'), 'NEEDS RECHECK');
  f.fill('PJ07'); f.review('PJ07'); assert.equal(f.report().status, 'COMPLETED');
  assert.equal(f.report().withdrawnTasks, 1); assert.equal(f.report().doneTasks, 0);
});

test('stored schema, event sequence, review binding and reschedule history are strictly checked', t => {
  const f = fixture(t); f.init(); f.through('PJ01'); f.command('reschedule', { due: '2026-09-30', reason: 'Changed deadline' });
  const original = f.read();
  for (const [mutate, pattern] of [
    [p => { p.events[0].seq = 2; }, /sequence/],
    [p => { p.events[1].id = p.events[0].id; }, /duplicate event/],
    [p => { p.events[0].data.criterion = 'PJ99-C1'; }, /Unknown criterion/],
    [p => { p.events[3].data.reviewer = 'owner01'; }, /Self-review/],
    [p => { p.events[7].data.upstreamReviewIds = []; }, /ALL upstream approvals/],
    [p => { p.events[7].data.attemptIds.reverse(); }, /Review binding/],
    [p => { p.events.at(-1).data.oldDue = '2026-09-07'; }, /preserve original/],
    [p => { p.events.at(-1).data.overdueDays = 0; }, /overdue history/],
    [p => { p.events[0].data.evidence.path = '../other/evidence.bin'; }, /project evidence folder/],
    [p => { p.events[0].at = '2099-01-01T00:00:00Z'; }, /future/],
    [p => { p.events[0].data.fake = true; }, /invalid or missing fields/],
    [p => { p.schemaVersion = 9; }, /Unsupported ledger/],
  ]) { const value = structuredClone(original); mutate(value); f.rewrite(value); assert.throws(() => f.command('check'), pattern); }
});

test('workflow check detects missing files, unknown IDs and changed definition without certifying actual delivery', t => {
  const f = fixture(t); f.init(); assert.match(f.run(['check']), /records NOT CHECKED/); assert.match(f.command('check'), /NOT VERIFIED/);
  const target = path.join(f.root, workflow.stages[0].document); fs.writeFileSync(target, 'PJ00-C1'); assert.throws(() => f.run(['check']), /Missing criterion/);
  fs.unlinkSync(target); assert.throws(() => f.run(['check']), /Missing file/);
  const changed = structuredClone(workflow); changed.version = '2.0.0'; fs.writeFileSync(path.join(f.root, 'docs/server-projects/workflow.json'), JSON.stringify(changed));
  assert.throws(() => f.report(), /Workflow changed/);
});

test('existing lock prevents mutation and is not removed by a failed writer', t => {
  const f = fixture(t); f.init(); const lock = path.join(f.root, '.local/server-projects/demo-a/write.lock'); fs.writeFileSync(lock, 'another-process');
  assert.throws(() => f.record(), /Project is locked/); assert.equal(fs.readFileSync(lock, 'utf8'), 'another-process'); assert.equal(f.read().events.length, 0);
});

test('two actual processes preserve every successful append and leave no orphan evidence', async t => {
  const f = fixture(t); f.init();
  const module = pathToFileURL(path.join(repository, 'scripts/server-projects.mjs')).href;
  const source = `import { execute } from ${JSON.stringify(module)}; try { console.log(execute(process.argv.slice(2), { root: process.argv[1], now: () => new Date('2026-09-08T06:00:00.000Z') })); } catch (error) { console.error(error.message); process.exitCode = 1; }`;
  const writer = criterion => new Promise((resolve, reject) => {
    const args = ['--input-type=module', '-e', source, f.root, ...argv('record', { project: 'demo-a', criterion, result: 'PASS', target: 'synthetic target', assistance: 'guided', evidence: 'incoming/evidence.txt', sanitized: true, note: 'Synthetic process fixture' })];
    const child = spawn(process.execPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }); let stderr = '';
    child.stdout.resume(); child.stderr.setEncoding('utf8'); child.stderr.on('data', value => { stderr += value; }); child.on('error', reject); child.on('close', code => resolve({ code, stderr }));
  });
  const results = await Promise.all([writer('PJ00-C1'), writer('PJ00-C2')]); const successes = results.filter(result => result.code === 0);
  assert.ok(successes.length >= 1); for (const result of results) if (result.code !== 0) assert.match(result.stderr, /Project is locked/);
  assert.equal(f.read().events.length, successes.length); assert.match(f.command('check'), /record integrity/);
  assert.equal(fs.readdirSync(path.join(f.root, '.local/server-projects/demo-a/evidence')).length, successes.length);
});
