import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { plan, validate, signature, execute, safe, context } from '../scripts/career.mjs';

const template = JSON.parse(fs.readFileSync(new URL('../career.config.example.json', import.meta.url), 'utf8'));
const at = '2026-09-08T04:00:00.000Z';
const signals = { learner: { state: 'NOT_CONNECTED' }, projects: { state: 'NOT_CONNECTED' } };
function setup() {
  const root = fs.mkdtempSync(path.join(tmpdir(), 'career-test-'));
  const input = structuredClone(template); input.weekly_minutes = 600; input.updated_at = at;
  for (const a of input.actions) { const p = path.join(root, a.reference); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, '# Fixture reference\n'); }
  fs.mkdirSync(path.join(root, 'tools/portfolio-audit'), { recursive: true });
  fs.writeFileSync(path.join(root, 'tools/portfolio-audit/career.config.example.json'), JSON.stringify(template));
  return { root, input, run: () => plan(input, signals, at, root), close: () => fs.rmSync(root, { recursive: true, force: true }) };
}
function use(fn) { return async () => { const f = setup(); try { await fn(f); } finally { f.close(); } }; }
function record(f, name = 'actual.md') {
  const relative = '.local/engineer-career/records/' + name;
  const file = path.join(f.root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, 'Synthetic record for testing only.\n'); return relative;
}
function opportunity(id = 'job-a') { return { id, source_url: 'https://example.com/jobs/a', checked_at: at,
  status: 'REVIEWED', required_fit: 'MEETS', next_check_at: null, record_ref: null }; }

test('ten-hour budget retains reserve, review and at most three substantive actions', use(f => {
  const r = f.run(); assert.equal(r.reserve_minutes, 120); assert.equal(r.planned_minutes, 390); assert.equal(r.unallocated_minutes, 90);
  assert.equal(r.selected.length, 4); assert.equal(r.external_actions_allowed, false);
  assert.equal(r.planned_minutes + r.reserve_minutes + r.unallocated_minutes, 600);
}));
test('unset and zero capacity never mean unlimited work', use(f => {
  for (const value of [null, 0]) { f.input.weekly_minutes = value; const r = f.run(); assert.equal(r.planned_minutes, 0); }
}));
test('negative, fractional and infinite capacities are rejected', use(f => {
  for (const value of [-1, 1.5, Infinity, '600', 2401]) { f.input.weekly_minutes = value; assert.throws(f.run, /Capacity/); }
}));
test('existing commitments reduce the weekly allocation without treating all project remaining work as this week', use(f => {
  f.input.commitments_minutes = 300; const r = f.run(); assert.ok(r.planned_minutes <= 180);
  f.input.commitments_minutes = 1000; const x = f.run(); assert.equal(x.planned_minutes, 0); assert.ok(x.warnings.includes('COMMITMENTS_EXCEED_AVAILABLE_CAPACITY'));
}));
test('reduced and paused modes reduce proposed work and never complete it', use(f => {
  f.input.load_mode = 'reduced'; assert.equal(f.run().effective_minutes, 300); assert.ok(f.run().planned_minutes <= 240);
  f.input.load_mode = 'paused'; assert.equal(f.run().planned_minutes, 0);
  assert.ok(f.input.actions.every(a => a.status !== 'DONE'));
}));
test('planning does not mutate the private input or mark learning as passed', use(f => {
  const before = JSON.stringify(f.input); const r = f.run(); assert.equal(JSON.stringify(f.input), before);
  assert.deepEqual(r.signals, signals); assert.equal(r.opportunity_states.length, 0);
}));
test('unknown and cyclic dependencies fail closed', use(f => {
  f.input.actions[0].depends_on = ['missing']; assert.throws(f.run, /Unknown dependency/);
  f.input.actions[0].depends_on = [f.input.actions[1].id]; f.input.actions[1].depends_on = [f.input.actions[0].id]; assert.throws(f.run, /Cyclic/);
}));
test('same-week selection does not satisfy an unfinished dependency', use(f => {
  f.input.actions[2].depends_on = [f.input.actions[0].id]; const r = f.run();
  assert.ok(!r.selected.some(a => a.id === f.input.actions[2].id));
  assert.ok(r.deferred.some(a => a.id === f.input.actions[2].id && a.reason === 'DEPENDENCY_NOT_DONE'));
}));
test('DONE requires a real nonempty private reference; protected and traversal paths are rejected', use(f => {
  f.input.actions[0].status = 'DONE'; assert.throws(f.run, /Required record/);
  f.input.actions[0].evidence_ref = 'README.md'; assert.throws(f.run, /Required record/);
  f.input.actions[0].evidence_ref = '.local/engineer-career/records/../../secret'; assert.throws(f.run, /Unsafe/);
  f.input.actions[0].evidence_ref = record(f); assert.ok(!f.run().selected.some(a => a.id === f.input.actions[0].id));
}));
test('a recorded action completion does not create an application or offer', use(f => {
  f.input.actions[0].status = 'DONE'; f.input.actions[0].evidence_ref = record(f);
  assert.deepEqual(f.run().opportunity_states, []);
}));
test('submitted applications and offers require owner records', use(f => {
  f.input.opportunities.push({ ...opportunity(), status: 'OFFER' }); assert.throws(f.run, /Required record/);
  f.input.opportunities[0].record_ref = record(f); assert.equal(f.run().opportunity_states[0].status, 'OFFER');
}));
test('duplicate normalized source URLs are rejected', use(f => {
  f.input.opportunities = [opportunity(), { ...opportunity('job-b'), source_url: 'https://example.com/jobs/a/?utm_source=mail#apply' }];
  assert.throws(f.run, /Duplicate opportunity source/);
}));
test('stale or unknown job requirements stop linked preparation actions', use(f => {
  f.input.opportunities = [opportunity()]; const a = f.input.actions[0]; a.opportunity_id = 'job-a'; a.requires_fresh_opportunity = true;
  for (const change of [{ checked_at: null }, { checked_at: '2026-08-01T00:00:00Z' }, { required_fit: 'UNKNOWN' }, { required_fit: 'GAP' }]) {
    f.input.opportunities[0] = { ...opportunity(), ...change };
    assert.ok(!f.run().selected.some(x => x.id === a.id));
  }
}));
test('due work is prioritized and unfit deadlines are exposed', use(f => {
  f.input.actions[2].due_at = '2026-09-09T00:00:00Z'; f.input.weekly_minutes = 150;
  assert.equal(f.run().selected[1].id, f.input.actions[2].id);
  f.input.actions[2].minutes = 500;
  assert.ok(f.run().warnings.includes('DEADLINE_REQUIRES_REPLAN:' + f.input.actions[2].id));
}));
test('opportunity follow-up dates use exact timestamps and closed items are excluded', use(f => {
  const o = opportunity(); o.next_check_at = '2026-09-09T00:00:00Z'; f.input.opportunities = [o];
  assert.deepEqual(f.run().due_opportunities, ['job-a']); o.status = 'CLOSED'; o.record_ref = record(f);
  assert.deepEqual(f.run().due_opportunities, []);
}));
test('future and invalid calendar dates are rejected', use(f => {
  f.input.updated_at = '2026-09-09T00:00:00Z'; assert.throws(f.run, /Future/);
  f.input.updated_at = '2026-02-30T00:00:00Z'; assert.throws(f.run, /invalid date/);
}));
test('old private planning records select review rather than stale commitments', use(f => {
  f.input.updated_at = '2026-08-01T00:00:00Z'; const r = f.run(); assert.equal(r.selected.length, 1); assert.equal(r.selected[0].id, 'weekly-review');
}));
test('missing optional records stay NOT_CONNECTED; unreadable connected records stay UNAVAILABLE', use(async f => {
  assert.deepEqual(await context(f.input, f.root, at), signals);
  f.input.connections.learner_id = 'learner'; const c = await context(f.input, f.root, at); assert.equal(c.learner.state, 'UNAVAILABLE');
  const r = plan(f.input, c, at, f.root); assert.ok(r.selected.some(x => x.kind === 'career')); assert.ok(!r.selected.some(x => x.kind === 'technical'));
}));
test('elapsed time alone does not alter the notification fingerprint', use(f => {
  const r = f.run(); assert.equal(signature(r), signature({ ...r, generated_at: '2026-09-08T05:00:00Z' }));
}));
test('init refuses overwrite and repeated plans suppress duplicate notices', use(async f => {
  await execute(['init', '10'], { root: f.root, now: () => at });
  await assert.rejects(execute(['init', '10'], { root: f.root, now: () => at }), /EEXIST/);
  const first = JSON.parse(await execute(['plan'], { root: f.root, now: () => at }));
  const second = JSON.parse(await execute(['plan'], { root: f.root, now: () => at }));
  assert.equal(first.notify, true); assert.equal(second.notify, false);
  assert.equal(fs.existsSync(path.join(f.root, '.local/engineer-career/plan.lock')), false);
}));
test('corrupt state and active locks stop writes', use(async f => {
  await execute(['init', '10'], { root: f.root, now: () => at });
  const base = path.join(f.root, '.local/engineer-career'); fs.writeFileSync(path.join(base, 'latest.json'), '{}');
  await assert.rejects(execute(['plan'], { root: f.root, now: () => at }), /Invalid previous/);
  assert.equal(fs.readFileSync(path.join(base, 'latest.json'), 'utf8'), '{}');
  fs.writeFileSync(path.join(base, 'plan.lock'), 'busy');
  await assert.rejects(execute(['plan'], { root: f.root, now: () => at }), /EEXIST/);
}));
test('unsafe paths and unknown commands are rejected', use(async f => {
  for (const p of ['../x', 'C:/x', 'a\\b', '.local/x:stream', '/tmp/x']) assert.throws(() => safe(f.root, p));
  await assert.rejects(execute(['send'], { root: f.root, now: () => at }), /Unknown command/);
}));
test('numeric identifiers cannot pass string ID validation', use(f => {
  f.input.actions[0].id = 123; assert.throws(f.run, /invalid action ID/);
  f.input.actions[0].id = 'valid'; f.input.connections.learner_id = 123; assert.throws(f.run, /Invalid learner ID/);
  f.input.connections.learner_id = null; f.input.opportunities = [{ ...opportunity(), id: 123 }]; assert.throws(f.run, /invalid opportunity ID/);
}));
test('changed deadlines alter fingerprints even when selected action stays the same', use(f => {
  f.input.actions[0].due_at = '2026-09-30T00:00:00Z'; const before = signature(f.run());
  f.input.actions[0].due_at = '2026-09-09T00:00:00Z'; const r = f.run();
  assert.notEqual(signature(r), before); assert.ok(r.selected.some(a => a.due_at === '2026-09-09T00:00:00Z'));
}));
test('blocked and dependent deadlines remain visible and require replanning', use(f => {
  for (const status of ['BLOCKED', 'BACKLOG']) {
    const a = f.input.actions[2]; a.status = status; a.depends_on = [f.input.actions[0].id]; a.due_at = '2026-09-09T00:00:00Z';
    const r = f.run(); assert.ok(r.warnings.includes('DEADLINE_REQUIRES_REPLAN:' + a.id));
    assert.equal(r.deferred.find(x => x.id === a.id).due_at, a.due_at);
  }
}));
test('plan lock is acquired before awaiting connected records', use(async f => {
  await execute(['init', '10'], { root: f.root, now: () => at });
  let resume, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const hold = new Promise(resolve => { resume = resolve; });
  const first = execute(['plan'], { root: f.root, now: () => at, loadContext: async () => { entered(); await hold; return signals; } });
  await started;
  try { await assert.rejects(execute(['plan'], { root: f.root, now: () => at }), /EEXIST/); }
  finally { resume(); await first; }
}));
test('profile edits during context loading prevent saving an outdated plan', use(async f => {
  await execute(['init', '10'], { root: f.root, now: () => at });
  await assert.rejects(execute(['plan'], { root: f.root, now: () => at, loadContext: async () => {
    const p = path.join(f.root, '.local/engineer-career/profile.json');
    const updated = JSON.parse(fs.readFileSync(p, 'utf8')); updated.weekly_minutes = 180;
    fs.writeFileSync(p, JSON.stringify(updated)); return signals;
  } }), /Profile changed/);
  assert.equal(fs.existsSync(path.join(f.root, '.local/engineer-career/latest.json')), false);
}));
test('real SE/PJ read adapters preserve unrun learning and do not create project outcomes', use(async f => {
  for (const name of ['server-engineer/curriculum.json', 'server-projects/workflow.json']) {
    const target = path.join(f.root, 'docs', name); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(new URL('../../../docs/' + name, import.meta.url), target);
  }
  const { execute: learner } = await import('../../../scripts/server-engineer.mjs');
  learner(['init', '--learner', 'synthetic-learner'], { root: f.root, now: () => new Date(at) });
  f.input.connections = { learner_id: 'synthetic-learner', project_board: true };
  const before = fs.readFileSync(path.join(f.root, '.local/server-engineer/synthetic-learner/progress.json'), 'utf8');
  const c = await context(f.input, f.root, at);
  assert.equal(c.learner.state, 'READ'); assert.equal(c.learner.stages.length, 8);
  assert.ok(c.learner.stages.every(s => s.status === 'NOT RUN'));
  assert.equal(c.projects.state, 'READ'); assert.equal(c.projects.count, 0);
  assert.equal(fs.readFileSync(path.join(f.root, '.local/server-engineer/synthetic-learner/progress.json'), 'utf8'), before);
}));
