import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { execute } from '../scripts/server-engineer.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const original = JSON.parse(fs.readFileSync(path.join(repository, 'docs/server-engineer/curriculum.json'), 'utf8').replace(/^\uFEFF/, ''));
const revision = 'a'.repeat(40);

function fixture(t, { nested = false } = {}) {
  const sandbox = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'server-engineer-test-')));
  const root = nested ? path.join(sandbox, 'extracted-copy') : sandbox;
  t.after(() => {
    assert.equal(path.dirname(sandbox), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(sandbox).startsWith('server-engineer-test-'));
    fs.rmSync(sandbox, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'docs/server-engineer/stages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'incoming'));
  fs.writeFileSync(path.join(root, 'incoming/log.txt'), 'Synthetic test evidence. Not learner achievement.\n');
  fs.writeFileSync(path.join(root, 'docs/server-engineer/curriculum.json'), JSON.stringify(original));
  for (const stage of original.stages) fs.writeFileSync(path.join(root, stage.document), stage.criteria.map(item => `## ${item.id}`).join('\n'));
  let clock = new Date('2026-09-05T06:00:00.000Z');
  const run = args => execute(args, { root, now: () => clock });
  const ledgerPath = path.join(root, '.local/server-engineer/learner/progress.json');
  const read = () => JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const rewrite = ledger => fs.writeFileSync(ledgerPath, JSON.stringify(ledger));
  const init = () => run(['init', '--learner', 'learner']);
  const record = (criterion = 'SE00-C1', overrides = {}) => {
    const options = { learner: 'learner', criterion, result: 'PASS', evidence: 'incoming/log.txt', environment: 'vm', target: 'isolated-test-vm', assistance: 'independent', session: 'session-one', note: 'Synthetic test fixture only', revision, ...overrides };
    const argv = ['record'];
    for (const [key, value] of Object.entries(options)) if (value !== undefined) argv.push(`--${key}`, value);
    if (overrides.sanitized !== undefined) throw new Error('Use direct run for sanitized flag tests');
    argv.push('--sanitized');
    return run(argv);
  };
  const review = (stage = 'SE00', overrides = {}) => run(['review', ...Object.entries({ learner: 'learner', stage, reviewer: 'observer', decision: 'APPROVE', evidence: 'incoming/log.txt', note: 'Synthetic observation for automated tests', ...overrides }).flatMap(([key, value]) => [`--${key}`, value]), '--sanitized']);
  const status = stage => JSON.parse(run(['report', '--learner', 'learner', '--json'])).stages.find(item => item.id === stage);
  const fill = (stage, overrides = {}) => { for (const criterion of original.stages.find(item => item.id === stage).criteria) record(criterion.id, overrides); };
  return { root, sandbox, run, read, rewrite, init, record, review, status, fill, clock: value => { clock = new Date(value); } };
}

function initializeFixtureRepository(directory) {
  assert.ok(path.basename(directory).startsWith('server-engineer-test-'));
  assert.equal(path.dirname(directory), fs.realpathSync(os.tmpdir()));
  const hooks = path.join(directory, 'empty-test-hooks');
  fs.mkdirSync(hooks);
  const git = args => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).trim();
  git(['-c', 'init.defaultBranch=main', 'init', '--quiet']);
  git(['-c', 'user.name=Test Fixture', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', '-c', `core.hooksPath=${hooks}`, 'commit', '--quiet', '--allow-empty', '-m', 'Synthetic fixture only']);
  return git(['rev-parse', '--verify', 'HEAD']);
}

test('init is empty NOT RUN, preserves an existing ledger, and requires a bounded learner ID', t => {
  const f = fixture(t);
  assert.match(f.init(), /All 32 criteria and all 8 stages: NOT RUN/);
  assert.deepEqual(f.read().attempts, []);
  assert.deepEqual(f.read().reviews, []);
  for (const stage of original.stages) assert.equal(f.status(stage.id).status, 'NOT RUN');
  assert.throws(() => f.init(), /already exists/);
  assert.throws(() => f.run(['init', '--learner', '../escape']), /learner/);
  assert.throws(() => f.run(['init', '--learner', 'con']), /reserved/);
});

test('records copy actual file bytes and metadata; changed source does not change archived evidence', t => {
  const f = fixture(t); f.init();
  f.record('SE00-C1', { 'performed-at': '2026-09-04T03:00:00Z' });
  const attempt = f.read().attempts[0];
  assert.equal(attempt.performedAt, '2026-09-04T03:00:00Z');
  assert.equal(attempt.revision, revision);
  assert.equal(attempt.evidence.sha256.length, 64);
  assert.equal(attempt.learner, 'learner');
  assert.equal(attempt.target, 'isolated-test-vm');
  assert.equal(attempt.evidence.sanitized, true);
  fs.writeFileSync(path.join(f.root, 'incoming/log.txt'), 'Changed later');
  assert.match(f.run(['check', '--learner', 'learner']), /record integrity \(1 attempts, 0 reviews\)/);
  assert.equal(f.status('SE00').status, 'IN PROGRESS');
});

test('default revision records HEAD only when the curriculum root is the actual Git root', t => {
  const f = fixture(t);
  const head = initializeFixtureRepository(f.root);
  f.init();
  f.record('SE00-C1', { revision: undefined });
  assert.equal(f.read().attempts[0].revision, head);
});

test('an extracted copy inside another Git repository cannot inherit its ancestor HEAD', t => {
  const f = fixture(t, { nested: true });
  const unrelatedHead = initializeFixtureRepository(f.sandbox);
  assert.equal(execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: f.root, encoding: 'utf8', windowsHide: true }).trim(), unrelatedHead);
  f.init();
  assert.throws(() => f.record('SE00-C1', { revision: undefined }), /Cannot read Git HEAD for this repository root.*--revision/);
  assert.equal(f.read().attempts.length, 0);
  assert.ok(!fs.existsSync(path.join(f.root, '.local/server-engineer/learner/evidence')));
  f.record('SE00-C1', { revision });
  assert.equal(f.read().attempts[0].revision, revision);
});

test('unknown criterion, malformed options, revision and missing/empty evidence cannot append', t => {
  const f = fixture(t); f.init();
  assert.throws(() => f.record('SE00-C9'), /Unknown criterion/);
  assert.throws(() => f.record('SE00-C1', { revision: 'abcd' }), /full lowercase Git SHA/);
  assert.throws(() => f.record('SE00-C1', { evidence: undefined }), /--evidence required/);
  assert.throws(() => f.record('SE00-C1', { evidence: 'incoming/missing.txt' }), /Missing file/);
  fs.writeFileSync(path.join(f.root, 'incoming/empty.txt'), ' \n\t');
  assert.throws(() => f.record('SE00-C1', { evidence: 'incoming/empty.txt' }), /Empty evidence/);
  assert.throws(() => f.run(['record', '--learner', 'learner', '--surprise', 'yes']), /Unknown option/);
  assert.throws(() => f.run(['report', '--learner', 'learner', '--learner', 'other']), /Duplicate option/);
  assert.equal(f.read().attempts.length, 0);
});

test('sanitized acknowledgement is mandatory and does not claim automatic secret removal', t => {
  const f = fixture(t); f.init();
  assert.throws(() => f.run(['record', '--learner', 'learner', '--criterion', 'SE00-C1', '--result', 'PASS', '--evidence', 'incoming/log.txt', '--environment', 'vm', '--target', 'isolated-vm', '--assistance', 'guided', '--session', 'one', '--note', 'test', '--revision', revision]), /--sanitized acknowledgement required/);
  assert.equal(f.read().attempts.length, 0);
});

test('rejects traversal, absolute paths and alternate streams in evidence paths', t => {
  const f = fixture(t); f.init();
  for (const evidence of ['../outside.txt', 'incoming/../../outside.txt', 'incoming\\..\\log.txt', path.join(f.root, 'incoming/log.txt'), 'C:\\outside.txt', 'incoming/log.txt:secret', 'incoming/log.txt.']) {
    assert.throws(() => f.record('SE00-C1', { evidence }), /relative|Unsafe path|escapes/);
  }
  assert.equal(f.read().attempts.length, 0);
});

test('rejects symlink/junction evidence ancestors and private data directories', t => {
  const f = fixture(t); f.init();
  const link = path.join(f.root, 'linked');
  fs.symlinkSync(path.join(f.root, 'incoming'), link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => f.record('SE00-C1', { evidence: 'linked/log.txt' }), /Symlink forbidden/);
  const privateLink = path.join(f.root, '.local/server-engineer/another');
  fs.symlinkSync(path.join(f.root, 'incoming'), privateLink, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => f.run(['init', '--learner', 'another']), /Symlink forbidden/);
});

test('all readers reject modified or missing archived evidence and unsafe stored paths', t => {
  const f = fixture(t); f.init(); f.record();
  const ledger = f.read();
  const evidence = path.join(f.root, '.local/server-engineer/learner', ledger.attempts[0].evidence.path);
  const bytes = fs.readFileSync(evidence);
  fs.writeFileSync(evidence, 'tampered');
  assert.throws(() => f.run(['report', '--learner', 'learner']), /Evidence changed/);
  assert.throws(() => f.run(['check', '--learner', 'learner']), /Evidence changed/);
  assert.throws(() => f.record(), /Evidence changed/);
  fs.unlinkSync(evidence);
  assert.throws(() => f.run(['check', '--learner', 'learner']), /Missing file/);
  fs.writeFileSync(evidence, bytes);
  ledger.attempts[0].evidence.path = '../other/log.txt'; f.rewrite(ledger);
  assert.throws(() => f.run(['check', '--learner', 'learner']), /inside learner evidence folder/);
});

test('all criterion PASS results are READY FOR REVIEW until a different human review is recorded', t => {
  const f = fixture(t); f.init(); f.fill('SE00');
  assert.equal(f.status('SE00').status, 'READY FOR REVIEW');
  assert.throws(() => f.review('SE00', { reviewer: 'learner' }), /Self-review forbidden/);
  f.review();
  assert.equal(f.status('SE00').status, 'PASS');
  assert.deepEqual(f.read().reviews[0].attemptIds, f.read().attempts.map(item => item.id));
  assert.equal(f.read().reviews[0].reviewer, 'observer');
});

test('a later attempt invalidates a review even when the new result is PASS', t => {
  const f = fixture(t); f.init(); f.fill('SE00'); f.review();
  const oldReview = f.read().reviews[0];
  f.record('SE00-C1');
  assert.equal(f.status('SE00').status, 'READY FOR REVIEW');
  assert.ok(f.status('SE00').problems.some(item => item.includes('stale')));
  assert.deepEqual(f.read().reviews[0], oldReview);
  f.review();
  assert.equal(f.status('SE00').status, 'PASS');
  assert.equal(f.read().reviews.length, 2);
});

test('latest FAIL and BLOCKED override old success; historical evidence remains intact', t => {
  const f = fixture(t); f.init(); f.fill('SE00'); f.review();
  f.record('SE00-C1', { result: 'FAIL' });
  assert.equal(f.status('SE00').status, 'FAIL');
  assert.throws(() => f.review(), /Cannot approve.*FAIL/);
  f.record('SE00-C1', { result: 'BLOCKED' });
  assert.equal(f.status('SE00').status, 'BLOCKED');
  assert.equal(f.read().attempts.length, 6);
  assert.equal(f.read().attempts[0].result, 'PASS');
});

test('prerequisites block approval and later prerequisite failure suspends downstream PASS', t => {
  const f = fixture(t); f.init(); f.fill('SE01');
  assert.equal(f.status('SE01').status, 'WAITING PREREQUISITE');
  assert.throws(() => f.review('SE01'), /WAITING PREREQUISITE/);
  f.fill('SE00'); f.review('SE00'); f.review('SE01');
  assert.equal(f.status('SE01').status, 'PASS');
  f.record('SE00-C1', { result: 'FAIL' });
  assert.equal(f.status('SE01').status, 'WAITING PREREQUISITE');
});

test('container satisfies runtime but cannot satisfy VM; local is not runtime', t => {
  const f = fixture(t); f.init();
  f.fill('SE00', { environment: 'container' });
  assert.equal(f.status('SE00').status, 'REQUIREMENTS NOT MET');
  assert.ok(f.status('SE00').problems.some(item => item.includes('vm/physical/cloud required')));
  f.fill('SE03', { environment: 'local' });
  assert.equal(f.status('SE03').status, 'REQUIREMENTS NOT MET');
  f.fill('SE03', { environment: 'container' });
  assert.equal(f.status('SE03').status, 'WAITING PREREQUISITE');
  assert.ok(f.status('SE03').problems.every(item => !item.includes('runtime required')));
});

test('AI or guided assistance does not satisfy an independent requirement', t => {
  const f = fixture(t); f.init(); f.fill('SE02', { assistance: 'ai' });
  assert.equal(f.status('SE02').status, 'REQUIREMENTS NOT MET');
  assert.ok(f.status('SE02').problems.some(item => item.includes('SE02-C4: independent required')));
  f.record('SE02-C4', { assistance: 'guided' });
  assert.equal(f.status('SE02').status, 'REQUIREMENTS NOT MET');
  f.record('SE02-C4');
  assert.equal(f.status('SE02').status, 'WAITING PREREQUISITE');
});

test('capstone requires different actual UTC dates AND different session IDs', t => {
  const f = fixture(t); f.init(); f.fill('SE07');
  assert.equal(f.status('SE07').status, 'REQUIREMENTS NOT MET');
  assert.ok(f.status('SE07').problems.some(item => item.includes('different UTC dates')));
  assert.ok(f.status('SE07').problems.some(item => item.includes('different sessions')));
  f.record('SE07-C1', { 'performed-at': '2026-09-03T23:59:00Z' });
  f.record('SE07-C2', { 'performed-at': '2026-09-04T00:01:00Z' });
  assert.equal(f.status('SE07').status, 'REQUIREMENTS NOT MET');
  f.record('SE07-C2', { 'performed-at': '2026-09-03T22:00:00Z', session: 'session-two' });
  assert.equal(f.status('SE07').status, 'REQUIREMENTS NOT MET');
  f.record('SE07-C2', { 'performed-at': '2026-09-04T00:01:00Z', session: 'session-two' });
  assert.equal(f.status('SE07').status, 'WAITING PREREQUISITE');
});

test('rejects future, timezone-ambiguous and nonexistent calendar timestamps', t => {
  const f = fixture(t); f.init();
  for (const performedAt of ['2026-09-05T06:00:00.001Z', '2026-09-06T00:00:00Z']) assert.throws(() => f.record('SE00-C1', { 'performed-at': performedAt }), /future/);
  for (const performedAt of ['2026-02-30T00:00:00Z', '2026-09-05', '2026-09-05T10:00:00+09:00']) assert.throws(() => f.record('SE00-C1', { 'performed-at': performedAt }), /timestamp/);
  assert.equal(f.read().attempts.length, 0);
});

test('review REJECT is retained and requires a new actual approval to advance', t => {
  const f = fixture(t); f.init(); f.fill('SE00');
  f.review('SE00', { decision: 'REJECT', note: 'Explanation did not match the observed test' });
  assert.equal(f.status('SE00').status, 'REVIEW REJECTED');
  f.review();
  assert.equal(f.status('SE00').status, 'PASS');
  assert.deepEqual(f.read().reviews.map(item => item.decision), ['REJECT', 'APPROVE']);
});

test('strict stored-record validation rejects forged self-review, invalid binding, unknown IDs and schema drift', t => {
  const f = fixture(t); f.init(); f.fill('SE00'); f.review();
  const pristine = f.read();
  for (const [mutate, pattern] of [
    [p => { p.reviews[0].reviewer = 'learner'; }, /Self-review forbidden/],
    [p => { p.reviews[0].attemptIds[0] = p.attempts[1].id; }, /Review binding/],
    [p => { p.attempts[0].criterion = 'FAKE-C1'; }, /Unknown criterion/],
    [p => { p.attempts[0].result = 'NOT RUN'; }, /Invalid attempt learner\/result/],
    [p => { p.attempts[0].invented = true; }, /invalid or missing fields/],
    [p => { p.schemaVersion = 999; }, /Unsupported progress schemaVersion/],
    [p => { p.attempts[1].id = p.attempts[0].id; }, /Duplicate or invalid attempt ID/],
  ]) {
    const changed = structuredClone(pristine); mutate(changed); f.rewrite(changed);
    assert.throws(() => f.run(['check', '--learner', 'learner']), pattern);
  }
});

test('check validates document existence, criterion IDs and curriculum changes without claiming skill', t => {
  const f = fixture(t); f.init();
  assert.match(f.run(['check']), /Learner records: NOT CHECKED/);
  assert.match(f.run(['check', '--learner', 'learner']), /Skill performance is not automatically verified/);
  const document = path.join(f.root, original.stages[0].document);
  fs.writeFileSync(document, 'SE00-C1\nSE00-C2\nSE00-C3');
  assert.throws(() => f.run(['check']), /missing criterion SE00-C4/);
  fs.unlinkSync(document);
  assert.throws(() => f.run(['check']), /Missing file/);
  const changed = structuredClone(original); changed.version = '2.0.0';
  fs.writeFileSync(path.join(f.root, 'docs/server-engineer/curriculum.json'), JSON.stringify(changed));
  assert.throws(() => f.run(['report', '--learner', 'learner']), /Curriculum changed/);
});

test('write lock prevents overlapping mutation and remains untouched', t => {
  const f = fixture(t); f.init();
  const lock = path.join(f.root, '.local/server-engineer/learner/write.lock');
  fs.writeFileSync(lock, 'another writer\n');
  assert.throws(() => f.record(), /Ledger is locked/);
  assert.equal(fs.readFileSync(lock, 'utf8'), 'another writer\n');
  assert.equal(f.read().attempts.length, 0);
});

test('separate writer processes cannot lose a successful append', async t => {
  const f = fixture(t); f.init();
  const script = pathToFileURL(path.join(repository, 'scripts/server-engineer.mjs')).href;
  const source = `import { execute } from ${JSON.stringify(script)}; try { console.log(execute(process.argv.slice(2), { root: process.argv[1], now: () => new Date('2026-09-05T06:00:00.000Z') })); } catch (error) { console.error(error.message); process.exitCode = 1; }`;
  const writer = session => new Promise((resolve, reject) => {
    const args = ['--input-type=module', '-e', source, f.root, 'record', '--learner', 'learner', '--criterion', 'SE00-C1', '--result', 'PASS', '--evidence', 'incoming/log.txt', '--environment', 'vm', '--target', 'isolated-test-vm', '--assistance', 'independent', '--session', session, '--note', 'Synthetic concurrent-write test only', '--revision', revision, '--sanitized'];
    const child = spawn(process.execPath, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
  const results = await Promise.all([writer('writer-one'), writer('writer-two')]);
  const succeeded = results.filter(result => result.code === 0);
  assert.ok(succeeded.length >= 1);
  for (const result of results) {
    if (result.code === 0) assert.match(result.stdout, /Recorded/);
    else assert.match(result.stderr, /Ledger is locked/);
  }
  const ledger = f.read();
  assert.equal(ledger.attempts.length, succeeded.length);
  assert.equal(new Set(ledger.attempts.map(item => item.id)).size, succeeded.length);
  assert.equal(fs.readdirSync(path.join(f.root, '.local/server-engineer/learner/evidence')).length, succeeded.length);
  assert.match(f.run(['check', '--learner', 'learner']), /record integrity/);
  assert.ok(!fs.existsSync(path.join(f.root, '.local/server-engineer/learner/write.lock')));
});
