import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { catalog, validateCatalog, plan, draftProtocol, register, protocolDigest, evaluate, savePlan } from '../innovation.mjs';
import { digest, blobHash } from '../../portfolio-audit/scripts/github.mjs';

const now = '2026-09-09T00:30:00Z';
const config = JSON.parse(readFileSync(new URL('../../portfolio-audit/live.config.json', import.meta.url)));
const cli = fileURLToPath(new URL('../innovation.mjs', import.meta.url));
// All fixtures are synthetic and created in OS temporary folders, never real VM evidence.
function snapshot(collectionConfig = config, observedAt = now) {
  const repositories = collectionConfig.repositories.map(spec => ({ ...spec, head_sha: 'a'.repeat(40),
    tree_paths: spec.files, open_prs: [], ci_runs: [{ head_sha: 'a'.repeat(40), status: 'completed', conclusion: 'success' }],
    files: Object.fromEntries(spec.files.map(path => {
      const text = path === 'docs/evidence/README.md' ? [...new Set(catalog.experiments.map(x => x.marker))].join('\n') : '# Fixture';
      return [path, { text, sha256: digest(text), blob_sha: blobHash(Buffer.from(text)), url: `https://github.com/${spec.full_name}/blob/${'a'.repeat(40)}/${path}` }];
    })) }));
  return { schema_version: 2, observed_at: observedAt, completed_at: observedAt, kind: 'github-api-read-only', collection_complete: true, repositories, errors: [] };
}
function dynamicFixture(observedAt = now) {
  const collectionConfig = structuredClone(config), sourcePath = 'docs/discovery-source.md';
  collectionConfig.repositories[0].files.push(sourcePath);
  const collected = snapshot(collectionConfig, observedAt), source = collected.repositories[0].files[sourcePath];
  const candidate = { ...structuredClone(catalog.experiments[0]), id: 'INV-a0123456789bcdef', source_path: sourcePath,
    marker: '# Fixture', source_sha256: source.sha256, paths: [sourcePath] };
  return { collected, candidate, collectionConfig, experiments: { schema_version: 1, experiments: [candidate] } };
}
function setup(candidate = catalog.experiments[0]) {
  const root = mkdtempSync(join(tmpdir(), 'innovation-test-'));
  const context = '{"fixture":true,"os":"synthetic","load":"fixed"}\n';
  writeFileSync(join(root, 'context.json'), context);
  const p = draftProtocol({ ...candidate, base_sha: 'a'.repeat(40) }, '2026-09-09T00:00:00Z');
  Object.assign(p, { candidate_sha: 'b'.repeat(40), environment_id: 'fixture-only', context_sha256: digest(context), scope: 'synthetic result comparison' });
  const protocol = register(p, '2026-09-09T00:01:00Z');
  const runs = [];
  for (let i = 1; i <= 3; i++) for (const variant of ['baseline', 'candidate']) {
    const value = variant === 'baseline' ? 100 : 70;
    const data = JSON.stringify({ fixture: true, i, variant, value });
    const path = `${i}-${variant}.json`; writeFileSync(join(root, path), data);
    const minute = i * 2 + (variant === 'candidate' ? 1 : 0);
    runs.push({ pair: i, variant, revision: protocol[variant + '_sha'], environment_id: protocol.environment_id,
      context_sha256: protocol.context_sha256, started_at: `2026-09-09T00:0${minute}:00Z`, finished_at: `2026-09-09T00:0${minute}:30Z`,
      status: 'PASS', value, guardrails: { functional_acceptance: 1, data_integrity: 1, unexpected_exposure: 0 }, artifact: { path, sha256: digest(data) } });
  }
  return { root, protocol, results: { schema_version: 1, protocol_sha256: protocolDigest(protocol), data_kind: 'measured', runs } };
}
const judge = x => evaluate(x.protocol, x.results, x.root, now);
const reroll = x => { x.results.protocol_sha256 = protocolDigest(x.protocol); };

test('catalog has eight valid, bounded hypotheses', () => { validateCatalog(catalog); assert.equal(catalog.experiments.length, 8); });
test('NaN ranking and duplicate catalog IDs are rejected', () => {
  const x = structuredClone(catalog); x.experiments[0].value = NaN; assert.throws(() => validateCatalog(x), /ranking/);
  x.experiments[0] = structuredClone(x.experiments[1]); assert.throws(() => validateCatalog(x), /Duplicate/);
});
test('generated hypotheses use an explicitly extended collection and the existing experiment evaluation', () => {
  const x = dynamicFixture();
  assert.throws(() => validateCatalog(x.experiments), /Uncollected/);
  validateCatalog(x.experiments, x.collectionConfig);
  const p = plan(x.collected, { now, experiments: x.experiments, collectionConfig: x.collectionConfig });
  assert.equal(p.selected, x.candidate.id); assert.equal(p.queue[0].source_line, 1);
  assert.equal(p.queue[0].source_excerpt, '# Fixture'); assert.equal(p.authorization, 'NONE');
  const measured = setup(p.queue[0]);
  assert.equal(measured.protocol.candidate_id, x.candidate.id);
  assert.equal(measured.protocol.hypothesis, x.candidate.hypothesis);
  assert.equal(measured.protocol.intervention, x.candidate.change);
  assert.equal(judge(measured).decision, 'PROMISING');
  measured.results.runs[0].guardrails.data_integrity = 0;
  assert.equal(judge(measured).decision, 'REJECT');
  measured.results.data_kind = 'synthetic'; assert.equal(judge(measured).decision, 'DEMO_ONLY');
});
test('candidate source hashes and identifiers reject ambiguous or malformed values', () => {
  for (const id of ['INV-0000', 'INV-A0123456789BCDEF', 'INV-a0123456789bcde', 'INV-a0123456789bcdef0', 'INV-a0123456789bcdeg']) {
    const x = dynamicFixture(); x.candidate.id = id;
    assert.throws(() => validateCatalog(x.experiments, x.collectionConfig), /experiment ID/);
  }
  for (const sourceHash of ['a'.repeat(63), 'A'.repeat(64), 'g'.repeat(64), null, undefined]) {
    const x = dynamicFixture(); x.candidate.source_sha256 = sourceHash;
    assert.throws(() => validateCatalog(x.experiments, x.collectionConfig), /source SHA-256/);
  }
});
test('a source changed outside its marker blocks the generated hypothesis until review', () => {
  const x = dynamicFixture(), source = x.collected.repositories[0].files[x.candidate.source_path];
  source.text += '\nChanged supporting context'; source.sha256 = digest(source.text); source.blob_sha = blobHash(Buffer.from(source.text));
  const p = plan(x.collected, { now, experiments: x.experiments, collectionConfig: x.collectionConfig });
  assert.equal(p.selected, null); assert.equal(p.queue[0].state, 'SOURCE_REVIEW'); assert.equal(p.queue[0].source_line, 1);
});
test('extended collected sources keep integrity, freshness, marker and PR overlap checks', () => {
  const run = x => plan(x.collected, { now, experiments: x.experiments, collectionConfig: x.collectionConfig });
  const forged = dynamicFixture(); forged.collected.repositories[0].files[forged.candidate.source_path].text += '\nforged';
  assert.throws(() => run(forged), /integrity/);
  const missing = dynamicFixture(); delete missing.collected.repositories[0].files[missing.candidate.source_path];
  assert.throws(() => run(missing), /Missing watched source/);
  const marker = dynamicFixture(); marker.candidate.marker = '# Changed'; assert.equal(run(marker).queue[0].state, 'SOURCE_REVIEW');
  const stale = dynamicFixture('2026-09-07T00:30:00Z'); assert.equal(run(stale).queue[0].state, 'NEEDS_REFRESH');
  const conflict = dynamicFixture(); conflict.collected.repositories[0].open_prs.push({ number: 998, paths: [conflict.candidate.source_path] });
  assert.equal(run(conflict).queue[0].state, 'EXISTING_PR_REVIEW');
  const otherRepo = dynamicFixture(); otherRepo.collectionConfig.repositories[0].full_name = 'ns7jp/unapproved';
  assert.throws(() => run(otherRepo), /outside allowlist/);
});
test('selects one preparable hypothesis with no execution authorization', () => {
  const p = plan(snapshot(), { now }); assert.equal(p.selected, 'INV-001'); assert.equal(p.authorization, 'NONE');
  assert.ok(p.queue.every(x => x.runtime_status === 'NOT_RUN' && !x.publication_allowed));
});
test('occupied weekly budget prevents another selection', () => { assert.equal(plan(snapshot(), { now, occupied: true }).selected, null); });
test('closing one hypothesis selects a different available hypothesis', () => { assert.notEqual(plan(snapshot(), { now, closed: ['INV-001'] }).selected, 'INV-001'); });
test('stale and incomplete snapshots stop selection', () => {
  assert.equal(plan(snapshot(), { now: '2026-09-11T00:30:00Z' }).selected, null);
  const x = snapshot(); x.collection_complete = false; assert.equal(plan(x, { now }).collection_status, 'NEEDS_REFRESH');
});
test('forged snapshot content and wrong CI revision are rejected', () => {
  const x = snapshot(); x.repositories[0].files['README.md'].text = 'edited'; assert.throws(() => plan(x, { now }), /integrity/);
  const y = snapshot(); y.repositories[0].ci_runs[0].head_sha = 'f'.repeat(40); assert.throws(() => plan(y, { now }), /different SHA/);
});
test('PR directory overlap reroutes the conflicting hypothesis', () => {
  const x = snapshot(); x.repositories[0].open_prs.push({ number: 999, paths: ['scripts/drills/d1-process-down.sh'] });
  const p = plan(x, { now }); assert.equal(p.queue.find(x => x.id === 'INV-001').state, 'EXISTING_PR_REVIEW'); assert.notEqual(p.selected, 'INV-001');
});
test('failed and absent CI require review', () => {
  const x = snapshot(); x.repositories[0].ci_runs[0].conclusion = 'failure'; assert.equal(plan(x, { now }).selected, null);
  x.repositories[0].ci_runs = []; assert.equal(plan(x, { now }).selected, null);
});
test('changed source markers require review rather than claiming resolved', () => {
  const x = snapshot(), f = x.repositories[0].files['docs/evidence/README.md'];
  f.text = '# changed'; f.sha256 = digest(f.text); f.blob_sha = blobHash(Buffer.from(f.text));
  assert.ok(plan(x, { now }).queue.every(x => x.state === 'SOURCE_REVIEW'));
});
test('unchanged plans do not create repeat drafts or notifications', () => {
  const root = mkdtempSync(join(tmpdir(), 'innovation-state-')), p = plan(snapshot(), { now });
  assert.equal(savePlan(p, root).notify, true); assert.equal(savePlan(p, root).notify, false);
  assert.equal(readdirSync(join(root, 'runs')).filter(p => existsSync(join(root, 'runs', p, 'protocol.draft.json'))).length, 1);
});
test('state corruption and a held lock do not overwrite results', () => {
  const root = mkdtempSync(join(tmpdir(), 'innovation-lock-')), p = plan(snapshot(), { now });
  writeFileSync(join(root, 'innovation.lock'), 'held'); assert.throws(() => savePlan(p, root), /EEXIST/);
  const other = mkdtempSync(join(tmpdir(), 'innovation-corrupt-')); writeFileSync(join(other, 'latest.json'), '{}');
  assert.throws(() => savePlan(p, other), /previous state/); assert.equal(readFileSync(join(other, 'latest.json'), 'utf8'), '{}');
});
test('incomplete protocol cannot be registered', () => {
  assert.throws(() => register(draftProtocol({ ...catalog.experiments[0], base_sha: 'a'.repeat(40) })), /SHAs/);
});
test('a complete small comparison is promising, never automatically adopted', () => {
  const r = judge(setup()); assert.equal(r.decision, 'PROMISING'); assert.equal(r.statistics.improvement_percent, 30); assert.equal(r.authorization, 'NONE');
});
test('synthetic measurements always remain demo only', () => {
  const x = setup(); x.results.data_kind = 'synthetic'; assert.equal(judge(x).decision, 'DEMO_ONLY');
});
test('omitted trials and NOT_RUN do not become PASS', () => {
  const x = setup(); x.results.runs.pop(); assert.equal(judge(x).decision, 'NOT_READY');
  const y = setup(); Object.assign(y.results.runs[0], { status: 'NOT_RUN', value: null, artifact: null }); assert.equal(judge(y).decision, 'NOT_READY');
});
test('FAIL is retained even if enough other trials succeed', () => {
  const x = setup(); x.results.runs[0].status = 'FAIL'; assert.equal(judge(x).decision, 'REJECT');
});
test('a guardrail regression rejects speed improvement', () => {
  const x = setup(); x.results.runs[1].guardrails.unexpected_exposure = 1; assert.equal(judge(x).decision, 'REJECT');
});
test('worst-case regression is not hidden by a better median', () => {
  const x = setup(); x.results.runs[1].value = 140; assert.equal(judge(x).decision, 'REJECT');
});
test('insufficient gain requests a new hypothesis', () => {
  const x = setup(); for (const r of x.results.runs.filter(x => x.variant === 'candidate')) r.value = 95;
  assert.equal(judge(x).decision, 'ITERATE');
});
test('higher-is-better and zero-baseline rules work', () => {
  const x = setup(); x.protocol.metric.direction = 'higher'; reroll(x);
  for (const r of x.results.runs.filter(x => x.variant === 'candidate')) r.value = 130;
  assert.equal(judge(x).decision, 'PROMISING');
  for (const r of x.results.runs.filter(x => x.variant === 'baseline')) r.value = 0;
  assert.equal(judge(x).decision, 'INCONCLUSIVE');
});
test('protocol changes invalidate existing result links', () => {
  const x = setup(); x.protocol.metric.target_percent = 1; assert.throws(() => judge(x), /digest mismatch/);
});
test('different environment, context or revision cannot be pooled', () => {
  for (const key of ['environment_id', 'context_sha256', 'revision']) {
    const x = setup(); x.results.runs[0][key] = 'changed'; assert.throws(() => judge(x), /Incomparable/);
  }
});
test('duplicate trials and reused evidence are rejected', () => {
  const x = setup(); x.results.runs.push(x.results.runs[0]); assert.throws(() => judge(x), /Duplicate/);
  const y = setup(); y.results.runs[1].artifact = y.results.runs[0].artifact; assert.throws(() => judge(y), /Reused/);
});
test('modified evidence, modified context and path traversal are rejected', () => {
  const x = setup(); writeFileSync(join(x.root, x.results.runs[0].artifact.path), 'modified'); assert.throws(() => judge(x), /hash mismatch/);
  const y = setup(); writeFileSync(join(y.root, 'context.json'), '{}'); assert.throws(() => judge(y), /Context manifest/);
  const z = setup(); z.results.runs[0].artifact.path = '../outside.json'; assert.throws(() => judge(z), /Unsafe/);
});
test('measurements before registration, in the future, or overlapping are rejected', () => {
  const x = setup(); x.results.runs[0].started_at = '2026-09-08T00:00:00Z'; assert.throws(() => judge(x), /interval/);
  const y = setup(); y.results.runs[0].finished_at = '2026-09-10T00:00:00Z'; assert.throws(() => judge(y), /interval/);
  const z = setup(); z.results.runs[0].finished_at = z.results.runs[1].finished_at; assert.throws(() => judge(z), /overlap/);
});
test('unknown fields and incomplete guardrails are rejected', () => {
  const x = setup(); x.results.extra = true; assert.throws(() => judge(x), /fields/);
  const y = setup(); delete y.results.runs[0].guardrails.data_integrity; assert.throws(() => judge(y), /fields/);
});
test('nonexistent calendar dates and mismatched candidate identity are rejected', () => {
  const x = setup(); x.results.runs[0].started_at = '2026-02-30T00:00:00Z'; assert.throws(() => judge(x), /interval/);
  const y = setup(); y.protocol.candidate_id = 'INV-002'; assert.throws(() => judge(y), /Candidate ID/);
});
test('generated protocol identifiers require a UUID and their own candidate identity', () => {
  const candidate = dynamicFixture().candidate;
  for (const suffix of ['-'.repeat(36), 'a'.repeat(36), '12345678-1234-0234-8234-123456789abc', '12345678-1234-4234-7234-123456789abc']) {
    const x = setup(candidate); x.protocol.id = `${candidate.id}-${suffix}`; reroll(x);
    assert.throws(() => judge(x), /protocol identity/);
  }
  const x = setup(candidate); x.protocol.candidate_id = 'INV-b0123456789bcdef'; reroll(x);
  assert.throws(() => judge(x), /Candidate ID/);
});
test('changed intervention paths update the semantic fingerprint', () => {
  const x = structuredClone(catalog); x.experiments[0].paths.push('docs/new-path.md');
  assert.notEqual(plan(snapshot(), { now }).fingerprint, plan(snapshot(), { now, experiments: x }).fingerprint);
});
test('CLI evaluate is reproducible and register refuses overwrites', () => {
  const x = setup(); writeFileSync(join(x.root, 'protocol.json'), JSON.stringify(x.protocol));
  x.results.data_kind = 'synthetic'; writeFileSync(join(x.root, 'results.json'), JSON.stringify(x.results));
  const result = spawnSync(process.execPath, [cli, 'evaluate', join(x.root, 'protocol.json'), join(x.root, 'results.json'), x.root], { encoding: 'utf8' });
  assert.equal(result.status, 3); assert.equal(JSON.parse(result.stdout).decision, 'DEMO_ONLY');
  const draft = { ...x.protocol, status: 'DRAFT', registered_at: null };
  writeFileSync(join(x.root, 'draft.json'), JSON.stringify(draft));
  const overwrite = spawnSync(process.execPath, [cli, 'register', join(x.root, 'draft.json'), join(x.root, 'protocol.json')], { encoding: 'utf8' });
  assert.equal(overwrite.status, 2); assert.match(overwrite.stderr, /EEXIST/);
});
test('CLI plan supports legacy and generated catalogs without allowing a missing config argument', () => {
  const root = mkdtempSync(join(tmpdir(), 'innovation-cli-plan-')), observedAt = new Date().toISOString();
  const contextPath = join(root, 'context.json'), snapshotPath = join(root, 'snapshot.json');
  writeFileSync(contextPath, JSON.stringify({ schema_version: 1, reviewed_at: observedAt, occupied: false, closed: [] }));
  writeFileSync(snapshotPath, JSON.stringify(snapshot(config, observedAt)));
  const legacy = spawnSync(process.execPath, [cli, 'plan', snapshotPath, contextPath, join(root, 'legacy')], { encoding: 'utf8' });
  assert.equal(legacy.status, 0, legacy.stderr); assert.equal(JSON.parse(legacy.stdout).selected, 'INV-001');
  const x = dynamicFixture(observedAt), catalogPath = join(root, 'catalog.json'), configPath = join(root, 'config.json');
  writeFileSync(snapshotPath, JSON.stringify(x.collected)); writeFileSync(catalogPath, JSON.stringify(x.experiments));
  writeFileSync(configPath, JSON.stringify(x.collectionConfig));
  const args = [cli, 'plan', snapshotPath, contextPath, join(root, 'generated'), catalogPath, configPath];
  const generated = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(generated.status, 0, generated.stderr); assert.equal(JSON.parse(generated.stdout).selected, x.candidate.id);
  const run = readdirSync(join(root, 'generated', 'runs'))[0];
  const draft = JSON.parse(readFileSync(join(root, 'generated', 'runs', run, 'protocol.draft.json')));
  assert.equal(draft.candidate_id, x.candidate.id); assert.equal(draft.status, 'DRAFT');
  const incomplete = spawnSync(process.execPath, args.slice(0, -1), { encoding: 'utf8' });
  assert.equal(incomplete.status, 2); assert.match(incomplete.stderr, /Usage:/);
});
