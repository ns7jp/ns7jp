import { readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { overlap } from './cycle.mjs';

const statuses = new Set(['PASS', 'FAIL', 'NOT_RUN', 'BLOCKED', 'SKIP_ENV']);
const environments = new Set(['ci-runner', 'container', 'local-vm', 'persistent-host', 'network-namespace']);
const sha = /^[0-9a-f]{40}$/;
const maxBytes = 1024 * 1024;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}
function str(value, label) {
  ensure(typeof value === 'string' && value.trim().length > 0 && value.length <= 4096 && !/[\r\n]/.test(value), label + ' must be a nonempty single-line string');
}
function obj(value, label) {
  ensure(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
}
function date(value, label) {
  str(value, label);
  ensure(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value)), label + ' must be a UTC timestamp');
  ensure(new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z'), label + ' must be a real calendar timestamp');
}
function paths(value, label) {
  ensure(Array.isArray(value) && value.length > 0, label + ' must have paths');
  for (const p of value) {
    str(p, label);
    ensure(!p.startsWith('/') && !p.includes('\\') && !p.includes(':') && !p.split('/').some(x => x === '..' || x === '' || x === '.'), label + ' must use relative repository paths');
  }
}
function unique(items, label) {
  ensure(Array.isArray(items) && items.length <= 2000, label + ' must be a bounded array');
  const seen = new Set();
  for (const item of items) {
    obj(item, label); str(item.id, label + '.id');
    ensure(!seen.has(item.id), label + ' duplicate id: ' + item.id);
    seen.add(item.id);
  }
}

export function validate(input, policy) {
  obj(input, 'input'); obj(policy, 'policy');
  ensure(input.schema_version === 1 && policy.schema_version === 1, 'schema_version must be 1');
  ensure(input.data_kind === 'curated_public_records' || input.data_kind === 'synthetic_test', 'unsupported data_kind');
  date(input.observed_at, 'observed_at'); date(input.evaluation_at, 'evaluation_at');
  ensure(Date.parse(input.observed_at) <= Date.parse(input.evaluation_at), 'observed_at is in the future');
  ensure(typeof input.collection_complete === 'boolean', 'collection_complete must be boolean');
  ensure(Number.isFinite(policy.snapshot_max_age_hours) && policy.snapshot_max_age_hours > 0, 'snapshot_max_age_hours must be positive');
  obj(policy.score_weights, 'score_weights');
  const weightKeys = ['job_fit', 'evidence_gain', 'reproducibility', 'readability'];
  ensure(Object.keys(policy.score_weights).every(k => weightKeys.includes(k)), 'unknown score weight');
  for (const k of weightKeys) {
    ensure(Number.isFinite(policy.score_weights[k]) && policy.score_weights[k] >= 0, 'invalid score weight: ' + k);
  }
  unique(input.repositories, 'repositories');
  ensure(input.repositories.length > 0, 'repositories cannot be empty');
  const repos = new Map();
  for (const r of input.repositories) {
    str(r.full_name, 'repository.full_name');
    ensure(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r.full_name), 'invalid repository full_name');
    ensure(!repos.has(r.full_name), 'duplicate repository name');
    ensure(sha.test(r.head_sha), 'repository head_sha must be full SHA');
    repos.set(r.full_name, r);
  }
  unique(input.evidence, 'evidence');
  const ids = new Set(input.evidence.map(e => e.id));
  for (const e of input.evidence) {
    ensure(repos.has(e.repository), 'unknown evidence repository');
    str(e.scope, 'evidence.scope');
    ensure(environments.has(e.environment), 'invalid evidence environment');
    ensure(statuses.has(e.result), 'invalid evidence result');
    ensure(typeof e.revision_verified === 'boolean', 'revision_verified must be boolean');
    ensure(e.revision === null || (typeof e.revision === 'string' && sha.test(e.revision)), 'revision must be null or full SHA');
    ensure(!e.revision_verified || sha.test(e.revision ?? ''), 'verified revision requires full SHA');
    str(e.record_url, 'evidence.record_url');
    const u = new URL(e.record_url);
    ensure(u.protocol === 'https:' && u.hostname === 'github.com' && !u.username && !u.password, 'record_url must be a public GitHub HTTPS reference');
    ensure(u.pathname.startsWith('/' + e.repository + '/blob/'), 'record_url must belong to evidence repository');
  }
  unique(input.claims, 'claims');
  for (const c of input.claims) {
    ensure(repos.has(c.repository), 'unknown claim repository'); str(c.scope, 'claim.scope');
    ensure(environments.has(c.environment), 'invalid claim environment');
    ensure(statuses.has(c.result), 'invalid claim result');
    ensure(['historical', 'current'].includes(c.timeframe), 'invalid claim timeframe');
    ensure(Array.isArray(c.evidence_ids) && c.evidence_ids.length <= 100, 'evidence_ids must be an array');
    for (const id of c.evidence_ids) { str(id, 'evidence_id'); ensure(ids.has(id), 'unknown evidence id: ' + id); }
  }
  unique(input.candidates, 'candidates');
  for (const c of input.candidates) {
    ensure(repos.has(c.repository), 'unknown candidate repository');
    str(c.rule_id, 'candidate.rule_id'); str(c.scope, 'candidate.scope'); str(c.title, 'candidate.title');
    paths(c.paths, 'candidate.paths');
    ensure(Number.isInteger(c.priority) && c.priority >= 0 && c.priority <= 3, 'priority must be 0..3');
    ensure(typeof c.requires_owner === 'boolean', 'requires_owner must be boolean');
    obj(c.values, 'candidate.values');
    for (const k of Object.keys(policy.score_weights)) {
      ensure(Number.isFinite(c.values[k]) && c.values[k] >= 0 && c.values[k] <= 5, 'candidate value must be 0..5');
    }
    ensure(Number.isFinite(c.effort) && c.effort >= 1 && c.effort <= 5, 'effort must be 1..5');
    ensure(Number.isFinite(c.risk) && c.risk >= 0 && c.risk <= 5, 'risk must be 0..5');
  }
  unique(input.open_prs, 'open_prs');
  for (const pr of input.open_prs) {
    ensure(repos.has(pr.repository), 'unknown PR repository');
    ensure(Number.isSafeInteger(pr.number) && pr.number > 0, 'invalid PR number');
    paths(pr.paths, 'PR.paths');
  }
}

export function assess(input, policy) {
  validate(input, policy);
  const findings = [];
  const add = (rule, subject, priority, message) => {
    findings.push({ id: rule + ':' + subject, rule, subject, priority, message });
  };
  const evidence = new Map(input.evidence.map(e => [e.id, e]));
  const repos = new Map(input.repositories.map(r => [r.full_name, r]));
  const ageHours = (Date.parse(input.evaluation_at) - Date.parse(input.observed_at)) / 3600000;
  const available = input.collection_complete && ageHours <= policy.snapshot_max_age_hours;
  if (!input.collection_complete) add('COLLECTION_UNKNOWN', 'snapshot', 1, 'Input collection is incomplete; dependent decisions must wait.');
  if (ageHours > policy.snapshot_max_age_hours) add('SNAPSHOT_OLD', 'snapshot', 1, 'Refresh before preparing changes.');
  for (const e of input.evidence) {
    if (e.result === 'PASS' && !e.revision_verified) {
      add('LIMITED_PROVENANCE', e.id, 2, 'Keep the historical record; resolve the exact execution revision before an automated current claim.');
    }
  }
  for (const c of input.claims) {
    if (!available) continue;
    const matched = c.evidence_ids.map(id => evidence.get(id)).filter(e =>
      e.repository === c.repository && e.scope === c.scope && e.environment === c.environment);
    if (c.evidence_ids.length === 0) {
      add('MISSING_EVIDENCE', c.id, 1, 'No evidence is linked.');
    } else if (matched.length === 0) {
      add('SCOPE_MISMATCH', c.id, 1, 'Linked evidence has a different repository, scope, or environment.');
    } else if (!matched.some(e => e.result === c.result)) {
      add('RESULT_MISMATCH', c.id, 1, 'The claim is not supported by the linked result.');
    } else if (c.result !== 'PASS') {
      add('NOT_VALIDATED', c.id, 2, 'The recorded result remains ' + c.result + '. This is a gap, not an incorrect claim.');
    } else if (c.timeframe === 'current' && !matched.some(e =>
      e.result === 'PASS' && e.revision_verified && e.revision === repos.get(c.repository).head_sha)) {
      add('CURRENT_NOT_VERIFIED', c.id, 1, 'Historical PASS does not establish PASS for the current revision.');
    }
  }
  const candidates = input.candidates.map(c => {
    const conflicts = input.open_prs.filter(pr => pr.repository === c.repository && pr.paths.some(p => c.paths.some(path => overlap(path, p))))
      .map(pr => pr.number).sort((a, b) => a - b);
    const value = Object.entries(policy.score_weights).reduce((sum, [k, w]) => sum + w * c.values[k], 0);
    const fingerprint = createHash('sha256').update(JSON.stringify([
      repos.get(c.repository).id, c.rule_id, c.scope, [...new Set(c.paths)].sort()
    ])).digest('hex').slice(0, 24);
    return {
      id: c.id, fingerprint, title: c.title, priority: c.priority,
      score: Math.round(value / (c.effort + 2 * c.risk) * 100) / 100,
      state: !available ? 'NEEDS_REFRESH' : conflicts.length ? 'EXISTING_PR_REVIEW' : c.requires_owner ? 'AWAITING_OWNER' : 'NO_OBSERVED_CONFLICT',
      related_prs: conflicts, publication_allowed: false
    };
  }).sort((a, b) => a.priority - b.priority || b.score - a.score || a.id.localeCompare(b.id, 'en'));
  findings.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'en'));
  return {
    schema_version: 1, input_kind: input.data_kind,
    observed_at: input.observed_at, evaluation_at: input.evaluation_at,
    snapshot_status: available ? 'AVAILABLE_AS_SUPPLIED' : 'NEEDS_REFRESH',
    authorization: 'NONE', findings, candidate_queue: candidates,
    limitations: ['No live fetching or evidence authentication.', 'No writing, publication, or lab execution.', 'Candidate values are proposed priorities, not measurements.']
  };
}

function loadJson(path) {
  ensure(statSync(path).isFile(), 'input must be a regular file');
  ensure(statSync(path).size <= maxBytes, 'input exceeds 1 MiB');
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0 || args[0] === '--help') {
      process.stdout.write('Usage: node scripts/audit.mjs INPUT.json POLICY.json\nExit 0 means assessment completed, never permission to publish.\n');
    } else {
      ensure(args.length === 2, 'Provide INPUT.json and POLICY.json');
      process.stdout.write(JSON.stringify(assess(loadJson(args[0]), loadJson(args[1])), null, 2) + '\n');
    }
  } catch (error) {
    process.stderr.write('Invalid input: ' + error.message + '\n');
    process.exitCode = 2;
  }
}
