import { performance } from 'node:perf_hooks';
import { runProbes, simulateD1Verdict, strictD1Verdict, parseResultLog, D1_SOURCE_PATH } from './probes.mjs';

// A finite, declarative model search. Neither captured source nor generated text is executed.
export const MODEL_VERSION = 'd1-finite-refinement-v1';
const EDITS = Object.freeze(['http_200', 'nonnegative_elapsed', 'restart_increased', 'same_target', 'json_escape']);
const initialPolicy = () => ({ guards: [], json_formatter: 'captured' });
const copy = value => structuredClone(value);
const holds = (guard, input) => {
  switch (guard) {
    case 'http_200': return input.http_status === 200;
    case 'nonnegative_elapsed': return input.recover_seconds >= 0;
    case 'restart_increased': return input.restart_count_after > input.restart_count_before;
    case 'same_target': return input.same_target;
    default: throw new Error('Unknown model guard');
  }
};
function editPolicy(policy, edit) {
  return edit === 'json_escape' ? { ...copy(policy), json_formatter: 'json-stringify' }
    : { ...copy(policy), guards: EDITS.filter(id => id !== 'json_escape' && (policy.guards.includes(id) || id === edit)) };
}
const available = (policy, edit) => edit === 'json_escape' ? policy.json_formatter === 'captured' : !policy.guards.includes(edit);

function casesFrom(probes) {
  return probes.flatMap(probe => probe.cases.map(item => ({ ...copy(item), id: probe.family + '/' + item.id, family: probe.family })));
}

function compare(cases, policy, previous = []) {
  const formerlyMatching = new Set(previous.filter(item => item.result === 'MATCH').map(item => item.id));
  const formerlyMismatching = new Set(previous.filter(item => item.result === 'MISMATCH').map(item => item.id));
  const compared = cases.map(item => {
    let expected, observed, match;
    if (item.family === 'combination') {
      expected = copy(item.expected);
      if (policy.json_formatter === 'captured') observed = copy(item.observed);
      else {
        const log = item.input.human_log + 'RESULT_JSON=' + JSON.stringify(item.input.fields) + '\n';
        observed = { ...parseResultLog(log), log, model: 'proposed-json-stringify-formatter' };
      }
      match = observed.status === expected.status && JSON.stringify(observed.value) === JSON.stringify(expected.value);
    } else {
      expected = { verdict: strictD1Verdict(item.input), model: 'proposed-recovery-evidence-policy' };
      observed = { verdict: simulateD1Verdict(item.input) === 'PASS' && policy.guards.every(guard => holds(guard, item.input)) ? 'PASS' : 'FAIL',
        model: policy.guards.length ? 'proposed-guarded-verdict-predicate' : 'captured-final-verdict-predicate' };
      match = observed.verdict === expected.verdict;
    }
    return { id: item.id, family: item.family, input: copy(item.input), expected, observed, result: match ? 'MATCH' : 'MISMATCH' };
  });
  const mismatchIds = compared.filter(item => item.result === 'MISMATCH').map(item => item.id);
  return { cases: compared, mismatches: mismatchIds.length, mismatch_ids: mismatchIds,
    regressions: mismatchIds.filter(id => formerlyMatching.has(id)),
    resolved_counterexamples: compared.filter(item => item.result === 'MATCH' && formerlyMismatching.has(item.id)).map(item => item.id) };
}

/** Search bounded one-edit policies, then freeze the policy before checking a different synthetic seed. */
export function iterateModel(snapshot, { rounds = 5, seed = 0, budgetMs = 1000, clock = () => performance.now() } = {}) {
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 8) throw new Error('Model rounds must be an integer from 1 to 8');
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Model seed must be a uint32 integer');
  if (!Number.isInteger(budgetMs) || budgetMs < 1 || budgetMs > 5000) throw new Error('Model budgetMs must be an integer from 1 to 5000');
  if (typeof clock !== 'function') throw new Error('Model clock must be a function');
  let lastTime = -Infinity;
  const readClock = () => {
    const value = clock();
    if (!Number.isFinite(value) || value < lastTime) throw new Error('Model clock must return finite monotonic times');
    lastTime = value; return value;
  };
  const started = readClock();
  const elapsed = () => readClock() - started;
  const expired = () => elapsed() >= budgetMs;
  const heldoutSeed = (seed ^ 0x9e3779b9) >>> 0;
  const probes = runProbes(snapshot, { seed });
  const unsupported = probes.probes.some(probe => probe.model_status !== 'SUPPORTED');
  const result = { schema_version: 1, model_version: MODEL_VERSION, execution_scope: 'local-model', data_kind: 'synthetic',
    runtime_status: 'NOT_RUN', authorization: 'NONE', publication_allowed: false,
    model_status: unsupported ? 'MODEL_UNSUPPORTED' : 'SUPPORTED', stop_reason: unsupported ? 'MODEL_UNSUPPORTED' : null,
    settings: { rounds, seed, budget_ms: budgetMs, heldout_seed: heldoutSeed },
    source: { repository: 'ns7jp/server', path: D1_SOURCE_PATH, sha256: probes.probes[0]?.source_sha256 ?? null },
    policy: initialPolicy(), baseline: { cases: [], mismatches: 0, mismatch_ids: [] },
    training: { cases: [], mismatches: 0, mismatch_ids: [] }, rounds: [],
    heldout: { status: 'NOT_RUN', seed: heldoutSeed, cases: [], mismatches: null, regressions: [] }, elapsed_ms: 0,
    limitations: [
      'Finite allowlisted model edits align with a fixed proposed evidence policy; no source file is changed and no general invention is claimed.',
      'All inputs and verdicts are synthetic. Model agreement does not prove reachability, server recovery, causal benefit, or a production defect.',
      'The heldout seed differs and is checked only after the policy is frozen; fixed boundary and normal cases are shared, so this is not independent statistical validation.',
      'Elapsed milliseconds measure this local search only, not server speed or improvement. Budget checks occur between bounded evaluations.',
      'Model results must not enter measured feedback or authorize publication; VM/server/network execution remains NOT_RUN.',
      ...probes.probes.flatMap(probe => probe.limitations),
    ] };
  const finish = () => { result.elapsed_ms = Math.round(elapsed() * 1000) / 1000; return result; };
  if (unsupported) return finish();
  if (expired()) { result.stop_reason = 'TIME_LIMIT'; return finish(); }
  const trainingCases = casesFrom(probes.probes);
  result.baseline = compare(trainingCases, result.policy);
  result.training = copy(result.baseline);
  for (let round = 1; round <= rounds; round++) {
    if (expired()) { result.stop_reason = 'TIME_LIMIT'; break; }
    if (result.training.mismatches === 0) { result.stop_reason = 'CONVERGED'; break; }
    const entry = { round, target_counterexamples: [...result.training.mismatch_ids], attempts: [], selected_edit: null,
      before_mismatches: result.training.mismatches, after_mismatches: result.training.mismatches, complete: false };
    let timedOut = false;
    for (const edit of EDITS.filter(edit => available(result.policy, edit))) {
      if (expired()) { timedOut = true; break; }
      const policy = editPolicy(result.policy, edit);
      const comparison = compare(trainingCases, policy, result.training.cases);
      const eligible = comparison.mismatches < result.training.mismatches && comparison.regressions.length === 0;
      entry.attempts.push({ edit, policy, ...comparison, eligible, selected: false,
        reason: comparison.regressions.length ? 'REGRESSION' : eligible ? 'IMPROVES_WITHOUT_REGRESSION' : 'NO_STRICT_IMPROVEMENT' });
    }
    if (expired()) timedOut = true;
    entry.complete = !timedOut;
    if (timedOut) {
      for (const attempt of entry.attempts.filter(attempt => attempt.eligible)) attempt.reason = 'INCOMPLETE_ROUND';
      result.rounds.push(entry); result.stop_reason = 'TIME_LIMIT'; break;
    }
    // Strict comparison keeps the EDITS order as a deterministic tie break.
    const best = entry.attempts.filter(attempt => attempt.eligible).reduce((winner, attempt) =>
      winner === null || attempt.mismatches < winner.mismatches ? attempt : winner, null);
    if (best) {
      for (const attempt of entry.attempts.filter(attempt => attempt.eligible)) {
        attempt.reason = attempt === best ? 'SELECTED' : attempt.mismatches === best.mismatches ? 'DETERMINISTIC_TIE_BREAK' : 'SMALLER_IMPROVEMENT';
      }
      best.selected = true; entry.selected_edit = best.edit; entry.after_mismatches = best.mismatches;
      result.policy = copy(best.policy);
      result.training = { cases: copy(best.cases), mismatches: best.mismatches, mismatch_ids: [...best.mismatch_ids],
        regressions: [...best.regressions], resolved_counterexamples: [...best.resolved_counterexamples] };
    }
    result.rounds.push(entry);
    if (!best) { result.stop_reason = 'NO_IMPROVEMENT'; break; }
    if (result.training.mismatches === 0) { result.stop_reason = 'CONVERGED'; break; }
  }
  result.stop_reason ??= 'ROUND_LIMIT';
  if (result.stop_reason === 'TIME_LIMIT' || expired()) { result.stop_reason = 'TIME_LIMIT'; return finish(); }
  // Do not use any heldout result to select, reject, or refine the frozen policy.
  const heldoutCases = casesFrom(runProbes(snapshot, { seed: heldoutSeed }).probes);
  const heldoutBaseline = compare(heldoutCases, initialPolicy());
  if (expired()) { result.stop_reason = 'TIME_LIMIT'; return finish(); }
  const heldout = compare(heldoutCases, result.policy, heldoutBaseline.cases);
  result.heldout = { status: 'COMPLETE', seed: heldoutSeed, ...heldout, baseline_mismatches: heldoutBaseline.mismatches };
  return finish();
}
