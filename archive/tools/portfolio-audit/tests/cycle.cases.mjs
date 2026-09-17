import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collect, pages, blobHash, digest, githubClient, validateConfig, safePath } from '../scripts/github.mjs';
import { analyze, inspectSnapshot, overlap, transition, prepareDraft, runCycle } from '../scripts/cycle.mjs';

const config = JSON.parse(readFileSync(new URL('../live.config.json', import.meta.url), 'utf8'));
// Synthetic fixtures use an independently reviewed synthetic source; production config retains its real source hash.
config.reviewed_el9_evidence_sha256 = digest('foundation.yml\n');
const timestamp = '2026-09-08T03:00:00.000Z';
const sha = 'a'.repeat(40);
const sentence = '- role として実装済みでも、実機で適用していなければ実績としません（AlmaLinux 対応が該当）';
function fixture() {
  const repositories = config.repositories.map(spec => ({ id: spec.id, full_name: spec.full_name,
    head_sha: sha, default_branch: 'main', tree_paths: spec.files, open_prs: [], ci_runs: [],
    files: Object.fromEntries(spec.files.map(path => [path, { text: '# example\n' }])) }));
  repositories[0].files['docs/evidence/README.md'].text = config.probes.map(p => p.prefix + ' NOT RUN |').join('\n') + '\n再利用 VM\n';
  repositories[0].files['docs/evidence/2026-09-04-ansible-foundation-el9-build.md'].text = 'foundation.yml\n';
  repositories[1].files['docs/target-roles.md'].text = '# title\nAlmaLinux 実機への適用、network / UFW\n\n## section\n\n\n\n\n' + sentence + '\n';
  for (const r of repositories) for (const [path, file] of Object.entries(r.files)) {
    Object.assign(file, { sha256: digest(file.text), blob_sha: blobHash(Buffer.from(file.text)),
      url: `https://github.com/${r.full_name}/blob/${sha}/${path}` });
  }
  return { schema_version: 2, observed_at: timestamp, completed_at: timestamp,
    kind: 'github-api-read-only', collection_complete: true, repositories, errors: [] };
}
function updateFile(snapshot, repo, path, text) {
  Object.assign(snapshot.repositories[repo].files[path], { text, sha256: digest(text), blob_sha: blobHash(Buffer.from(text)) });
}
const inspect = x => analyze(x, config, timestamp, { live: true });

function fixtureGetter(original = fixture()) {
  return async route => {
    const spec = config.repositories.find(r => route.startsWith('/repos/' + r.full_name + '/') || route === '/repos/' + r.full_name);
    const repo = original.repositories.find(r => r.full_name === spec.full_name);
    const suffix = route.slice(('/repos/' + spec.full_name).length);
    if (!suffix) return { ...spec, default_branch: 'main', private: false };
    if (suffix.startsWith('/commits/')) return { sha: repo.head_sha };
    if (suffix.startsWith('/git/trees/')) return { truncated: false, tree: Object.entries(repo.files).map(([path, f]) => ({ path, type: 'blob', mode: '100644', sha: f.blob_sha, size: Buffer.byteLength(f.text) })) };
    if (suffix.startsWith('/git/blobs/')) {
      const f = Object.values(repo.files).find(f => suffix.endsWith(f.blob_sha));
      return { sha: f.blob_sha, encoding: 'base64', content: Buffer.from(f.text).toString('base64') };
    }
    if (suffix.startsWith('/pulls?')) return [];
    if (suffix.startsWith('/actions/runs?')) return { workflow_runs: [] };
    throw Error('Unexpected fixture route');
  };
}
test('live collection checks blobs, PR files, HEAD and CI revision', async () => {
  const get = fixtureGetter();
  const result = await collect(config, get, () => timestamp);
  assert.equal(result.collection_complete, true);
  assert.equal(result.repositories.length, 3);
  assert.ok(inspectSnapshot(result, config, timestamp));
});
test('a collection error remains UNKNOWN and cannot generate a draft', async () => {
  const x = await collect(config, async () => { throw Error('unavailable'); }, () => timestamp);
  assert.equal(x.collection_complete, false);
  assert.equal(x.errors.length, 3);
  assert.equal(inspect(x).draft, null);
});
test('pagination follows all pages and rejects truncation at its limit', async () => {
  let calls = 0;
  assert.equal((await pages(async () => ++calls === 1 ? Array(100).fill({}) : [{ last: true }], '/repos/ns7jp/server/pulls')).length, 101);
  await assert.rejects(pages(async () => Array(100).fill({}), '/repos/ns7jp/server/pulls'), /Pagination/);
});
test('HTTP failures have bounded retries and do not expose tokens', async () => {
  let calls = 0;
  const get = githubClient({ token: 'synthetic-token', sleep: async () => {}, fetchImpl: async () => { calls++; return { status: 500, ok: false }; } });
  await assert.rejects(get('/repos/ns7jp/server'), /HTTP 500/);
  assert.equal(calls, 3);
});
test('client rejects API hosts outside the exact allowlisted route', async () => {
  await assert.rejects(githubClient()('https://example.com/secret'), /allowlist/);
});
test('repository identity and traversal paths are rejected', () => {
  const c = structuredClone(config); c.repositories[0].id = 1;
  assert.throws(() => validateConfig(c), /allowlist/);
  for (const p of ['../x', '/etc/passwd', 'C:/x', 'a\\b', 'a/../b', 'a. /b']) assert.equal(safePath(p), false);
});
test('snapshot tampering is detected before drafting', () => {
  const x = fixture(); x.repositories[0].files['README.md'].text += 'tampered';
  assert.throws(() => inspect(x), /integrity/);
});
test('old and replay snapshots cannot create a repair', () => {
  const x = fixture();
  assert.equal(analyze(x, config, '2026-09-10T03:00:00.000Z', { live: true }).draft, null);
  assert.equal(analyze(x, config, timestamp).draft, null);
});
test('future snapshots and wrong-SHA CI results are rejected', () => {
  assert.throws(() => analyze(fixture(), config, '2026-09-07T03:00:00.000Z'), /future/);
  const x = fixture(); x.repositories[0].ci_runs.push({ head_sha: 'b'.repeat(40) });
  assert.throws(() => inspect(x), /different SHA/);
});
test('only known unrun rows are NOT_RUN; changed rows never auto-PASS', () => {
  const x = fixture();
  assert.ok(inspect(x).evidence_probes.every(p => p.result === 'NOT_RUN'));
  updateFile(x, 0, 'docs/evidence/README.md', x.repositories[0].files['docs/evidence/README.md'].text.replace('NOT RUN', 'PASS'));
  assert.equal(inspect(x).evidence_probes[0].result, 'REVIEW_REQUIRED');
});
test('duplicate table rows and mixed results require review', () => {
  const x = fixture(), path = 'docs/evidence/README.md';
  updateFile(x, 0, path, x.repositories[0].files[path].text + config.probes[0].prefix + ' NOT RUN |');
  assert.equal(inspect(x).evidence_probes[0].result, 'REVIEW_REQUIRED');
});
test('directory conflicts block drafts, sibling names do not conflict', () => {
  assert.ok(overlap('docs/**', 'docs/target-roles.md'));
  assert.equal(overlap('docs/a', 'docs/abc'), false);
  const x = fixture(); x.repositories[1].open_prs.push({ number: 1, paths: ['docs/**'] });
  assert.equal(inspect(x).draft, null);
});
test('repair requires exact source and supporting evidence', () => {
  const x = fixture(); assert.ok(inspect(x).draft);
  updateFile(x, 0, 'docs/evidence/2026-09-04-ansible-foundation-el9-build.md', 'unknown');
  assert.equal(inspect(x).draft, null);
});
test('two-line draft is restricted to its reviewed path and transformations', () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-test-'));
  try {
    const draft = inspect(fixture()).draft;
    const m = prepareDraft(draft, root);
    assert.equal(m.changed_lines, 4);
    assert.ok(existsSync(join(root, 'proposal.patch')));
    assert.throws(() => prepareDraft({ ...draft, path: '.github/workflows/test.yml' }, root), /allowlist/);
    assert.throws(() => prepareDraft({ ...draft, after: draft.after + '\nPASS' }, root), /exact repair/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('stable repeated observation does not notify again', () => {
  const result = inspect(fixture()); const one = transition(null, result), two = transition(one, result);
  assert.ok(one.changes.length > 0); assert.deepEqual(two.changes, []);
});
test('disappearing findings are not automatically resolved', () => {
  const result = inspect(fixture()); const one = transition(null, result);
  const two = transition(one, { ...result, findings: [] });
  assert.ok(two.items.every(i => i.observation === 'NOT_OBSERVED'));
  const three = transition(two, { ...result, findings: [], collection_status: 'NEEDS_REFRESH' });
  assert.ok(three.items.every(i => i.observation === 'UNKNOWN'));
});
test('state corruption is rejected', () => {
  assert.throws(() => transition({ schema_version: 7 }, inspect(fixture())), /state/);
});
test('replay history is isolated and lock blocks concurrent runs', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-cycle-'));
  try {
    const result = await runCycle({ config, outputDir: root, replay: fixture(), now: () => timestamp });
    assert.equal(result.draft_status, 'NONE'); assert.equal(existsSync(join(root, 'state.json')), false);
    assert.ok(existsSync(join(root, 'replay-state.json')));
    writeFileSync(join(root, 'cycle.lock'), 'busy');
    await assert.rejects(runCycle({ config, outputDir: root, replay: fixture(), now: () => timestamp }), /EEXIST/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('truncated trees and symlink sources stop dependent collection', async () => {
  for (const mode of ['truncated', 'symlink']) {
    const base = fixtureGetter();
    const get = async route => {
      const data = await base(route);
      if (route.includes('/git/trees/')) {
        if (mode === 'truncated') data.truncated = true;
        else data.tree[0].mode = '120000';
      }
      return data;
    };
    const result = await collect(config, get, () => timestamp);
    assert.equal(result.collection_complete, false);
    assert.equal(inspect(result).draft, null);
  }
});
test('HEAD moving during collection is not treated as a consistent snapshot', async () => {
  const base = fixtureGetter(), counts = new Map();
  const get = async route => {
    const data = await base(route);
    if (route.includes('/commits/')) {
      counts.set(route, (counts.get(route) ?? 0) + 1);
      if (counts.get(route) > 1) data.sha = 'b'.repeat(40);
    }
    return data;
  };
  const result = await collect(config, get, () => timestamp);
  assert.equal(result.collection_complete, false);
  assert.ok(result.errors.every(e => e.message.includes('changed during collection')));
});
test('moving PR file list stops dependent collection', async () => {
  const base = fixtureGetter();
  const get = async route => {
    if (route.includes('/pulls?')) return [{ number: 173, head: { sha }, html_url: 'https://github.com/ns7jp/server/pull/173', title: 'fixture' }];
    if (route.includes('/pulls/173/files')) return [{ filename: 'docs/file.md' }];
    if (route.endsWith('/pulls/173')) return { head: { sha: 'b'.repeat(40) }, state: 'open', changed_files: 1 };
    return base(route);
  };
  const result = await collect(config, get, () => timestamp);
  assert.equal(result.collection_complete, false);
  assert.ok(result.errors.every(e => e.message.includes('PR changed')));
});
test('live repeated cycles retain one pending draft and suppress unchanged notification', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-repeat-'));
  try {
    const options = { config, outputDir: root, get: fixtureGetter(), now: () => timestamp };
    assert.equal((await runCycle(options)).draft_status, 'CREATED');
    const first = readFileSync(join(root, 'pending.json'), 'utf8');
    const second = await runCycle(options);
    assert.equal(second.draft_status, 'EXISTING_PENDING_DRAFT');
    assert.equal(second.notify, false);
    assert.equal(readFileSync(join(root, 'pending.json'), 'utf8'), first);
    assert.equal(existsSync(join(root, 'cycle.lock')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('corrupt pending state is preserved and blocks new proposal creation', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-corrupt-'));
  try {
    writeFileSync(join(root, 'pending.json'), '{"status":"broken"}');
    await assert.rejects(runCycle({ config, outputDir: root, get: fixtureGetter(), now: () => timestamp }), /pending/);
    assert.equal(readFileSync(join(root, 'pending.json'), 'utf8'), '{"status":"broken"}');
    assert.equal(existsSync(join(root, 'state.json')), false);
    assert.equal(existsSync(join(root, 'cycle.lock')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('three consecutive collection failures are recorded and recovery resets count', () => {
  const result = inspect(fixture()); const failure = { ...result, collection_status: 'NEEDS_REFRESH' };
  let state = null;
  for (let i = 0; i < 3; i++) state = transition(state, failure);
  assert.equal(state.consecutive_collection_failures, 3);
  assert.equal(transition(state, result).consecutive_collection_failures, 0);
});
test('changed base SHA requires rebase and one new notification', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-rebase-'));
  try {
    await runCycle({ config, outputDir: root, get: fixtureGetter(), now: () => timestamp });
    const changed = fixture(); changed.repositories[1].head_sha = 'b'.repeat(40);
    const options = { config, outputDir: root, get: fixtureGetter(changed), now: () => timestamp };
    const second = await runCycle(options);
    assert.equal(second.draft_status, 'PENDING_DRAFT_NEEDS_REBASE');
    assert.equal(second.notify, true);
    assert.equal((await runCycle(options)).notify, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('third identical collection failure notifies once, later identical failures stay quiet', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-failure-'));
  try {
    const options = { config, outputDir: root, get: async () => { throw Error('network'); }, now: () => timestamp };
    assert.equal((await runCycle(options)).notify, true);
    assert.equal((await runCycle(options)).notify, false);
    const third = await runCycle(options);
    assert.equal(third.notify, true); assert.equal(third.repeated_failure, true);
    assert.equal((await runCycle(options)).notify, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('missing repair target or evidence produces a finding instead of crashing', () => {
  for (const [repo, path] of [[1, 'docs/target-roles.md'], [0, 'docs/evidence/README.md'],
    [0, 'docs/evidence/2026-09-04-ansible-foundation-el9-build.md']]) {
    const x = fixture(); x.repositories[repo].files[path] = { missing: true };
    const result = inspect(x);
    assert.equal(result.draft, null);
    assert.ok(result.findings.some(f => f.rule === 'SOURCE_MISSING' && f.path === path));
  }
});
test('valid new blob hashes cannot authorize a repair from revised or retracted evidence', () => {
  const x = fixture();
  updateFile(x, 0, 'docs/evidence/2026-09-04-ansible-foundation-el9-build.md',
    '# Retraction\nfoundation.yml failed. Earlier PASS was invalid; Docker installation is NOT RUN.\n');
  const result = inspect(x);
  assert.equal(result.draft, null);
  assert.equal(result.findings.find(f => f.rule === 'CLAIM_BOUNDARY').state, 'NEEDS_REVIEW');
});
test('contradictory or duplicate EL9 ledger rows cannot authorize a repair', () => {
  for (const extra of ['PASS', 'FAIL', 'BLOCKED', 'SKIP-ENV']) {
    const x = fixture(), path = 'docs/evidence/README.md';
    updateFile(x, 0, path, x.repositories[0].files[path].text.replace(
      '| AlmaLinux / Rocky 9 実機への `site.yml` 適用 | NOT RUN |',
      '| AlmaLinux / Rocky 9 実機への `site.yml` 適用 | NOT RUN ' + extra + ' |'));
    assert.equal(inspect(x).draft, null);
  }
  const x = fixture(), path = 'docs/evidence/README.md';
  updateFile(x, 0, path, x.repositories[0].files[path].text + '| AlmaLinux / Rocky 9 実機への `site.yml` 適用 | NOT RUN |\n');
  assert.equal(inspect(x).draft, null);
});
test('invalid replay inputs never switch to live collection or create normal state', async () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-replay-invalid-'));
  let calls = 0;
  try {
    for (const replay of [null, false, 0, '', []]) {
      await assert.rejects(runCycle({ config, outputDir: root, replay,
        get: async () => { calls++; throw Error('must not call network'); } }), /Invalid replay snapshot/);
    }
    assert.equal(calls, 0);
    assert.equal(existsSync(join(root, 'state.json')), false);
    assert.equal(existsSync(join(root, 'pending.json')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
