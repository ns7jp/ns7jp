// ループの試験。すべて一時ルートとメモリ上の合成スナップショットで行い、ネットワークと実在の .local には触れない。
// 取り込み試験で使う data_kind: 'measured' の値は検証器を通すためのテスト構築値であり、一時ルートの外へ出ない。
// fetch の無効化はこのプロセス内のライブラリ呼び出しに効く。spawn する CLI 試験は --offline と PORTFOLIO_LOOP_NO_NETWORK で守る。
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runLoop, inspect, nextActions, validateLedger, readLedger, closedIds, decide, registerDraft, dismiss, init, bindSlot, demo, classifyError, statusView, renderSummary, renderCard, STAMP, FOOTER, DIRS, REPO_ROOT } from '../loop.mjs';
import { buildSnapshot, updateFile, seedRoot, HEADS, FIXTURE_NOW } from '../fixture.mjs';
import { draftProtocol, catalog } from '../../server-innovation/innovation.mjs';
import { discoveryConfig } from '../../server-innovation/discovery.mjs';
import { digest } from '../../portfolio-audit/scripts/github.mjs';

globalThis.fetch = () => { throw new Error('network forbidden in tests'); };
const cli = fileURLToPath(new URL('../loop.mjs', import.meta.url));
const T = hhmm => `2026-09-08T${hhmm}:00.000Z`;
const NOW = () => FIXTURE_NOW;
const DEAD_PID = 2 ** 31 - 1; // どの OS でも割り当てられない値
const tmp = () => mkdtempSync(join(tmpdir(), 'portfolio-loop-'));
async function seeded(now = () => T('03:10')) { const root = tmp(); await seedRoot(root, { now }); return root; }
const use = (fn, seed = true) => async () => { const root = seed ? await seeded() : tmp(); try { await fn(root); } finally { rmSync(root, { recursive: true, force: true }); } };
const stamped = x => { for (const [k, v] of Object.entries(STAMP)) assert.equal(x[k], v, k); };
const dirs = p => existsSync(p) ? readdirSync(p) : [];
const codes = s => s.next_actions.map(a => a.code);
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, PORTFOLIO_LOOP_NO_NETWORK: '1' } });

function measuredInbox(root, { candidate = catalog.experiments[0], values = [100, 70], dataKind = 'measured', pairs = null } = {}) {
  const draft = draftProtocol({ ...candidate, base_sha: HEADS[candidate.repository] }, T('03:20'));
  const draftPath = join(root, 'draft.json'); writeFileSync(draftPath, JSON.stringify(draft));
  const contextPath = join(root, 'context.json'); writeFileSync(contextPath, JSON.stringify({ kind: 'test-construction', host: 'none', note: 'temp root only' }));
  const reg = registerDraft({ root, draftPath, candidateSha: 'e'.repeat(40), environmentId: 'test-env', scope: 'test-only comparison inside a temporary root', contextPath, now: T('03:30') });
  const protocol = JSON.parse(readFileSync(join(reg.directory, 'protocol.registered.json'), 'utf8'));
  const runs = []; let minute = 31;
  for (let pair = 1; pair <= (pairs ?? protocol.pairs); pair++) for (const variant of ['baseline', 'candidate']) {
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
  assert.equal(s.mode, 'OFFLINE_REPLAY'); assert.equal(s.outcome, 'PROCESSED'); assert.equal(s.demo, false); assert.equal(s.synthetic, true);
  assert.equal(s.audit.execution_mode, 'REPLAY_NO_EDITS'); assert.equal(s.audit.draft_status, 'NONE'); assert.deepEqual(s.audit.errors, []);
  assert.equal(s.career.state, 'PLANNED'); assert.equal(s.career.planned_minutes, 390);
  assert.equal(s.growth.state, 'PLANNED'); assert.equal(s.growth.binding_status, 'NOT_BOUND');
  assert.equal(s.context.occupied, false); assert.deepEqual(s.context.basis, []); assert.deepEqual(s.context.closed, []);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(s.run_dir, 'context.json'), 'utf8'))).sort(), ['closed', 'occupied', 'reviewed_at', 'schema_version']);
  assert.equal(s.discovery.state, 'DISCOVERED'); assert.ok(s.discovery.selected); assert.equal(s.discovery.draft.status, 'NEW');
  assert.ok(s.discovery.queue.some(q => q.id === 'INV-001' && q.state === 'PREPARABLE'));
  assert.deepEqual(codes(s), ['BIND_SLOT', 'REGISTER_PROTOCOL', 'PREPARE_CANDIDATE']);
  assert.ok(!existsSync(join(root, DIRS.audit, 'pending.json')) && !existsSync(join(root, DIRS.audit, 'latest.json')));
  const md = readFileSync(s.report, 'utf8'); assert.match(md, /公開許可: なし/); assert.match(md, /実機試験: NOT RUN/); assert.match(md, /合成スナップショットの再生/); assert.ok(md.includes(FOOTER));
  assert.ok(renderCard(s).includes(FOOTER));
  const latest = JSON.parse(readFileSync(join(root, DIRS.loop, 'latest.json'), 'utf8')); stamped(latest); assert.equal(latest.discovery.selected, s.discovery.selected);
  // career と growth の記録時刻はループの評価時刻と同じ
  assert.equal(JSON.parse(readFileSync(join(root, DIRS.career, 'latest.json'), 'utf8')).at, FIXTURE_NOW);
  assert.equal(JSON.parse(readFileSync(join(root, DIRS.growth, 'latest.json'), 'utf8')).at, FIXTURE_NOW);
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
  assert.deepEqual(codes(second), codes(first));
}));
test('without a career profile the slot is unknown, nothing is selected and status agrees with run', use(async root => {
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.career.state, 'NOT_INITIALIZED'); assert.equal(s.growth.state, 'SKIPPED_CAREER_NOT_INITIALIZED');
  assert.equal(s.context.occupied, true); assert.deepEqual(s.context.basis, ['CAREER_CAPACITY_UNKNOWN']);
  assert.equal(s.discovery.selected, null); assert.equal(codes(s)[0], 'INIT_CAREER'); assert.ok(codes(s).includes('SLOT_OCCUPIED'));
  assert.ok(!existsSync(join(root, DIRS.career)));
  assert.deepEqual(statusView(root, FIXTURE_NOW).next_actions.map(a => a.code), codes(s));
  assert.ok(s.next_actions[0].command.endsWith(`--root ${root}`));
  const free = await runLoop({ root, offline: buildSnapshot(), now: NOW, free: true });
  assert.equal(free.context.occupied, false); assert.ok(free.context.basis.includes('HUMAN_CONFIRMED_FREE_OVERRIDES')); assert.ok(free.discovery.selected);
  const forced = await runLoop({ root, offline: buildSnapshot(), now: NOW, free: true, occupied: true });
  assert.equal(forced.context.occupied, true); assert.ok(forced.context.basis.includes('FLAG_OCCUPIED'));
}, false));
test('a clean slot confirmed free records the plain basis; open PRs and CI failures occupy it', use(async root => {
  const free = await runLoop({ root, offline: buildSnapshot(), now: NOW, free: true });
  assert.deepEqual(free.context.basis, ['HUMAN_CONFIRMED_FREE']); assert.equal(free.context.occupied, false);
  const pr = await runLoop({ root, offline: buildSnapshot({ openPrs: { 'ns7jp/server': [{ number: 7, paths: ['ansible/site.yml'] }] } }), now: NOW });
  assert.deepEqual(pr.context.basis, ['AUDIT_URGENT_OR_PR_REVIEW']); assert.ok(pr.context.basis_findings.some(id => id.startsWith('OPEN_PR:'))); assert.equal(pr.discovery.selected, null);
  assert.ok(codes(pr).includes('SLOT_OCCUPIED'));
  const ci = await runLoop({ root, offline: buildSnapshot({ ciRuns: 'failure' }), now: NOW });
  assert.deepEqual(ci.context.basis, ['AUDIT_URGENT_OR_PR_REVIEW']); assert.ok(ci.context.basis_findings.some(id => id.startsWith('CI_FAILURE:')));
}));
test('probe rows that changed and missing sources become review actions, not slot occupation', use(async root => {
  const changed = buildSnapshot();
  const ledger = changed.repositories[0].files['docs/evidence/README.md'].text;
  updateFile(changed, 'ns7jp/server', 'docs/evidence/README.md', ledger.replace(`${discoveryConfig.probes[0].prefix} NOT RUN |`, `${discoveryConfig.probes[0].prefix} PASS |`));
  const s = await runLoop({ root, offline: changed, now: NOW });
  assert.equal(s.context.occupied, false); assert.ok(s.audit.findings.some(f => f.rule === 'SOURCE_REVIEW' && f.priority === 1 && f.state === 'NEEDS_REVIEW'));
  assert.ok(codes(s).includes('REVIEW_AUDIT_FINDING')); assert.ok(s.discovery.selected);
  const missing = await runLoop({ root, offline: buildSnapshot({ texts: { 'ns7jp/server:docs/build-package-wsus/README.md': null } }), now: NOW });
  assert.equal(missing.context.occupied, false); assert.ok(missing.next_actions.some(a => a.code === 'REVIEW_AUDIT_FINDING' && a.detail.startsWith('SOURCE_MISSING:')));
}));
test('a stale snapshot stops discovery and asks for a refresh instead of using old sources', use(async root => {
  const s = await runLoop({ root, offline: buildSnapshot({ observedAt: '2026-09-06T00:00:00.000Z' }), now: NOW });
  assert.equal(s.outcome, 'NEEDS_REFRESH'); assert.equal(s.discovery.state, 'SKIPPED_NEEDS_REFRESH'); assert.equal(s.discovery.selected, null);
  assert.deepEqual(s.context.basis, ['COLLECTION_INCOMPLETE']); assert.equal(codes(s)[0], 'REFRESH_COLLECTION');
  assert.ok(!existsSync(join(root, DIRS.discovery, 'latest.json')));
  assert.equal(statusView(root, FIXTURE_NOW).audit.fresh, false);
  await assert.rejects(runLoop({ root, offline: buildSnapshot({ observedAt: '2026-09-09T00:00:00.000Z' }), now: NOW }), /future/);
}));
test('collection errors are surfaced in the summary, card and refresh action', use(async root => {
  const broken = buildSnapshot(); broken.collection_complete = false; broken.errors = [{ repository: 'ns7jp/server', message: 'GitHub HTTP 401' }];
  const s = await runLoop({ root, offline: broken, now: NOW });
  assert.equal(s.outcome, 'NEEDS_REFRESH'); assert.deepEqual(s.audit.errors, ['ns7jp/server: GitHub HTTP 401']);
  assert.match(s.next_actions[0].title, /GitHub HTTP 401/); assert.match(s.next_actions[0].title, /GITHUB_TOKEN/);
  assert.match(renderCard(s), /収集エラー: ns7jp\/server: GitHub HTTP 401/); assert.match(readFileSync(s.report, 'utf8'), /## 収集エラー/);
}));
test('held, stale and unreadable subsystem locks stop the run before anything is written and are never removed', use(async root => {
  for (const [dir, name] of [[DIRS.audit, 'cycle.lock'], [DIRS.career, 'plan.lock'], [DIRS.growth, 'plan.lock'], [DIRS.discovery, 'discovery.lock']]) {
    const lock = join(root, dir, name); mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(lock, JSON.stringify({ pid: process.pid, started: FIXTURE_NOW }));
    await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Another run holds/);
    writeFileSync(lock, JSON.stringify({ pid: DEAD_PID, started: FIXTURE_NOW }));
    await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Stale lock/);
    writeFileSync(lock, '');
    await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /present but unreadable/);
    assert.equal(classifyError('Lock x is present but unreadable; wait').code, 'LOCKED');
    assert.ok(existsSync(lock)); assert.ok(!existsSync(join(root, DIRS.loop, 'runs')) && !existsSync(join(root, DIRS.audit, 'runs')));
    assert.equal(inspect(root, FIXTURE_NOW).locks[0].holder, 'UNREADABLE'); assert.equal(nextActions(inspect(root, FIXTURE_NOW))[0].code, 'LOCK_PRESENT');
    rmSync(lock);
  }
}));
test('a corrupt pending draft is refused before the audit writes a run directory; a valid one occupies the slot', use(async root => {
  mkdirSync(join(root, DIRS.audit), { recursive: true });
  writeFileSync(join(root, DIRS.audit, 'pending.json'), JSON.stringify({ id: 'x' }));
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Invalid pending draft/);
  assert.ok(!existsSync(join(root, DIRS.audit, 'runs')));
  assert.equal(classifyError('Audit pending: Invalid pending draft').code, 'CORRUPT_STATE');
  writeFileSync(join(root, DIRS.audit, 'pending.json'), JSON.stringify({ id: 'CLAIM_BOUNDARY:ns7jp/ns7jp:el9-foundation', before_sha256: 'a'.repeat(64), status: 'AWAITING_REVIEW', folder: '/nowhere' }));
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.deepEqual(s.context.basis, ['AUDIT_DRAFT_PENDING', 'AUDIT_PENDING_FILE']); assert.equal(s.audit.draft_status, 'PENDING_REQUIRES_REVIEW');
  assert.ok(codes(s).includes('REVIEW_PENDING_DRAFT')); assert.ok(existsSync(join(root, DIRS.audit, 'pending.json')));
}));
test('decisions ledger accepts only the documented shape, survives a BOM, and closes candidates from human decisions', use(async root => {
  const entry = { candidate_id: 'INV-001', decision: 'ADOPT', verdict: null, protocol_sha256: null, decided_at: FIXTURE_NOW, reason: 'test', resume_condition: null, source: 'human' };
  validateLedger({ schema_version: 1, entries: [entry] });
  for (const bad of [{ ...entry, extra: 1 }, { ...entry, decision: 'MAYBE' }, { ...entry, candidate_id: 'X-1' }, { ...entry, reason: 'a\nb' }, { ...entry, decision: 'PARK' }, { ...entry, source: 'intake' }, { ...entry, decision: null, source: 'intake' }, { ...entry, decision: null, verdict: 'PROMISING', source: 'intake' }])
    assert.throws(() => validateLedger({ schema_version: 1, entries: [bad] }), /Invalid decisions ledger/);
  assert.throws(() => decide({ root, id: 'INV-001', decision: 'PARK', reason: 'later', now: FIXTURE_NOW }), /resume-condition/);
  assert.throws(() => decide({ root, id: 'INV-999', decision: 'ADOPT', reason: 'x', now: FIXTURE_NOW }), /Unknown candidate/);
  assert.throws(() => decide({ root, id: 'INV-001', decision: 'YES', reason: 'x', now: FIXTURE_NOW }), /Decision must be/);
  const adopt = decide({ root, id: 'INV-001', decision: 'ADOPT', reason: 'adopted in test', now: FIXTURE_NOW }); stamped(adopt);
  assert.deepEqual(adopt.closed, ['INV-001']); stamped(JSON.parse(readFileSync(join(root, DIRS.loop, 'decisions.json'), 'utf8')));
  decide({ root, id: 'INV-002', decision: 'PARK', reason: 'wait', resumeCondition: 'after the persistent host exists', now: FIXTURE_NOW });
  const ledgerPath = join(root, DIRS.loop, 'decisions.json');
  writeFileSync(ledgerPath, '﻿' + readFileSync(ledgerPath, 'utf8')); // Windows のエディタが付ける BOM
  assert.equal(readLedger(root).entries.length, 2);
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.deepEqual(s.context.closed, ['INV-001', 'INV-002']);
  assert.equal(s.discovery.queue.find(q => q.id === 'INV-001').state, 'CLOSED_BY_RECORD');
  decide({ root, id: 'INV-001', decision: 'ITERATE', reason: 'reopened', now: FIXTURE_NOW });
  assert.deepEqual(closedIds(readLedger(root), new Set(['INV-001', 'INV-002'])), ['INV-002']);
  const again = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.ok(again.context.basis.includes('EXPERIMENT_ITERATING')); assert.equal(again.context.occupied, true);
  const ledger = readLedger(root); ledger.entries.push({ ...entry, candidate_id: 'INV-999', decision: 'REJECT' });
  writeFileSync(ledgerPath, JSON.stringify(ledger));
  const dropped = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.deepEqual(dropped.context.dropped_closed, ['INV-999']); assert.ok(!dropped.context.closed.includes('INV-999')); assert.match(dropped.warnings[0], /INV-999/);
  writeFileSync(ledgerPath, '{"schema_version":1,"entries":[{"candidate_id":"INV-001"}]}');
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW }), /Invalid decisions ledger/);
}));
test('measured results in the inbox are taken before discovery, recorded once, yield a follow-up candidate, and re-intake is a duplicate', use(async root => {
  const { reg } = measuredInbox(root);
  assert.equal(reg.candidate_id, 'INV-001'); stamped(reg);
  assert.equal(JSON.parse(readFileSync(join(reg.directory, 'results.template.json'), 'utf8')).data_kind, 'NOT SET');
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.intake.taken.length, 1); assert.equal(s.intake.taken[0].verdict, 'PROMISING'); assert.equal(s.intake.errors.length, 0); assert.equal(s.intake.taken[0].duplicate, false);
  assert.ok(!existsSync(reg.directory)); assert.equal(dirs(join(root, DIRS.loop, 'done')).length, 1);
  const ledger = readLedger(root); assert.equal(ledger.entries.length, 1); assert.equal(ledger.entries[0].source, 'intake'); assert.equal(ledger.entries[0].verdict, 'PROMISING');
  const facts = inspect(root, FIXTURE_NOW);
  assert.equal(facts.discovery.counts.feedback, 1); assert.ok(facts.discovery.candidates.some(c => c.operator === 'vary'));
  assert.ok(s.discovery.added.length >= 1); assert.equal(facts.awaiting.length, 1);
  assert.ok(s.next_actions.some(a => a.code === 'DECIDE' && a.command.includes('INV-001') && a.command.endsWith(`--root ${root}`)));
  assert.equal(s.context.occupied, false);
  const md = renderSummary(s); assert.match(md, /取り込んだ実測結果/); assert.match(md, /PROMISING/);
  // 同じ実験票と結果をもう一度 inbox へ置くと、重複として移動だけ行い台帳は増えない
  cpSync(s.intake.taken[0].archived_to, reg.directory, { recursive: true });
  const again = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(again.intake.taken[0].duplicate, true); assert.equal(readLedger(root).entries.length, 1); assert.equal(dirs(join(root, DIRS.loop, 'done')).length, 2);
  assert.equal(inspect(root, FIXTURE_NOW).discovery.counts.feedback, 1);
  decide({ root, id: 'INV-001', decision: 'ADOPT', reason: 'measured and reviewed in test', protocolSha256: reg.protocol_sha256, now: FIXTURE_NOW });
  assert.equal(inspect(root, FIXTURE_NOW).awaiting.length, 0);
}));
test('partial measurements stay in the inbox as NOT_READY without feedback, ledger rows or archiving', use(async root => {
  const { reg } = measuredInbox(root, { pairs: 1 });
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.intake.taken.length, 0); assert.equal(s.intake.errors.length, 0); assert.equal(s.intake.not_ready.length, 1); assert.equal(s.intake.not_ready[0].candidate_id, 'INV-001');
  assert.ok(existsSync(join(reg.directory, 'results.json'))); assert.equal(dirs(join(root, DIRS.loop, 'done')).length, 0);
  assert.equal(readLedger(root).entries.length, 0); assert.equal(inspect(root, FIXTURE_NOW).discovery.counts.feedback, 0);
  assert.ok(codes(s).includes('COMPLETE_MEASUREMENT')); assert.ok(!codes(s).includes('DECIDE')); assert.ok(s.context.basis.includes('EXPERIMENT_INBOX_PENDING'));
  assert.ok(statusView(root, FIXTURE_NOW).next_actions.some(a => a.code === 'COMPLETE_MEASUREMENT'));
}));
test('synthetic, unset or incomplete inbox entries never reach the learning ledger and keep the slot occupied', use(async root => {
  const { reg } = measuredInbox(root, { dataKind: 'synthetic' });
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.intake.taken.length, 0); assert.equal(s.intake.errors.length, 1); assert.equal(s.intake.errors[0].code, 'SYNTHETIC_REJECTED');
  assert.ok(existsSync(reg.directory)); assert.equal(readLedger(root).entries.length, 0);
  assert.equal(inspect(root, FIXTURE_NOW).discovery.counts.feedback, 0);
  assert.ok(s.context.basis.includes('EXPERIMENT_INBOX_PENDING')); assert.equal(s.context.occupied, true); assert.equal(s.notify, true);
  assert.ok(codes(s).includes('FIX_INBOX'));
  cpSync(join(reg.directory, 'results.template.json'), join(reg.directory, 'results.json'));
  const unset = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(unset.intake.errors[0].code, 'SYNTHETIC_REJECTED'); assert.match(unset.intake.errors[0].message, /NOT SET/);
  rmSync(join(reg.directory, 'results.json'));
  const t = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.deepEqual(t.intake.remaining, [{ id: reg.id, missing: ['results.json'] }]);
  assert.ok(codes(t).includes('COMPLETE_INBOX'));
}));
test('register fills exactly the four NOT SET fields, hashes the context file, refuses reuse or placeholders, and suppresses the register action', use(async root => {
  const first = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  const draftPath = first.discovery.draft.path, selected = first.discovery.selected;
  const contextPath = join(root, 'c.json'); writeFileSync(contextPath, '{"os":"none"}\n');
  const args = { root, draftPath, candidateSha: 'f'.repeat(40), environmentId: 'env-1', scope: 'scope text', contextPath, now: FIXTURE_NOW };
  assert.throws(() => registerDraft({ ...args, candidateSha: 'abc' }), /40-hex/);
  assert.throws(() => registerDraft({ ...args, scope: 'TODO later' }), /NOT SET or TODO/);
  assert.throws(() => registerDraft({ ...args, candidateSha: JSON.parse(readFileSync(draftPath, 'utf8')).baseline_sha }), /distinct/);
  const r = registerDraft(args);
  const p = JSON.parse(readFileSync(join(r.directory, 'protocol.registered.json'), 'utf8'));
  assert.equal(p.status, 'REGISTERED'); assert.equal(p.candidate_id, selected); assert.equal(p.candidate_sha, 'f'.repeat(40)); assert.equal(p.environment_id, 'env-1'); assert.equal(p.scope, 'scope text');
  assert.equal(p.context_sha256, digest(readFileSync(contextPath))); assert.equal(p.registered_at, FIXTURE_NOW);
  assert.equal(readFileSync(join(r.directory, 'evidence/context.json'), 'utf8'), '{"os":"none"}\n');
  assert.equal(JSON.parse(readFileSync(join(r.directory, 'results.template.json'), 'utf8')).protocol_sha256, r.protocol_sha256);
  assert.throws(() => registerDraft(args), /already registered|EEXIST/);
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW, free: true });
  assert.equal(s.discovery.selected, selected); assert.equal(s.discovery.draft.status, 'REGISTERED');
  assert.deepEqual(codes(s), ['COMPLETE_INBOX', 'BIND_SLOT', 'PREPARE_CANDIDATE']);
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
test('an old profile and an unreadable learner ledger produce their own actions instead of silent degradation', async () => {
  const root = await seeded(() => '2026-08-17T03:10:00.000Z');
  try {
    const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
    assert.equal(s.career.state, 'PLANNED'); assert.equal(inspect(root, FIXTURE_NOW).career.age_days, 22);
    assert.ok(s.next_actions.some(a => a.code === 'REVIEW_PROFILE' && a.title.includes('22 日')));
    const profilePath = join(root, DIRS.career, 'profile.json'); const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
    profile.connections.learner_id = 'ghost-learner'; profile.updated_at = T('03:10'); writeFileSync(profilePath, JSON.stringify(profile));
    const t = await runLoop({ root, offline: buildSnapshot(), now: NOW });
    assert.equal(t.career.learner_state, 'UNAVAILABLE'); assert.equal(t.growth.state, 'SKIPPED_LEARNER_UNAVAILABLE');
    assert.ok(t.next_actions.some(a => a.code === 'FIX_LEARNER_CONNECTION' && a.title.includes('ghost-learner')));
    assert.ok(statusView(root, FIXTURE_NOW).next_actions.some(a => a.code === 'FIX_LEARNER_CONNECTION'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('bind-slot connects the growth slot through the loop and a fully settled root reports no change', use(async root => {
  const bound = await bindSlot({ root, actionId: 'evidence-map', now: NOW }); stamped(bound); assert.equal(bound.career_action_id, 'evidence-map');
  assert.equal(inspect(root, FIXTURE_NOW).growth.binding_status, 'BOUND');
  assert.deepEqual(nextActions(inspect(root, FIXTURE_NOW)).map(a => a.code), ['NO_CHANGE']);
  const s = await runLoop({ root, offline: buildSnapshot(), now: NOW });
  assert.equal(s.growth.binding_status, 'BOUND'); assert.ok(s.growth.technical_slot_minutes > 0);
  assert.deepEqual(codes(s), ['REGISTER_PROTOCOL', 'PREPARE_CANDIDATE']);
}));
test('research and backlog states map to their actions', use(async root => {
  const facts = inspect(root, FIXTURE_NOW);
  const base = { audit: { state: 'COMPLETE', collection_status: 'COMPLETE_FOR_CONFIGURED_SCOPE', errors: [], findings: [] }, growth: { state: 'PLANNED' }, intake: { errors: [], not_ready: [] }, context: { occupied: false, basis: [], basis_findings: [] } };
  const research = nextActions(facts, { ...base, discovery: { discovery_status: 'RESEARCH_REQUIRED', selected: null, draft: null } });
  assert.ok(research.some(a => a.code === 'RESEARCH'));
  const full = nextActions(facts, { ...base, discovery: { discovery_status: 'BACKLOG_FULL', selected: null, draft: null } });
  assert.ok(full.some(a => a.code === 'DISMISS_OR_PARK' && a.command.includes('dismiss')));
}));
test('init creates the private plan and ledger once, copies templates for a bare root, and demo refuses non-empty roots', use(async root => {
  rmSync(join(root, '.local'), { recursive: true, force: true });
  const created = await init({ root, hours: '8', now: NOW }); stamped(created);
  assert.equal(created.career, 'CREATED'); assert.equal(created.decisions, 'CREATED');
  assert.equal(JSON.parse(readFileSync(join(root, DIRS.career, 'profile.json'), 'utf8')).weekly_minutes, 480);
  const again = await init({ root, now: NOW }); assert.equal(again.career, 'ALREADY_INITIALIZED'); assert.equal(again.decisions, 'EXISTS');
  const bare = tmp();
  try { const b = await init({ root: bare, now: NOW }); assert.equal(b.career, 'CREATED_WITH_TEMPLATES'); assert.ok(existsSync(join(bare, DIRS.career, 'profile.json'))); }
  finally { rmSync(bare, { recursive: true, force: true }); }
  await assert.rejects(demo({ root: REPO_ROOT, now: NOW }), /repository root/);
  await assert.rejects(demo({ root, now: NOW }), /already contains/);
  const s = await demo({ now: NOW }); stamped(s);
  try {
    assert.equal(s.demo, true); assert.equal(s.synthetic, true); assert.equal(s.mode, 'OFFLINE_REPLAY'); assert.equal(s.outcome, 'PROCESSED');
    assert.ok(s.root.startsWith(tmpdir())); assert.notEqual(s.root, REPO_ROOT);
    assert.ok(readdirSync(join(s.root, DIRS.loop)).some(f => f.endsWith('.synthetic.json')));
    assert.match(readFileSync(s.report, 'utf8'), /合成データによるデモ実行/);
  } finally { rmSync(s.root, { recursive: true, force: true }); }
}));
test('synthetic snapshots are refused outside demo or temporary roots, and live collection can be disabled', async () => {
  const outside = join(REPO_ROOT, '.local', 'portfolio-loop-test-never-created');
  await assert.rejects(runLoop({ root: outside, offline: buildSnapshot(), now: NOW }), /Synthetic snapshot refused/);
  assert.ok(!existsSync(outside));
  assert.equal(classifyError('Synthetic snapshot refused outside demo').code, 'SYNTHETIC_REJECTED');
  const root = tmp();
  try {
    process.env.PORTFOLIO_LOOP_NO_NETWORK = '1';
    await assert.rejects(runLoop({ root, now: NOW }), /Live collection is disabled/);
    assert.ok(!existsSync(join(root, DIRS.audit)));
  } finally { delete process.env.PORTFOLIO_LOOP_NO_NETWORK; rmSync(root, { recursive: true, force: true }); }
});
test('status is read-only and reports freshness from the observed time, capacity, awaiting decisions and sizes', use(async root => {
  const before = statusView(root, FIXTURE_NOW); stamped(before);
  assert.equal(before.last_run, null); assert.equal(before.next_actions[0].code, 'BIND_SLOT'); assert.match(before.text, /次の一手/); assert.ok(before.text.includes(FOOTER));
  await runLoop({ root, offline: buildSnapshot(), now: NOW });
  const after = statusView(root, '2026-09-08T05:00:00.000Z');
  assert.equal(after.audit.latest.source, 'REPLAY'); assert.equal(after.audit.observed_at, '2026-09-08T03:00:00.000Z'); assert.equal(after.audit.snapshot_age_hours, 2); assert.equal(after.audit.fresh, true);
  assert.equal(after.last_run.outcome, 'PROCESSED'); assert.ok(after.discovery.counts.candidates > 0); assert.ok(after.sizes.discovery.files > 0);
  assert.equal(readdirSync(join(root, DIRS.loop, 'runs')).length, 1);
  const stale = statusView(root, '2026-09-10T05:00:00.000Z'); assert.equal(stale.audit.fresh, false);
}));
test('proposals are limited and errors are classified without changing the original message', use(async root => {
  await assert.rejects(runLoop({ root, offline: buildSnapshot(), now: NOW, proposals: [1, 2, 3, 4, 5] }), /At most four/);
  await assert.rejects(runLoop({ root, offline: [], now: NOW }), /Invalid offline snapshot/);
  for (const [message, code] of [['EEXIST: file already exists', 'LOCKED'], ['Stale lock x', 'STALE_LOCK'], ['ENOENT: no such file or directory, stat profile.json', 'NOT_INITIALIZED'],
    ['Refresh work context within 24 hours', 'TIME'], ['Missing file: .local/server-engineer/a/progress.json', 'LEARNER_UNAVAILABLE'], ['Synthetic results cannot update', 'SYNTHETIC_REJECTED'],
    ['Feedback capacity reached', 'CAPACITY'], ['Invalid work context', 'CONTEXT'], ['Discovery state integrity mismatch', 'CORRUPT_STATE'], ["Unexpected token '﻿', is not valid JSON", 'CORRUPT_STATE'],
    ['Live collection is disabled by X', 'NO_NETWORK'], ['something else', 'INVALID_INPUT']])
    assert.equal(classifyError(message).code, code, message);
}));
test('CLI exit codes: 0 processed, 3 needs refresh, 2 stopped; every subcommand works with --root and --json', use(async root => {
  const fresh = buildSnapshot({ observedAt: new Date(Date.now() - 3600000).toISOString() });
  const snap = join(root, 'snap.json'); writeFileSync(snap, '﻿' + JSON.stringify(fresh)); // BOM 付きでも読める
  assert.equal(run('--help').status, 0); assert.match(run().stdout, /Usage/);
  const ok = run('run', '--root', root, '--offline', snap, '--json'); assert.equal(ok.status, 0, ok.stderr);
  const summary = JSON.parse(ok.stdout); stamped(summary); assert.equal(summary.mode, 'OFFLINE_REPLAY'); assert.equal(summary.career.state, 'PLANNED'); assert.equal(summary.synthetic, true);
  assert.equal(summary.prosperity.notify, summary.notify);
  const card = run('weekly', '--root', root, '--offline', snap); assert.equal(card.status, 0); assert.match(card.stdout, /変化なし/); assert.ok(card.stdout.includes(FOOTER));
  const old = join(root, 'old.json'); writeFileSync(old, JSON.stringify(buildSnapshot({ observedAt: '2026-09-01T00:00:00.000Z' })));
  const stale = run('run', '--root', root, '--offline', old); assert.equal(stale.status, 3); assert.match(stale.stdout, /NEEDS_REFRESH/);
  const live = run('run', '--root', root); assert.equal(live.status, 2); assert.match(live.stderr, /Live collection is disabled/); assert.match(live.stderr, /\[NO_NETWORK\]/);
  const bad = run('nope', '--root', root); assert.equal(bad.status, 2); assert.match(bad.stderr, /Loop stopped: Unknown command/); assert.match(bad.stderr, /\[USAGE\]/);
  const flag = run('run', '--root', root, '--bogus'); assert.equal(flag.status, 2); assert.match(flag.stderr, /Loop stopped/);
  const proposals = join(root, 'p.json'); writeFileSync(proposals, JSON.stringify({ schema_version: 1, proposals: [] }));
  assert.equal(run('run', '--root', root, '--offline', snap, '--proposals', proposals).status, 0);
  writeFileSync(proposals, JSON.stringify({ proposals: 'x' })); assert.equal(run('run', '--root', root, '--offline', snap, '--proposals', proposals).status, 2);
  const status = run('status', '--root', root, '--json'); assert.equal(status.status, 0); stamped(JSON.parse(status.stdout));
  const initText = run('init', '--root', root); assert.equal(initText.status, 0); assert.match(initText.stdout, /ALREADY_INITIALIZED/); assert.ok(initText.stdout.includes(FOOTER));
  const done = run('done', 'INV-003', 'PARK', 'wait for host', '--resume-condition', 'host exists', '--root', root, '--json'); assert.equal(done.status, 0, done.stderr); stamped(JSON.parse(done.stdout));
  const noCond = run('done', 'INV-004', 'PARK', 'wait', '--root', root); assert.equal(noCond.status, 2); assert.match(noCond.stderr, /resume-condition/);
  const draft = summary.discovery.draft.path, ctx = join(root, 'ctx.json'); writeFileSync(ctx, '{"host":"none"}');
  const reg = run('register', draft, '--candidate-sha', 'f'.repeat(40), '--environment-id', 'env', '--scope', 'cli scope', '--context', ctx, '--root', root, '--json');
  assert.equal(reg.status, 0, reg.stderr); const regJson = JSON.parse(reg.stdout); stamped(regJson); assert.ok(existsSync(join(regJson.directory, 'protocol.registered.json')));
  const dynamic = inspect(root).discovery.candidates[0].id;
  const dis = run('dismiss', dynamic, 'cli reason', '--root', root); assert.equal(dis.status, 0, dis.stderr); assert.match(dis.stdout, new RegExp(dynamic));
  const bind = run('bind-slot', 'evidence-map', '--root', root); assert.equal(bind.status, 0, bind.stderr); assert.match(bind.stdout, /evidence-map/);
  const demoRoot = join(root, 'demo-target');
  const d = run('demo', '--root', demoRoot, '--json'); assert.equal(d.status, 0, d.stderr); const dj = JSON.parse(d.stdout); stamped(dj); assert.equal(dj.demo, true); assert.equal(dj.root, demoRoot);
  const refuse = run('demo', '--root', root); assert.equal(refuse.status, 2); assert.match(refuse.stderr, /already contains/);
}));
