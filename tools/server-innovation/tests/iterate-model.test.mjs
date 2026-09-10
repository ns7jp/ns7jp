import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { iterateModel, MODEL_VERSION } from '../iterate-model.mjs';
import { D1_SOURCE_PATH, D1_MODEL_SOURCE_SHA256, runProbes } from '../probes.mjs';
import { sourceText } from '../fixtures/d1-model-source.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const snapshot = (text = sourceText) => ({ repositories: [{ full_name: 'ns7jp/server', files: { [D1_SOURCE_PATH]: { text, sha256: digest(text) } } }] });
const run = options => iterateModel(snapshot(), { clock: () => 0, ...options });
const initialPolicy = { guards: [], json_formatter: 'captured' };

test('fixture bytes correspond to the reviewed inert source model', () => {
  assert.equal(digest(sourceText.replace(/\r\n/g, '\n')), D1_MODEL_SOURCE_SHA256);
});

test('default search retains all counterexamples and converges in five local one-edit rounds', () => {
  const result = run();
  assert.equal(result.model_version, MODEL_VERSION);
  assert.equal(result.model_status, 'SUPPORTED');
  assert.equal(result.stop_reason, 'CONVERGED');
  assert.equal(result.baseline.cases.length, 22);
  assert.equal(result.baseline.mismatches, 10);
  assert.equal(result.training.cases.length, 22);
  assert.equal(result.training.mismatches, 0);
  assert.equal(result.rounds.length, 5);
  assert.deepEqual(result.rounds.map(round => round.selected_edit), ['restart_increased', 'json_escape', 'http_200', 'nonnegative_elapsed', 'same_target']);
  assert.deepEqual(result.policy, { guards: ['http_200', 'nonnegative_elapsed', 'restart_increased', 'same_target'], json_formatter: 'json-stringify' });
  assert.equal(result.source.sha256, digest(sourceText));
});

test('every chosen edit strictly improves and retains previous normal and regression controls', () => {
  const result = run();
  let previous = result.baseline;
  let policy = initialPolicy;
  for (const round of result.rounds) {
    assert.equal(round.complete, true);
    assert.deepEqual(round.target_counterexamples, previous.mismatch_ids);
    const winner = round.attempts.find(attempt => attempt.selected);
    assert.ok(winner);
    assert.ok(winner.mismatches < previous.mismatches);
    assert.deepEqual(winner.regressions, []);
    assert.equal(winner.cases.length, previous.cases.length);
    for (const item of previous.cases.filter(item => item.result === 'MATCH')) {
      assert.equal(winner.cases.find(next => next.id === item.id).result, 'MATCH');
    }
    const changes = winner.policy.guards.length - policy.guards.length + Number(winner.policy.json_formatter !== policy.json_formatter);
    assert.equal(changes, 1);
    assert.ok(round.attempts.every(attempt => attempt.cases.length === 22));
    assert.equal(round.after_mismatches, winner.mismatches);
    previous = winner; policy = winner.policy;
  }
});

test('unselected alternatives and selection reasons remain in the trace', () => {
  const result = run();
  assert.deepEqual(result.rounds.map(round => round.attempts.length), [5, 4, 3, 2, 1]);
  const first = result.rounds[0];
  assert.equal(first.attempts.filter(attempt => attempt.selected).length, 1);
  assert.equal(first.attempts.find(attempt => attempt.edit === 'json_escape').mismatches, 7);
  assert.equal(first.attempts.find(attempt => attempt.edit === 'restart_increased').mismatches, 7);
  assert.equal(first.attempts.find(attempt => attempt.edit === 'json_escape').reason, 'DETERMINISTIC_TIE_BREAK');
  assert.equal(first.attempts.find(attempt => attempt.edit === 'http_200').reason, 'SMALLER_IMPROVEMENT');
  assert.ok(result.baseline.cases.filter(item => item.result === 'MISMATCH').every(item => result.training.cases.some(next => next.id === item.id)));
});

test('bounded rounds stop with a concrete unresolved counterexample and a frozen heldout comparison', () => {
  const result = run({ rounds: 1 });
  assert.equal(result.stop_reason, 'ROUND_LIMIT');
  assert.equal(result.rounds.length, 1);
  assert.equal(result.training.mismatches, 7);
  assert.equal(result.heldout.status, 'COMPLETE');
  assert.equal(result.heldout.mismatches, 7);
  assert.deepEqual(result.policy, { guards: ['restart_increased'], json_formatter: 'captured' });
});

test('heldout uses a distinct seed after search without leaking heldout data into its decisions', () => {
  const result = run({ seed: 7 });
  assert.notEqual(result.heldout.seed, result.settings.seed);
  assert.equal(result.heldout.status, 'COMPLETE');
  assert.equal(result.heldout.cases.length, 22);
  assert.equal(result.heldout.mismatches, 0);
  assert.deepEqual(result.heldout.regressions, []);
  const generated = runProbes(snapshot(), { seed: result.heldout.seed });
  assert.deepEqual(result.heldout.cases.map(item => item.input), generated.probes.flatMap(probe => probe.cases.map(item => item.input)));
  assert.notDeepEqual(result.heldout.cases.map(item => item.input), result.training.cases.map(item => item.input));
  assert.deepEqual(result.policy, run({ seed: result.heldout.seed }).policy);
  assert.ok(result.limitations.some(text => text.includes('not independent statistical')));
});

test('one seed and bounded configuration produce a deterministic full search trace', () => {
  assert.deepEqual(run({ seed: 0xffffffff, rounds: 8 }), run({ seed: 0xffffffff, rounds: 8 }));
  assert.notDeepEqual(run({ seed: 7 }).training.cases, run({ seed: 8 }).training.cases);
});

test('invalid and unbounded options fail before source comparison', () => {
  for (const rounds of [0, 9, 1.5, '5', NaN]) assert.throws(() => run({ rounds }), /rounds/);
  for (const seed of [-1, 0x100000000, 1.2, '1', NaN]) assert.throws(() => run({ seed }), /uint32/);
  for (const budgetMs of [0, 5001, 1.2, '1', Infinity]) assert.throws(() => run({ budgetMs }), /budgetMs/);
  assert.throws(() => run({ clock: 5 }), /clock/);
  assert.throws(() => run({ clock: () => NaN }), /monotonic/);
  let tick = 1;
  assert.throws(() => run({ clock: () => tick-- }), /monotonic/);
});

test('unsupported or integrity-mismatched source never gets a simulated baseline or heldout', () => {
  const altered = snapshot(sourceText.replace('RTO_TARGET=300', 'RTO_TARGET=500'));
  const tampered = snapshot(); tampered.repositories[0].files[D1_SOURCE_PATH].sha256 = '0'.repeat(64);
  for (const input of [altered, tampered, { repositories: [] }]) {
    const result = iterateModel(input, { clock: () => 0 });
    assert.equal(result.stop_reason, 'MODEL_UNSUPPORTED');
    assert.equal(result.model_status, 'MODEL_UNSUPPORTED');
    assert.deepEqual(result.rounds, []);
    assert.deepEqual(result.baseline.cases, []);
    assert.deepEqual(result.training.cases, []);
    assert.equal(result.heldout.status, 'NOT_RUN');
    assert.deepEqual(result.policy, initialPolicy);
  }
});

test('time exhausted before search leaves cases and measurements unrun', () => {
  let tick = 0;
  const result = run({ budgetMs: 1, clock: () => tick++ });
  assert.equal(result.stop_reason, 'TIME_LIMIT');
  assert.deepEqual(result.rounds, []);
  assert.deepEqual(result.baseline.cases, []);
  assert.equal(result.heldout.status, 'NOT_RUN');
  assert.equal(result.heldout.mismatches, null);
});

test('partial round preserves attempted alternatives without adopting an incomplete comparison', () => {
  let tick = 0;
  const result = run({ budgetMs: 5, clock: () => tick++ });
  assert.equal(result.stop_reason, 'TIME_LIMIT');
  assert.equal(result.rounds.length, 1);
  assert.equal(result.rounds[0].complete, false);
  assert.equal(result.rounds[0].attempts.length, 2);
  assert.equal(result.rounds[0].selected_edit, null);
  assert.ok(result.rounds[0].attempts.every(attempt => attempt.reason === 'INCOMPLETE_ROUND'));
  assert.equal(result.training.mismatches, 10);
  assert.deepEqual(result.policy, initialPolicy);
  assert.equal(result.heldout.status, 'NOT_RUN');
});

test('synthetic source and shell-like field contents stay inert and caller input stays unchanged', () => {
  const input = snapshot(), before = structuredClone(input);
  const result = iterateModel(input, { clock: () => 0 });
  assert.deepEqual(input, before);
  const shellCase = result.training.cases.find(item => item.id === 'combination/result-json-shell-text');
  assert.equal(shellCase.observed.value.service, shellCase.input.fields.service);
  assert.equal(shellCase.result, 'MATCH');
  globalThis.__iterateMustNotExecute = false;
  const unsupported = iterateModel(snapshot(sourceText + '\nglobalThis.__iterateMustNotExecute = true;'), { clock: () => 0 });
  assert.equal(unsupported.stop_reason, 'MODEL_UNSUPPORTED');
  assert.equal(globalThis.__iterateMustNotExecute, false);
  delete globalThis.__iterateMustNotExecute;
});

test('local success retains synthetic provenance and cannot claim runtime or publication permission', () => {
  const result = run();
  assert.equal(result.execution_scope, 'local-model');
  assert.equal(result.data_kind, 'synthetic');
  assert.equal(result.runtime_status, 'NOT_RUN');
  assert.equal(result.authorization, 'NONE');
  assert.equal(result.publication_allowed, false);
  assert.ok(Number.isFinite(result.elapsed_ms) && result.elapsed_ms >= 0);
  assert.ok(result.limitations.some(text => text.includes('not server speed')));
  assert.ok(result.limitations.some(text => text.includes('must not enter measured feedback')));
});
