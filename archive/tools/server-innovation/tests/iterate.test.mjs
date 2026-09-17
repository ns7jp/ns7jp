import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runIteration, latestSnapshot, ITERATION_DIR, MAX_CACHED_RUNS } from '../iterate.mjs';
import { iterateModel } from '../iterate-model.mjs';
import { D1_SOURCE_PATH } from '../probes.mjs';
import { sourceText } from '../fixtures/d1-model-source.mjs';
import { buildSnapshot, seedRoot, FIXTURE_NOW } from '../../portfolio-loop/fixture.mjs';
import { main } from '../../portfolio-loop/loop.mjs';
import { checkIn } from '../../autonomous-prosperity/prosperity.mjs';

globalThis.fetch = () => { throw Error('Network forbidden in iteration tests'); };
const NOW = FIXTURE_NOW;
const snapshot = (observedAt) => buildSnapshot({ d1Source: sourceText, ...(observedAt ? { observedAt } : {}) });
const write = (root, relative, value) => {
  const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value));
};
const temporary = fn => async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'innovation-fast-test-'));
  try { await fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
};
const stamped = result => {
  assert.equal(result.execution_scope, 'local-model'); assert.equal(result.data_kind, 'synthetic');
  assert.equal(result.runtime_status, 'NOT_RUN'); assert.equal(result.authorization, 'NONE'); assert.equal(result.publication_allowed, false);
};

test('fresh model trial is cached, repeated without network or measured feedback writes', temporary(async root => {
  let calls = 0; const engine = (...args) => { calls++; return iterateModel(...args); };
  const first = await runIteration({ root, snapshot: snapshot(), now: NOW, engine });
  assert.equal(first.status, 'CONVERGED'); stamped(first); assert.equal(first.notify, true);
  assert.equal(first.summary.baseline_mismatches, 10); assert.equal(first.summary.training_mismatches, 0);
  const again = await runIteration({ root, snapshot: snapshot('2026-09-08T03:30:00.000Z'), now: NOW, engine });
  assert.equal(calls, 1); assert.equal(again.cache.hit, true); assert.equal(again.metrics.engine_executed, false);
  assert.equal(again.metrics.network_requests, 0); assert.equal(again.notify, false); assert.equal(again.signature, first.signature);
  assert.equal(fs.readdirSync(path.join(root, ITERATION_DIR, 'runs')).length, 1);
  assert.equal(fs.existsSync(path.join(root, '.local/server-innovation')), false);
  assert.equal(fs.existsSync(path.join(root, '.local/engineer-career')), false);
}));
test('changed seed or round limit invalidates the cache and gives a bounded retry', temporary(async root => {
  const first = await runIteration({ root, snapshot: snapshot(), now: NOW, rounds: 1 });
  assert.equal(first.status, 'ROUND_LIMIT'); assert.equal(first.summary.rounds, 1);
  const second = await runIteration({ root, snapshot: snapshot(), now: NOW, rounds: 5, seed: 42 });
  assert.equal(second.cache.hit, false); assert.notEqual(second.cache.key, first.cache.key);
  assert.equal(second.status, 'CONVERGED');
}));
test('cache cannot bypass freshness, integrity, or unsupported source checks', temporary(async root => {
  await runIteration({ root, snapshot: snapshot(), now: NOW });
  const stale = await runIteration({ root, snapshot: snapshot('2020-01-01T00:00:00Z'), now: NOW });
  assert.equal(stale.status, 'NEEDS_REFRESH'); assert.equal(stale.metrics.engine_executed, false);
  const broken = snapshot(); broken.repositories[0].files[Object.keys(broken.repositories[0].files)[0]].text += 'tampered';
  await assert.rejects(runIteration({ root, snapshot: broken, now: NOW }), /integrity/);
  const unsupported = await runIteration({ root, snapshot: buildSnapshot(), now: NOW });
  assert.equal(unsupported.status, 'MODEL_UNSUPPORTED'); assert.equal(unsupported.summary.baseline_cases, 0);
}));
test('a missing marker with captured content cannot reuse a successful model cache', temporary(async root => {
  const first = await runIteration({ root, snapshot: snapshot(), now: NOW });
  const cachedPath = path.join(root, first.cache.result_path), before = fs.readFileSync(cachedPath);
  for (const tamper of [false, true]) {
    const input = snapshot();
    const source = input.repositories.find(repo => repo.full_name === 'ns7jp/server').files[D1_SOURCE_PATH];
    source.missing = true;
    if (tamper) source.text += '\nchanged source with the old hash';
    await assert.rejects(runIteration({ root, snapshot: input, now: NOW,
      engine: () => { throw Error('The invalid source must be rejected before model execution'); } }), /Missing model source/);
  }
  assert.deepEqual(fs.readFileSync(cachedPath), before);
  assert.equal(fs.readdirSync(path.join(root, ITERATION_DIR, 'runs')).length, 1);
}));
test('a clean missing source is unsupported and never inherits a successful cached comparison', temporary(async root => {
  const first = await runIteration({ root, snapshot: snapshot(), now: NOW });
  const input = snapshot();
  input.repositories.find(repo => repo.full_name === 'ns7jp/server').files[D1_SOURCE_PATH] = { missing: true };
  const missing = await runIteration({ root, snapshot: input, now: NOW });
  assert.equal(missing.status, 'MODEL_UNSUPPORTED'); assert.equal(missing.cache.hit, false);
  assert.notEqual(missing.cache.key, first.cache.key); assert.equal(missing.summary.baseline_cases, 0);
  assert.equal(missing.summary.heldout_status, 'NOT_RUN'); stamped(missing);
  assert.equal(fs.existsSync(path.join(root, first.cache.result_path)), true);
}));
test('identical settings retry timeouts, preserve each history, then reuse a completed result quietly', temporary(async root => {
  let calls = 0;
  const engine = (input, settings) => {
    calls++;
    let tick = 0;
    return iterateModel(input, { ...settings, clock: calls <= 2 ? () => tick++ === 0 ? 0 : settings.budgetMs : () => 0 });
  };
  const run = () => runIteration({ root, snapshot: snapshot(), now: NOW, engine });
  const first = await run();
  assert.equal(first.status, 'TIME_LIMIT'); assert.equal(first.notify, true); assert.equal(first.cache.hit, false);
  const firstBytes = fs.readFileSync(path.join(root, first.cache.result_path));
  const second = await run();
  assert.equal(calls, 2); assert.equal(second.status, 'TIME_LIMIT'); assert.equal(second.cache.hit, false);
  assert.equal(second.cache.key, first.cache.key); assert.notEqual(second.cache.result_path, first.cache.result_path);
  assert.equal(second.notify, false);
  const secondBytes = fs.readFileSync(path.join(root, second.cache.result_path));
  const completed = await run();
  assert.equal(calls, 3); assert.equal(completed.status, 'CONVERGED'); assert.equal(completed.cache.hit, false);
  assert.equal(completed.cache.key, first.cache.key); assert.equal(completed.notify, true);
  const cached = await run();
  assert.equal(calls, 3); assert.equal(cached.status, 'CONVERGED'); assert.equal(cached.cache.hit, true);
  assert.equal(cached.cache.result_path, completed.cache.result_path); assert.equal(cached.notify, false);
  assert.equal(fs.readdirSync(path.join(root, ITERATION_DIR, 'runs')).length, 3);
  assert.deepEqual(fs.readFileSync(path.join(root, first.cache.result_path)), firstBytes);
  assert.deepEqual(fs.readFileSync(path.join(root, second.cache.result_path)), secondBytes);
}));
test('a corrupt cached result is rejected without re-running or deleting history', temporary(async root => {
  const first = await runIteration({ root, snapshot: snapshot(), now: NOW });
  const file = path.join(root, first.cache.result_path), cached = JSON.parse(fs.readFileSync(file));
  cached.result.training.mismatches = 999; fs.writeFileSync(file, JSON.stringify(cached));
  await assert.rejects(runIteration({ root, snapshot: snapshot(), now: NOW, engine: () => { throw Error('Must not execute'); } }), /integrity/);
  assert.equal(JSON.parse(fs.readFileSync(file)).result.training.mismatches, 999);
}));
test('newest incomplete observation stops instead of silently using older success', temporary(async root => {
  write(root, '.local/portfolio-operations/latest.json', { evaluated_at: '2026-09-08T03:00:00Z', report: path.join(root, '.local/portfolio-operations/runs/live/report.md') });
  write(root, '.local/portfolio-operations/runs/live/snapshot.json', snapshot());
  const incomplete = snapshot(); incomplete.collection_complete = false;
  write(root, '.local/portfolio-operations/replay-latest.json', { evaluated_at: '2026-09-08T03:30:00Z', report: path.join(root, '.local/portfolio-operations/runs/replay/report.md') });
  write(root, '.local/portfolio-operations/runs/replay/snapshot.json', incomplete);
  assert.equal(latestSnapshot(root, NOW).collection_complete, false);
  const report = await runIteration({ root, now: NOW }); assert.equal(report.status, 'NEEDS_REFRESH');
}));
test('missing snapshot needs one normal run and escaped pointers are rejected', temporary(async root => {
  const missing = await runIteration({ root, now: NOW }); assert.equal(missing.status, 'NEEDS_REFRESH');
  assert.equal(missing.input_data_kind, 'unknown');
  write(root, '.local/portfolio-operations/latest.json', { evaluated_at: NOW, report: path.join(root, 'outside/report.md') });
  assert.throws(() => latestSnapshot(root, NOW), /outside/);
}));
test('pause and reduced-load confirmation are respected without modifying the profile', temporary(async root => {
  await seedRoot(root, { now: () => NOW });
  const profilePath = path.join(root, '.local/engineer-career/profile.json'), before = fs.readFileSync(profilePath);
  await checkIn(root, 'paused', NOW);
  assert.equal((await runIteration({ root, snapshot: snapshot(), now: NOW })).status, 'PAUSED');
  await checkIn(root, 'reduced', NOW);
  assert.equal((await runIteration({ root, snapshot: snapshot(), now: NOW })).status, 'REVIEW_LOAD');
  assert.deepEqual(fs.readFileSync(profilePath), before);
}));
test('locks remain intact, and storage limit does not remove records or block valid cache reuse', temporary(async root => {
  write(root, '.local/portfolio-operations/cycle.lock', { pid: 1 });
  assert.equal((await runIteration({ root, snapshot: snapshot(), now: NOW })).status, 'LOCKED');
  assert.equal(fs.existsSync(path.join(root, '.local/portfolio-operations/cycle.lock')), true);
  fs.unlinkSync(path.join(root, '.local/portfolio-operations/cycle.lock'));
  const first = await runIteration({ root, snapshot: snapshot(), now: NOW });
  for (let i = 1; i < MAX_CACHED_RUNS; i++) write(root, `${ITERATION_DIR}/runs/filler-${i}.json`, {});
  assert.equal((await runIteration({ root, snapshot: snapshot(), now: NOW })).cache.hit, true);
  assert.equal((await runIteration({ root, snapshot: snapshot(), now: NOW, seed: 1 })).status, 'ARCHIVE_REVIEW');
  assert.equal(fs.existsSync(path.join(root, first.cache.result_path)), true);
  write(root, ITERATION_DIR + '/run.lock', { pid: 1 });
  await assert.rejects(runIteration({ root, snapshot: snapshot(), now: NOW }), /EEXIST/);
  assert.equal(fs.existsSync(path.join(root, ITERATION_DIR, 'run.lock')), true);
}));
test('existing run integrates trials and iterate reuses the collected observation', temporary(async root => {
  await seedRoot(root);
  const input = snapshot(new Date().toISOString()), file = path.join(root, 'input.json'); fs.writeFileSync(file, JSON.stringify(input));
  const weekly = await main(['run', '--root', root, '--offline', file, '--json']);
  assert.equal(weekly.exitCode, 0); const first = JSON.parse(weekly.text);
  assert.equal(first.innovation_iteration.status, 'CONVERGED'); assert.equal(first.notify, true);
  const fast = await main(['iterate', '--root', root, '--json']); const second = JSON.parse(fast.text);
  assert.equal(second.cache.hit, true); assert.equal(second.notify, false); stamped(second);
}));
test('CLI rejects bad budgets before the weekly loop writes or collects', temporary(async root => {
  for (const args of [['run', '--rounds', '9'], ['iterate', '--budget-ms', '0'], ['iterate', '--seed', '-1'],
    ['status', '--rounds', '2'], ['iterate', '--free'], ['iterate-demo', '--root', root]]) {
    await assert.rejects(main([...args, ...(args.includes('--root') ? [] : ['--root', root])]));
  }
  assert.equal(fs.existsSync(path.join(root, '.local')), false);
}));

test('oversized explicit snapshots are rejected before parsing or private writes', temporary(async root => {
  const file = path.join(root, 'oversized.json'); fs.writeFileSync(file, Buffer.alloc(8 * 1024 * 1024 + 1, ' '));
  for (const command of ['run', 'iterate']) await assert.rejects(main([command, '--root', root, '--offline', file]), /8 MiB/);
  assert.equal(fs.existsSync(path.join(root, '.local')), false);
}));
test('real CLI demo completes in a temporary root with synthetic provenance', () => {
  const cli = fileURLToPath(new URL('../../portfolio-loop/loop.mjs', import.meta.url));
  const processResult = spawnSync(process.execPath, [cli, 'iterate-demo', '--json'], { encoding: 'utf8', env: { ...process.env, PORTFOLIO_LOOP_NO_NETWORK: '1' } });
  assert.equal(processResult.status, 0, processResult.stderr);
  const result = JSON.parse(processResult.stdout);
  try { assert.equal(result.demo, true); assert.equal(result.status, 'CONVERGED'); stamped(result); }
  finally { fs.rmSync(result.demo_root, { recursive: true, force: true }); }
});
