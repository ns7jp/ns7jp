import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assess } from '../scripts/audit.mjs';
import './cycle.cases.mjs';

const policy = JSON.parse(readFileSync(new URL('../policy.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(readFileSync(new URL('../data/baseline.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(baseline);
const rules = x => assess(x, policy).findings.map(f => f.rule);
function current() {
  const x = copy();
  x.evidence[0].revision = x.repositories[0].head_sha;
  x.evidence[0].revision_verified = true;
  x.claims[0].timeframe = 'current';
  return x;
}

test('identical input gives deterministic results', () => {
  assert.deepEqual(assess(copy(), policy), assess(copy(), policy));
});
test('current profile historical summaries are not treated as stale mistakes', () => {
  const r = rules(copy());
  assert.ok(!r.includes('RESULT_MISMATCH'));
  assert.ok(!r.includes('SCOPE_MISMATCH'));
  assert.ok(!r.includes('CURRENT_NOT_VERIFIED'));
});
test('short and approximate execution revisions need provenance review', () => {
  assert.equal(assess(copy(), policy).findings.filter(f => f.rule === 'LIMITED_PROVENANCE').length, 2);
});
test('NOT_RUN never becomes PASS', () => {
  const x = copy(); x.claims[2].result = 'PASS';
  assert.ok(rules(x).includes('RESULT_MISMATCH'));
});
test('SKIP_ENV never becomes PASS', () => {
  const x = copy(); x.evidence[0].result = 'SKIP_ENV';
  assert.ok(rules(x).includes('RESULT_MISMATCH'));
});
test('CI evidence cannot support a local VM claim', () => {
  const x = current(); x.evidence[0].environment = 'ci-runner';
  assert.ok(rules(x).includes('SCOPE_MISMATCH'));
});
test('foundation cannot establish site.yml coverage', () => {
  const x = current(); x.claims[0].scope = 'site-entire-stack';
  assert.ok(rules(x).includes('SCOPE_MISMATCH'));
});
test('historical success cannot establish current revision', () => {
  const x = copy(); x.claims[0].timeframe = 'current';
  assert.ok(rules(x).includes('CURRENT_NOT_VERIFIED'));
});
test('matching claimed current revision passes only the declared comparison', () => {
  const r = rules(current()); assert.ok(!r.includes('CURRENT_NOT_VERIFIED'));
});
test('snapshot HEAD change invalidates a current claim', () => {
  const x = current(); x.repositories[0].head_sha = 'a'.repeat(40);
  assert.ok(rules(x).includes('CURRENT_NOT_VERIFIED'));
});
test('existing PR 160 and 161 conflict with proposed paths', () => {
  const q = assess(copy(), policy).candidate_queue;
  assert.deepEqual(q.find(c => c.id === 'foundation-composition').related_prs, [160]);
  assert.deepEqual(q.find(c => c.id === 'ubuntu22-package-guard').related_prs, [161]);
});
test('incomplete collection blocks dependent decisions', () => {
  const x = copy(); x.collection_complete = false;
  const r = assess(x, policy);
  assert.ok(r.findings.some(f => f.rule === 'COLLECTION_UNKNOWN'));
  assert.ok(r.candidate_queue.every(c => c.state === 'NEEDS_REFRESH'));
});
test('old snapshot requires refresh and does not claim a live finding', () => {
  const x = copy(); x.evaluation_at = '2026-09-10T01:33:00Z';
  const r = assess(x, policy);
  assert.equal(r.snapshot_status, 'NEEDS_REFRESH');
  assert.ok(r.candidate_queue.every(c => c.state === 'NEEDS_REFRESH'));
});
test('priority zero overrides numeric score', () => {
  const x = copy(); x.candidates[0].priority = 0; x.candidates[0].risk = 5;
  assert.equal(assess(x, policy).candidate_queue[0].id, x.candidates[0].id);
});
test('fingerprint is stable when observation time changes', () => {
  const x = copy(); x.observed_at = x.evaluation_at = '2026-09-08T01:33:00Z';
  assert.deepEqual(assess(x, policy).candidate_queue.map(c => c.fingerprint), assess(copy(), policy).candidate_queue.map(c => c.fingerprint));
});
test('unknown evidence id is invalid input', () => {
  const x = copy(); x.claims[0].evidence_ids = ['missing'];
  assert.throws(() => assess(x, policy), /unknown evidence/);
});
test('empty evidence links produce a finding', () => {
  const x = copy(); x.claims[0].evidence_ids = [];
  assert.ok(rules(x).includes('MISSING_EVIDENCE'));
});
test('duplicate evidence ids are rejected', () => {
  const x = copy(); x.evidence.push(structuredClone(x.evidence[0]));
  assert.throws(() => assess(x, policy), /duplicate id/);
});
test('string booleans and unknown result states are rejected', () => {
  const x = copy(); x.evidence[0].revision_verified = 'true';
  assert.throws(() => assess(x, policy), /boolean/);
  const y = copy(); y.evidence[0].result = 'SUCCESS';
  assert.throws(() => assess(y, policy), /invalid evidence result/);
});
test('future observation and invalid dates are rejected', () => {
  const x = copy(); x.observed_at = '2027-01-01T00:00:00Z';
  assert.throws(() => assess(x, policy), /future/);
  const y = copy(); y.observed_at = '2026-02-30T00:00:00Z';
  assert.throws(() => assess(y, policy), /real calendar/);
});
test('non-GitHub and wrong-repository evidence URLs are rejected', () => {
  const x = copy(); x.evidence[0].record_url = 'https://example.com/anything';
  assert.throws(() => assess(x, policy), /GitHub/);
  const y = copy(); y.evidence[0].record_url = 'https://github.com/ns7jp/other/blob/main/file';
  assert.throws(() => assess(y, policy), /belong/);
});
test('path traversal and invalid numeric bounds are rejected', () => {
  const x = copy(); x.candidates[0].paths = ['../secret'];
  assert.throws(() => assess(x, policy), /relative/);
  const y = copy(); y.candidates[0].effort = 0;
  assert.throws(() => assess(y, policy), /effort/);
});
test('never authorizes external publication', () => {
  const r = assess(current(), policy);
  assert.equal(r.authorization, 'NONE');
  assert.ok(r.candidate_queue.every(c => c.publication_allowed === false));
});
test('unknown score weights are rejected before producing a nonfinite score', () => {
  const x = copy();
  for (const candidate of x.candidates) candidate.values.extra = 1;
  const invalidPolicy = structuredClone(policy);
  invalidPolicy.score_weights.extra = 'not-a-number';
  assert.throws(() => assess(x, invalidPolicy), /unknown score weight/);
});
