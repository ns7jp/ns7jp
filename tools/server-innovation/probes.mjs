import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

// Read-only models of reviewed source. No source text is imported, evaluated, or executed.
// A changed source must be reviewed before adding its normalized hash here.
export const D1_SOURCE_PATH = 'scripts/drills/d1-process-down.sh';
export const D1_MODEL_SOURCE_SHA256 = 'dbc268cae2f4a7ce774384dab0a21a01092800fd137acac8cdf2ce9455eef902';
export const PROBE_FAMILIES = Object.freeze(['boundary', 'counterexample', 'combination']);
const repository = 'ns7jp/server';
const hash = text => createHash('sha256').update(text).digest('hex');
const normalizedHash = text => hash(text.replace(/\r\n/g, '\n'));
const MAX_SOURCE_BYTES = 1024 * 1024;

function sourceModel(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.repositories)) throw new Error('Probe snapshot.repositories must be an array');
  const matches = snapshot.repositories.filter(repo => repo?.full_name === repository);
  const source = matches.length === 1 ? matches[0].files?.[D1_SOURCE_PATH] : null;
  if (!source || typeof source.text !== 'string') return { sha256: null, reason: 'Captured D-1 source is absent or repository is ambiguous.' };
  const sha256 = hash(source.text);
  if (Buffer.byteLength(source.text, 'utf8') > MAX_SOURCE_BYTES) return { sha256, reason: 'Captured source exceeds the bounded model input size.' };
  if (source.sha256 !== sha256) return { sha256, reason: 'Captured source SHA-256 does not match its text.' };
  if (normalizedHash(source.text) !== D1_MODEL_SOURCE_SHA256) return { sha256, reason: 'Source differs from the reviewed D-1 model; review and update the model before comparing it.' };
  return { sha256, reason: null };
}

function validateInput(input) {
  if (!input || !Number.isInteger(input.curl_exit_code) || input.curl_exit_code < 0 || input.curl_exit_code > 255 ||
      !Number.isInteger(input.recover_seconds) || !Number.isInteger(input.http_status) ||
      !Number.isInteger(input.restart_count_before) || !Number.isInteger(input.restart_count_after) ||
      typeof input.same_target !== 'boolean') throw new Error('Invalid synthetic D-1 model input');
}

/** Model only the captured final predicate, given synthetic values of its inputs. */
export function simulateD1Verdict(input) {
  validateInput(input);
  // The source sets SUCCESS from curl's exit code, then checks SUCCESS and <= 300.
  return input.curl_exit_code === 0 && input.recover_seconds <= 300 ? 'PASS' : 'FAIL';
}

/** Proposed evidence policy; a mismatch is a question, not a confirmed runtime defect. */
export function strictD1Verdict(input) {
  validateInput(input);
  return input.curl_exit_code === 0 && input.http_status === 200 && input.recover_seconds >= 0 &&
    input.recover_seconds <= 300 && input.restart_count_after > input.restart_count_before && input.same_target ? 'PASS' : 'FAIL';
}

function trial(id, input) {
  const expected = { verdict: strictD1Verdict(input), model: 'proposed-recovery-evidence-policy' };
  const observed = { verdict: simulateD1Verdict(input), model: 'captured-final-verdict-predicate' };
  return { id, input, expected, observed, result: expected.verdict === observed.verdict ? 'MATCH' : 'MISMATCH' };
}

function baseline(overrides = {}) {
  return { curl_exit_code: 0, http_status: 200, recover_seconds: 10, restart_count_before: 2, restart_count_after: 3, same_target: true, ...overrides };
}

// Tiny deterministic generator is used only to choose additional synthetic boundary values.
function random(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; };
}

function boundaryCases(seed) {
  const next = random(seed);
  return [
    trial('http-200', baseline()),
    trial('http-204-exit-zero', baseline({ http_status: 204 })),
    trial('http-301-exit-zero', baseline({ http_status: 301 })),
    trial('http-503-exit-22', baseline({ http_status: 503, curl_exit_code: 22 })),
    trial('transport-error', baseline({ http_status: 0, curl_exit_code: 7 })),
    ...[299, 300, 301].map(seconds => trial(`rto-${seconds}`, baseline({ recover_seconds: seconds }))),
    trial('negative-clock-delta', baseline({ recover_seconds: -1 })),
    trial('seeded-within-rto', baseline({ recover_seconds: 1 + next() % 298 })),
    trial('seeded-over-rto', baseline({ recover_seconds: 302 + next() % 298 })),
  ];
}

function counterexampleCases(seed) {
  const count = 1 + random(seed)() % 100;
  return [
    trial('restart-increased', baseline({ restart_count_before: count, restart_count_after: count + 1 })),
    trial('restart-unchanged', baseline({ restart_count_before: count, restart_count_after: count })),
    trial('restart-decreased', baseline({ restart_count_before: count, restart_count_after: count - 1 })),
    trial('different-health-target', baseline({ same_target: false })),
    trial('healthy-wrong-target-with-no-restart', baseline({ same_target: false, restart_count_before: count, restart_count_after: count })),
  ];
}

function resultFields(service, verdict = 'PASS') {
  return { service, verdict, recover_seconds: 10, rto_target_seconds: 300, restart_count_before: '2', restart_count_after: '3',
    kill_at: '2026-01-01T00:00:00Z', recover_at: '2026-01-01T00:00:10Z' };
}

function capturedResultLine(fields) {
  // Reviewed printf %s format reproduced as a string operation; never call printf or a shell.
  return `RESULT_JSON={"service":"${fields.service}","verdict":"${fields.verdict}","recover_seconds":${fields.recover_seconds},"rto_target_seconds":${fields.rto_target_seconds},"restart_count_before":"${fields.restart_count_before}","restart_count_after":"${fields.restart_count_after}","kill_at":"${fields.kill_at}","recover_at":"${fields.recover_at}"}`;
}

/** Parse a bounded synthetic log without running or importing any embedded text. */
export function parseResultLog(log) {
  if (typeof log !== 'string' || Buffer.byteLength(log, 'utf8') > 16384) return { status: 'INVALID', reason: 'Invalid or oversized log.' };
  const lines = log.trimEnd().split(/\r?\n/);
  const tagged = lines.filter(line => line.startsWith('RESULT_JSON='));
  if (tagged.length !== 1 || lines.at(-1) !== tagged[0]) return { status: 'INVALID', reason: 'Exactly one final RESULT_JSON line is required.' };
  let value;
  try { value = JSON.parse(tagged[0].slice('RESULT_JSON='.length)); } catch { return { status: 'INVALID', reason: 'RESULT_JSON is not valid JSON.' }; }
  const keys = ['service', 'verdict', 'recover_seconds', 'rto_target_seconds', 'restart_count_before', 'restart_count_after', 'kill_at', 'recover_at'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== keys.sort().join() ||
      typeof value.service !== 'string' || !['PASS', 'FAIL'].includes(value.verdict) ||
      !Number.isInteger(value.recover_seconds) || !Number.isInteger(value.rto_target_seconds) || value.rto_target_seconds <= 0 ||
      typeof value.restart_count_before !== 'string' || typeof value.restart_count_after !== 'string' ||
      typeof value.kill_at !== 'string' || typeof value.recover_at !== 'string') return { status: 'INVALID', reason: 'RESULT_JSON does not match the captured output field types.' };
  return { status: 'PARSED', value };
}

function serializationCases() {
  return [['ordinary', 'app'], ['quote', 'app"quoted'], ['backslash', 'app\\path'], ['newline', 'app\nsecond-line'],
    ['shell-text', '$(touch PROBE_MUST_NOT_EXIST); `whoami`'], ['unicode', '演習app']].map(([id, service]) => {
    const fields = resultFields(service), humanLog = 'preflight verdict: PASS\n';
    const input = { data_kind: 'synthetic', fields, human_log: humanLog };
    const expected = { status: 'PARSED', value: fields, model: 'json-escaped-reference-formatter' };
    const log = humanLog + capturedResultLine(fields) + '\n';
    const observed = { ...parseResultLog(log), log, model: 'captured-printf-output-format' };
    const match = observed.status === expected.status && JSON.stringify(observed.value) === JSON.stringify(expected.value);
    return { id: `result-json-${id}`, input, expected, observed, result: match ? 'MATCH' : 'MISMATCH' };
  });
}

const definitions = [
  { id: 'd1-health-and-rto-boundaries', family: 'boundary', make: boundaryCases,
    question: 'D-1 の復旧判定で HTTP 200、非負の経過時間、RTO 境界を明示すると誤判定を減らせるか。',
    limitations: [
      'Synthetic curl exit codes and status pairs are inputs, not measured curl behavior; no HTTP request is made.',
      'Only the captured final verdict predicate is modeled. The polling loop, timeout, clock, and shell are not executed.',
      'Negative time models a clock-change question; actual reachability and frequency remain NOT_RUN.',
    ] },
  { id: 'd1-restart-and-target-counterexamples', family: 'counterexample', make: counterexampleCases,
    question: 'D-1 の復旧証拠に restart count の増加と対象の一致を組み合わせると、正常応答だけでは残る曖昧さを減らせるか。',
    limitations: [
      'Restart count and target identity are synthetic observations; no Docker inspection or process signal is performed.',
      'The stricter policy is a proposed acceptance criterion. A model mismatch does not establish a production defect.',
      'The model does not prove that these post-kill observations can occur in the target environment.',
    ] },
  { id: 'd1-result-json-observation-combinations', family: 'combination', make: serializationCases,
    question: '人向けログと機械向け結果を併記する CLI で、特殊文字を含む入力の JSON エスケープと最終行の読取り境界を検証できるか。',
    limitations: [
      'A string model of the captured printf format is compared with JSON escaping; the CLI is not executed.',
      'Service names containing special characters may be rejected earlier by Docker Compose; reachability is unverified.',
      'Parsing a synthetic PASS reports a parsed field only and never changes runtime_status from NOT_RUN.',
    ] },
];

export function runProbes(snapshot, { families = PROBE_FAMILIES, seed = 0 } = {}) {
  if (!Array.isArray(families) || families.some(family => !PROBE_FAMILIES.includes(family)) || new Set(families).size !== families.length) throw new Error('Unknown or duplicate probe family');
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Probe seed must be a uint32 integer');
  const model = sourceModel(snapshot);
  const probes = definitions.filter(def => families.includes(def.family)).map(def => {
    const started = performance.now();
    const cases = model.reason ? [] : def.make(seed);
    return { id: def.id, family: def.family, repository, source_path: D1_SOURCE_PATH, source_sha256: model.sha256,
      model_status: model.reason ? 'MODEL_UNSUPPORTED' : 'SUPPORTED', cases,
      finding: cases.some(item => item.result === 'MISMATCH'), question: def.question,
      limitations: [...def.limitations, ...(model.reason ? [model.reason] : []), 'This local model generates research questions; VM/server/network execution remains NOT_RUN.'],
      elapsed_ms: Math.round((performance.now() - started) * 1000) / 1000 };
  });
  return { schema_version: 1, execution_scope: 'local-model', runtime_status: 'NOT_RUN', probes };
}
