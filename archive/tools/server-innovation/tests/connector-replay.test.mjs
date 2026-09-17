import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { replayConnector } from '../connector-replay.mjs';
import { discoveryConfig } from '../discovery.mjs';
import { blobHash, digest } from '../../portfolio-audit/scripts/github.mjs';
import { inspectSnapshot } from '../../portfolio-audit/scripts/cycle.mjs';

const startedAt = '2026-09-09T00:00:00Z', completedAt = '2026-09-09T00:01:00Z', head = 'a'.repeat(40);
const cli = fileURLToPath(new URL('../connector-replay.mjs', import.meta.url));
// Entirely synthetic recorded GET responses. No connector, network, server, shell, or credentials.
function fixture({ decoded = true } = {}) {
  const capture = { started_at: startedAt, completed_at: completedAt, responses: {} }, sources = new Map();
  for (const spec of discoveryConfig.repositories) {
    const base = '/repos/' + spec.full_name;
    capture.responses[base] = [{ id: spec.id, full_name: spec.full_name, private: false, default_branch: 'main' }];
    capture.responses[base + '/commits/main'] = [{ sha: head }, { sha: head }];
    const tree = [];
    for (const path of spec.files) {
      const text = `# Synthetic source: ${spec.full_name}/${path}\r\n日本語と CRLF を含む採録文字列。\r\n`;
      const bytes = Buffer.from(text, 'utf8'), sha = blobHash(bytes), route = `${base}/git/blobs/${sha}`;
      sources.set(`${spec.full_name}/${path}`, { text, sha, route });
      tree.push({ path, type: 'blob', mode: '100644', sha, size: bytes.length });
      capture.responses[route] = [decoded ? { connector_decoded: true, sha, text } : { sha, encoding: 'base64', content: bytes.toString('base64') }];
    }
    capture.responses[`${base}/git/trees/${head}?recursive=1`] = [{ truncated: false, tree }];
    capture.responses[`${base}/pulls?state=open&per_page=100&page=1`] = [[], []];
    capture.responses[`${base}/actions/runs?head_sha=${head}&per_page=100&page=1`] = [{ workflow_runs: [{
      id: 1, workflow_id: 1, name: 'fixture CI', path: '.github/workflows/fixture.yml', head_sha: head,
      status: 'completed', conclusion: 'success', html_url: `https://github.com/${spec.full_name}/actions/runs/1`, updated_at: completedAt
    }] }];
  }
  return { capture, sources };
}

test('connector decoded text reconstructs the original Git blobs with Unicode and CRLF intact', async () => {
  const { capture, sources } = fixture(), original = structuredClone(capture), snapshot = await replayConnector(capture);
  assert.equal(snapshot.collection_complete, true); assert.deepEqual(snapshot.errors, []);
  assert.equal(snapshot.observed_at, startedAt); assert.equal(snapshot.completed_at, completedAt);
  assert.equal(snapshot.kind, 'github-api-read-only'); assert.match(snapshot.collection_transport, /Connected GitHub GET capture/);
  assert.equal(snapshot.repositories.length, discoveryConfig.repositories.length);
  assert.equal(Object.values(snapshot.repositories).flatMap(repo => Object.keys(repo.files)).length, sources.size);
  for (const repo of snapshot.repositories) for (const [path, file] of Object.entries(repo.files)) {
    const expected = sources.get(`${repo.full_name}/${path}`);
    assert.equal(file.text, expected.text); assert.equal(file.blob_sha, expected.sha); assert.equal(file.sha256, digest(expected.text));
    assert.equal(file.url, `https://github.com/${repo.full_name}/blob/${head}/${path}`);
  }
  assert.equal(inspectSnapshot(snapshot, discoveryConfig, completedAt), true);
  assert.deepEqual(capture, original, 'replaying cannot consume the saved input sequence');
});
test('ordinary base64 API blobs pass the same collector verification', async () => {
  const { capture } = fixture({ decoded: false }), result = await replayConnector(capture);
  assert.equal(result.collection_complete, true); assert.equal(inspectSnapshot(result, discoveryConfig, completedAt), true);
});
test('missing recorded routes produce an incomplete snapshot and preserve successful repositories', async () => {
  const { capture, sources } = fixture(), source = sources.values().next().value;
  delete capture.responses[source.route];
  const result = await replayConnector(capture);
  assert.equal(result.collection_complete, false); assert.equal(result.repositories.length, discoveryConfig.repositories.length - 1);
  assert.equal(result.errors[0].repository, discoveryConfig.repositories[0].full_name);
  assert.match(result.errors[0].message, /Unrecorded connector request:/); assert.equal(inspectSnapshot(result, discoveryConfig, completedAt), false);
});
test('malformed capture envelopes, timestamps and GET sequences are rejected', async () => {
  const { capture } = fixture();
  for (const invalid of [null, {}, { ...capture, responses: null }, { ...capture, responses: [] },
    { ...capture, started_at: 'not a timestamp' }, { ...capture, completed_at: '2026-09-08T00:00:00Z' },
    { ...capture, responses: { '/outside/allowlist': [] } }, { ...capture, responses: { '/repos/ns7jp/server': {} } }]) {
    await assert.rejects(replayConnector(invalid), /Invalid connector capture|Invalid recorded GET sequence/);
  }
});
test('decoded blob text or original blob identity changes cannot masquerade as collected evidence', async () => {
  for (const field of ['text', 'sha']) {
    const { capture, sources } = fixture(), route = sources.values().next().value.route;
    capture.responses[route][0][field] = field === 'text' ? 'modified connector text' : 'f'.repeat(40);
    const result = await replayConnector(capture);
    assert.equal(result.collection_complete, false); assert.match(result.errors[0].message, /Git blob integrity mismatch/);
  }
});
test('HEAD changes and missing second observations fail the moving-ref check', async () => {
  const base = '/repos/' + discoveryConfig.repositories[0].full_name;
  const moving = fixture().capture; moving.responses[base + '/commits/main'][1].sha = 'b'.repeat(40);
  const result = await replayConnector(moving);
  assert.equal(result.collection_complete, false); assert.match(result.errors[0].message, /HEAD or open PR set changed/);
  const missing = fixture().capture; missing.responses[base + '/commits/main'].pop();
  const incomplete = await replayConnector(missing);
  assert.equal(incomplete.collection_complete, false); assert.match(incomplete.errors[0].message, /Unrecorded connector request/);
});
test('a changed open PR set remains incomplete even when HEAD is unchanged', async () => {
  const capture = fixture().capture, base = '/repos/' + discoveryConfig.repositories[0].full_name;
  capture.responses[`${base}/pulls?state=open&per_page=100&page=1`][1].push({ number: 901, head: { sha: 'c'.repeat(40) } });
  const result = await replayConnector(capture);
  assert.equal(result.collection_complete, false); assert.match(result.errors[0].message, /HEAD or open PR set changed/);
});
test('replay needs no network and collected text is never executed', async () => {
  const { capture, sources } = fixture(), source = sources.values().next().value, originalFetch = globalThis.fetch;
  const text = source.text + 'globalThis.__connectorFixtureExecuted = true;\n', bytes = Buffer.from(text), sha = blobHash(bytes);
  const base = '/repos/' + discoveryConfig.repositories[0].full_name, replacementRoute = `${base}/git/blobs/${sha}`;
  const entry = capture.responses[`${base}/git/trees/${head}?recursive=1`][0].tree[0]; entry.sha = sha; entry.size = bytes.length;
  capture.responses[replacementRoute] = [{ connector_decoded: true, sha, text }]; delete capture.responses[source.route];
  globalThis.__connectorFixtureExecuted = false;
  globalThis.fetch = async () => { throw new Error('Unexpected network access in connector replay test'); };
  try {
    const result = await replayConnector(capture); assert.equal(result.collection_complete, true);
    assert.equal(globalThis.__connectorFixtureExecuted, false);
  } finally { globalThis.fetch = originalFetch; delete globalThis.__connectorFixtureExecuted; }
});
test('CLI saves immutable snapshots, signals incomplete replay, and refuses destination overwrites', () => {
  const root = mkdtempSync(join(tmpdir(), 'connector-replay-fixture-')), inputPath = join(root, 'capture.json'), outputPath = join(root, 'snapshot.json');
  const capture = fixture().capture; writeFileSync(inputPath, JSON.stringify(capture));
  const invoke = output => spawnSync(process.execPath, [cli, inputPath, output], { encoding: 'utf8' });
  const complete = invoke(outputPath); assert.equal(complete.status, 0, complete.stderr); assert.equal(JSON.parse(complete.stdout).collection_complete, true);
  const before = readFileSync(outputPath, 'utf8'), again = invoke(outputPath);
  assert.equal(again.status, 2); assert.match(again.stderr, /EEXIST/); assert.equal(readFileSync(outputPath, 'utf8'), before);
  delete capture.responses['/repos/' + discoveryConfig.repositories[0].full_name]; writeFileSync(inputPath, JSON.stringify(capture));
  const incomplete = invoke(join(root, 'incomplete.json')); assert.equal(incomplete.status, 3, incomplete.stderr);
  assert.equal(JSON.parse(incomplete.stdout).collection_complete, false);
});
