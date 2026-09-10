// 自律型ポートフォリオ改善ループ。
// 既存の監査（cycle）・キャリア計画（career）・自律型成長（growth）・改善実験の探索（discovery）を
// ライブラリとして一括実行し、作業枠の判定・実測結果の取り込み・次の一手の提示までを 1 コマンドで行う。
// 公開・実機操作・外部送信・本人の技能判定は行わない。書き込み先は .local/ 配下（デモ用ルートの雛形複製を除く）だけ。
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, renameSync, copyFileSync, mkdtempSync, realpathSync, constants } from 'node:fs';
import { join, resolve, dirname, basename, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { parseArgs } from 'node:util';
import { runCycle } from '../portfolio-audit/scripts/cycle.mjs';
import { digest, assert } from '../portfolio-audit/scripts/github.mjs';
import { execute as careerExecute } from '../portfolio-audit/scripts/career.mjs';
import { execute as growthExecute, actionSignature } from '../portfolio-audit/scripts/growth.mjs';
import { runDiscovery, recordFeedback, dismissCandidate, discoveryConfig, limits } from '../server-innovation/discovery.mjs';
import { catalog, register, validateProtocol, protocolDigest, evaluate } from '../server-innovation/innovation.mjs';
import { buildSnapshot, seedRoot, REPO_ROOT } from './fixture.mjs';

export { REPO_ROOT };
export const DIRS = Object.freeze({ loop: '.local/portfolio-loop', audit: '.local/portfolio-operations', career: '.local/engineer-career',
  growth: '.local/autonomous-growth', discovery: '.local/server-innovation/discovery' });
const LOCKS = [[DIRS.audit, 'cycle.lock'], [DIRS.career, 'plan.lock'], [DIRS.growth, 'plan.lock'], [DIRS.discovery, 'discovery.lock']];
// すべての JSON 出力と記録に付ける固定の権限表示。ループは何も許可せず、何も合格にしない。
export const STAMP = Object.freeze({ authorization: 'NONE', publication_allowed: false, external_actions_allowed: false, se_record_writes_allowed: false, runtime_status: 'NOT_RUN' });
export const FOOTER = '権限: authorization NONE / publication_allowed false / external_actions_allowed false / se_record_writes_allowed false / runtime_status NOT_RUN';
export const DECISIONS = Object.freeze(['ADOPT', 'REJECT', 'PARK', 'ITERATE']);
const CLOSING = ['ADOPT', 'REJECT', 'PARK'];
const VERDICTS = ['PROMISING', 'ITERATE', 'REJECT', 'NOT_READY', 'INCONCLUSIVE'];
const LEDGER_KEYS = ['candidate_id', 'decision', 'verdict', 'protocol_sha256', 'decided_at', 'reason', 'resume_condition', 'source'];
const PENDING_DRAFT = ['CREATED', 'EXISTING_PENDING_DRAFT', 'PENDING_DRAFT_NEEDS_REBASE', 'PENDING_REQUIRES_REVIEW'];
// 共通作業枠を実際に占有する監査課題。open PR、当該 HEAD の CI 失敗、主張境界の要確認だけ。資料欠落やプローブ行の変化は別の次の一手にする。
const CONTENTION = { OPEN_PR: ['EXISTING_PR_REVIEW'], CI_FAILURE: ['NEEDS_REVIEW'], CLAIM_BOUNDARY: ['NEEDS_REVIEW', 'EXISTING_PR_REVIEW', 'DRAFTABLE'] };
const INBOX_PARTS = ['protocol.registered.json', 'results.json', 'evidence/context.json'];
const CLI = 'node tools/portfolio-loop/loop.mjs';
const NO_NETWORK = 'PORTFOLIO_LOOP_NO_NETWORK';

const json = x => JSON.stringify(x, null, 2) + '\n';
const stripBom = text => text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
const readJson = p => JSON.parse(stripBom(readFileSync(p, 'utf8')));
const readIf = p => existsSync(p) ? readJson(p) : null;
const iso = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(x) && Number.isFinite(Date.parse(x));
const candidateId = x => typeof x === 'string' && /^INV-(?:\d{3}|[a-f0-9]{16})$/.test(x);
const dynamicId = x => typeof x === 'string' && /^INV-[a-f0-9]{16}$/.test(x);
const hex64 = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const sha40 = x => typeof x === 'string' && /^[a-f0-9]{40}$/.test(x);
const plain = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 4000 && !/[\r\n\t]/.test(x);
const stamp = x => ({ ...x, ...STAMP });
const safeTime = t => t.replace(/[:.]/g, '-');
const cell = x => String(x ?? '').replace(/[\r\n|]/g, ' ').replace(/[<>]/g, '');
const wallClock = () => new Date().toISOString();
function atomically(path, content) { const temp = path + '.tmp-' + randomUUID(); writeFileSync(temp, content, { flag: 'wx' }); renameSync(temp, path); }
function pidAlive(pid) { if (!Number.isInteger(pid) || pid <= 0) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }
function dirSize(dir) {
  const size = { files: 0, bytes: 0 };
  if (!existsSync(dir)) return size;
  const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.isFile()) { size.files++; size.bytes += statSync(p).size; } } };
  walk(dir); return size;
}
const subdirs = d => existsSync(d) ? readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort() : [];
const candidateOf = experimentId => experimentId.match(/^(INV-(?:\d{3}|[a-f0-9]{16}))-/)?.[1] ?? null;
function insideTemp(root) {
  const bases = [tmpdir()]; try { bases.push(realpathSync(tmpdir())); } catch { /* 一時ディレクトリが解決できない環境 */ }
  let real = root; try { real = realpathSync(root); } catch { /* 未作成のルート */ }
  return bases.some(b => [root, real].some(r => r === b || r.startsWith(b + sep)));
}

// ---- 採否台帳（decisions.json）。人の判断と取り込んだ判定だけを持ち、技能や実績は持たない。 ----
export function validateLedger(ledger) {
  assert(ledger && typeof ledger === 'object' && !Array.isArray(ledger) && ledger.schema_version === 1 && Array.isArray(ledger.entries), 'Invalid decisions ledger');
  for (const e of ledger.entries) {
    assert(e && typeof e === 'object' && !Array.isArray(e) && Object.keys(e).sort().join() === [...LEDGER_KEYS].sort().join(), 'Invalid decisions ledger');
    assert(candidateId(e.candidate_id) && (e.decision === null || DECISIONS.includes(e.decision)) && (e.verdict === null || VERDICTS.includes(e.verdict)) &&
      (e.protocol_sha256 === null || hex64(e.protocol_sha256)) && iso(e.decided_at) && plain(e.reason) &&
      (e.resume_condition === null || plain(e.resume_condition)) && ['human', 'intake'].includes(e.source), 'Invalid decisions ledger');
    assert(e.source === 'human' ? e.decision !== null : (e.decision === null && e.verdict !== null && e.protocol_sha256 !== null), 'Invalid decisions ledger');
    assert(e.decision !== 'PARK' || e.resume_condition !== null, 'Invalid decisions ledger');
  }
  return ledger;
}
export function readLedger(root) {
  const path = join(root, DIRS.loop, 'decisions.json');
  return existsSync(path) ? validateLedger(readJson(path)) : { schema_version: 1, entries: [] };
}
function writeLedger(root, ledger) {
  validateLedger(ledger); mkdirSync(join(root, DIRS.loop), { recursive: true });
  atomically(join(root, DIRS.loop, 'decisions.json'), json(stamp({ schema_version: 1, entries: ledger.entries })));
  return ledger;
}
function appendLedger(root, entry) { const ledger = readLedger(root); ledger.entries.push(entry); return writeLedger(root, ledger); }
// 候補ごとに最新の本人判断だけを使う。ITERATE や取り込みだけの記録は除外しない。
export function latestDecisions(ledger) {
  const map = new Map();
  for (const e of ledger.entries) if (e.source === 'human') map.set(e.candidate_id, e);
  return map;
}
export function closedIds(ledger, known) {
  return [...latestDecisions(ledger).values()].filter(e => CLOSING.includes(e.decision)).map(e => e.candidate_id).filter(id => known.has(id)).sort();
}
function awaitingDecisions(ledger) {
  const humans = ledger.entries.filter(e => e.source === 'human');
  return ledger.entries.filter(e => e.source === 'intake' && !humans.some(h => h.candidate_id === e.candidate_id && Date.parse(h.decided_at) >= Date.parse(e.decided_at)));
}

// ---- 読み取り専用の点検。run の前提確認と status の両方が同じ関数を使う。 ----
export function inspect(root = REPO_ROOT, now = wallClock()) {
  root = resolve(root);
  const facts = { root, evaluated_at: now, problems: [], locks: [] };
  const problem = (label, error) => facts.problems.push(`${label}: ${error.message}`);
  const tryRead = (label, path) => { try { return readIf(path); } catch (error) { problem(label, error); return null; } };
  for (const [dir, name] of LOCKS) {
    const path = join(root, dir, name); if (!existsSync(path)) continue;
    let pid = null, holder = 'UNREADABLE';
    try { pid = readJson(path).pid; holder = pidAlive(pid) ? 'ALIVE' : 'DEAD'; } catch { /* 書き込み途中や壊れたロックも報告対象 */ }
    facts.locks.push({ path, pid, holder });
  }
  const auditDir = join(root, DIRS.audit);
  facts.audit = { latest: null, observed_at: null, snapshot_age_hours: null, fresh: false, pending: null };
  try {
    // 直近の実行を LIVE / REPLAY の新しい方から取る。鮮度は評価時刻ではなく観測時刻で測る。
    const candidates = [['LIVE', readIf(join(auditDir, 'latest.json'))], ['REPLAY', readIf(join(auditDir, 'replay-latest.json'))]].filter(([, l]) => l);
    const [source, latest] = candidates.sort((a, b) => Date.parse(b[1].evaluated_at) - Date.parse(a[1].evaluated_at))[0] ?? [];
    if (latest) {
      const analysis = tryRead('Audit analysis', join(dirname(latest.report), 'analysis.json'));
      const observed = analysis?.observed_at ?? latest.evaluated_at;
      const age = (Date.parse(now) - Date.parse(observed)) / 3600000;
      const complete = latest.collection_status === 'COMPLETE_FOR_CONFIGURED_SCOPE';
      facts.audit.latest = { source, evaluated_at: latest.evaluated_at, collection_status: latest.collection_status, draft_status: latest.draft_status, notify: latest.notify, report: latest.report };
      facts.audit.observed_at = observed; facts.audit.snapshot_age_hours = Math.round(age * 10) / 10;
      facts.audit.fresh = complete && age >= 0 && age <= discoveryConfig.snapshot_max_age_hours;
    }
  } catch (error) { problem('Audit latest', error); }
  try {
    const pending = readIf(join(auditDir, 'pending.json'));
    if (pending) {
      assert(pending.id && pending.before_sha256 && pending.status === 'AWAITING_REVIEW', 'Invalid pending draft');
      facts.audit.pending = { id: pending.id, folder: pending.folder ?? null, base_sha: pending.base_sha ?? null };
    }
  } catch (error) { problem('Audit pending', error); }
  const profilePath = join(root, DIRS.career, 'profile.json');
  facts.career = { initialized: existsSync(profilePath), updated_at: null, age_days: null, learner_id: null, actions: [], latest: tryRead('Career latest', join(root, DIRS.career, 'latest.json')) };
  if (facts.career.initialized) {
    try {
      const profile = readJson(profilePath);
      facts.career.updated_at = profile.updated_at; facts.career.learner_id = profile.connections?.learner_id ?? null;
      facts.career.actions = Array.isArray(profile.actions) ? profile.actions : [];
      facts.career.age_days = Math.floor((Date.parse(now) - Date.parse(profile.updated_at)) / 86400000);
    } catch (error) { problem('Career profile', error); }
  }
  facts.growth = { binding_status: facts.career.initialized ? 'NOT_BOUND' : null, latest: tryRead('Growth latest', join(root, DIRS.growth, 'latest.json')) };
  try {
    const settings = readIf(join(root, DIRS.growth, 'settings.json'));
    if (settings && settings.career_action_id !== null) {
      const bound = facts.career.actions.find(a => a.id === settings.career_action_id);
      facts.growth.binding_status = bound && actionSignature(bound) === settings.action_signature ? 'BOUND' : 'ACTION_CHANGED_REBIND_REQUIRED';
    }
  } catch (error) { problem('Growth settings', error); }
  const discoveryDir = join(root, DIRS.discovery);
  facts.discovery = { pointer: null, selected: null, candidates: [], counts: { candidates: 0, open: 0, superseded: 0, feedback: 0, dismissals: 0 }, limits, drafts: [] };
  try {
    const pointer = readIf(join(discoveryDir, 'latest.json'));
    if (pointer) {
      assert(pointer.schema_version === 2 && hex64(pointer.state_sha256) && typeof pointer.state_path === 'string', 'Invalid discovery pointer');
      const bytes = readFileSync(join(discoveryDir, pointer.state_path));
      assert(digest(bytes) === pointer.state_sha256, 'Discovery state integrity mismatch');
      const state = JSON.parse(bytes);
      facts.discovery.pointer = { kind: pointer.kind, evaluated_at: pointer.evaluated_at, selected: pointer.selected, report: pointer.report_path ? join(discoveryDir, pointer.report_path) : null };
      facts.discovery.selected = pointer.selected ?? null;
      facts.discovery.candidates = state.candidates.map(c => ({ id: c.id, registry_status: c.registry_status, title: c.title, operator: c.operator }));
      const dismissed = new Set(state.dismissals.map(d => d.candidate_id));
      facts.discovery.counts = { candidates: state.candidates.length, open: state.candidates.filter(c => c.registry_status === 'OPEN' && !dismissed.has(c.id)).length,
        superseded: state.candidates.filter(c => c.registry_status === 'SUPERSEDED').length, feedback: state.feedback.length, dismissals: state.dismissals.length };
    } else assert(!existsSync(join(discoveryDir, 'runs')) && !existsSync(join(discoveryDir, 'feedback')), 'Missing latest pointer with existing history; recover explicitly');
    const drafts = new Map();
    for (const run of subdirs(join(discoveryDir, 'runs'))) {
      const path = join(discoveryDir, 'runs', run, 'protocol.draft.json'); if (!existsSync(path)) continue;
      const draft = readJson(path);
      if (!drafts.has(draft.candidate_id) || Date.parse(draft.prepared_at) > Date.parse(drafts.get(draft.candidate_id).prepared_at)) drafts.set(draft.candidate_id, { path, candidate_id: draft.candidate_id, prepared_at: draft.prepared_at });
    }
    facts.discovery.drafts = [...drafts.values()];
  } catch (error) { problem('Discovery state', error); }
  facts.ledger = { schema_version: 1, entries: [] }; facts.awaiting = []; facts.parked = [];
  try {
    facts.ledger = readLedger(root);
    facts.awaiting = awaitingDecisions(facts.ledger).map(e => ({ candidate_id: e.candidate_id, verdict: e.verdict, reason: e.reason, protocol_sha256: e.protocol_sha256, decided_at: e.decided_at }));
    facts.parked = [...latestDecisions(facts.ledger).values()].filter(e => e.decision === 'PARK').map(e => ({ candidate_id: e.candidate_id, resume_condition: e.resume_condition, decided_at: e.decided_at }));
  } catch (error) { problem('Decisions ledger', error); }
  const inbox = join(root, DIRS.loop, 'inbox');
  facts.inbox = subdirs(inbox).map(name => { const path = join(inbox, name); const missing = INBOX_PARTS.filter(f => !existsSync(join(path, f))); return { id: name, path, complete: missing.length === 0, missing }; });
  facts.done = subdirs(join(root, DIRS.loop, 'done'));
  // 登録済みとみなす候補は、inbox に実験票がある候補と、取り込み済み（done）の候補。
  facts.registered_candidates = [...new Set([...facts.inbox.map(x => x.id), ...facts.done].map(candidateOf).filter(Boolean))];
  facts.sizes = Object.fromEntries(Object.entries(DIRS).map(([k, d]) => [k, dirSize(join(root, d))]));
  facts.loop_latest = tryRead('Loop latest', join(root, DIRS.loop, 'latest.json'));
  return facts;
}
function enforce(facts) {
  for (const l of facts.locks) {
    if (l.holder === 'ALIVE') throw new Error(`Another run holds ${l.path} (pid ${l.pid})`);
    if (l.holder === 'UNREADABLE') throw new Error(`Lock ${l.path} is present but unreadable; wait and retry before removing it`);
    throw new Error(`Stale lock ${l.path} (pid ${l.pid} is not running); confirm and remove it manually`);
  }
  if (facts.problems.length) throw new Error(facts.problems[0]);
}
const knownIds = facts => new Set([...catalog.experiments.map(x => x.id), ...facts.discovery.candidates.map(c => c.id)]);

// ---- 実測結果の取り込み。inbox/<実験ID>/ に登録済み実験票・結果・証拠が揃った分だけを探索の学習へ渡す。 ----
// 順序: 検証 → 探索へ記録（永続化）→ 台帳へ記録（同じ実験票は一度だけ）→ done/ へ移動。移動失敗は警告にとどめ、判定を失わない。
function takeInbox(root, facts, nowIso) {
  const discoveryDir = join(root, DIRS.discovery), taken = [], errors = [], remaining = [], notReady = [], warnings = [];
  for (const entry of facts.inbox) {
    if (!entry.complete) { remaining.push(entry); continue; }
    try {
      const protocol = readJson(join(entry.path, 'protocol.registered.json')); validateProtocol(protocol);
      const results = readJson(join(entry.path, 'results.json'));
      assert(results && results.data_kind === 'measured', `Inbox results data_kind must be measured (found ${JSON.stringify(results?.data_kind ?? null)}); synthetic, demo or unset data stays out of the ledger`);
      assert(results.protocol_sha256 === protocolDigest(protocol), 'Protocol digest mismatch');
      const evidenceDir = join(entry.path, 'evidence');
      const preview = evaluate(protocol, results, evidenceDir, nowIso);
      if (preview.decision === 'NOT_READY') { notReady.push({ id: entry.id, candidate_id: protocol.candidate_id, reason: preview.reason, path: entry.path }); remaining.push(entry); continue; }
      const pointer = recordFeedback({ outputDir: discoveryDir, protocol, results, evidenceDir, now: nowIso });
      const verdict = pointer.duplicate_feedback ? preview : readJson(join(discoveryDir, pointer.result_path)).verdict;
      const sha = protocolDigest(protocol);
      const ledger = readLedger(root);
      if (!ledger.entries.some(e => e.source === 'intake' && e.protocol_sha256 === sha)) {
        ledger.entries.push({ candidate_id: protocol.candidate_id, decision: null, verdict: verdict.decision, protocol_sha256: sha, decided_at: nowIso, reason: verdict.reason, resume_condition: null, source: 'intake' });
        writeLedger(root, ledger);
      }
      const archived = join(root, DIRS.loop, 'done', `${entry.id}-${safeTime(nowIso)}-${randomUUID().slice(0, 8)}`);
      let archivedTo = null;
      try { mkdirSync(dirname(archived), { recursive: true }); renameSync(entry.path, archived); archivedTo = archived; }
      catch (error) { warnings.push(`実験 ${entry.id} は記録済みですが done/ へ移動できませんでした（${error.message}）。手動で移動します`); }
      taken.push({ id: entry.id, candidate_id: protocol.candidate_id, verdict: verdict.decision, reason: verdict.reason, protocol_sha256: sha, duplicate: !!pointer.duplicate_feedback, archived_to: archivedTo });
    } catch (error) { errors.push({ id: entry.id, message: error.message, code: classifyError(error.message).code }); remaining.push(entry); }
  }
  return { taken, errors, remaining, not_ready: notReady, warnings };
}

// ---- 1 回の週次実行。順序: 点検 → 監査 → キャリア → 成長 → 取り込み → 作業枠 → 探索 → 集約。 ----
export async function runLoop({ root = REPO_ROOT, offline, proposals = [], occupied: occupiedFlag = false, free = false, now, demo = false } = {}) {
  const clock = now ?? wallClock; root = resolve(root);
  assert(offline === undefined || (offline && typeof offline === 'object' && !Array.isArray(offline)), 'Invalid offline snapshot');
  assert(Array.isArray(proposals) && proposals.length <= 4, 'At most four custom proposals per cycle');
  const synthetic = offline?.data_kind === 'synthetic';
  // 合成スナップショットは、実在の探索登録簿に候補を残さないよう、デモか一時ルートに限る。
  assert(!synthetic || demo || insideTemp(root), 'Synthetic snapshot refused outside demo or a temporary root; use `demo`');
  assert(offline !== undefined || process.env[NO_NETWORK] !== '1', `Live collection is disabled by ${NO_NETWORK}=1; pass --offline SNAPSHOT.json`);
  const before = inspect(root, clock()); enforce(before);
  const loopDir = join(root, DIRS.loop); mkdirSync(join(loopDir, 'inbox'), { recursive: true });
  // 1. 監査。オフラインは既存の replay 機能（REPLAY_NO_EDITS）を使い、修正案を生成しない。
  const auditDir = join(root, DIRS.audit);
  const auditSummary = offline === undefined ? await runCycle({ config: discoveryConfig, outputDir: auditDir, now: clock })
    : await runCycle({ config: discoveryConfig, outputDir: auditDir, replay: offline, now: clock });
  const nowIso = clock(); // 収集完了後に確定させる。以降の工程はこの 1 時刻を共有する。
  const fixed = () => nowIso;
  const runDir = dirname(auditSummary.report);
  const snapshot = offline ?? readJson(join(runDir, 'snapshot.json'));
  const analysis = readJson(join(runDir, 'analysis.json'));
  const complete = auditSummary.collection_status === 'COMPLETE_FOR_CONFIGURED_SCOPE';
  const audit = { state: complete ? 'COMPLETE' : 'NEEDS_REFRESH', mode: offline === undefined ? 'LIVE' : 'OFFLINE_REPLAY', collection_status: auditSummary.collection_status,
    execution_mode: analysis.execution_mode, observed_at: snapshot.observed_at, changes: auditSummary.changes, draft_status: auditSummary.draft_status, notify: auditSummary.notify,
    repeated_failure: auditSummary.repeated_failure, report: auditSummary.report, snapshot: join(runDir, 'snapshot.json'),
    errors: (snapshot.errors ?? []).map(e => typeof e === 'string' ? e : `${e.repository ?? e.full_name ?? 'collection'}: ${e.message ?? e.error ?? JSON.stringify(e)}`),
    findings: analysis.findings.map(f => ({ id: f.id, rule: f.rule, priority: f.priority, state: f.state, title: f.title })),
    probes: analysis.evidence_probes.map(p => ({ id: p.id, result: p.result, environment: p.environment })) };
  // 2. キャリア計画。未初期化なら作らず、作業枠不明として扱う。
  let career = { state: 'NOT_INITIALIZED', notify: false, report: null, warnings: [], selected: [], planned_minutes: null, learner_state: null };
  if (before.career.initialized) {
    const check = JSON.parse(await careerExecute(['check'], { root, now: fixed }));
    const latest = JSON.parse(await careerExecute(['plan'], { root, now: fixed }));
    const plan = readJson(join(root, latest.plan));
    career = { state: 'PLANNED', notify: latest.notify, report: join(root, latest.report), warnings: check.warnings, learner_state: check.signals.learner.state,
      selected: plan.selected.map(a => ({ id: a.id, minutes: a.minutes, kind: a.kind })), planned_minutes: plan.planned_minutes };
  }
  // 3. 自律型成長。SE 台帳が読めない接続状態では growth が停止するため、career の信号で先に分岐する。
  let growth = { state: career.state === 'PLANNED' ? 'SKIPPED_LEARNER_UNAVAILABLE' : 'SKIPPED_CAREER_NOT_INITIALIZED', notify: false, report: null, binding_status: null, technical_slot_minutes: null, actions: [] };
  if (career.state === 'PLANNED' && (before.career.learner_id === null || career.learner_state === 'READ')) {
    const check = JSON.parse(await growthExecute(['check'], { root, now: fixed }));
    const latest = JSON.parse(await growthExecute(['plan'], { root, now: fixed }));
    const plan = readJson(join(root, latest.plan));
    growth = { state: 'PLANNED', notify: latest.notify, report: join(root, latest.report), binding_status: check.binding_status, technical_slot_minutes: check.technical_slot_minutes,
      learner_connected: check.learner_connected, actions: plan.actions.map(a => ({ id: a.id, minutes: a.minutes, title: a.title })), deferred: plan.deferred.length };
  }
  // 4. 実測結果の取り込みを探索より先に行う。同じ実行で判定と追試候補が出るようにするため。
  const intake = takeInbox(root, before, nowIso);
  // 5. 作業枠の判定。未確認は使用中。空きは検証した条件がすべて偽のときだけ。
  const ledger = readLedger(root), known = knownIds(before);
  const closedAll = [...latestDecisions(ledger).values()].filter(e => CLOSING.includes(e.decision)).map(e => e.candidate_id);
  const closed = closedIds(ledger, known), dropped = closedAll.filter(id => !known.has(id)).sort();
  const basis = [], contention = analysis.findings.filter(f => f.priority === 1 && CONTENTION[f.rule]?.includes(f.state)).map(f => f.id);
  if (PENDING_DRAFT.includes(auditSummary.draft_status)) basis.push('AUDIT_DRAFT_PENDING');
  if (existsSync(join(auditDir, 'pending.json'))) basis.push('AUDIT_PENDING_FILE');
  if (!complete) basis.push('COLLECTION_INCOMPLETE');
  else if (contention.length) basis.push('AUDIT_URGENT_OR_PR_REVIEW');
  if (intake.remaining.length) basis.push('EXPERIMENT_INBOX_PENDING');
  if ([...latestDecisions(ledger).values()].some(e => e.decision === 'ITERATE')) basis.push('EXPERIMENT_ITERATING');
  if (career.state !== 'PLANNED') basis.push('CAREER_CAPACITY_UNKNOWN');
  if (occupiedFlag) basis.push('FLAG_OCCUPIED');
  const computed = basis.length > 0;
  const occupied = occupiedFlag ? true : free ? false : computed;
  if (free && !occupiedFlag) basis.push(computed ? 'HUMAN_CONFIRMED_FREE_OVERRIDES' : 'HUMAN_CONFIRMED_FREE');
  const context = { schema_version: 1, reviewed_at: nowIso, occupied, closed };
  // 6. 探索。収集不全のときは古い原本で候補を作らない。
  let discovery = { state: complete ? 'RUN' : 'SKIPPED_NEEDS_REFRESH', discovery_status: null, notify: false, selected: null, report: null, draft: null, added: [], skipped: [], questions: [], queue: [], counts: null, limits };
  if (complete) {
    const discoveryDir = join(root, DIRS.discovery);
    const pointer = runDiscovery({ snapshot, context, outputDir: discoveryDir, proposals, now: nowIso });
    const result = readJson(join(discoveryDir, pointer.result_path));
    const draftHere = join(discoveryDir, dirname(pointer.state_path), 'protocol.draft.json');
    const after = inspect(root, nowIso);
    const existing = after.discovery.drafts.find(d => d.candidate_id === result.plan.selected) ?? null;
    const draft = result.plan.selected ? (existsSync(draftHere) ? { path: draftHere, candidate_id: result.plan.selected, status: 'NEW' } : existing ? { ...existing, status: 'EXISTING' } : null) : null;
    if (draft && after.registered_candidates.includes(result.plan.selected)) draft.status = 'REGISTERED';
    discovery = { state: result.discovery_status, discovery_status: result.discovery_status, collection_status: result.collection_status, notify: pointer.notify,
      selected: result.plan.selected, report: join(discoveryDir, pointer.report_path), draft, added: result.added, skipped: result.skipped,
      questions: [...new Map(result.questions.map(q => [q.kind + '\n' + q.question, { kind: q.kind, question: q.question, source: q.source ?? null }])).values()],
      queue: result.plan.queue.slice(0, 8).map(x => ({ id: x.id, state: x.state, priority: x.priority, score: x.score, title: x.title, source: x.source, source_line: x.source_line, related_prs: x.related_prs })),
      counts: after.discovery.counts, limits };
  }
  // 7. 集約。通知は各系統の意味差分と取り込みの有無だけから決め、時刻からは決めない。
  const after = inspect(root, nowIso);
  const summary = stamp({ schema_version: 1, evaluated_at: nowIso, mode: audit.mode, demo, synthetic, outcome: complete ? 'PROCESSED' : 'NEEDS_REFRESH', root,
    audit, career, growth, intake: { taken: intake.taken, errors: intake.errors, not_ready: intake.not_ready, remaining: intake.remaining.map(e => ({ id: e.id, missing: e.missing })) },
    context: { ...context, basis, basis_findings: complete ? contention : [], computed_occupied: computed, dropped_closed: dropped }, discovery,
    warnings: [...dropped.map(id => `除外指定 ${id} は既知の候補にないため無視しました`), ...intake.warnings],
    notify: audit.notify || career.notify || growth.notify || discovery.notify || intake.taken.length > 0 || intake.errors.length > 0 });
  summary.next_actions = nextActions(after, summary);
  const loopRun = join(loopDir, 'runs', `${safeTime(nowIso)}-${randomUUID().slice(0, 8)}`);
  assert(!existsSync(loopRun), 'Run directory collision'); mkdirSync(loopRun, { recursive: true });
  writeFileSync(join(loopRun, 'context.json'), json(context), { flag: 'wx' });
  writeFileSync(join(loopRun, 'summary.json'), json(summary), { flag: 'wx' });
  writeFileSync(join(loopRun, 'summary.md'), renderSummary(summary), { flag: 'wx' });
  summary.run_dir = loopRun; summary.report = join(loopRun, 'summary.md');
  // status が run と同じ次の一手を導けるよう、判定に使う項目をそのまま残す。
  atomically(join(loopDir, 'latest.json'), json(stamp({ schema_version: 1, evaluated_at: nowIso, mode: summary.mode, demo, synthetic, outcome: summary.outcome, notify: summary.notify,
    run_dir: loopRun, report: summary.report, audit: { state: audit.state, collection_status: audit.collection_status, draft_status: audit.draft_status, notify: audit.notify, errors: audit.errors, findings: audit.findings },
    career: { state: career.state, notify: career.notify }, growth: { state: growth.state, binding_status: growth.binding_status, notify: growth.notify },
    intake: { taken: intake.taken.length, errors: intake.errors, not_ready: intake.not_ready },
    discovery: { state: discovery.state, discovery_status: discovery.discovery_status, selected: discovery.selected, notify: discovery.notify, draft: discovery.draft, report: discovery.report },
    context: { occupied, basis, basis_findings: summary.context.basis_findings, closed }, next_actions: summary.next_actions })));
  return summary;
}

// ---- 次の一手。上から順に優先。すべて提案であり、実施・公開・合格の許可ではない。 ----
export function nextActions(facts, summary = null) {
  const actions = [];
  const rootArg = facts.root === REPO_ROOT ? '' : ` --root ${facts.root}`;
  const cli = command => `${CLI} ${command}${rootArg}`;
  const add = (code, title, command = null, detail = null) => actions.push({ code, title, command, detail });
  for (const l of facts.locks) add('LOCK_PRESENT', l.holder === 'UNREADABLE' ? `ロック ${basename(dirname(l.path))}/${basename(l.path)} が読めません。書き込み途中の可能性があるため、しばらく待って再確認してから判断します`
    : `ロック ${basename(dirname(l.path))}/${basename(l.path)} が残っています（pid ${l.pid}: ${l.holder}）。実行中か確認し、終了済みと確認した当該ロックだけを除去します`, null, l.path);
  for (const p of facts.problems) add('CORRUPT_STATE', '状態ファイルが不正です。上書きせず、直前の runs/ と原本を照合して復旧します', null, p);
  const src = summary ?? facts.loop_latest ?? null; // 直前の実行の判定。null の値も意味を持つため、項目ごとに別の実行へ遡らない。
  const auditNow = src?.audit ?? null;
  const collection = auditNow?.collection_status ?? facts.audit.latest?.collection_status ?? null;
  if (collection === 'NEEDS_REFRESH') {
    const errors = auditNow?.errors ?? [];
    add('REFRESH_COLLECTION', `取得が不完全または古いため、依存する準備を進めません。${errors.length ? '収集エラー: ' + errors.join(' / ') + '。' : ''}ネットワーク・API 制限を確認し、HTTP 401/403 なら GITHUB_TOKEN の有効性か未設定に戻すことを確認して再実行します`, cli('run'), errors.length ? errors.join('\n') : null);
  }
  if (facts.audit.pending) add('REVIEW_PENDING_DRAFT', `監査の限定修正案 ${facts.audit.pending.id} がレビュー待ちです。内容を確認し、採否と理由を残して pending.json を履歴へ移します`, null, facts.audit.pending.folder);
  const reviewFindings = (auditNow?.findings ?? []).filter(f => f.priority === 1 && f.state === 'NEEDS_REVIEW' && !CONTENTION[f.rule]?.includes(f.state));
  for (const f of reviewFindings) add('REVIEW_AUDIT_FINDING', `監査の要確認課題: ${f.title}（${f.rule}）。原本を読み、監査設定または資料の側を直します`, null, f.id);
  if (!facts.career.initialized) add('INIT_CAREER', '私用のキャリア計画が未作成のため作業枠を判定できません。週の合計時間で初期化します', cli('init 10'));
  else if (facts.career.age_days !== null && facts.career.age_days >= 21) add('REVIEW_PROFILE', `キャリア計画の確認から ${facts.career.age_days} 日経過。28 日で週次見直しのみへ縮退するため、本人が内容を確認して updated_at を更新します`, null, join(facts.root, DIRS.career, 'profile.json'));
  const growthState = src?.growth?.state ?? null;
  if (growthState === 'SKIPPED_LEARNER_UNAVAILABLE') add('FIX_LEARNER_CONNECTION', `キャリア計画の learner_id（${facts.career.learner_id ?? '不明'}）に対応する SE 台帳が読めないため、自律型成長を飛ばしました。ID を確認するか接続を null に戻します`, null, join(facts.root, DIRS.career, 'profile.json'));
  for (const e of facts.inbox.filter(x => !x.complete)) add('COMPLETE_INBOX', `実験 ${e.id} の取り込みに ${e.missing.join(', ')} が不足しています。実測後に揃えます`, null, e.path);
  for (const e of src?.intake?.not_ready ?? []) add('COMPLETE_MEASUREMENT', `実験 ${e.id} は全試行が揃っていません（${e.reason}）。残りの組を測定して results.json を更新します`, null, e.path);
  for (const e of src?.intake?.errors ?? []) add('FIX_INBOX', `実験 ${e.id} の取り込みに失敗（${e.code}）: ${e.message}`, null, null);
  for (const a of facts.awaiting) add('DECIDE', `実験 ${a.candidate_id} の判定は ${a.verdict}（${a.reason}）。採用・見直し・却下・保留を本人が決めます`, cli(`done ${a.candidate_id} ADOPT|ITERATE|REJECT|PARK "理由"`), a.protocol_sha256);
  if (facts.career.initialized && facts.growth.binding_status && facts.growth.binding_status !== 'BOUND') add('BIND_SLOT', `学習枠が ${facts.growth.binding_status} です。本人が許可する技術行動を明示して接続します`, cli('bind-slot evidence-map'));
  const selected = src ? src.discovery?.selected ?? null : facts.discovery.selected;
  const draft = src ? src.discovery?.draft ?? null : (selected ? facts.discovery.drafts.find(d => d.candidate_id === selected) ?? null : null);
  if (selected && draft && draft.status !== 'REGISTERED' && !facts.registered_candidates.includes(selected)) add('REGISTER_PROTOCOL', `候補 ${selected} の実験票の下書きがあります。比較条件を決め、実験の前に登録します`, cli(`register ${draft.path} --candidate-sha <40hex> --environment-id <環境ID> --scope "<比較の範囲>" --context <環境条件.json>`), draft.path);
  if (selected) add('PREPARE_CANDIDATE', `候補 ${selected} を既存の 45 分枠で一件だけ準備します（根拠の原本・後続記録・コード・既存 PR を読む）`, null, src?.discovery?.report ?? facts.discovery.pointer?.report ?? null);
  const status = src?.discovery?.discovery_status ?? null;
  if (status === 'RESEARCH_REQUIRED') add('RESEARCH', '根拠のある新しい前提がありません。未収集の実測記録・別方式の根拠を読み、出典付きの独自提案を検討します');
  if (status === 'BACKLOG_FULL') add('DISMISS_OR_PARK', `未着手の動的候補が上限 ${limits.open_candidates} 件です。理由を付けて却下または保留します`, cli('dismiss <INV-16hex> "理由"'));
  const context = src?.context ?? null;
  if (context && context.occupied && !selected && auditNow?.state === 'COMPLETE') add('SLOT_OCCUPIED', `共通作業枠が使用中（${context.basis.join(', ')}${context.basis_findings?.length ? '; ' + context.basis_findings.join(', ') : ''}）のため新しい準備を選びません。空いていると確認した週だけ --free を付けます`);
  if (!actions.length) add('NO_CHANGE', '意味のある変化はありません。次回の定期実行を待ちます');
  return actions;
}

// ---- エラー分類。元のメッセージは変えず、日本語の対処だけを添える。 ----
const ERRORS = [
  [m => /Stale lock/.test(m), 'STALE_LOCK', 'ロックの pid が動いていません。原因を確認し、当該ロックだけを手動で除去してから再実行します'],
  [m => /Another run holds|EEXIST|present but unreadable/.test(m), 'LOCKED', '別の実行が同じ保存先を使っています。終了を待つか、動いていないと確認した当該ロックだけを除去します'],
  [m => /ENOENT/.test(m) && /profile\.json/.test(m), 'NOT_INITIALIZED', `${CLI} init 10 で私用のキャリア計画を作ります`],
  [m => /Invalid pending draft|Invalid state; refusing|Invalid previous|Invalid decisions ledger|integrity mismatch|Invalid discovery pointer|Missing latest pointer|no longer verifies|Refusing to overwrite a newer|newer previous growth|Run directory collision|is not valid JSON|Unexpected token|Unexpected end of JSON/.test(m), 'CORRUPT_STATE', '状態ファイルや入力 JSON が壊れています。上書きせず、直前の runs/ と原本を照合して復旧します'],
  [m => /Refresh work context|future snapshot|Invalid or future|Invalid measurement interval/.test(m), 'TIME', '時刻の前後関係が不正です。端末の時計・観測時刻・登録時刻を確認します'],
  [m => /Missing file: \.local\/server-engineer/.test(m), 'LEARNER_UNAVAILABLE', 'career profile の learner_id に対応する SE 台帳がありません。ID を確認するか接続を null に戻します'],
  [m => /Synthetic results|must be measured|DEMO_ONLY|Synthetic snapshot refused/.test(m), 'SYNTHETIC_REJECTED', '合成・デモの結果は学習台帳へ入れません。実測結果だけを inbox に置き、合成の再生は demo か一時ルートで行います'],
  [m => /Invalid work context|Unknown work context/.test(m), 'CONTEXT', '作業枠の内容が不正です。除外 ID が既知の候補か確認します'],
  [m => /capacity reached/i.test(m), 'CAPACITY', '探索の登録上限です。候補の却下・保留と過去の feedback の整理を本人がレビューします'],
  [m => /Live collection is disabled/.test(m), 'NO_NETWORK', `${NO_NETWORK}=1 のため GitHub 収集を行いません。--offline を付けるか、環境変数を外します`],
  [m => /Usage:|Unknown command|Unknown option|takes no|takes at most|requires|must be|must look like|Provide|Reason must|Decision must|already registered|already contains|Refusing/.test(m), 'USAGE', '--help で引数の形式と前提を確認します'],
];
export function classifyError(message) {
  const hit = ERRORS.find(([test]) => test(String(message)));
  return hit ? { code: hit[1], hint: hit[2] } : { code: 'INVALID_INPUT', hint: '入力ファイル・引数・状態の内容を確認します。元のメッセージをそのまま記録します' };
}

// ---- 本人が使う補助操作。いずれも .local/ 配下だけを書く。 ----
export function decide({ root = REPO_ROOT, id, decision, reason, resumeCondition = null, protocolSha256 = null, now = wallClock() }) {
  root = resolve(root);
  assert(candidateId(id), 'Candidate ID must look like INV-001 or INV-<16 hex>');
  assert(DECISIONS.includes(decision), 'Decision must be ADOPT, REJECT, PARK or ITERATE');
  assert(plain(reason), 'Reason must be one non-empty line (max 4000 chars)');
  assert(decision !== 'PARK' || plain(resumeCondition), 'PARK requires --resume-condition');
  assert(protocolSha256 === null || hex64(protocolSha256), 'protocol_sha256 must be 64 hex');
  const facts = inspect(root, now); enforce(facts);
  const known = knownIds(facts); assert(known.has(id), `Unknown candidate ${id}; known ids come from the seed catalog and the discovery registry`);
  const entry = { candidate_id: id, decision, verdict: null, protocol_sha256: protocolSha256, decided_at: now, reason, resume_condition: decision === 'PARK' ? resumeCondition : null, source: 'human' };
  const ledger = appendLedger(root, entry);
  return stamp({ entry, closed: closedIds(ledger, known), meaning: 'Recorded a human decision for the next work context. No candidate is executed, published or certified.' });
}
export function registerDraft({ root = REPO_ROOT, draftPath, candidateSha, environmentId, scope, contextPath, now = wallClock() }) {
  root = resolve(root);
  const draft = readJson(resolve(draftPath));
  assert(draft && draft.status === 'DRAFT' && candidateId(draft.candidate_id), 'Expected an unregistered protocol draft');
  assert(sha40(candidateSha), '--candidate-sha must be a complete lowercase 40-hex commit SHA');
  assert(plain(environmentId) && plain(scope) && !/NOT SET|TODO/.test(environmentId + scope), '--environment-id and --scope must be one line without NOT SET or TODO');
  const contextBytes = readFileSync(resolve(contextPath));
  const filled = { ...draft, candidate_sha: candidateSha, environment_id: environmentId, scope, context_sha256: digest(contextBytes) };
  const registered = register(filled, now);
  const dir = join(root, DIRS.loop, 'inbox', registered.id);
  assert(!existsSync(dir), `Experiment already registered: ${dir}`);
  mkdirSync(join(dir, 'evidence'), { recursive: true });
  writeFileSync(join(dir, 'protocol.registered.json'), json(registered), { flag: 'wx' });
  copyFileSync(resolve(contextPath), join(dir, 'evidence', 'context.json'), constants.COPYFILE_EXCL);
  const sha = protocolDigest(registered);
  // 雛形の data_kind は未設定にしておく。実測した本人が measured と書き換えるまで取り込みは拒否される。
  writeFileSync(join(dir, 'results.template.json'), json({ schema_version: 1, protocol_sha256: sha, data_kind: 'NOT SET', runs: [] }), { flag: 'wx' });
  return stamp({ id: registered.id, candidate_id: registered.candidate_id, protocol_sha256: sha, directory: dir,
    next: 'Measure all predeclared pairs, place artifacts under evidence/, copy results.template.json to results.json with the real runs and data_kind measured, then run the loop.' });
}
export function dismiss({ root = REPO_ROOT, id, reason, now = wallClock() }) {
  root = resolve(root);
  assert(dynamicId(id), 'Only dynamic candidates (INV-<16 hex>) can be dismissed; close seeds INV-001..008 with done ID REJECT|PARK');
  assert(plain(reason), 'Reason must be one non-empty line (max 4000 chars)');
  const facts = inspect(root, now); enforce(facts);
  const pointer = dismissCandidate({ outputDir: join(root, DIRS.discovery), candidateId: id, reason, now });
  if (!pointer.duplicate_dismissal) appendLedger(root, { candidate_id: id, decision: 'REJECT', verdict: null, protocol_sha256: null, decided_at: now, reason, resume_condition: null, source: 'human' });
  return stamp({ candidate_id: id, duplicate: !!pointer.duplicate_dismissal, notify: pointer.notify });
}
export async function init({ root = REPO_ROOT, hours = '10', now = wallClock } = {}) {
  root = resolve(root);
  const profile = join(root, DIRS.career, 'profile.json');
  let career = 'ALREADY_INITIALIZED';
  if (!existsSync(profile)) {
    // リポジトリ以外のルートには雛形がないため、デモと同じ複製を行ってから初期化する。
    if (!existsSync(join(root, 'tools/portfolio-audit/career.config.example.json'))) { await seedRoot(root, { hours, now }); career = 'CREATED_WITH_TEMPLATES'; }
    else { await careerExecute(['init', String(hours)], { root, now }); career = 'CREATED'; }
  }
  mkdirSync(join(root, DIRS.loop, 'inbox'), { recursive: true });
  const ledger = join(root, DIRS.loop, 'decisions.json');
  const decisions = existsSync(ledger) ? 'EXISTS' : (writeFileSync(ledger, json(stamp({ schema_version: 1, entries: [] })), { flag: 'wx' }), 'CREATED');
  return stamp({ career, decisions, profile, next: `${CLI} run${root === REPO_ROOT ? '' : ' --root ' + root}` });
}
export async function bindSlot({ root = REPO_ROOT, actionId, now = wallClock } = {}) {
  root = resolve(root); assert(plain(actionId), 'bind-slot requires an action id');
  return stamp(JSON.parse(await growthExecute(['bind-slot', actionId], { root, now })));
}
export async function demo({ root, now } = {}) {
  const clock = now ?? wallClock;
  if (root !== undefined) {
    root = resolve(root);
    assert(root !== REPO_ROOT, 'Refusing to run the demo on the repository root; omit --root or give an empty directory');
    for (const marker of [join(DIRS.career, 'profile.json'), join(DIRS.discovery, 'latest.json'), join(DIRS.audit, 'latest.json')])
      assert(!existsSync(join(root, marker)), `Refusing to run the demo: ${root} already contains ${marker}`);
  } else root = mkdtempSync(join(tmpdir(), 'portfolio-loop-demo-'));
  await seedRoot(root, { hours: 10, now: clock });
  const snapshot = buildSnapshot({ observedAt: new Date(Date.parse(clock()) - 3600000).toISOString() });
  mkdirSync(join(root, DIRS.loop), { recursive: true });
  writeFileSync(join(root, DIRS.loop, `demo-snapshot-${safeTime(clock())}.synthetic.json`), json(snapshot), { flag: 'wx' });
  return runLoop({ root, offline: snapshot, now: clock, demo: true });
}

// ---- 表示。summary.md は記録、カードは端末向けの要約。 ----
export function renderSummary(s) {
  const yes = b => b ? 'あり' : 'なし';
  const lines = ['# 自律型ポートフォリオ改善ループ 実行記録', '',
    `評価: ${s.evaluated_at} / 方式: ${s.mode} / 結果: ${s.outcome}`, '',
    '公開許可: なし / 実機試験: NOT RUN / 外部送信: なし / 技能判定: なし', ''];
  if (s.demo) lines.push('**合成データによるデモ実行です。実測記録・本人の実績ではありません。**', '');
  else if (s.synthetic) lines.push('**合成スナップショットの再生です。候補や課題は合成データに由来し、実測記録ではありません。**', '');
  lines.push('## 工程', '', '| 工程 | 状態 | 通知 | レポート |', '| --- | --- | --- | --- |',
    `| 監査（${s.audit.mode}） | ${s.audit.collection_status} / 修正案 ${s.audit.draft_status} | ${yes(s.audit.notify)} | ${cell(s.audit.report)} |`,
    `| キャリア計画 | ${s.career.state}${s.career.planned_minutes !== null ? ` / 計画 ${s.career.planned_minutes} 分` : ''} | ${yes(s.career.notify)} | ${cell(s.career.report ?? '—')} |`,
    `| 自律型成長 | ${s.growth.state}${s.growth.binding_status ? ` / 枠 ${s.growth.binding_status}` : ''} | ${yes(s.growth.notify)} | ${cell(s.growth.report ?? '—')} |`,
    `| 実測の取り込み | 取込 ${s.intake.taken.length} 件 / 未完了 ${s.intake.not_ready.length} 件 / 失敗 ${s.intake.errors.length} 件 / 不足 ${s.intake.remaining.length} 件 | ${yes(s.intake.taken.length > 0)} | — |`,
    `| 探索と改善キュー | ${s.discovery.state}${s.discovery.selected ? ` / 選択 ${s.discovery.selected}` : ''} | ${yes(s.discovery.notify)} | ${cell(s.discovery.report ?? '—')} |`, '');
  if (s.audit.errors.length) { lines.push('## 収集エラー', ''); for (const e of s.audit.errors) lines.push(`- ${cell(e)}`); lines.push(''); }
  lines.push('## 作業枠', '', `使用中: ${s.context.occupied}（根拠: ${s.context.basis.join(', ') || 'なし'}${s.context.basis_findings.length ? '; ' + s.context.basis_findings.join(', ') : ''}）`, '', `除外した候補: ${s.context.closed.join(', ') || 'なし'}`, '');
  for (const w of s.warnings) lines.push(`- 注意: ${cell(w)}`);
  if (s.warnings.length) lines.push('');
  if (s.intake.taken.length) {
    lines.push('## 取り込んだ実測結果', '', '| 実験 | 候補 | 判定 | 理由 |', '| --- | --- | --- | --- |');
    for (const t of s.intake.taken) lines.push(`| ${cell(t.id)} | ${t.candidate_id} | ${t.verdict}${t.duplicate ? '（重複）' : ''} | ${cell(t.reason)} |`);
    lines.push('');
  }
  if (s.discovery.queue.length) {
    lines.push('## 改善キュー（上位）', '', '| ID | 優先 | 状態 | 点 | テーマ |', '| --- | --- | --- | --- | --- |');
    for (const q of s.discovery.queue) lines.push(`| ${q.id} | P${q.priority} | ${q.state} | ${q.score} | ${cell(q.title)} |`);
    lines.push('');
    if (s.discovery.counts) lines.push(`動的候補: 登録 ${s.discovery.counts.candidates} / 未着手 ${s.discovery.counts.open}（上限 ${s.discovery.limits.open_candidates}） / 実測記録 ${s.discovery.counts.feedback}（上限 ${s.discovery.limits.feedback}）`, '');
  }
  if (s.discovery.questions.length) {
    lines.push('## 探索からの問い', '');
    for (const q of s.discovery.questions) lines.push(`- ${q.kind}: ${cell(q.question)}`);
    lines.push('');
  }
  const top = s.audit.findings.filter(f => f.priority <= 2).slice(0, 10);
  if (top.length) {
    lines.push('## 監査の課題（P1・P2）', '', '| 優先 | 課題 | 状態 |', '| --- | --- | --- |');
    for (const f of top) lines.push(`| P${f.priority} | ${cell(f.title)} | ${f.state} |`);
    lines.push('');
  }
  lines.push('## 次に必要な本人の判断', '');
  s.next_actions.forEach((a, i) => { lines.push(`${i + 1}. [${a.code}] ${a.title}`); if (a.command) lines.push(`   実行例: \`${a.command}\``); if (a.detail) lines.push(`   対象: ${cell(a.detail)}`); });
  lines.push('', '各工程の判定は提案です。本人の技能合格・実機の受け入れ・公開の許可には変換しません。', '', FOOTER, '');
  return lines.join('\n');
}
export function renderCard(s) {
  const first = s.next_actions[0];
  return [`ループ完了: ${s.outcome} / 方式 ${s.mode}${s.demo ? '（合成デモ）' : s.synthetic ? '（合成スナップショット）' : ''} / ${s.evaluated_at}`,
    `監査 ${s.audit.collection_status} / キャリア ${s.career.state} / 成長 ${s.growth.state} / 取込 ${s.intake.taken.length} 件 / 探索 ${s.discovery.state}${s.discovery.selected ? `（選択 ${s.discovery.selected}）` : ''}`,
    ...(s.audit.errors.length ? [`収集エラー: ${s.audit.errors.join(' / ')}`] : []),
    `作業枠: ${s.context.occupied ? '使用中' : '空き'}${s.context.basis.length ? `（${s.context.basis.join(', ')}）` : ''} / 通知: ${s.notify ? 'あり' : 'なし'}`,
    `次の一手: [${first.code}] ${first.title}`, ...(first.command ? [`  実行例: ${first.command}`] : []), ...(first.detail ? [`  対象: ${first.detail}`] : []),
    `記録: ${s.report}`, '公開許可: なし / 実機試験: NOT RUN', FOOTER, ''].join('\n');
}
export function statusView(root = REPO_ROOT, now = wallClock()) {
  const facts = inspect(root, now);
  const mb = b => `${Math.round(b / 1024 / 10.24) / 100} MB`;
  const view = stamp({ schema_version: 1, evaluated_at: now, root: facts.root, locks: facts.locks, problems: facts.problems,
    audit: { ...facts.audit, max_age_hours: discoveryConfig.snapshot_max_age_hours }, career: { initialized: facts.career.initialized, updated_at: facts.career.updated_at, age_days: facts.career.age_days, learner_id: facts.career.learner_id },
    growth: { binding_status: facts.growth.binding_status }, discovery: { selected: facts.discovery.selected, counts: facts.discovery.counts, limits, drafts: facts.discovery.drafts, last: facts.discovery.pointer },
    inbox: facts.inbox, done: facts.done.length, awaiting: facts.awaiting, parked: facts.parked, sizes: facts.sizes,
    last_run: facts.loop_latest ? { evaluated_at: facts.loop_latest.evaluated_at, mode: facts.loop_latest.mode, demo: facts.loop_latest.demo ?? false, synthetic: facts.loop_latest.synthetic ?? false, outcome: facts.loop_latest.outcome, notify: facts.loop_latest.notify, report: facts.loop_latest.report } : null,
    next_actions: nextActions(facts) });
  view.text = [`状態確認: ${now} / ルート ${facts.root}`,
    `監査: ${facts.audit.latest ? `${facts.audit.latest.collection_status}（${facts.audit.latest.source === 'REPLAY' ? '再生、' : ''}観測から ${facts.audit.snapshot_age_hours}h、${facts.audit.fresh ? '鮮度内' : '要再取得'}）` : '未実行'} / 修正案待ち: ${facts.audit.pending ? 'あり' : 'なし'}`,
    `キャリア: ${facts.career.initialized ? `確認から ${facts.career.age_days} 日` : '未初期化'} / 学習枠: ${facts.growth.binding_status ?? '—'} / 探索: 候補 ${facts.discovery.counts.candidates}（未着手 ${facts.discovery.counts.open}/${limits.open_candidates}）実測 ${facts.discovery.counts.feedback}/${limits.feedback}`,
    `実験: inbox ${facts.inbox.length} 件（不足 ${facts.inbox.filter(x => !x.complete).length}） / 判断待ち ${facts.awaiting.length} 件 / 保留 ${facts.parked.length} 件 / 完了 ${facts.done.length} 件`,
    `保存量: ${Object.entries(facts.sizes).map(([k, v]) => `${k} ${v.files} files ${mb(v.bytes)}`).join(' / ')}`,
    `前回: ${view.last_run ? `${view.last_run.evaluated_at} ${view.last_run.mode}${view.last_run.demo ? '（合成デモ）' : view.last_run.synthetic ? '（合成スナップショット）' : ''} ${view.last_run.outcome}` : 'なし'}`,
    ...(facts.locks.map(l => `ロック: ${l.path} (pid ${l.pid ?? '?'}: ${l.holder})`)), ...(facts.problems.map(p => `問題: ${p}`)),
    '次の一手:', ...view.next_actions.slice(0, 5).map((a, i) => `  ${i + 1}. [${a.code}] ${a.title}${a.command ? `\n     実行例: ${a.command}` : ''}`), FOOTER, ''].join('\n');
  return view;
}

const USAGE = `Usage: ${CLI} <command> [options]
  run|weekly [--offline SNAPSHOT.json] [--proposals FILE] [--occupied] [--free]   週次ループを 1 回実行
  iterate [--rounds 5] [--seed 0] [--budget-ms 1000] [--offline SNAPSHOT.json]    保存済み観測で反例と小変更を高速試行（ネットワークなし）
  iterate-demo                                                               合成データで高速試行を体験（一時領域だけ）
  status                                                                         読み取り専用の点検と次の一手
  init [HOURS]                                                                   私用キャリア計画と採否台帳を初期化（既定 10 時間）
  check-in normal|reduced|paused                                                 本人の週次負荷を記録（繁栄判断へ接続）
  done ID ADOPT|REJECT|PARK|ITERATE "理由" [--resume-condition "条件"]          本人の採否を記録
  register DRAFT.json --candidate-sha SHA --environment-id ID --scope "範囲" --context FILE
                                                                                 実験票を登録し inbox を用意
  dismiss INV-<16hex> "理由"                                                     動的候補を却下
  bind-slot ACTION_ID                                                            自律型成長の学習枠を明示して接続
  demo [--root 空のディレクトリ]                                                 合成データで全工程を実行（既定は一時ディレクトリ）
  共通: --root DIR（既定はリポジトリのルート）、--json（JSON で出力）。
  ネットワークは run の GitHub API GET だけ（${NO_NETWORK}=1 で禁止）。公開・実機操作・外部送信はしない。
`;
function readProposals(path) {
  const doc = readJson(resolve(path));
  assert(doc && doc.schema_version === 1 && Array.isArray(doc.proposals), 'Invalid proposals document');
  return doc.proposals;
}
export async function main(argv) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { root: { type: 'string' }, offline: { type: 'string' }, proposals: { type: 'string' },
    occupied: { type: 'boolean' }, free: { type: 'boolean' }, json: { type: 'boolean' }, help: { type: 'boolean' }, 'candidate-sha': { type: 'string' },
    'environment-id': { type: 'string' }, scope: { type: 'string' }, context: { type: 'string' }, 'resume-condition': { type: 'string' },
    rounds: { type: 'string' }, seed: { type: 'string' }, 'budget-ms': { type: 'string' } } });
  const [command, ...rest] = positionals;
  if (!command || values.help) return { text: USAGE, exitCode: 0 };
  const root = resolve(values.root ?? REPO_ROOT);
  const iterationSettings = { rounds: Number(values.rounds ?? 5), seed: Number(values.seed ?? 0), budgetMs: Number(values['budget-ms'] ?? 1000) };
  assert(!['rounds', 'seed', 'budget-ms'].some(k => values[k] !== undefined) || ['run', 'weekly', 'iterate', 'iterate-demo'].includes(command), 'Iteration settings are only valid with run, weekly, iterate or iterate-demo');
  if (['run', 'weekly', 'iterate', 'iterate-demo'].includes(command)) {
    assert(Number.isInteger(iterationSettings.rounds) && iterationSettings.rounds >= 1 && iterationSettings.rounds <= 8, 'rounds must be 1..8');
    assert(Number.isSafeInteger(iterationSettings.seed) && iterationSettings.seed >= 0 && iterationSettings.seed <= 0xffffffff, 'seed must be a uint32 integer');
    assert(Number.isInteger(iterationSettings.budgetMs) && iterationSettings.budgetMs >= 1 && iterationSettings.budgetMs <= 5000, 'budget-ms must be 1..5000');
  }
  const out = (value, text) => ({ text: values.json ? json(value) : text + FOOTER + '\n', exitCode: 0 });
  switch (command) {
    case 'run': case 'weekly': {
      assert(rest.length === 0, 'run takes no positional arguments');
      const { runIteration, renderIteration, readSnapshotFile } = await import('../server-innovation/iterate.mjs');
      const offline = values.offline ? readSnapshotFile(resolve(values.offline)) : undefined;
      const { cycle, render } = await import('../autonomous-prosperity/prosperity.mjs');
      const { loop_summary: summary, ...prosperity } = await cycle({ root, offline,
        proposals: values.proposals ? readProposals(values.proposals) : [], occupied: !!values.occupied, free: !!values.free });
      const iteration = summary ? await runIteration({ root, ...iterationSettings }) : null;
      const notify = prosperity.notify || !!iteration?.notify;
      return { text: values.json ? json(summary ? { ...summary, notify, prosperity, innovation_iteration: iteration } : { ...prosperity, outcome: 'NOT_RUN' })
        : prosperity.notify ? render(prosperity) + (iteration ? `モデル試行: ${iteration.status}（実機 NOT RUN）\n` : '')
          : iteration?.notify ? renderIteration(iteration) : '変化なし。新しい判断依頼はありません。\n' + FOOTER + '\n',
        exitCode: summary && summary.outcome !== 'PROCESSED' ? 3 : 0 };
    }
    case 'iterate': case 'iterate-demo': {
      assert(rest.length === 0, 'iterate takes no positional arguments');
      assert(!['proposals', 'occupied', 'free', 'candidate-sha', 'environment-id', 'scope', 'context', 'resume-condition'].some(k => values[k] !== undefined), 'Unsupported option for iterate');
      assert(command !== 'iterate-demo' || (!values.root && !values.offline), 'iterate-demo uses a temporary root and its own synthetic snapshot');
      const { runIteration, iterationDemo, renderIteration, readSnapshotFile } = await import('../server-innovation/iterate.mjs');
      const result = command === 'iterate-demo' ? await iterationDemo(iterationSettings)
        : await runIteration({ root, ...iterationSettings, snapshot: values.offline ? readSnapshotFile(resolve(values.offline)) : undefined });
      return { text: values.json ? json(result) : renderIteration(result), exitCode: result.status === 'NEEDS_REFRESH' ? 3 : 0 };
    }
    case 'status': { assert(rest.length === 0, 'status takes no positional arguments'); const { text, ...view } = statusView(root); return { text: values.json ? json(view) : text, exitCode: 0 }; }
    case 'check-in': {
      assert(rest.length === 1, 'check-in requires normal, reduced or paused');
      const { checkIn } = await import('../autonomous-prosperity/prosperity.mjs');
      const result = await checkIn(root, rest[0]); return out(result, result.message + '\n');
    }
    case 'init': { assert(rest.length <= 1, 'init takes at most HOURS'); const r = await init({ root, hours: rest[0] ?? '10' }); return out(r, `キャリア計画: ${r.career} / 採否台帳: ${r.decisions}\n次: ${r.next}\n`); }
    case 'done': { assert(rest.length === 3, 'Usage: done ID DECISION "REASON" [--resume-condition "..."]'); const r = decide({ root, id: rest[0], decision: rest[1], reason: rest[2], resumeCondition: values['resume-condition'] ?? null }); return out(r, `記録: ${r.entry.candidate_id} ${r.entry.decision}\n次回の除外候補: ${r.closed.join(', ') || 'なし'}\n`); }
    case 'register': {
      assert(rest.length === 1 && values['candidate-sha'] && values['environment-id'] && values.scope && values.context, 'Usage: register DRAFT.json --candidate-sha SHA --environment-id ID --scope "..." --context FILE');
      const r = registerDraft({ root, draftPath: rest[0], candidateSha: values['candidate-sha'], environmentId: values['environment-id'], scope: values.scope, contextPath: values.context });
      return out(r, `登録: ${r.id}\nprotocol_sha256: ${r.protocol_sha256}\n保存先: ${r.directory}\n次: 全試行を測定し evidence/ と results.json（data_kind: measured）を置いてから run を実行\n`);
    }
    case 'dismiss': { assert(rest.length === 2, 'Usage: dismiss INV-<16hex> "REASON"'); const r = dismiss({ root, id: rest[0], reason: rest[1] }); return out(r, `却下: ${r.candidate_id}${r.duplicate ? '（記録済み）' : ''}\n`); }
    case 'bind-slot': { assert(rest.length === 1, 'Usage: bind-slot ACTION_ID'); const r = await bindSlot({ root, actionId: rest[0] }); return out(r, `学習枠を接続: ${r.career_action_id}\n`); }
    case 'demo': { assert(rest.length === 0, 'demo takes no positional arguments'); const summary = await demo({ root: values.root }); return { text: values.json ? json(summary) : renderCard(summary) + `デモのルート: ${summary.root}\n`, exitCode: summary.outcome === 'PROCESSED' ? 0 : 3 }; }
    default: throw new Error(`Unknown command ${command}\n${USAGE}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // Finish module evaluation before loading the optional prosperity integration.
  main(process.argv.slice(2)).then(result => {
    process.stdout.write(result.text);
    if (result.exitCode) process.exitCode = result.exitCode;
  }).catch(error => {
    const c = classifyError(error.message);
    process.stderr.write(`Loop stopped: ${error.message}\n[${c.code}] ${c.hint}\n`);
    process.exitCode = 2;
  });
}
