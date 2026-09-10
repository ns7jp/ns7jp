import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBridge, buildHandoff } from '../bridge-plan.mjs';
import { discover, emptyRegistry, discoveryConfig } from '../discovery.mjs';
import { catalog, plan } from '../innovation.mjs';
import { D1_SOURCE_PATH } from '../probes.mjs';
import { sourceText } from '../fixtures/d1-model-source.mjs';
import { buildSnapshot, updateFile, FIXTURE_NOW as now } from '../../portfolio-loop/fixture.mjs';

const options = { now, modelOptions: { clock: () => 0 } };
const snapshot = settings => buildSnapshot({ d1Source: sourceText, ...settings });
const context = extra => ({ schema_version: 1, reviewed_at: now, occupied: false, closed: catalog.experiments.map(item => item.id), ...extra });
function run(source = snapshot(), extra = {}) {
  const prepared = prepareBridge(source, options);
  const discovered = discover(source, context(extra), emptyRegistry(), { now, proposals: prepared.proposals });
  return { source, prepared, ...discovered };
}
const modelCandidate = run => run.result.plan.queue.find(item => item.operator === 'custom' && item.source_path === D1_SOURCE_PATH);
function select(run, candidate = modelCandidate(run)) {
  return { ...run.result, plan: { ...run.result.plan, selected: candidate.id } };
}

test('fresh observed source yields stable exact custom proposals and bounded local model repair', () => {
  const source = snapshot(), first = prepareBridge(source, options), second = prepareBridge(source, options);
  assert.deepEqual(first, second);
  assert.equal(first.state, 'PREPARED'); assert.equal(first.proposals.length, 2);
  assert.deepEqual(first.proposals[0].paths, [D1_SOURCE_PATH]);
  assert.match(first.proposals[0].change, /この一条件だけ/);
  assert.equal(first.model_result.data_kind, 'synthetic');
  for (const proposal of first.proposals) {
    assert.deepEqual(Object.keys(proposal).sort(), ['signal_id', 'title', 'hypothesis', 'change', 'paths', 'metric', 'rollback'].sort());
    assert.ok(first.signals.some(item => item.id === proposal.signal_id));
    assert.doesNotMatch(JSON.stringify(proposal), /NOT SET|TODO/);
  }
  assert.equal(first.runtime_status, 'NOT_RUN'); assert.equal(first.authorization, 'NONE');
  assert.equal(first.publication_allowed, false); assert.equal(first.se_record_writes_allowed, false);
});

test('proposal budget leaves room for manual proposals and rejects invalid limits', () => {
  const source = snapshot();
  for (let limit = 0; limit <= 4; limit++) assert.equal(prepareBridge(source, { ...options, limit }).proposals.length, limit);
  for (const limit of [-1, 5, 0.5, '2']) assert.throws(() => prepareBridge(source, { ...options, limit }), /0\.\.4/);
  const prepared = prepareBridge(source, { ...options, limit: 3 });
  const manual = { ...prepared.proposals[0], title: '手動で追加した比較条件', hypothesis: '本人の別仮説について入力条件を一つ固定して比較すると不一致の原因が識別できる。' };
  const result = discover(source, context(), emptyRegistry(), { now, proposals: [manual, ...prepared.proposals] });
  assert.equal(result.result.added.length, 4);
  assert.ok(result.state.candidates.some(item => item.hypothesis === manual.hypothesis));
});

test('stale or incomplete sources produce no proposals, signals or model work', () => {
  for (const source of [snapshot({ observedAt: '2026-09-05T01:00:00Z' }), { ...snapshot(), collection_complete: false }]) {
    const result = prepareBridge(source, options);
    assert.equal(result.state, 'NEEDS_REFRESH'); assert.deepEqual(result.proposals, []);
    assert.deepEqual(result.signals, []); assert.equal(result.model_result, null);
  }
});

test('tampered bytes, source URL and hidden missing-source bytes fail closed', () => {
  const content = snapshot(); content.repositories[0].files[D1_SOURCE_PATH].text += 'tampered';
  assert.throws(() => prepareBridge(content, options), /integrity mismatch/);
  const url = snapshot(); url.repositories[0].files[D1_SOURCE_PATH].url = 'https://github.com/ns7jp/server/blob/main/' + D1_SOURCE_PATH;
  assert.throws(() => prepareBridge(url, options), /pinned/);
  const missing = snapshot(); missing.repositories[0].files[D1_SOURCE_PATH].missing = true;
  assert.throws(() => prepareBridge(missing, options), /Missing bridge source/);
  const extra = snapshot(); extra.repositories[0].files['uncollected.md'] = { text: '未確認の外部入力を改善候補へ混ぜるために用意された原本とは別の文章。' };
  assert.throws(() => prepareBridge(extra, options), /Uncollected bridge source/);
});

test('model unsupported falls back to distinct source-linked text comparisons without changing evidence', () => {
  const source = buildSnapshot(), before = structuredClone(source), prepared = prepareBridge(source, options);
  assert.equal(prepared.model_result.model_status, 'MODEL_UNSUPPORTED');
  assert.equal(prepared.proposals.length, 2);
  const signals = prepared.proposals.map(proposal => prepared.signals.find(signal => signal.id === proposal.signal_id));
  assert.ok(signals.every(item => item.origin === 'text'));
  assert.equal(new Set(signals.map(item => item.repository + ':' + item.source_path)).size, 2);
  assert.ok(prepared.proposals.every(item => item.paths.every(path => path.startsWith('tools/innovation-lab/'))));
  assert.deepEqual(source, before);
});

test('time-limited model work cannot become a model repair proposal', () => {
  let elapsed = 0;
  const prepared = prepareBridge(snapshot(), { now, modelOptions: { budgetMs: 1, clock: () => elapsed++ } });
  assert.equal(prepared.model_result.stop_reason, 'TIME_LIMIT');
  assert.ok(prepared.proposals.every(item => !item.paths.includes(D1_SOURCE_PATH)));
});

test('no observed trigger returns an explicit research state without invented candidates', () => {
  const source = buildSnapshot();
  for (const repo of source.repositories) for (const path of Object.keys(repo.files)) updateFile(source, repo.full_name, path, '# Reviewed source\n');
  const prepared = prepareBridge(source, options);
  assert.equal(prepared.state, 'RESEARCH_REQUIRED'); assert.deepEqual(prepared.proposals, []);
});

test('handoff includes exact source anchor, one change, full synthetic comparison and unregistered workflow', () => {
  const item = run(), result = buildHandoff(item.source, select(item), item.prepared), packet = result.packet;
  assert.equal(result.state, 'READY'); assert.equal(packet.candidate_id, modelCandidate(item).id);
  const source = item.source.repositories[0].files[D1_SOURCE_PATH];
  assert.equal(packet.source.sha256, source.sha256); assert.equal(packet.source.url, source.url);
  assert.equal(packet.source.excerpt, source.text.split('\n')[packet.source.line - 1]);
  assert.deepEqual(packet.targets, [D1_SOURCE_PATH]); assert.ok(packet.implementation_steps.length >= 4);
  const comparison = packet.verification.model_comparison;
  assert.equal(comparison.baseline.cases.length, 22); assert.equal(comparison.training.cases.length, 22);
  assert.equal(comparison.heldout.cases.length, 22); assert.ok(comparison.rounds.length);
  assert.equal(packet.verification.acceptance_cases.length + packet.verification.negative_cases.length, 22);
  assert.equal(comparison.data_kind, 'synthetic'); assert.equal(comparison.reference_only, true);
  assert.equal(packet.registration.status, 'DRAFT'); assert.equal(packet.registration.candidate_sha, 'NOT SET');
  assert.equal(packet.runtime_status, 'NOT_RUN'); assert.equal(packet.publication_allowed, false);
  assert.match(packet.verification.recipe.join(' '), /実測記録だけ/);
});

test('text, seed and manual selected candidates also receive a handoff without invented runtime cases', () => {
  const item = run(buildSnapshot());
  const candidate = item.result.plan.queue.find(value => value.operator === 'custom');
  const result = buildHandoff(item.source, select(item, candidate), item.prepared);
  assert.equal(result.state, 'READY'); assert.deepEqual(result.packet.verification.acceptance_cases, []);
  assert.deepEqual(result.packet.verification.negative_cases, []); assert.equal(result.packet.verification.model_comparison, null);
  assert.match(result.packet.verification.recipe[0], /まだ作成していない/);
  const seedPlan = plan(item.source, { now, experiments: { schema_version: 1, experiments: [catalog.experiments[0]] }, collectionConfig: discoveryConfig });
  assert.equal(buildHandoff(item.source, { plan: seedPlan }, item.prepared).state, 'READY');
});

test('protected seed targets are returned for review without a packet', () => {
  const item = run();
  const seed = { ...catalog.experiments[0], paths: ['docs/evidence/README.md'] };
  const seedPlan = plan(item.source, { now, experiments: { schema_version: 1, experiments: [seed] }, collectionConfig: discoveryConfig });
  const result = buildHandoff(item.source, { plan: seedPlan }, item.prepared);
  assert.equal(result.state, 'REVIEW_PROTECTED_SOURCE'); assert.equal(result.packet, null);
});

test('occupied, closed, failed CI and overlapping PR selections remain blocked by existing planning', () => {
  const occupied = run(snapshot(), { occupied: true });
  assert.equal(buildHandoff(occupied.source, occupied.result, occupied.prepared).state, 'NO_SELECTION');
  const ci = run(snapshot({ ciRuns: 'failure' }));
  assert.equal(buildHandoff(ci.source, ci.result, ci.prepared).state, 'NO_SELECTION');
  const prs = run(snapshot({ openPrs: { 'ns7jp/server': [{ paths: ['scripts', 'tools'] }],
    'ns7jp/ns7jp': [{ paths: ['tools'] }], 'ns7jp/ns7jp.github.io': [{ paths: ['tools'] }] } }));
  assert.equal(buildHandoff(prs.source, prs.result, prs.prepared).state, 'NO_SELECTION');
  const closed = run();
  const all = closed.result.plan.queue.map(item => item.id);
  const blocked = { ...closed.result, plan: plan(closed.source, { now, closed: all,
    experiments: { schema_version: 1, experiments: closed.result.plan.queue }, collectionConfig: discoveryConfig }) };
  assert.equal(buildHandoff(closed.source, blocked, closed.prepared).state, 'NO_SELECTION');
});

test('handoff rechecks CI and PR metadata instead of trusting a previous PREPARABLE label', () => {
  const item = run(), selected = select(item);
  const ci = structuredClone(item.source); ci.repositories[0].ci_runs[0].conclusion = 'failure';
  assert.equal(buildHandoff(ci, selected, item.prepared).state, 'REVIEW_GATES');
  const pr = structuredClone(item.source); pr.repositories[0].open_prs.push({ number: 9, paths: [D1_SOURCE_PATH] });
  assert.equal(buildHandoff(pr, selected, item.prepared).state, 'REVIEW_GATES');
  const occupied = structuredClone(selected); occupied.plan.occupied = true;
  assert.equal(buildHandoff(item.source, occupied, item.prepared).state, 'REVIEW_GATES');
  const state = structuredClone(selected); state.plan.queue.find(value => value.id === state.plan.selected).state = 'CLOSED_BY_RECORD';
  assert.equal(buildHandoff(item.source, state, item.prepared).state, 'REVIEW_GATES');
});

test('handoff rejects changed bytes, changed candidate source URL and nonunique anchors', () => {
  const item = run(), selected = select(item);
  const changed = structuredClone(item.source); updateFile(changed, 'ns7jp/server', D1_SOURCE_PATH, sourceText + '\n# changed\n');
  assert.equal(buildHandoff(changed, selected, item.prepared).state, 'REVIEW_SOURCE');
  const url = structuredClone(selected); url.plan.queue.find(value => value.id === url.plan.selected).source += '?stale';
  assert.equal(buildHandoff(item.source, url, item.prepared).state, 'REVIEW_SOURCE');
  const marker = structuredClone(selected); marker.plan.queue.find(value => value.id === marker.plan.selected).marker = '#';
  assert.equal(buildHandoff(item.source, marker, item.prepared).state, 'REVIEW_SOURCE');
  const prepared = { ...item.prepared, evaluated_at: '2026-09-10T04:00:00Z' };
  assert.equal(buildHandoff(item.source, selected, prepared).state, 'NEEDS_REFRESH');
});

test('same source and same proposals do not create duplicate custom candidates or alter feedback', () => {
  const item = run(), before = structuredClone(item.state.feedback);
  const replay = discover(item.source, context(), item.state, { now, proposals: item.prepared.proposals });
  assert.deepEqual(replay.result.added, []); assert.deepEqual(replay.state.feedback, before);
  const result = buildHandoff(item.source, select(item), item.prepared);
  assert.equal(result.packet.verification.model_comparison.runtime_status, 'NOT_RUN');
  assert.ok(!Object.hasOwn(result.packet, 'results'));
});

test('a timeout before baseline comparison does not claim attached model cases', () => {
  const source = snapshot(); let tick = 0;
  const prepared = prepareBridge(source, { now, modelOptions: { budgetMs: 1, clock: () => tick += 10 } });
  assert.equal(prepared.model_result.stop_reason, 'TIME_LIMIT');
  const discovered = discover(source, context(), emptyRegistry(), { now, proposals: prepared.proposals });
  const candidate = discovered.result.plan.queue.find(item => item.source_path === D1_SOURCE_PATH && item.state === 'PREPARABLE');
  assert.ok(candidate);
  const selected = { ...discovered.result, plan: { ...discovered.result.plan, selected: candidate.id } };
  const handoff = buildHandoff(source, selected, prepared);
  assert.equal(handoff.state, 'READY');
  assert.equal(handoff.packet.verification.cases_data_kind, 'not-created');
  assert.equal(handoff.packet.verification.model_comparison, null);
  assert.deepEqual(handoff.packet.verification.acceptance_cases, []);
  assert.deepEqual(handoff.packet.verification.negative_cases, []);
});
