import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { init, review, status, demo, safePath, validateLedger, REPO_ROOT } from '../prosperity.mjs';
import { plan as careerPlan } from '../../portfolio-audit/scripts/career.mjs';

// All owner records and measured payloads below are synthetic fixtures in OS temp roots.
// They never enter the user's operational ledger. No test makes network requests.
const NOW = '2026-09-10T01:00:00.000Z';
const BEFORE = '2026-09-10T00:00:00.000Z';
const DAY = '2026-09-09T01:00:00.000Z';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = (root, path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
function put(root, path, value) { const file = join(root, path); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
const LEDGER = '.local/prosperity/ledger.json';
const LOOP = '.local/portfolio-loop/latest.json';
const SUMMARY = '.local/portfolio-loop/runs/fixture/summary.json';
const PROFILE = '.local/engineer-career/profile.json';
const PLAN = '.local/engineer-career/plans/fixture/plan.json';
function fixture(t, active = true) {
  const root = mkdtempSync(join(tmpdir(), 'prosperity-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  init({ root });
  const profile = read(REPO_ROOT, 'tools/portfolio-audit/career.config.example.json');
  profile.updated_at = BEFORE; profile.weekly_minutes = 600;
  put(root, PROFILE, profile);
  put(root, PLAN, careerPlan(profile, { learner: { state: 'NOT_CONNECTED' }, projects: { state: 'NOT_CONNECTED' } }, NOW, REPO_ROOT));
  put(root, '.local/engineer-career/latest.json', { schema_version: 1, at: NOW, plan: PLAN });
  const loop = { schema_version: 1, evaluated_at: NOW, mode: 'LIVE', demo: false, synthetic: false, outcome: 'PROCESSED', audit: { state: 'COMPLETE', collection_status: 'COMPLETE_FOR_CONFIGURED_SCOPE', errors: [], findings: [], observed_at: BEFORE, execution_mode: 'LIVE' }, context: { occupied: false, basis: [] }, discovery: { selected: null }, next_actions: [], run_dir: join(root, '.local/portfolio-loop/runs/fixture') };
  put(root, LOOP, loop); put(root, SUMMARY, loop);
  put(root, '.local/autonomous-prosperity/review.json', { schema_version: 1, updated_at: NOW, data_kind: 'measured', load: 'normal', observations: [] });
  const ledger = read(root, LEDGER);
  ledger.owner_confirmed_at = NOW; ledger.baseline = { confirmed_at: NOW, weekly_actual_minutes: 120, load: 'normal' };
  if (active) Object.assign(ledger.experiments[0], { status: 'ACTIVE', adopted_at: DAY, original_due_at: '2026-09-12T01:00:00.000Z', due_at: '2026-09-12T01:00:00.000Z', metric: { ...ledger.experiments[0].metric, baseline: 20, target: 10 } });
  put(root, LEDGER, ledger);
  return root;
}
function edit(root, path, change) { const obj = read(root, path); change(obj); put(root, path, obj); }
function inspect(root, now = NOW) { return status({ root, now }); }
function evidence(root, change = () => {}) {
  const e = read(root, LEDGER).experiments[0];
  e.metric.actual = 8;
  const body = { schema_version: 1, experiment_id: e.id, action_id: e.action_id, data_kind: 'measured', recorded_by: 'owner', method: 'Synthetic unit-test fixture; not a real personal result', period_start: DAY, period_end: BEFORE, observed_at: BEFORE, metric: { ...e.metric } };
  change(body);
  const path = '.local/prosperity/evidence/P-001.json'; put(root, path, body);
  e.evidence = { path, sha256: sha(readFileSync(join(root, path))), data_kind: 'measured', observed_at: BEFORE };
  edit(root, LEDGER, l => { l.experiments[0] = e; });
}

test('uses the real career planner without adding experiment minutes', t => {
  const root = fixture(t), r = inspect(root);
  assert.equal(r.state, 'IN_PROGRESS'); assert.equal(r.next_action.experiment_id, 'P-001');
  assert.equal(r.capacity.experiment_added_minutes, 0); assert.equal(r.capacity.accounted_minutes, 510);
  assert.equal(r.capacity.active_experiment_detail_minutes, 45);
  assert.equal(r.verified_at, BEFORE); assert.equal(r.metrics.income, 'UNKNOWN');
});
test('init creates unconfirmed fields and refuses overwrite', t => {
  const root = fixture(t); assert.throws(() => init({ root }), /already exists/);
  assert.equal(read(REPO_ROOT, 'tools/prosperity/ledger.example.json').owner_confirmed_at, null);
});
test('missing baseline stays unknown, never zero', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.baseline.weekly_actual_minutes = null; });
  assert.equal(inspect(root).state, 'UNKNOWN'); assert.equal(inspect(root).capacity.actual_week_minutes, null);
});
test('zero actual workload is valid', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.baseline.weekly_actual_minutes = 0; });
  assert.equal(inspect(root).state, 'IN_PROGRESS');
});
test('no eligible experiment gives null denominator', t => {
  const r = inspect(fixture(t, false)); assert.equal(r.metrics.measurement_rate, null); assert.equal(r.next_action.code, 'REVIEW_PROPOSAL');
});
test('review preserves upstream and ledger, repeated observations are quiet', t => {
  const root = fixture(t), paths = [LEDGER, LOOP, SUMMARY, PROFILE, PLAN];
  const before = paths.map(p => sha(readFileSync(join(root, p))));
  assert.equal(review({ root, now: NOW }).notify, true);
  assert.equal(review({ root, now: '2026-09-10T01:01:00.000Z' }).notify, false);
  assert.deepEqual(paths.map(p => sha(readFileSync(join(root, p)))), before);
  assert.equal(readdirSync(join(root, '.local/prosperity/history')).length, 2);
});
test('failed collection preserves last verified observation', t => {
  const root = fixture(t); review({ root, now: NOW });
  for (const path of [LOOP, SUMMARY]) edit(root, path, l => { l.outcome = 'NEEDS_REFRESH'; l.audit.errors = ['HTTP 403']; l.audit.collection_status = 'NEEDS_REFRESH'; });
  const r = review({ root, now: '2026-09-10T01:02:00.000Z' });
  assert.equal(r.state, 'UNKNOWN'); assert.equal(r.verified_at, BEFORE);
});
test('old observation cannot be made fresh by a recent evaluation timestamp', t => {
  const root = fixture(t); edit(root, SUMMARY, l => { l.audit.observed_at = '2026-09-08T00:00:00.000Z'; });
  assert.equal(inspect(root).state, 'UNKNOWN'); assert.equal(inspect(root).verified_at, null);
});
test('future observation is refused', t => {
  const root = fixture(t); edit(root, SUMMARY, l => { l.audit.observed_at = '2026-09-11T00:00:00.000Z'; });
  assert.ok(inspect(root).reasons.some(r => r.code === 'FUTURE_SOURCE'));
});
test('synthetic upstream and offline replay cannot establish live provenance', t => {
  for (const mode of ['synthetic', 'replay']) {
    const root = fixture(t);
    for (const path of [LOOP, SUMMARY]) edit(root, path, l => { if (mode === 'synthetic') l.synthetic = true; else l.mode = 'OFFLINE_REPLAY'; });
    assert.equal(inspect(root).state, 'UNKNOWN'); assert.equal(inspect(root).verified_at, null);
  }
});
test('high load precedes missing baseline and blocks new work', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.baseline.load = 'high'; l.baseline.weekly_actual_minutes = null; });
  assert.equal(inspect(root).next_action.code, 'HIGH_LOAD');
});
test('the existing prosperity pause cannot be overridden by the auxiliary ledger', t => {
  const root = fixture(t); edit(root, '.local/autonomous-prosperity/review.json', x => { x.load = 'paused'; });
  assert.equal(inspect(root).next_action.code, 'CAPACITY_UNAVAILABLE');
});
test('weekly overrun and parent action overrun stop planning', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.baseline.weekly_actual_minutes = 601; });
  assert.equal(inspect(root).next_action.code, 'TIME_OVERRUN');
  edit(root, LEDGER, l => { l.baseline.weekly_actual_minutes = 200; l.experiments[0].planned_minutes = 181; });
  assert.equal(inspect(root).next_action.code, 'TIME_OVERRUN');
});
test('reduced workload invalidates a normal-mode plan', t => {
  const root = fixture(t); edit(root, PROFILE, p => { p.load_mode = 'reduced'; });
  assert.equal(inspect(root).state, 'STOP'); assert.ok(inspect(root).reasons.some(r => r.code === 'INVALID_SOURCE'));
});
test('two active experiments stop rather than doubling work', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.experiments.push({ ...l.experiments[0], id: 'P-002' }); });
  assert.equal(inspect(root).next_action.code, 'ACTIVE_LIMIT');
});
test('upstream occupied and selected discovery consume the common slot', t => {
  const root = fixture(t); edit(root, LOOP, l => { l.context.occupied = true; l.context.basis = ['EXPERIMENT_INBOX_PENDING']; });
  assert.equal(inspect(root).next_action.code, 'UPSTREAM_OCCUPIED');
});
test('new pending draft precedes missing personal baseline', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.owner_confirmed_at = null; });
  put(root, '.local/portfolio-operations/pending.json', { id: 'new-draft' });
  assert.equal(inspect(root).next_action.code, 'UPSTREAM_URGENT');
});
test('upstream lock blocks a previous healthy result', t => {
  const root = fixture(t); put(root, '.local/engineer-career/plan.lock', { pid: 123 });
  assert.equal(inspect(root).next_action.code, 'UPSTREAM_LOCK');
});
test('own lock prevents writes and is never removed automatically', t => {
  const root = fixture(t); put(root, '.local/prosperity/review.lock', { pid: 123 });
  assert.throws(() => review({ root, now: NOW }), /EEXIST/);
  assert.ok(existsSync(join(root, '.local/prosperity/review.lock')));
});
test('invalid ledger fails closed; source pointer traversal is refused', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.weekly_budget_minutes = '600'; });
  assert.equal(inspect(root).state, 'STOP');
  edit(root, '.local/engineer-career/latest.json', l => { l.plan = '../../outside.json'; });
  assert.ok(inspect(root).reasons.some(r => r.code === 'INVALID_SOURCE'));
  assert.throws(() => safePath(root, '.local/../outside.json'), /Unsafe/);
});
test('dangling directory links are refused', t => {
  const root = fixture(t); const target = join(root, 'missing');
  symlinkSync(target, join(root, '.local/prosperity/evidence'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => safePath(root, '.local/prosperity/evidence/record.json'), /Symbolic link/);
});
test('evidence identity, data kind, metric values and hash are checked', t => {
  const root = fixture(t); evidence(root);
  let r = inspect(root); assert.equal(r.experiments[0].metric.verified_actual, 8); assert.equal(r.metrics.measurement_rate, 1);
  assert.equal(r.next_action.code, 'REVIEW_EXPERIMENT'); assert.equal(r.experiments[0].metric.target_met, true);
  edit(root, LEDGER, l => { l.experiments[0].metric.actual = 7; });
  r = inspect(root); assert.equal(r.experiments[0].metric.verified_actual, null);
  evidence(root, body => { body.experiment_id = 'P-OTHER'; }); assert.equal(inspect(root).state, 'UNKNOWN');
  evidence(root, body => { body.data_kind = 'synthetic'; }); assert.equal(inspect(root).state, 'UNKNOWN');
  evidence(root); writeFileSync(join(root, '.local/prosperity/evidence/P-001.json'), '{}');
  assert.equal(inspect(root).experiments[0].evidence.state, 'HASH_MISMATCH');
});
test('zero baseline reports absolute difference without inventing causal success', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.experiments[0].metric.baseline = 0; });
  evidence(root); const r = inspect(root); assert.equal(r.experiments[0].metric.difference, 8);
  assert.equal(r.metrics.causal_success, 'UNKNOWN');
});
test('zero measured actual is retained and direction mismatch is refused', t => {
  const root = fixture(t); evidence(root);
  edit(root, '.local/prosperity/evidence/P-001.json', b => { b.metric.actual = 0; });
  edit(root, LEDGER, l => { l.experiments[0].metric.actual = 0; l.experiments[0].evidence.sha256 = sha(readFileSync(join(root, '.local/prosperity/evidence/P-001.json'))); });
  assert.equal(inspect(root).experiments[0].metric.verified_actual, 0);
  edit(root, LEDGER, l => { l.experiments[0].metric.direction = 'increase'; });
  assert.equal(inspect(root).experiments[0].metric.verified_actual, null);
});
test('raw evidence change notifies even when metric values stay equal', t => {
  const root = fixture(t); evidence(root); review({ root, now: NOW });
  evidence(root, body => { body.method = 'Another synthetic test method'; });
  assert.equal(review({ root, now: NOW }).notify, true);
});
test('overdue days advance without repeated notifications', t => {
  const root = fixture(t); edit(root, LEDGER, l => { l.experiments[0].due_at = l.experiments[0].original_due_at = DAY; });
  review({ root, now: NOW });
  for (const path of [LOOP, SUMMARY]) edit(root, path, l => { l.evaluated_at = '2026-09-11T01:00:00.000Z'; l.audit.observed_at = '2026-09-11T00:00:00.000Z'; });
  edit(root, PLAN, p => { p.generated_at = '2026-09-11T01:00:00.000Z'; });
  edit(root, '.local/engineer-career/latest.json', p => { p.at = '2026-09-11T01:00:00.000Z'; });
  const r = review({ root, now: '2026-09-11T01:00:00.000Z' });
  assert.equal(r.experiments[0].overdue_days, 2); assert.equal(r.notify, false);
});
test('original deadline survives rescheduling and cannot be rewritten', t => {
  const root = fixture(t); const first = review({ root, now: NOW });
  edit(root, LEDGER, l => { l.experiments[0].due_at = '2026-09-13T00:00:00.000Z'; l.experiments[0].reschedule_reason = '本人が比較条件の調整を記録'; });
  assert.equal(inspect(root).experiments[0].original_due_at, first.experiments[0].original_due_at);
  edit(root, LEDGER, l => { l.experiments[0].original_due_at = l.experiments[0].due_at; });
  assert.equal(inspect(root).next_action.code, 'INVALID_LEDGER');
  review({ root, now: NOW });
  assert.equal(inspect(root).next_action.code, 'INVALID_LEDGER');
  edit(root, LEDGER, l => { l.weekly_budget_minutes = 'bad'; }); review({ root, now: NOW });
  edit(root, LEDGER, l => { l.weekly_budget_minutes = 600; });
  assert.equal(inspect(root).next_action.code, 'INVALID_LEDGER');
});
test('parked experiment requires reason and resume condition', t => {
  const root = fixture(t); const l = read(root, LEDGER);
  Object.assign(l.experiments[0], { status: 'PARKED', decision: 'PARK', notes: '余裕がない' });
  assert.throws(() => validateLedger(l), /resume_condition/);
  l.experiments[0].resume_condition = '本人が週の余裕を確認したとき'; assert.equal(validateLedger(l), l);
});
test('corrupt previous state is preserved', t => {
  const root = fixture(t); put(root, '.local/prosperity/latest.json', { broken: true });
  assert.throws(() => review({ root, now: NOW }), /previous prosperity state/);
  assert.deepEqual(read(root, '.local/prosperity/latest.json'), { broken: true });
});
test('demo is isolated and CLI never uses the supplied production root', t => {
  const root = fixture(t), original = sha(readFileSync(join(root, LEDGER)));
  const r = demo({ now: NOW }); t.after(() => rmSync(r.demo_root, { recursive: true, force: true }));
  assert.equal(r.synthetic, true); assert.equal(read(r.demo_root, '.local/prosperity/latest.json').synthetic, true);
  const cli = spawnSync(process.execPath, [join(REPO_ROOT, 'tools/prosperity/prosperity.mjs'), 'demo', '--root', root, '--json'], { encoding: 'utf8' });
  assert.equal(cli.status, 0); const result = JSON.parse(cli.stdout); t.after(() => rmSync(result.demo_root, { recursive: true, force: true }));
  assert.notEqual(result.demo_root, root); assert.equal(sha(readFileSync(join(root, LEDGER))), original);
});
