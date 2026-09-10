import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { prepareBridge, buildHandoff } from '../bridge-plan.mjs';
import { persistBridge, readBridge, BRIDGE_DIR, MAX_BRIDGE_BUNDLES } from '../bridge.mjs';
import { discover, emptyRegistry } from '../discovery.mjs';
import { catalog } from '../innovation.mjs';
import { D1_SOURCE_PATH } from '../probes.mjs';
import { sourceText } from '../fixtures/d1-model-source.mjs';
import { buildSnapshot, seedRoot, FIXTURE_NOW } from '../../portfolio-loop/fixture.mjs';
import { main, runLoop, statusView, readLedger } from '../../portfolio-loop/loop.mjs';
import { cycle, checkIn } from '../../autonomous-prosperity/prosperity.mjs';

globalThis.fetch = () => { throw Error('Network forbidden in bridge tests'); };
const NOW = FIXTURE_NOW;
const snapshot = observedAt => buildSnapshot({ d1Source: sourceText, ...(observedAt ? { observedAt } : {}) });
const temporary = fn => async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'improvement-bridge-test-'));
  try { await fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
};
function planned() {
  const source = snapshot(), prepared = prepareBridge(source, { now: NOW, modelOptions: { clock: () => 0 } });
  const context = { schema_version: 1, reviewed_at: NOW, occupied: false, closed: catalog.experiments.map(c => c.id) };
  const discovered = discover(source, context, emptyRegistry(), { now: NOW, proposals: prepared.proposals });
  return { source, prepared, handoff: buildHandoff(source, discovered.result, prepared) };
}
const write = (root, relative, value) => {
  const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value));
};

test('one immutable bundle contains implementation, cases, proposals and provenance', temporary(async root => {
  const { prepared, handoff } = planned(); assert.equal(handoff.state, 'READY');
  const first = persistBridge(root, prepared, handoff, NOW);
  const read = readBridge(root);
  assert.equal(first.notify, true); assert.equal(read.packet.candidate_id, first.candidate_id);
  assert.match(read.markdown, /最小変更の手順/); assert.match(read.markdown, /NOT RUN/);
  assert.equal(read.packet.registration.candidate_sha, 'NOT SET');
  assert.ok(read.packet.verification.negative_cases.length); assert.ok(read.packet.verification.acceptance_cases.length);
  assert.equal(read.packet.verification.cases_data_kind, 'synthetic');
  assert.deepEqual(fs.readdirSync(path.join(root, first.bundle.path)).sort(), ['handoff.json', 'implementation.md', 'manifest.json', 'proposals.json', 'regression-cases.json']);
  const second = persistBridge(root, { ...prepared, evaluated_at: '2026-09-08T04:01:00Z' }, handoff, '2026-09-08T04:01:00Z');
  assert.equal(second.notify, false); assert.equal(second.bundle.id, first.bundle.id);
  assert.equal(fs.readdirSync(path.join(root, BRIDGE_DIR, 'bundles')).length, 1);
  assert.equal(fs.existsSync(path.join(root, '.local/server-innovation')), false);
}));
test('standalone bridge artifacts preserve the synthetic origin of their source snapshot', temporary(async root => {
  const { prepared, handoff } = planned();
  const saved = persistBridge(root, prepared, handoff, NOW);
  const record = readBridge(root);
  assert.equal(record.packet.input_data_kind, 'synthetic');
  assert.equal(record.latest.input_data_kind, 'synthetic');
  const proposals = JSON.parse(fs.readFileSync(path.join(root, saved.bundle.path, 'proposals.json')));
  assert.equal(proposals.input_data_kind, 'synthetic');
  assert.match(record.markdown, /入力ソース: synthetic/);
  assert.match(record.markdown, /本人の観測ではありません/);
  assert.equal(record.packet.runtime_status, 'NOT_RUN');
}));
test('identical source bytes reclassified from synthetic to observed cannot reuse prepared identity', () => {
  const source = snapshot(), prepared = prepareBridge(source, { now: NOW, modelOptions: { clock: () => 0 } });
  const context = { schema_version: 1, reviewed_at: NOW, occupied: false, closed: catalog.experiments.map(c => c.id) };
  const discovered = discover(source, context, emptyRegistry(), { now: NOW, proposals: prepared.proposals });
  assert.equal(buildHandoff(source, discovered.result, prepared).state, 'READY');
  // This deliberately inconsistent test input is not an observed or measured record.
  const reclassified = { ...structuredClone(source), data_kind: 'observed' };
  assert.deepEqual(reclassified.repositories, source.repositories);
  const rejected = buildHandoff(reclassified, discovered.result, prepared);
  assert.equal(rejected.state, 'REVIEW_SOURCE'); assert.equal(rejected.packet, null);
});
test('meaningful verification changes notify, while only a base revision change stays quiet', temporary(async root => {
  const { prepared, handoff } = planned(); const first = persistBridge(root, prepared, handoff, NOW);
  const newBase = structuredClone(handoff); const old = newBase.packet.source.base_sha;
  newBase.packet.source.base_sha = 'f'.repeat(40); newBase.packet.source.url = newBase.packet.source.url.replace(old, 'f'.repeat(40));
  newBase.packet.implementation_steps = newBase.packet.implementation_steps.map(step => step.replaceAll(old, 'f'.repeat(40)));
  const second = persistBridge(root, prepared, newBase, NOW);
  assert.equal(second.notify, false); assert.notEqual(second.bundle.id, first.bundle.id);
  newBase.packet.metric.target_percent = 25;
  const third = persistBridge(root, prepared, newBase, NOW); assert.equal(third.notify, true);
}));
test('corrupted artifacts and manifest are refused, retaining original files', temporary(async root => {
  const { prepared, handoff } = planned(); const first = persistBridge(root, prepared, handoff, NOW);
  const file = path.join(root, first.bundle.implementation); fs.appendFileSync(file, 'tampered');
  assert.throws(() => readBridge(root), /integrity/);
  assert.throws(() => persistBridge(root, prepared, handoff, NOW), /integrity/);
  assert.ok(fs.readFileSync(file, 'utf8').endsWith('tampered'));
}));
test('blocked handoff does not expose a stale bundle or create implementation files', temporary(async root => {
  const { prepared, handoff } = planned(); persistBridge(root, prepared, handoff, NOW);
  const blocked = persistBridge(root, prepared, { state: 'NO_SELECTION', packet: null }, NOW);
  assert.equal(blocked.bundle, null); assert.equal(readBridge(root).packet, null);
  assert.equal(fs.readdirSync(path.join(root, BRIDGE_DIR, 'bundles')).length, 1);
}));
test('quota preserves existing bundles and locks are not removed on collision', temporary(async root => {
  const { prepared, handoff } = planned(); const first = persistBridge(root, prepared, handoff, NOW);
  for (let i = 1; i < MAX_BRIDGE_BUNDLES; i++) fs.mkdirSync(path.join(root, BRIDGE_DIR, 'bundles', 'filler-' + i));
  assert.equal(persistBridge(root, prepared, handoff, NOW).bundle.id, first.bundle.id);
  const changed = structuredClone(handoff); changed.packet.metric.target_percent = 30;
  assert.equal(persistBridge(root, prepared, changed, NOW).state, 'ARCHIVE_REVIEW');
  write(root, BRIDGE_DIR + '/bridge.lock', { pid: 1 });
  assert.throws(() => persistBridge(root, prepared, handoff, NOW), /EEXIST/);
  assert.equal(fs.existsSync(path.join(root, BRIDGE_DIR, 'bridge.lock')), true);
}));
test('normal loop connects auto proposals once and puts implementation before registration', temporary(async root => {
  await seedRoot(root, { now: () => NOW });
  const profilePath = path.join(root, '.local/engineer-career/profile.json'), original = fs.readFileSync(profilePath);
  const result = await runLoop({ root, offline: snapshot(), now: () => NOW, bridge: true });
  assert.equal(result.bridge.state, 'READY'); assert.equal(result.bridge.proposal_count, 2);
  assert.ok(result.discovery.added.length <= 4);
  const actions = result.next_actions.map(a => a.code);
  assert.ok(actions.indexOf('PREPARE_IMPLEMENTATION') >= 0);
  assert.ok(actions.indexOf('PREPARE_IMPLEMENTATION') < actions.indexOf('REGISTER_PROTOCOL'));
  assert.ok(statusView(root, NOW).next_actions.some(a => a.code === 'PREPARE_IMPLEMENTATION'));
  const again = await runLoop({ root, offline: snapshot(), now: () => NOW, bridge: true });
  assert.equal(again.bridge.notify, false); assert.equal(again.bridge.bundle.id, result.bridge.bundle.id);
  assert.equal(again.discovery.added.length, 0); assert.deepEqual(fs.readFileSync(profilePath), original);
  const ledger = readLedger(root);
  assert.equal(ledger.entries.length, 0);
}));
test('an unchanged selected D1 candidate gets a new matching draft when its repository HEAD advances', temporary(async root => {
  await seedRoot(root, { now: () => NOW });
  // Fill the bounded queue with distinct observation rounds so the HEAD-only change cannot introduce a new candidate.
  let previous;
  for (const observedAt of ['2026-09-08T03:00:00Z', '2026-09-08T03:05:00Z', '2026-09-08T03:10:00Z'])
    previous = await runLoop({ root, offline: snapshot(observedAt), now: () => NOW, bridge: true });
  const oldPacket = readBridge(root).packet;
  assert.equal(oldPacket.source.path, D1_SOURCE_PATH);
  const oldPath = previous.discovery.draft.path, oldBytes = fs.readFileSync(oldPath);
  const oldDraft = JSON.parse(oldBytes);
  assert.equal(oldDraft.baseline_sha, oldPacket.source.base_sha);
  const advanced = snapshot('2026-09-08T03:20:00Z');
  const repo = advanced.repositories.find(item => item.full_name === 'ns7jp/server');
  const oldHead = repo.head_sha, newHead = 'e'.repeat(40);
  repo.head_sha = newHead;
  for (const file of Object.values(repo.files)) if (file.url) file.url = file.url.replace(oldHead, newHead);
  for (const run of repo.ci_runs) run.head_sha = newHead;
  const next = await runLoop({ root, offline: advanced, now: () => '2026-09-08T04:01:00Z', bridge: true });
  assert.equal(next.discovery.selected, previous.discovery.selected);
  const packet = readBridge(root).packet, nextPath = next.discovery.draft.path;
  assert.equal(packet.source.sha256, oldPacket.source.sha256);
  assert.equal(packet.source.base_sha, newHead); assert.notEqual(nextPath, oldPath);
  const newDraft = JSON.parse(fs.readFileSync(nextPath));
  assert.equal(newDraft.candidate_id, oldDraft.candidate_id);
  assert.equal(newDraft.baseline_sha, packet.source.base_sha);
  assert.deepEqual(fs.readFileSync(oldPath), oldBytes);
}));
test('manual proposal capacity is preserved and occupied context creates no handoff', temporary(async root => {
  await seedRoot(root, { now: () => NOW });
  const manual = prepareBridge(snapshot(), { now: NOW, limit: 4 }).proposals;
  const result = await runLoop({ root, offline: snapshot(), now: () => NOW, bridge: true, proposals: manual, occupied: true });
  assert.equal(result.bridge.proposal_count, 0); assert.equal(result.bridge.bundle, null);
  assert.equal(result.discovery.selected, null); assert.ok(result.discovery.added.length <= 4);
  assert.equal(result.next_actions.some(a => a.code === 'PREPARE_IMPLEMENTATION'), false);
}));
test('corrupt saved handoff stops before a new audit run writes', temporary(async root => {
  await seedRoot(root, { now: () => NOW });
  const { prepared, handoff } = planned(); const record = persistBridge(root, prepared, handoff, NOW);
  fs.appendFileSync(path.join(root, record.bundle.cases), 'corrupt');
  await assert.rejects(runLoop({ root, offline: snapshot(), now: () => NOW, bridge: true }), /integrity/);
  assert.equal(fs.existsSync(path.join(root, '.local/portfolio-operations/runs')), false);
}));
test('pause and load-review do not prepare a new bridge bundle', temporary(async root => {
  await seedRoot(root, { now: () => NOW }); await checkIn(root, 'paused', NOW);
  const stopped = await cycle({ root, offline: snapshot(), now: () => NOW, bridge: true });
  assert.equal(stopped.loop_outcome, 'NOT_RUN'); assert.equal(fs.existsSync(path.join(root, BRIDGE_DIR)), false);
  await checkIn(root, 'reduced', NOW);
  const reduced = await cycle({ root, offline: snapshot(), now: () => NOW, bridge: true });
  assert.equal(reduced.state, 'REVIEW_LOAD'); assert.equal(reduced.loop_summary.bridge, null);
}));
test('bridge command reuses a fresh observation and bridge-show is read only', temporary(async root => {
  await seedRoot(root);
  const file = path.join(root, 'snapshot.json'); fs.writeFileSync(file, JSON.stringify(snapshot(new Date().toISOString())));
  const result = await main(['bridge', '--root', root, '--offline', file, '--json']); assert.equal(result.exitCode, 0);
  assert.equal(JSON.parse(result.text).bridge.state, 'READY');
  const latest = fs.readFileSync(path.join(root, BRIDGE_DIR, 'latest.json'));
  const show = await main(['bridge-show', '--root', root]); assert.match(show.text, /最小変更の手順/);
  assert.deepEqual(fs.readFileSync(path.join(root, BRIDGE_DIR, 'latest.json')), latest);
  const next = await main(['bridge', '--root', root, '--json']); assert.equal(next.exitCode, 0);
  assert.equal(JSON.parse(next.text).bridge.notify, false);
}));
test('bridge with no saved observation returns NEEDS_REFRESH without network', temporary(async root => {
  const result = await main(['bridge', '--root', root, '--json']); assert.equal(result.exitCode, 3);
  assert.equal(JSON.parse(result.text).state, 'NEEDS_REFRESH');
  assert.equal(fs.existsSync(path.join(root, '.local')), false);
}));
test('real bridge-demo CLI builds a complete synthetic handoff', () => {
  const cli = fileURLToPath(new URL('../../portfolio-loop/loop.mjs', import.meta.url));
  const output = spawnSync(process.execPath, [cli, 'bridge-demo', '--json'], { encoding: 'utf8', env: { ...process.env, PORTFOLIO_LOOP_NO_NETWORK: '1' } });
  assert.equal(output.status, 0, output.stderr); const result = JSON.parse(output.stdout);
  try { assert.equal(result.demo, true); assert.equal(result.synthetic, true); assert.equal(result.bridge.state, 'READY'); assert.ok(readBridge(result.demo_root).packet); }
  finally { fs.rmSync(result.demo_root, { recursive: true, force: true }); }
});
