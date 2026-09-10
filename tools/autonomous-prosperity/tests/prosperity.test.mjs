import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateReview, assessOutcomes, decide, run, cycle, checkIn, render } from '../prosperity.mjs';
import { seedRoot, buildSnapshot, FIXTURE_NOW } from '../../portfolio-loop/fixture.mjs';
import { main } from '../../portfolio-loop/loop.mjs';

globalThis.fetch = () => { throw Error('Network forbidden'); };
const NOW = FIXTURE_NOW;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const doc = { 'a.md': Buffer.from('synthetic sample A'), 'b.md': Buffer.from('synthetic sample B'), 'c.md': Buffer.from('synthetic sample C') };
const profile = { actions: [{ id: 'evidence-map' }], load_mode: 'normal', weekly_minutes: 600 };
const row = (id, day, file) => ({ id, action_id: 'evidence-map', observed_at: `2026-09-0${day}T00:00:00Z`, metric: 'recovery', unit: 'seconds', context_key: 'fixed-context', environment: 'test-only', before: 100, after: 70, direction: 'lower', min_delta: 10, guardrail_ok: true, evidence_ref: '.local/engineer-career/records/' + file, evidence_sha256: digest(doc[file]) });
const review = () => ({ schema_version: 1, updated_at: NOW, data_kind: 'measured', load: 'normal', observations: [row('a', 6, 'a.md'), row('b', 7, 'b.md')] });
const reader = ref => doc[path.basename(ref)];
const basis = () => ({ profile, review: review(), now: NOW, career: { weekly_minutes: 600, effective_minutes: 600, commitments_minutes: 0, reserve_minutes: 120, planned_minutes: 390, unallocated_minutes: 90, warnings: [], selected: [{ id: 'weekly-review', minutes: 60 }, { id: 'evidence-map', minutes: 180 }] }, loop: { locks: [], problems: [], audit: { fresh: true }, last_run: { outcome: 'PROCESSED', evaluated_at: NOW, synthetic: false, demo: false }, next_actions: [{ code: 'NO_CHANGE', title: 'No change' }] } });
const temporary = fn => async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prosperity-'));
  try { await seedRoot(root, { now: () => NOW }); await fn(root); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
};

test('two comparable observations permit considering reuse, never grant execution', () => {
  const r = review(); validateReview(r, profile, NOW, reader);
  const result = decide(basis());
  assert.equal(result.state, 'READY'); assert.equal(result.outcomes[0].state, 'CONSIDER_REUSE');
  assert.equal(result.authorization, 'NONE'); assert.equal(result.external_actions_allowed, false);
  assert.equal(result.budget.added_minutes, 0); assert.equal(result.budget.prosperity_review_minutes, 15);
});
test('different context, environment or day does not manufacture repetition', () => {
  for (const field of ['context_key', 'environment', 'unit', 'metric']) {
    const r = review(); r.observations[1][field] = 'different';
    assert.ok(assessOutcomes(r, NOW).every(x => x.state === 'MEASURE_AGAIN'));
  }
  const r = review(); r.observations[1].observed_at = r.observations[0].observed_at;
  assert.equal(assessOutcomes(r, NOW)[0].state, 'MEASURE_AGAIN');
});
test('latest same-day regression wins across valid timestamp precision formats', () => {
  const r = review();
  r.observations.push({ ...row('newer-regression', 7, 'c.md'), observed_at: '2026-09-07T00:00:00.500Z', after: 120 });
  validateReview(r, profile, NOW, reader);
  const [outcome] = assessOutcomes(r, NOW);
  assert.equal(outcome.state, 'CHANGE_METHOD');
  assert.deepEqual(outcome.evidence_ids, ['newer-regression', 'a']);
});
test('synthetic and old results cannot support personal progress', () => {
  const r = review(); r.data_kind = 'synthetic'; assert.deepEqual(assessOutcomes(r, NOW), []);
  r.data_kind = 'measured'; assert.deepEqual(assessOutcomes(r, '2026-11-01T00:00:00Z'), []);
});
test('guardrail failure outranks speed; regression and neutral results change advice', () => {
  const r = review(); r.observations[0].guardrail_ok = false;
  assert.equal(assessOutcomes(r, NOW)[0].state, 'REVIEW_HARM');
  r.observations[0].guardrail_ok = true; r.observations[0].after = 120;
  assert.equal(assessOutcomes(r, NOW)[0].state, 'CHANGE_METHOD');
  r.observations[0].after = 99; assert.equal(assessOutcomes(r, NOW)[0].state, 'REVIEW_HYPOTHESIS');
});
test('bad evidence, duplicate evidence, NaN, unknown action and future date are rejected', () => {
  for (const mutate of [r => r.observations[0].evidence_sha256 = 'f'.repeat(64),
    r => r.observations[1].evidence_sha256 = r.observations[0].evidence_sha256,
    r => r.observations[0].after = NaN, r => r.observations[0].action_id = 'invented',
    r => r.updated_at = '2027-01-01T00:00:00Z', r => r.observations[0].unexpected = true]) {
    const r = review(); mutate(r); assert.throws(() => validateReview(r, profile, NOW, reader));
  }
});
test('observation IDs reject non-string values before ordering observations', () => {
  for (const id of [1, true, null, {}, []]) {
    const r = review(); r.observations[0].id = id;
    r.observations[1].observed_at = r.observations[0].observed_at;
    assert.throws(() => validateReview(r, profile, NOW, reader), /observation ID/);
  }
  const r = review(); r.observations[0].id = '1';
  assert.doesNotThrow(() => validateReview(r, profile, NOW, reader));
});
test('missing and stale input, pause, overload, loop blockers and false freshness are gated', () => {
  const cases = [
    [x => x.profile = null, 'CONNECT_PROFILE'], [x => x.profile = { ...profile, load_mode: 'paused' }, 'PAUSED'],
    [x => x.review.load = 'reduced', 'REVIEW_LOAD'], [x => x.review = null, 'REFRESH_REVIEW'],
    [x => x.review.updated_at = '2026-08-01T00:00:00Z', 'REFRESH_REVIEW'],
    [x => x.loop.locks.push({}), 'FIX_LOOP'], [x => x.loop.audit.fresh = false, 'REFRESH_AUDIT'],
    [x => x.loop.last_run.synthetic = true, 'REFRESH_AUDIT'],
    [x => x.loop.last_run.evaluated_at = '2027-01-01T00:00:00Z', 'REFRESH_AUDIT'],
    [x => x.career.warnings.push('CAPACITY_NOT_SET'), 'REVIEW_PLAN'],
    [x => x.profile = { ...profile, weekly_minutes: 601 }, 'REVIEW_PLAN'],
    [x => x.loop.next_actions = [{ code: 'DECIDE' }], 'REVIEW_EXISTING'],
  ];
  for (const [mutate, expected] of cases) { const x = basis(); mutate(x); const r = decide(x); assert.equal(r.state, expected); assert.deepEqual(r.selected_action_ids, []); }
});
test('synthetic load values request a real review without becoming personal load decisions', () => {
  for (const load of ['normal', 'reduced', 'paused', 'unknown']) {
    const x = basis(); x.review = { ...x.review, data_kind: 'synthetic', load };
    assert.equal(decide(x).state, 'REFRESH_REVIEW', load);
  }
  const paused = basis(); paused.profile = { ...profile, load_mode: 'paused' };
  paused.review = { ...paused.review, data_kind: 'synthetic', load: 'normal' };
  assert.equal(decide(paused).state, 'PAUSED');
});
test('status decisions render pending commands and targets or the selected action completion condition', () => {
  const x = basis();
  const pending = { code: 'BIND_SLOT', title: 'Confirm and connect the existing learning slot',
    command: 'node tools/portfolio-loop/loop.mjs bind-slot evidence-map --root "C:/test root"',
    detail: 'C:/test root/.local/autonomous-growth/settings.json' };
  x.loop.next_actions = [pending];
  const status = decide(x);
  assert.equal(status.state, 'REVIEW_EXISTING'); assert.deepEqual(status.next_action.upstream, pending);
  const text = render(status);
  for (const field of ['title', 'command', 'detail']) assert.ok(text.includes(pending[field]), field);
  x.loop.next_actions = [{ code: 'NO_CHANGE', title: 'No change' }];
  x.career.selected[1] = { ...x.career.selected[1], title: 'Review one existing evidence record', done_when: 'The source and its recorded limit are checked.' };
  const ready = decide(x);
  assert.equal(ready.next_action.action_id, 'evidence-map');
  assert.ok(render(ready).includes(x.career.selected[1].title));
  assert.ok(render(ready).includes(x.career.selected[1].done_when));
});
test('semantic signature excludes evaluation time and no extra review time is allocated', () => {
  const a = basis(), b = basis(); b.now = new Date(Date.parse(NOW) + 1000).toISOString();
  assert.equal(decide(a).signature, decide(b).signature);
  a.career.selected = []; assert.equal(decide(a).budget.prosperity_review_minutes, 0);
});
test('status is read-only and explicit check-in preserves empty outcome record', temporary(async root => {
  const before = fs.readFileSync(path.join(root, '.local/engineer-career/profile.json'));
  const r = await run({ root, now: NOW }); assert.equal(r.state, 'REFRESH_REVIEW');
  assert.equal(fs.existsSync(path.join(root, '.local/autonomous-prosperity')), false);
  await checkIn(root, 'normal', NOW);
  const reviewFile = JSON.parse(fs.readFileSync(path.join(root, '.local/autonomous-prosperity/review.json')));
  assert.deepEqual(reviewFile.observations, []); assert.deepEqual(fs.readFileSync(path.join(root, '.local/engineer-career/profile.json')), before);
}));
test('one command runs the loop, repeats quietly and preserves human records', temporary(async root => {
  const before = fs.readFileSync(path.join(root, '.local/engineer-career/profile.json'));
  const first = await cycle({ root, offline: buildSnapshot(), now: () => NOW });
  assert.equal(first.loop_outcome, 'PROCESSED'); assert.equal(first.notify, true);
  assert.equal(first.loop_summary.synthetic, true); assert.equal(first.state, 'REFRESH_REVIEW');
  const second = await cycle({ root, offline: buildSnapshot(), now: () => NOW });
  assert.equal(second.notify, false); assert.equal(second.signature, first.signature);
  assert.deepEqual(fs.readFileSync(path.join(root, '.local/engineer-career/profile.json')), before);
  assert.equal(fs.existsSync(path.join(root, '.local/autonomous-prosperity/review.json')), false);
}));
test('an unchanged invalid inbox notifies once even when upstream repeats its error flag', temporary(async root => {
  const inbox = path.join(root, '.local/portfolio-loop/inbox/INV-001-invalid');
  fs.mkdirSync(path.join(inbox, 'evidence'), { recursive: true });
  for (const file of ['protocol.registered.json', 'results.json', 'evidence/context.json'])
    fs.writeFileSync(path.join(inbox, file), '{}');
  const first = await cycle({ root, offline: buildSnapshot(), now: () => NOW });
  assert.equal(first.notify, true); assert.equal(first.loop_summary.intake.errors.length, 1);
  const second = await cycle({ root, offline: buildSnapshot(), now: () => NOW });
  assert.deepEqual(second.loop_summary.intake.errors, first.loop_summary.intake.errors);
  assert.equal(second.loop_summary.notify, true);
  assert.equal(second.signature, first.signature); assert.equal(second.notify, false);
  assert.equal(fs.existsSync(path.join(inbox, 'results.json')), true);
}));
test('pause skips loop execution and a retained lock is not removed', temporary(async root => {
  await checkIn(root, 'paused', NOW);
  const report = await cycle({ root, now: () => NOW }); assert.equal(report.state, 'PAUSED'); assert.equal(report.loop_outcome, 'NOT_RUN');
  const lock = path.join(root, '.local/autonomous-prosperity/run.lock'); fs.writeFileSync(lock, '{}');
  await assert.rejects(cycle({ root, now: () => NOW }), /EEXIST/); assert.equal(fs.existsSync(lock), true);
}));
test('a synthetic paused review does not skip the existing loop', temporary(async root => {
  const directory = path.join(root, '.local/autonomous-prosperity');
  fs.mkdirSync(directory);
  const reviewBytes = JSON.stringify({ schema_version: 1, updated_at: NOW, data_kind: 'synthetic', load: 'paused', observations: [] });
  fs.writeFileSync(path.join(directory, 'review.json'), reviewBytes);
  const status = await run({ root, now: NOW });
  assert.equal(status.state, 'REFRESH_REVIEW'); assert.equal(status.next_action.code, 'REFRESH_REVIEW');
  const result = await cycle({ root, offline: buildSnapshot(), now: () => NOW });
  assert.equal(result.state, 'REFRESH_REVIEW'); assert.equal(result.loop_outcome, 'PROCESSED');
  assert.equal(result.loop_summary.synthetic, true);
  assert.equal(fs.readFileSync(path.join(directory, 'review.json'), 'utf8'), reviewBytes);
}));
test('broken private review stops before loop writes', temporary(async root => {
  fs.mkdirSync(path.join(root, '.local/autonomous-prosperity'));
  fs.writeFileSync(path.join(root, '.local/autonomous-prosperity/review.json'), '{bad');
  await assert.rejects(cycle({ root, offline: buildSnapshot(), now: () => NOW }));
  assert.equal(fs.existsSync(path.join(root, '.local/portfolio-loop/latest.json')), false);
}));
test('existing CLI run and weekly include prosperity without dropping options or exit 3', temporary(async root => {
  const snapshot = buildSnapshot(); snapshot.observed_at = '2020-01-01T00:00:00Z';
  const file = path.join(root, 'old.json'); fs.writeFileSync(file, JSON.stringify(snapshot));
  const result = await main(['weekly', '--root', root, '--offline', file, '--json', '--occupied']);
  assert.equal(result.exitCode, 3); const output = JSON.parse(result.text);
  assert.ok(output.prosperity); assert.equal(output.outcome, 'NEEDS_REFRESH');
}));
test('existing CLI JSON exposes a load-only notification at the aggregate level', temporary(async root => {
  const file = path.join(root, 'snapshot.synthetic.json');
  fs.writeFileSync(file, JSON.stringify(buildSnapshot({ observedAt: new Date(Date.now() - 3600000).toISOString() })));
  const args = ['run', '--root', root, '--offline', file, '--json'];
  await checkIn(root, 'normal');
  await main(args);
  const unchanged = JSON.parse((await main(args)).text);
  assert.equal(unchanged.notify, false); assert.equal(unchanged.prosperity.notify, false);
  const discoveryPath = path.join(root, '.local/server-innovation/discovery/latest.json');
  const discoveryBefore = fs.readFileSync(discoveryPath);
  await checkIn(root, 'reduced');
  const changed = JSON.parse((await main(args)).text);
  for (const stage of ['audit', 'career', 'growth', 'discovery']) assert.equal(changed[stage].notify, false, stage);
  assert.deepEqual(fs.readFileSync(discoveryPath), discoveryBefore);
  assert.equal(changed.intake.taken.length, 0); assert.equal(changed.intake.errors.length, 0);
  assert.equal(changed.prosperity.state, 'REVIEW_LOAD'); assert.equal(changed.prosperity.notify, true);
  assert.equal(changed.notify, true);
}));
test('CLI rejects unknown options and commands', () => {
  const cli = fileURLToPath(new URL('../prosperity.mjs', import.meta.url));
  for (const args of [['status', '--typo'], ['publish'], ['check-in']]) {
    const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' }); assert.equal(r.status, 2);
  }
});
