#!/usr/bin/env node
/** Private, append-only-by-CLI learning records. No lab commands or network calls. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENVIRONMENTS = ['desk', 'local', 'container', 'vm', 'physical', 'cloud'];
const ASSISTANCE = ['guided', 'ai', 'independent'];
const REVISION = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const fail = message => { throw new Error(message); };
const requireThat = (condition, message) => { if (!condition) fail(message); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export const HELP = `サーバー構築学習台帳 (Node.js 22 以上)
実行場所: このリポジトリ。台帳: .local/server-engineer/<learner>/progress.json

node scripts/server-engineer.mjs init --learner <id>
node scripts/server-engineer.mjs record --learner <id> --criterion <SE00-C1> \\
  --result <PASS|FAIL|BLOCKED> --evidence <repo-relative-file> --sanitized \\
  --environment <desk|local|container|vm|physical|cloud> --target <description> \\
  --assistance <guided|ai|independent> --session <id> --note <text> \\
  [--performed-at <YYYY-MM-DDTHH:mm:ss.sssZ>] [--revision <full-git-sha>]
node scripts/server-engineer.mjs review --learner <id> --stage <SE00> \\
  --reviewer <other-person-id> --decision <APPROVE|REJECT> \\
  --evidence <repo-relative-file> --sanitized --note <actual-observation>
node scripts/server-engineer.mjs report --learner <id> [--json]
node scripts/server-engineer.mjs check [--learner <id>]

ID: 小文字英数字、_、- (1〜64文字)。証跡は秘密情報を除去した既存ファイル。
--sanitized は除去済みという利用者の申告で、自動マスキングではありません。
--performed-at は既存ログの実施UTC時刻。省略時は現在、未来は禁止。
--revision は実施に用いた教材の完全なGit SHA。省略時は現在のHEAD。
初期状態は全件 NOT RUN。結果の追記だけでは段階の PASS になりません。
本人以外の実際の観察記録と前提段階の PASS が必要です。
詳細: docs/server-engineer/tracker-guide.md
`;

function keys(value, expected, label) {
  requireThat(isObject(value), `${label}: JSON object required`);
  requireThat(same(Object.keys(value).sort(), [...expected].sort()), `${label}: invalid or missing fields`);
}
function textField(value, label, max = 8000) {
  requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), `${label}: non-empty text required (max ${max})`);
}
function identifier(value, label) {
  requireThat(typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value), `${label}: use 1-64 lowercase letters, digits, _ or -; reserved names forbidden`);
}
function instant(value, label) {
  requireThat(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value), `${label}: UTC ISO timestamp required`);
  const date = new Date(value);
  requireThat(!Number.isNaN(date.getTime()) && date.toISOString() === value.replace(/(?<!\.\d{3})Z$/, '.000Z'), `${label}: invalid calendar timestamp`);
  return date.getTime();
}

/** Every input and stored relative path is checked, including all existing ancestors. */
function safePath(root, relative) {
  requireThat(typeof relative === 'string' && relative.length > 0 && !path.isAbsolute(relative) && !path.win32.isAbsolute(relative), 'Path must be repository-relative');
  const parts = relative.split(/[\\/]/);
  requireThat(parts.every(part => part !== '' && part !== '.' && part !== '..' && !/[:\x00]/.test(part) && !/[. ]$/.test(part)), 'Unsafe path: traversal, alternate streams or ambiguous components');
  const target = path.resolve(root, ...parts);
  requireThat(target.startsWith(root + path.sep), 'Path escapes repository');
  let cursor = root;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    try {
      const stat = fs.lstatSync(cursor);
      requireThat(!stat.isSymbolicLink(), `Symlink forbidden: ${relative}`);
      requireThat(cursor === target || stat.isDirectory(), `Path ancestor is not a directory: ${relative}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return target;
}
function ensureDirectory(root, relative) {
  const parts = relative.split('/');
  for (let index = 1; index <= parts.length; index++) {
    const directory = safePath(root, parts.slice(0, index).join('/'));
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { mode: 0o700 });
    requireThat(fs.statSync(directory).isDirectory(), `Not a directory: ${directory}`);
  }
}
function readBytes(root, relative) {
  const target = safePath(root, relative);
  requireThat(fs.existsSync(target), `Missing file: ${relative}`);
  const stat = fs.statSync(target);
  requireThat(stat.isFile() && stat.size <= MAX_FILE_BYTES, `Evidence/JSON must be a regular file <= ${MAX_FILE_BYTES} bytes: ${relative}`);
  return fs.readFileSync(target);
}
function readJson(root, relative) {
  try { return JSON.parse(readBytes(root, relative).toString('utf8').replace(/^\uFEFF/, '')); }
  catch (error) { fail(`Cannot read ${relative}: ${error.message}`); }
}

export function loadCurriculum(root, { documents = false } = {}) {
  const curriculum = readJson(root, 'docs/server-engineer/curriculum.json');
  keys(curriculum, ['schemaVersion', 'version', 'title', 'stages'], 'curriculum');
  requireThat(curriculum.schemaVersion === 1, 'Unsupported curriculum schemaVersion');
  textField(curriculum.version, 'curriculum version', 100);
  textField(curriculum.title, 'curriculum title', 200);
  requireThat(Array.isArray(curriculum.stages) && curriculum.stages.length === 8, 'Curriculum requires SE00-SE07');
  const documentPaths = new Set();
  for (const [index, stage] of curriculum.stages.entries()) {
    keys(stage, ['id', 'title', 'period', 'document', 'prerequisites', 'criteria'], 'stage');
    requireThat(stage.id === `SE${String(index).padStart(2, '0')}`, 'Stage IDs/order must be SE00-SE07');
    textField(stage.title, `${stage.id} title`, 200);
    textField(stage.period, `${stage.id} period`, 200);
    requireThat(Array.isArray(stage.prerequisites) && same(stage.prerequisites, index ? [`SE${String(index - 1).padStart(2, '0')}`] : []), `${stage.id}: invalid prerequisite chain`);
    requireThat(typeof stage.document === 'string' && stage.document.startsWith('docs/server-engineer/stages/') && stage.document.endsWith('.md') && !documentPaths.has(stage.document), `${stage.id}: invalid or duplicate document`);
    safePath(root, stage.document);
    documentPaths.add(stage.document);
    requireThat(Array.isArray(stage.criteria) && stage.criteria.length === 4, `${stage.id}: four criteria required`);
    const documentText = documents ? readBytes(root, stage.document).toString('utf8') : '';
    for (const [criterionIndex, criterion] of stage.criteria.entries()) {
      keys(criterion, ['id', 'title', 'environment', 'independent'], `${stage.id} criterion`);
      requireThat(criterion.id === `${stage.id}-C${criterionIndex + 1}`, `${stage.id}: unknown or duplicate criterion ID`);
      textField(criterion.title, `${criterion.id} title`, 300);
      requireThat(['any', 'runtime', 'vm'].includes(criterion.environment) && typeof criterion.independent === 'boolean', `${criterion.id}: invalid requirements`);
      if (documents) requireThat(new RegExp(`(?<![A-Z0-9-])${criterion.id}(?![A-Z0-9-])`).test(documentText), `${stage.document}: missing criterion ${criterion.id}`);
    }
  }
  return curriculum;
}
function curriculumHash(curriculum) { return hash(JSON.stringify(curriculum)); }
function criterionMap(curriculum) { return new Map(curriculum.stages.flatMap(stage => stage.criteria.map(item => [item.id, item]))); }
function latestAttempts(progress, stage) {
  return stage.criteria.map(criterion => progress.attempts.findLast(attempt => attempt.criterion === criterion.id));
}
function criteriaProblems(stage, attempts) {
  const problems = [];
  for (const [index, criterion] of stage.criteria.entries()) {
    const attempt = attempts[index];
    if (!attempt) { problems.push(`${criterion.id}: NOT RUN`); continue; }
    if (attempt.result !== 'PASS') problems.push(`${criterion.id}: latest result ${attempt.result}`);
    if (criterion.environment === 'vm' && !['vm', 'physical', 'cloud'].includes(attempt.environment)) problems.push(`${criterion.id}: vm/physical/cloud required; recorded ${attempt.environment}`);
    if (criterion.environment === 'runtime' && !['container', 'vm', 'physical', 'cloud'].includes(attempt.environment)) problems.push(`${criterion.id}: runtime required; recorded ${attempt.environment}`);
    if (criterion.independent && attempt.assistance !== 'independent') problems.push(`${criterion.id}: independent required; recorded ${attempt.assistance}`);
  }
  if (stage.id === 'SE07' && attempts[0] && attempts[1]) {
    if (attempts[0].performedAt.slice(0, 10) === attempts[1].performedAt.slice(0, 10)) problems.push('SE07-C1/C2: different UTC dates required');
    if (attempts[0].session === attempts[1].session) problems.push('SE07-C1/C2: different sessions required');
  }
  return problems;
}

export function evaluate(curriculum, progress) {
  const stages = [];
  for (const stage of curriculum.stages) {
    const attempts = latestAttempts(progress, stage);
    const problems = criteriaProblems(stage, attempts);
    const attemptIds = attempts.map(attempt => attempt?.id ?? null);
    const reviews = progress.reviews.filter(review => review.stage === stage.id);
    const review = reviews.findLast(item => same(item.attemptIds, attemptIds));
    const prerequisites = stage.prerequisites.filter(id => stages.find(item => item.id === id)?.status !== 'PASS');
    let status;
    if (attempts.every(attempt => !attempt)) status = 'NOT RUN';
    else if (attempts.some(attempt => attempt?.result === 'FAIL')) status = 'FAIL';
    else if (attempts.some(attempt => attempt?.result === 'BLOCKED')) status = 'BLOCKED';
    else if (attempts.some(attempt => !attempt)) status = 'IN PROGRESS';
    else if (problems.length) status = 'REQUIREMENTS NOT MET';
    else if (prerequisites.length) status = 'WAITING PREREQUISITE';
    else if (!review) status = 'READY FOR REVIEW';
    else status = review.decision === 'APPROVE' ? 'PASS' : 'REVIEW REJECTED';
    if (prerequisites.length) problems.push(`Prerequisites not PASS: ${prerequisites.join(', ')}`);
    if (reviews.length && !review) problems.push('Earlier review is stale: latest attempt IDs changed; a new observation is required');
    if (status === 'READY FOR REVIEW') problems.push('A different human reviewer must observe and record the assessment');
    if (status === 'REVIEW REJECTED') problems.push(`Review rejected: ${review.note}`);
    stages.push({ id: stage.id, title: stage.title, status, problems, attemptIds, reviewId: review?.id ?? null,
      criteria: stage.criteria.map((criterion, index) => ({ id: criterion.id, title: criterion.title, result: attempts[index]?.result ?? 'NOT RUN', attemptId: attempts[index]?.id ?? null })) });
  }
  return stages;
}

function validateEvidence(root, learnerBase, evidence) {
  keys(evidence, ['path', 'sha256', 'bytes', 'originalName', 'sanitized'], 'evidence');
  requireThat(typeof evidence.path === 'string' && /^evidence\/[a-f0-9-]{36}\.bin$/.test(evidence.path), 'Evidence path must stay inside learner evidence folder');
  requireThat(UUID.test(evidence.path.slice(9, -4)), 'Evidence filename UUID invalid');
  requireThat(typeof evidence.sha256 === 'string' && /^[a-f0-9]{64}$/.test(evidence.sha256), 'Evidence SHA-256 invalid');
  requireThat(Number.isSafeInteger(evidence.bytes) && evidence.bytes > 0 && evidence.bytes <= MAX_FILE_BYTES && evidence.sanitized === true, 'Evidence must be non-empty and sanitized');
  textField(evidence.originalName, 'evidence originalName', 255);
  requireThat(!/[\\/:]/.test(evidence.originalName), 'Evidence originalName must be a basename');
  const bytes = readBytes(root, `${learnerBase}/${evidence.path}`);
  requireThat(bytes.length === evidence.bytes && hash(bytes) === evidence.sha256, `Evidence changed: ${evidence.path}`);
  requireThat(bytes.toString('utf8').trim().length > 0, `Empty evidence: ${evidence.path}`);
}
export function validateProgress(root, curriculum, progress, learner, now = new Date()) {
  keys(progress, ['schemaVersion', 'curriculumVersion', 'curriculumHash', 'learner', 'createdAt', 'attempts', 'reviews'], 'progress');
  requireThat(progress.schemaVersion === 1, 'Unsupported progress schemaVersion');
  requireThat(progress.curriculumVersion === curriculum.version && progress.curriculumHash === curriculumHash(curriculum), 'Curriculum changed: preserve the existing ledger and arrange an explicit migration; no silent revalidation');
  identifier(learner, 'learner');
  requireThat(progress.learner === learner, 'Learner does not match ledger');
  const nowMs = now.getTime();
  requireThat(instant(progress.createdAt, 'createdAt') <= nowMs, 'createdAt is in the future');
  requireThat(Array.isArray(progress.attempts) && Array.isArray(progress.reviews), 'attempts/reviews arrays required');
  const criteria = criterionMap(curriculum);
  const ids = new Set();
  const evidencePaths = new Set();
  let previous = instant(progress.createdAt, 'createdAt');
  const learnerBase = `.local/server-engineer/${learner}`;
  for (const attempt of progress.attempts) {
    keys(attempt, ['id', 'criterion', 'learner', 'result', 'recordedAt', 'performedAt', 'revision', 'environment', 'target', 'assistance', 'session', 'note', 'evidence'], 'attempt');
    requireThat(UUID.test(attempt.id) && !ids.has(attempt.id), 'Duplicate or invalid attempt ID');
    ids.add(attempt.id);
    requireThat(criteria.has(attempt.criterion), `Unknown criterion: ${attempt.criterion}`);
    requireThat(attempt.learner === learner && ['PASS', 'FAIL', 'BLOCKED'].includes(attempt.result), 'Invalid attempt learner/result');
    const recorded = instant(attempt.recordedAt, 'recordedAt');
    requireThat(recorded >= previous && recorded <= nowMs && instant(attempt.performedAt, 'performedAt') <= recorded, 'Attempt timestamps out of order or in the future');
    previous = recorded;
    requireThat(typeof attempt.revision === 'string' && REVISION.test(attempt.revision), 'Full Git revision required');
    requireThat(ENVIRONMENTS.includes(attempt.environment) && ASSISTANCE.includes(attempt.assistance), 'Invalid environment/assistance');
    identifier(attempt.session, 'session');
    textField(attempt.target, 'target', 1000);
    textField(attempt.note, 'note');
    validateEvidence(root, learnerBase, attempt.evidence);
    requireThat(!evidencePaths.has(attempt.evidence.path), 'Evidence copies must be unique per record');
    evidencePaths.add(attempt.evidence.path);
  }
  previous = instant(progress.createdAt, 'createdAt');
  for (const review of progress.reviews) {
    keys(review, ['id', 'stage', 'learner', 'reviewer', 'decision', 'recordedAt', 'attemptIds', 'note', 'evidence'], 'review');
    requireThat(UUID.test(review.id) && !ids.has(review.id), 'Duplicate or invalid review ID');
    ids.add(review.id);
    identifier(review.reviewer, 'reviewer');
    requireThat(review.learner === learner && review.reviewer !== learner, 'Self-review forbidden: reviewer must be another person');
    requireThat(['APPROVE', 'REJECT'].includes(review.decision), 'Invalid review decision');
    const recorded = instant(review.recordedAt, 'review recordedAt');
    requireThat(recorded >= previous && recorded <= nowMs, 'Review timestamp out of order or in the future');
    previous = recorded;
    const stage = curriculum.stages.find(item => item.id === review.stage);
    requireThat(stage && Array.isArray(review.attemptIds) && review.attemptIds.length === stage.criteria.length, 'Unknown stage or invalid review binding');
    const attempts = review.attemptIds.map(id => progress.attempts.find(attempt => attempt.id === id));
    for (const [index, attempt] of attempts.entries()) requireThat(attempt && attempt.criterion === stage.criteria[index].id && instant(attempt.recordedAt, 'attempt recordedAt') <= recorded, 'Review binding must reference recorded attempts in criterion order');
    if (review.decision === 'APPROVE') requireThat(criteriaProblems(stage, attempts).length === 0, 'Approval bound to unmet criterion requirements');
    textField(review.note, 'review note');
    validateEvidence(root, learnerBase, review.evidence);
    requireThat(!evidencePaths.has(review.evidence.path), 'Evidence copies must be unique per record');
    evidencePaths.add(review.evidence.path);
  }
  return progress;
}

function copyEvidence(root, learnerBase, options) {
  requireThat(options.sanitized === true, '--sanitized acknowledgement required; remove secrets before recording');
  requireThat(typeof options.evidence === 'string', '--evidence required');
  const bytes = readBytes(root, options.evidence);
  requireThat(bytes.length > 0 && bytes.toString('utf8').trim().length > 0, 'Empty evidence is not accepted');
  const id = randomUUID();
  ensureDirectory(root, `${learnerBase}/evidence`);
  fs.writeFileSync(safePath(root, `${learnerBase}/evidence/${id}.bin`), bytes, { flag: 'wx', mode: 0o600 });
  return { path: `evidence/${id}.bin`, sha256: hash(bytes), bytes: bytes.length, originalName: path.basename(options.evidence.replaceAll('\\', '/')), sanitized: true };
}
function saveProgress(root, learnerBase, progress) {
  const serialized = `${JSON.stringify(progress, null, 2)}\n`;
  requireThat(Buffer.byteLength(serialized, 'utf8') <= MAX_FILE_BYTES, 'Ledger would exceed 10 MiB; preserve the current ledger and arrange an explicit archive/migration');
  const target = safePath(root, `${learnerBase}/progress.json`);
  const temporary = safePath(root, `${learnerBase}/progress-${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, serialized, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, target);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function withLock(root, learnerBase, action) {
  ensureDirectory(root, learnerBase);
  const target = safePath(root, `${learnerBase}/write.lock`);
  let descriptor;
  try { descriptor = fs.openSync(target, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') fail('Ledger is locked (write.lock). Check whether another writer is running; never remove an active lock.'); throw error; }
  try { fs.writeSync(descriptor, `${process.pid}\n`); return action(); }
  finally { fs.closeSync(descriptor); fs.unlinkSync(target); }
}
function parse(argv) {
  if (!argv.length || argv.includes('--help') || argv[0] === 'help') return { command: 'help', options: {} };
  const [command, ...args] = argv;
  const specifications = {
    init: ['learner'],
    record: ['learner', 'criterion', 'result', 'evidence', 'sanitized', 'environment', 'target', 'assistance', 'session', 'note', 'performed-at', 'revision'],
    review: ['learner', 'stage', 'reviewer', 'decision', 'evidence', 'sanitized', 'note'],
    report: ['learner', 'json'],
    check: ['learner'],
  };
  requireThat(Object.hasOwn(specifications, command), `Unknown command: ${command}; use --help`);
  const options = Object.create(null);
  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    requireThat(token.startsWith('--') && specifications[command].includes(token.slice(2)), `Unknown option: ${token}`);
    const key = token.slice(2);
    requireThat(!Object.hasOwn(options, key), `Duplicate option: ${token}`);
    if (['sanitized', 'json'].includes(key)) options[key] = true;
    else {
      requireThat(args[index + 1] !== undefined && !args[index + 1].startsWith('--'), `Value required: ${token}`);
      options[key] = args[++index];
    }
  }
  if (command !== 'check' || options.learner !== undefined) identifier(options.learner, 'learner');
  return { command, options };
}
function reportText(curriculum, progress) {
  const stages = evaluate(curriculum, progress);
  const next = stages.find(stage => stage.status !== 'PASS');
  return [`学習者: ${progress.learner} / 教材 ${curriculum.version}`,
    next ? `次の行動: ${next.id} — ${next.problems[0] ?? '記録と評価内容を確認する'}` : '次の行動: 全段階の記録上の評価がPASSです。引渡し後の実環境・担当範囲は受入担当者と確認してください。',
    ...(next ? [`開く教材: ${curriculum.stages.find(stage => stage.id === next.id).document}`] : []),
    ...stages.flatMap(stage => [`${stage.id} ${stage.title}: ${stage.status}`,
      ...(stage.status === 'NOT RUN' ? [] : [
        ...stage.criteria.map(item => `  ${item.id}: ${item.result}`),
        ...stage.problems.filter(problem => !/NOT RUN$/.test(problem)).map(problem => `  - ${problem}`),
      ]),
    ]),
    'この判定は入力された証跡と評価記録の整合性に基づきます。実作業・本人性・自立性・評価者の観察を自動認証しません。実務経験や資格の認定ではありません。'].join('\n');
}

/** Exported for isolated, real-filesystem tests. CLI data never leaves the repository. */
export function execute(argv, { root = DEFAULT_ROOT, now = () => new Date() } = {}) {
  const { command, options } = parse(argv);
  if (command === 'help') return HELP;
  root = fs.realpathSync(root);
  const curriculum = loadCurriculum(root, { documents: command === 'check' });
  const time = now();
  requireThat(time instanceof Date && !Number.isNaN(time.getTime()), 'Invalid current time');
  if (command === 'check' && !options.learner) return `OK: curriculum ${curriculum.version}, 8 stage documents, 32 criterion IDs. Learner records: NOT CHECKED (use --learner).`;
  const learnerBase = `.local/server-engineer/${options.learner}`;
  const read = () => validateProgress(root, curriculum, readJson(root, `${learnerBase}/progress.json`), options.learner, time);
  if (command === 'check') { const progress = read(); return `OK: curriculum and ${options.learner} record integrity (${progress.attempts.length} attempts, ${progress.reviews.length} reviews). Skill performance is not automatically verified.`; }
  if (command === 'report') {
    const progress = read();
    return options.json ? JSON.stringify({ learner: progress.learner, basis: 'recorded evidence and human attestation; not identity or performance authentication', stages: evaluate(curriculum, progress) }, null, 2) : reportText(curriculum, progress);
  }
  return withLock(root, learnerBase, () => {
    if (command === 'init') {
      requireThat(!fs.existsSync(safePath(root, `${learnerBase}/progress.json`)), 'Learner ledger already exists; init never overwrites records');
      saveProgress(root, learnerBase, { schemaVersion: 1, curriculumVersion: curriculum.version, curriculumHash: curriculumHash(curriculum), learner: options.learner, createdAt: time.toISOString(), attempts: [], reviews: [] });
      return `Created ${learnerBase}/progress.json. All 32 criteria and all 8 stages: NOT RUN.`;
    }
    const progress = read();
    const recordedAt = time.toISOString();
    if (command === 'record') {
      requireThat(criterionMap(curriculum).has(options.criterion), `Unknown criterion: ${options.criterion}`);
      requireThat(['PASS', 'FAIL', 'BLOCKED'].includes(options.result), '--result must be PASS, FAIL or BLOCKED');
      requireThat(ENVIRONMENTS.includes(options.environment), '--environment must be desk, local, container, vm, physical or cloud');
      requireThat(ASSISTANCE.includes(options.assistance), '--assistance must be guided, ai or independent');
      identifier(options.session, 'session');
      textField(options.target, 'target', 1000);
      textField(options.note, 'note');
      const performedAt = options['performed-at'] ?? recordedAt;
      requireThat(instant(performedAt, 'performedAt') <= time.getTime(), 'performedAt cannot be in the future');
      let revision = options.revision;
      if (!revision) {
        try {
          const gitOptions = { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true };
          const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], gitOptions).trim();
          requireThat(path.relative(root, fs.realpathSync(gitRoot)) === '', 'Git top-level does not match this repository root');
          revision = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], gitOptions).trim();
        } catch { fail('Cannot read Git HEAD for this repository root; provide --revision with the full revision actually used'); }
      }
      requireThat(REVISION.test(revision), '--revision must be a full lowercase Git SHA (40 or 64 hex characters)');
      const evidence = copyEvidence(root, learnerBase, options);
      const attempt = { id: randomUUID(), criterion: options.criterion, learner: options.learner, result: options.result, recordedAt, performedAt, revision, environment: options.environment, target: options.target, assistance: options.assistance, session: options.session, note: options.note, evidence };
      progress.attempts.push(attempt);
      validateProgress(root, curriculum, progress, options.learner, time);
      saveProgress(root, learnerBase, progress);
      return `Recorded ${attempt.id}: ${attempt.criterion} ${attempt.result}. Gate status: ${evaluate(curriculum, progress).find(stage => stage.id === options.criterion.slice(0, 4)).status}.`;
    }
    const stage = curriculum.stages.find(item => item.id === options.stage);
    requireThat(stage, `Unknown stage: ${options.stage}`);
    identifier(options.reviewer, 'reviewer');
    requireThat(options.reviewer !== options.learner, 'Self-review forbidden: reviewer must be another person');
    requireThat(['APPROVE', 'REJECT'].includes(options.decision), '--decision must be APPROVE or REJECT');
    textField(options.note, 'review note');
    const attempts = latestAttempts(progress, stage);
    requireThat(attempts.every(Boolean), 'Review requires a recorded attempt for every criterion');
    if (options.decision === 'APPROVE') {
      const state = evaluate(curriculum, progress).find(item => item.id === stage.id);
      requireThat(['READY FOR REVIEW', 'REVIEW REJECTED', 'PASS'].includes(state.status), `Cannot approve ${stage.id}: ${state.status}; ${state.problems.join('; ')}`);
    }
    const evidence = copyEvidence(root, learnerBase, options);
    const review = { id: randomUUID(), stage: stage.id, learner: options.learner, reviewer: options.reviewer, decision: options.decision, recordedAt, attemptIds: attempts.map(item => item.id), note: options.note, evidence };
    progress.reviews.push(review);
    validateProgress(root, curriculum, progress, options.learner, time);
    saveProgress(root, learnerBase, progress);
    return `Recorded review ${review.id}: ${review.decision}. ${stage.id}: ${evaluate(curriculum, progress).find(item => item.id === stage.id).status}. Reviewer identity is an attestation, not authenticated by this tool.`;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(execute(process.argv.slice(2))); }
  catch (error) { console.error(`ERROR: ${error.message}\nUse --help for usage.`); process.exitCode = 1; }
}
