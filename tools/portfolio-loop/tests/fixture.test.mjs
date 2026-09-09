import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSnapshot, updateFile, assertFixture, seedRoot, FIXTURE_NOW, FIXTURE_TIME, REPO_ROOT } from '../fixture.mjs';
import { inspectSnapshot } from '../../portfolio-audit/scripts/cycle.mjs';
import { discoveryConfig } from '../../server-innovation/discovery.mjs';
import { catalog } from '../../server-innovation/innovation.mjs';

globalThis.fetch = () => { throw new Error('network forbidden in tests'); };
const cli = fileURLToPath(new URL('../fixture.mjs', import.meta.url));

test('synthetic snapshot is complete and fresh at the fixture clock, stale two days later, invalid before observation', () => {
  const snapshot = buildSnapshot();
  assert.equal(assertFixture(snapshot), true);
  assert.equal(inspectSnapshot(snapshot, discoveryConfig, '2026-09-10T03:00:01.000Z'), false);
  assert.throws(() => inspectSnapshot(snapshot, discoveryConfig, '2026-09-07T00:00:00.000Z'), /future/);
  assert.equal(snapshot.observed_at, FIXTURE_TIME); assert.ok(Date.parse(FIXTURE_NOW) > Date.parse(FIXTURE_TIME));
});
test('every configured file is present with hashes pinned to the synthetic head', () => {
  const snapshot = buildSnapshot();
  for (const spec of discoveryConfig.repositories) {
    const repo = snapshot.repositories.find(r => r.full_name === spec.full_name);
    assert.equal(repo.id, spec.id);
    for (const path of spec.files) { assert.equal(typeof repo.files[path].text, 'string'); assert.ok(repo.files[path].url.includes(`/blob/${repo.head_sha}/`)); }
  }
});
test('ledger text keeps every audit probe NOT RUN and every catalog marker exactly once', () => {
  const text = buildSnapshot().repositories.find(r => r.full_name === 'ns7jp/server').files['docs/evidence/README.md'].text;
  const lines = text.split('\n');
  for (const p of discoveryConfig.probes) assert.equal(lines.filter(l => l.startsWith(p.prefix)).length, 1);
  for (const m of new Set(catalog.experiments.map(x => x.marker))) assert.equal(lines.filter(l => l.startsWith(m)).length, 1);
  assert.ok(text.includes('合成データ'));
});
test('editing a file without updateFile breaks integrity; updateFile keeps it', () => {
  const snapshot = buildSnapshot();
  snapshot.repositories[1].files['README.md'].text += 'x';
  assert.throws(() => inspectSnapshot(snapshot, discoveryConfig, FIXTURE_NOW), /integrity/);
  const fixed = updateFile(buildSnapshot(), 'ns7jp/ns7jp', 'README.md', '# 変更後（合成データ）\n');
  assert.equal(assertFixture(fixed), true);
});
test('missing files, open PRs and failed CI are expressible', () => {
  const snapshot = buildSnapshot({ texts: { 'ns7jp/ns7jp:docs/target-roles.md': null }, openPrs: { 'ns7jp/server': [{ number: 7, paths: ['ansible/site.yml'] }] }, ciRuns: 'failure' });
  assert.equal(snapshot.repositories[1].files['docs/target-roles.md'].missing, true);
  assert.equal(snapshot.repositories[0].open_prs[0].number, 7);
  assert.equal(snapshot.repositories[0].ci_runs[0].conclusion, 'failure');
  assert.equal(assertFixture(snapshot), true);
});
test('seedRoot copies only the career template inputs and initializes the private plan once', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-loop-fixture-'));
  try {
    await seedRoot(root, { now: () => FIXTURE_NOW });
    assert.ok(existsSync(join(root, '.local/engineer-career/profile.json')));
    assert.ok(existsSync(join(root, 'docs/server-engineer/curriculum.json')));
    const profile = JSON.parse(readFileSync(join(root, '.local/engineer-career/profile.json'), 'utf8'));
    assert.equal(profile.weekly_minutes, 600); assert.equal(profile.connections.learner_id, null);
    await seedRoot(root, { now: () => FIXTURE_NOW }); // 二回目は上書きしない
    assert.equal(JSON.parse(readFileSync(join(root, '.local/engineer-career/profile.json'), 'utf8')).updated_at, FIXTURE_NOW);
    assert.ok(!existsSync(join(root, '.git')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('fixture CLI writes a synthetic snapshot, refuses docs/ and refuses to overwrite', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-loop-fixture-cli-'));
  try {
    const ok = spawnSync(process.execPath, [cli, join(dir, 'snap.json'), '--observed-at', FIXTURE_TIME], { encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stderr);
    const written = JSON.parse(readFileSync(join(dir, 'snap.json'), 'utf8'));
    assert.equal(written.observed_at, FIXTURE_TIME); assert.equal(assertFixture(written), true);
    const again = spawnSync(process.execPath, [cli, join(dir, 'snap.json')], { encoding: 'utf8' });
    assert.equal(again.status, 2); assert.match(again.stderr, /EEXIST/);
    const docs = spawnSync(process.execPath, [cli, join(REPO_ROOT, 'docs/portfolio-loop/never.json')], { encoding: 'utf8' });
    assert.equal(docs.status, 2); assert.match(docs.stderr, /docs\//);
    assert.ok(!existsSync(join(REPO_ROOT, 'docs/portfolio-loop/never.json')));
    const usage = spawnSync(process.execPath, [cli], { encoding: 'utf8' });
    assert.equal(usage.status, 2); assert.match(usage.stderr, /Usage/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
