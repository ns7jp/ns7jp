// ループの試験。すべて一時ルートとメモリ上の合成スナップショットで行い、ネットワークと実在の .local には触れない。
// 取り込み試験で使う data_kind: 'measured' の値は検証器を通すためのテスト構築値であり、一時ルートの外へ出ない。
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runLoop, inspect, nextActions, validateLedger, readLedger, closedIds, decide, registerDraft, dismiss, init, demo, classifyError, statusView, renderSummary, STAMP, DIRS, REPO_ROOT } from '../loop.mjs';
import { buildSnapshot, seedRoot, HEADS, FIXTURE_NOW } from '../fixture.mjs';
import { draftProtocol, catalog } from '../../server-innovation/innovation.mjs';
import { digest } from '../../portfolio-audit/scripts/github.mjs';

globalThis.fetch = () => { throw new Error('network forbidden in tests'); };
const cli = fileURLToPath(new URL('../loop.mjs', import.meta.url));
const T = hhmm => `2026-09-08T${hhmm}:00.000Z`;
const NOW = () => FIXTURE_NOW;
const tmp = () => mkdtempSync(join(tmpdir(), 'portfolio-loop-'));
async function seeded() { const root = tmp(); await seedRoot(root, { now: () => T('03:10') }); return root; }
const use = (fn, seed = true) => async () => { const root = seed ? await seeded() : tmp(); try { await fn(root); } finally { rmSync(root, { recursive: true, force: true }); } };
const stamped = x => { for (const [k, v] of Object.entries(STAMP)) assert.equal(x[k], v, k); };
const dirs = p => existsSync(p) ? readdirSync(p) : [];

function measuredInbox(root, { candidate = catalog.experiments[0], values = [100, 70], dataKind = 'measured' } = {}) {
  const draft = draftProtocol({ ...candidate, base_sha: HEADS[candidate.repository] }, T('03:20'));
  const draftPath = join(root, 'draft.json'); writeFileSync(draftPath, JSON.stringify(draft));
  const contextPath = join(root, 'context.json'); writeFileSync(contextPath, JSON.stringify({ kind: 'test-construction', host: 'none', note: 'temp root only' }));
  const reg = registerDraft({ root, draftPath, candidateSha: 'e'.repeat(40), environmentId: 'test-env', scope: 'test-only comparison inside a temporary root', contextPath, now: T('03:30') });
  const protocol = JSON.parse(readFileSync(join(reg.directory, 'protocol.registered.json'), 'utf8'));
  const runs = []; let minute = 31;
  for (let pair = 1; pair <= protocol.pairs; pair++) for (const variant of ['baseline', 'candidate']) {
    const value = variant === 'baseline' ? values[0] : values[1], artifact = `${pair}-${variant}.json`;
    const body = JSON.stringify({ pair, variant, value, note: 'test construction' }); writeFileSync(join(reg.directory, 'evidence', artifact), body);
    runs.push({ pair, variant, revision: protocol[variant + '_sha'], environment_id: protocol.environment_id, context_sha256: protocol.context_sha256,
      started_at: T(`03:${minute}`), finished_at: T(`03:${minute + 1}`), status: 'PASS', value, guardrails: { functional_acceptance: 1, data_integrity: 1, unexpected_exposure: 0 },
      artifact: { path: artifact, sha256: digest(body) } });
    minute += 2;
  }
  writeFileSync(join(reg.directory, 'results.json'), JSON.stringify({ schema_version: 1, protocol_sha256: reg.protocol_sha256, data_kind: dataKind, runs }));
  return { reg, protocol };
}

test('one offline run covers audit, career, growth, context and discovery with fixed literals', use(async root => {
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  stamped(s);
  assert.equal(s.mode, 'OFFLINE_REPLAY'); assert.equal(s.outcome, 'PROCESSED'); assert.equal(s.demo, false);
  assert.equal(s.audit.execution_mode, 'REPLAY_NO_EDITS'); assert.equal(s.audit.draft_status, 'NONE');
  assert.equal(s.career.state, 'PLANNED'); assert.equal(s.career.planned_minutes, 390);
  assert.equal(s.growth.state, 'PLANNED'); assert.equal(s.growth.binding_status, 'NOT_BOUND');
  assert.equal(s.context.occupied, false); assert.deepEqual(s.context.basis, []); assert.deepEqual(s.context.closed, []);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(s.run_dir, 'context.json'), 'utf8'))).sort(), ['closed', 'occupied', 'reviewed_at', 'schema_version']);
  assert.equal(s.discovery.state, 'DISCOVERED'); assert.ok(s.discovery.selected); assert.equal(s.discovery.draft.status, 'NEW');
  assert.ok(s.discovery.queue.some(q => q.id === 'INV-001' && q.state === 'PREPARABLE'));
  assert.deepEqual(s.next_actions.map(a => a.code), ['BIND_SLOT', 'REGISTER_PROTOCOL', 'PREPARE_CANDIDATE']);
  assert.ok(!existsSync(join(root, DIRS.audit, 'pending.json')) && !existsSync(join(root, DIRS.audit, 'latest.json')));
  const md = readFileSync(s.report, 'utf8'); assert.match(md, /公開許可: なし/); assert.match(md, /実機試験: NOT RUN/);
  const latest = JSON.parse(readFileSync(join(root, DIRS.loop, 'latest.json'), 'utf8')); stamped(latest); assert.equal(latest.discovery.selected, s.discovery.selected);
}));
test('an identical rerun changes nothing, notifies nothing and drafts nothing new', use(async root => {
  const snapshot = buildSnapshot();
  const first = await runLoop({ root, offline: snapshot, now: NOW });
  const before = dirs(join(root, DIRS.discovery, 'runs')).length;
  const second = await runLoop({ root, offline: snapshot, now: NOW });
  assert.equal(second.notify, false);
  for (const step of ['audit', 'career', 'growth', 'discovery']) assert.equal(second[step].notify, false, step);
  assert.deepEqual(second.discovery.added, []); assert.equal(second.discovery.selected, first.discovery.selected);
  assert.equal(second.discovery.draft.status, 'EXISTING'); assert.equal(second.discovery.draft.path, first.discovery.draft.path);
  assert.equal(dirs(join(root, DIRS.discovery, 'runs')).filter(d => existsSync(join(root, DIRS.discovery, 'runs', d, 'protocol.draft.json'))).length, 1);
  assert.equal(dirs(join(root, DIRS.discovery, 'runs')).length, before + 1);
  assert.equal(second.next_actions.map(a => a.code).join(), first.next_actions.map(a => a.code).join());
}));
test('without a career profile the slot is unknown, nothing is selected and the first action is init', use(async root => {
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.career.state, 'NOT_INITIALIZED'); assert.equal(s.growth.state, 'SKIPPED_CAREER_NOT_INITIALIZED');
  assert.equal(s.context.occupied, true); assert.deepEqual(s.context.basis, ['CAREER_CAPACITY_UNKNOWN']);
  assert.equal(s.discovery.selected, null); assert.equal(s.next_actions[0].code, 'INIT_CAREER');
  assert.ok(s.next_actions.some(a => a.code === 'SLOT_OCCUPIED'));
  assert.ok(!existsSync(join(root, DIRS.career)));
  const free = await runLoop({ root, offline: buildSnapshot(), now: NOW, free: true });
  assert.equal(free.context.occupied, false); assert.ok(free.context.basis.includes('HUMAN_CONFIRMED_FREE_OVERRIDES')); assert.ok(free.discovery.selected);
  const forced = await runLoop({ root, offline: buildSnapshot(), now: NOW, free: true, occupied: true });
  assert.equal(forced.context.occupied, true); assert.ok(forced.context.basis.includes('FLAG_OCCUPIED'));
}, false));
test('a stale snapshot stops discovery and asks for a refresh instead of using old sources', use(async root => {
  const s = await runLoop({ root, offline: buildSnapshot({ observedAt: '2026-09-06T00:00:00.000Z' }), now: NOW });
  assert.equal(s.outcome, 'NEEDS_REFRESH'); assert.equal(s.discovery.state, 'SKIPPED_NEEDS_REFRESH'); assert.equal(s.discovery.selected, null);
  assert.ok(s.context.basis.includes('COLLECTION_INCOMPLETE')); assert.equal(s.next_actions[0].code, 'REFRESH_COLLECTION');
  assert.ok(!existsSync(join(root, DIRS.discovery, 'latest.json')));
  await assert.rejects(runLoop({ root, offline: buildSnapshot({ observedAt: '2026-09-09T00:00:00.000Z' }), now: NOW }), /future/);
}));
test('held and stale subsystem locks stop the run before anything is written and are never removed', use(async root => {
  const lock = join(root, DIRS.audit, 'cycle.lock'); mkdirSync(join(root, DIRS.audit), { recursive: true });
  writeFileSync(lock, JSON.stringify({ pid: process.pid, started: FIXTURE_NOW }));
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Another run holds/);
  const dead = spawnSync(process.execPath, ['-e', '0']).pid; // 終了済みプロセスの pid
  writeFileSync(lock, JSON.stringify({ pid: dead, started: FIXTURE_NOW }));
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Stale lock/);
  assert.ok(existsSync(lock)); assert.ok(!existsSync(join(root, DIRS.loop, 'runs')) && !existsSync(join(root, DIRS.audit, 'runs')));
  assert.equal(inspect(root, FIXTURE_NOW).locks[0].holder, 'DEAD');
  assert.equal(nextActions(inspect(root, FIXTURE_NOW))[0].code, 'LOCK_PRESENT');
  rmSync(lock);
}));
test('a corrupt pending draft is refused before the audit writes a run directory', use(async root => {
  mkdirSync(join(root, DIRS.audit), { recursive: true });
  writeFileSync(join(root, DIRS.audit, 'pending.json'), JSON.stringify({ id: 'x' }));
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Invalid pending draft/);
  assert.ok(!existsSync(join(root, DIRS.audit, 'runs')));
  assert.equal(classifyError('Audit pending: Invalid pending draft').code, 'CORRUPT_STATE');
}));
test('decisions ledger accepts only the documented shape and closes candidates from human decisions', use(async root => {
  const entry = { candidate_id: 'INV-001', decision: 'ADOPT', verdict: null, protocol_sha256: null, decided_at: FIXTURE_NOW, reason: 'test', resume_condition: null, source: 'human' };
  validateLedger({ schema_version: 1, entries: [entry] });
  for (const bad of [{ ...entry, extra: 1 }, { ...entry, decision: 'MAYBE' }, { ...entry, candidate_id: 'X-1' }, { ...entry, reason: 'a\nb' }, { ...entry, decision: 'PARK' }, { ...entry, source: 'intake' }, { ...entry, decision: null, source: 'intake' }])
    assert.throws(() => validateLedger({ schema_version: 1, entries: [bad] }), /Invalid decisions ledger/);
  assert.throws(() => decide({ root, id: 'INV-001', decision: 'PARK', reason: 'later', now: FIXTURE_NOW }), /resume-condition/);
  assert.throws(() => decide({ root, id: 'INV-999', decision: 'ADOPT', reason: 'x', now: FIXTURE_NOW }), /Unknown candidate/);
  assert.throws(() => decide({ root, id: 'INV-001', decision: 'YES', reason: 'x', now: FIXTURE_NOW }), /Decision must be/);
  const adopt = decide({ root, id: 'INV-001', decision: 'ADOPT', reason: 'adopted in test', now: FIXTURE_NOW }); stamped(adopt);
  assert.deepEqual(adopt.closed, ['INV-001']);
  decide({ root, id: 'INV-002', decision: 'PARK', reason: 'wait', resumeCondition: 'after the persistent host exists', now: FIXTURE_NOW });
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.deepEqual(s.context.closed, ['INV-001', 'INV-002']);
  assert.equal(s.discovery.queue.find(q => q.id === 'INV-001').state, 'CLOSED_BY_RECORD');
  decide({ root, id: 'INV-001', decision: 'ITERATE', reason: 'reopened', now: FIXTURE_NOW });
  assert.deepEqual(closedIds(readLedger(root), new Set(['INV-001', 'INV-002'])), ['INV-002']);
  const again = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.ok(again.context.basis.includes('EXPERIMENT_ITERATING')); assert.equal(again.context.occupied, true);
  writeFileSync(join(root, DIRS.loop, 'decisions.json'), '{"schema_version":1,"entries":[{"candidate_id":"INV-001"}]}');
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Invalid decisions ledger/);
}));
test('measured results in the inbox are taken before discovery, recorded once, and yield a follow-up candidate', use(async root => {
  const { reg } = measuredInbox(root);
  assert.equal(reg.candidate_id, 'INV-001'); stamped(reg);
  assert.ok(existsSync(join(reg.directory, 'results.template.json')));
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.intake.taken.length, 1); assert.equal(s.intake.taken[0].verdict, 'PROMISING'); assert.equal(s.intake.errors.length, 0);
  assert.ok(!existsSync(reg.directory)); assert.equal(dirs(join(root, DIRS.loop, 'done')).length, 1);
  const ledger = readLedger(root); assert.equal(ledger.entries.length, 1); assert.equal(ledger.entries[0].source, 'intake'); assert.equal(ledger.entries[0].verdict, 'PROMISING');
  const facts = inspect(root, FIXTURE_NOW);
  assert.equal(facts.discovery.counts.feedback, 1); assert.ok(facts.discovery.candidates.some(c => c.operator === 'vary'));
  assert.ok(s.discovery.added.length >= 1); assert.equal(facts.awaiting.length, 1);
  assert.ok(s.next_actions.some(a => a.code === 'DECIDE' && a.command.includes('INV-001')));
  assert.equal(s.context.occupied, false);
  decide({ root, id: 'INV-001', decision: 'ADOPT', reason: 'measured and reviewed in test', protocolSha256: reg.protocol_sha256, now: FIXTURE_NOW });
  assert.equal(inspect(root, FIXTURE_NOW).awaiting.length, 0);
  const md = renderSummary(s); assert.match(md, /取り込んだ実測結果/); assert.match(md, /PROMISING/);
}));
test('synthetic or incomplete inbox entries never reach the learning ledger and keep the slot occupied', use(async root => {
  const { reg } = measuredInbox(root, { dataKind: 'synthetic' });
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.intake.taken.length, 0); assert.equal(s.intake.errors.length, 1); assert.equal(s.intake.errors[0].code, 'SYNTHETIC_REJECTED');
  assert.ok(existsSync(reg.directory)); assert.equal(readLedger(root).entries.length, 0);
  assert.equal(inspect(root, FIXTURE_NOW).discovery.counts.feedback, 0);
  assert.ok(s.context.basis.includes('EXPERIMENT_INBOX_PENDING')); assert.equal(s.context.occupied, true); assert.equal(s.notify, true);
  assert.ok(s.next_actions.some(a => a.code === 'FIX_INBOX'));
  rmSync(join(reg.directory, 'results.json'));
  const t = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.deepEqual(t.intake.remaining, [{ id: reg.id, missing: ['results.json'] }]);
  assert.ok(t.next_actions.some(a => a.code === 'COMPLETE_INBOX'));
}));
test('register fills exactly the four NOT SET fields, hashes the context file and refuses reuse or placeholders', use(async root => {
  const draft = draftProtocol({ ...catalog.experiments[1], base_sha: HEADS['ns7jp/server'] }, T('03:20'));
  const draftPath = join(root, 'd.json'); writeFileSync(draftPath, JSON.stringify(draft));
  const contextPath = join(root, 'c.json'); writeFileSync(contextPath, '{"os":"none"}\n');
  const args = { root, draftPath, candidateSha: 'f'.repeat(40), environmentId: 'env-1', scope: 'scope text', contextPath, now: T('03:30') };
  assert.throws(() => registerDraft({ ...args, candidateSha: 'abc' }), /40-hex/);
  assert.throws(() => registerDraft({ ...args, scope: 'TODO later' }), /NOT SET or TODO/);
  assert.throws(() => registerDraft({ ...args, candidateSha: HEADS['ns7jp/server'] }), /distinct/);
  const r = registerDraft(args);
  const p = JSON.parse(readFileSync(join(r.directory, 'protocol.registered.json'), 'utf8'));
  assert.equal(p.status, 'REGISTERED'); assert.equal(p.candidate_sha, 'f'.repeat(40)); assert.equal(p.environment_id, 'env-1'); assert.equal(p.scope, 'scope text');
  assert.equal(p.context_sha256, digest(readFileSync(contextPath))); assert.equal(p.registered_at, T('03:30'));
  assert.equal(readFileSync(join(r.directory, 'evidence/context.json'), 'utf8'), '{"os":"none"}\n');
  assert.equal(JSON.parse(readFileSync(join(r.directory, 'results.template.json'), 'utf8')).protocol_sha256, r.protocol_sha256);
  assert.throws(() => registerDraft(args), /already registered|EEXIST/);
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.ok(!s.next_actions.some(a => a.code === 'REGISTER_PROTOCOL' && a.title.includes('INV-002')));
}));
test('dismiss applies only to dynamic candidates and mirrors a REJECT into the ledger once', use(async root => {
  await runLoop({ root, offline: buildSnapshot(), now: NOW });
  const dynamic = inspect(root, FIXTURE_NOW).discovery.candidates[0].id;
  assert.throws(() => dismiss({ root, id: 'INV-001', reason: 'seed', now: FIXTURE_NOW }), /dynamic/);
  assert.throws(() => dismiss({ root, id: dynamic, reason: '  ', now: FIXTURE_NOW }), /Reason/);
  const first = dismiss({ root, id: dynamic, reason: 'not worth a trial', now: FIXTURE_NOW }); stamped(first);
  assert.equal(first.duplicate, false); assert.equal(inspect(root, FIXTURE_NOW).discovery.counts.dismissals, 1);
  assert.equal(dismiss({ root, id: dynamic, reason: 'again', now: FIXTURE_NOW }).duplicate, true);
  const ledger = readLedger(root); assert.equal(ledger.entries.length, 1); assert.equal(ledger.entries[0].decision, 'REJECT');
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW }); assert.ok(s.context.closed.includes(dynamic));
}));
test('init creates the private plan and ledger once, demo never touches the repository root', use(async root => {
  rmSync(join(root, '.local'), { recursive: true, force: true });
  const created = await init({ root, hours: '8', now: NOW }); stamped(created);
  assert.equal(created.career, 'CREATED'); assert.equal(created.decisions, 'CREATED');
  assert.equal(JSON.parse(readFileSync(join(root, DIRS.career, 'profile.json'), 'utf8')).weekly_minutes, 480);
  const again = await init({ root, now: NOW }); assert.equal(again.career, 'ALREADY_INITIALIZED'); assert.equal(again.decisions, 'EXISTS');
  const s = await demo({ now: NOW }); stamped(s);
  try {
    assert.equal(s.demo, true); assert.equal(s.mode, 'OFFLINE_REPLAY'); assert.equal(s.outcome, 'PROCESSED');
    assert.ok(s.root.startsWith(tmpdir())); assert.notEqual(s.root, REPO_ROOT);
    assert.ok(readdirSync(join(s.root, DIRS.loop)).some(f => f.endsWith('.synthetic.json')));
    assert.match(readFileSync(s.report, 'utf8'), /合成データによるデモ実行/);
  } finally { rmSync(s.root, { recursive: true, force: true }); }
}));
test('status is read-only and reports freshness, capacity, awaiting decisions and sizes', use(async root => {
  const before = statusView(root, FIXTURE_NOW); stamped(before);
  assert.equal(before.last_run, null); assert.equal(before.next_actions[0].code, 'BIND_SLOT'); assert.match(before.text, /次の一手/);
  await runLoop({ root, offline: buildSnapshot(), now: NOW });
  const after = statusView(root, '2026-09-08T05:00:00.000Z');
  assert.equal(after.audit.latest.source, 'REPLAY'); assert.equal(after.audit.snapshot_age_hours, 1); assert.equal(after.audit.fresh, true);
  assert.equal(after.last_run.outcome, 'PROCESSED'); assert.ok(after.discovery.counts.candidates > 0); assert.ok(after.sizes.discovery.files > 0);
  assert.ok(!existsSync(join(root, DIRS.loop, 'runs')) || readdirSync(join(root, DIRS.loop, 'runs')).length === 1);
  const stale = statusView(root, '2026-09-10T05:00:00.000Z'); assert.equal(stale.audit.fresh, false);
}));
test('proposals are limited and errors are classified without changing the original message', use(async root => {
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW, proposals: [1, 2, 3, 4, 5] }), /At most four/);
  await assert.rejects(runLoop({ root, offline: [], now: NOW }), /Invalid offline snapshot/);
  for (const [message, code] of [['EEXIST: file already exists', 'LOCKED'], ['Stale lock x', 'STALE_LOCK'], ['ENOENT: no such file or directory, stat profile.json', 'NOT_INITIALIZED'],
    ['Refresh work context within 24 hours', 'TIME'], ['Missing file: .local/server-engineer/a/progress.json', 'LEARNER_UNAVAILABLE'], ['Synthetic results cannot update', 'SYNTHETIC_REJECTED'],
    ['Feedback capacity reached', 'CAPACITY'], ['Invalid work context', 'CONTEXT'], ['Discovery state integrity mismatch', 'CORRUPT_STATE'], ['something else', 'INVALID_INPUT']])
    assert.equal(classifyError(message).code, code, message);
}));
test('CLI exit codes: 0 processed, 3 needs refresh, 2 stopped; JSON output keeps the literals', use(async root => {
  const snap = join(root, 'snap.json'); writeFileSync(snap, JSON.stringify(buildSnapshot({ observedAt: new Date(Date.now() - 3600000).toISOString() })));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.equal(run('--help').status, 0); assert.match(run().stdout, /Usage/);
  const ok = run('run', '--root', root, '--offline', snap, '--json'); assert.equal(ok.status, 0, ok.stderr);
  const summary = JSON.parse(ok.stdout); stamped(summary); assert.equal(summary.mode, 'OFFLINE_REPLAY'); assert.equal(summary.career.state, 'PLANNED');
  const card = run('weekly', '--root', root, '--offline', snap); assert.equal(card.status, 0); assert.match(card.stdout, /ループ完了: PROCESSED/); assert.match(card.stdout, /公開許可: なし/);
  const old = join(root, 'old.json'); writeFileSync(old, JSON.stringify(buildSnapshot({ observedAt: '2026-09-01T00:00:00.000Z' })));
  const stale = run('run', '--root', root, '--offline', old); assert.equal(stale.status, 3); assert.match(stale.stdout, /NEEDS_REFRESH/);
  const bad = run('nope', '--root', root); assert.equal(bad.status, 2); assert.match(bad.stderr, /Loop stopped: Unknown command/); assert.match(bad.stderr, /\[USAGE\]/);
  const flag = run('run', '--root', root, '--bogus'); assert.equal(flag.status, 2); assert.match(flag.stderr, /Loop stopped/);
  const status = run('status', '--root', root, '--json'); assert.equal(status.status, 0); stamped(JSON.parse(status.stdout));
  const done = run('done', 'INV-003', 'PARK', 'wait for host', '--resume-condition', 'host exists', '--root', root); assert.equal(done.status, 0, done.stderr); assert.match(done.stdout, /INV-003/);
  const noCond = run('done', 'INV-004', 'PARK', 'wait', '--root', root); assert.equal(noCond.status, 2); assert.match(noCond.stderr, /resume-condition/);
}));
