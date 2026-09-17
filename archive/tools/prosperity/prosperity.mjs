// Private, read-only decision support over the existing portfolio loop and career plan.
// No network, upstream execution, learner-record writes, adoption or publication.
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, realpathSync, lstatSync, mkdtempSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { resolve, join, dirname, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { parseArgs } from 'node:util';
import { validateReview } from '../autonomous-prosperity/prosperity.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const BASE = '.local/prosperity';
export const LIMITS = Object.freeze({ weekly_minutes: 600, upstream_hours: 24, owner_days: 28, baseline_days: 7, active_experiments: 1 });
export const STAMP = Object.freeze({ authorization: 'NONE', publication_allowed: false, external_actions_allowed: false, se_record_writes_allowed: false, runtime_status: 'NOT_RUN' });
const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = value => createHash('sha256').update(value).digest('hex');
const check = (condition, message) => { if (!condition) throw new Error(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 2000;
const numeric = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const nullableNumber = x => x === null || numeric(x);
const instant = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(Date.parse(x)).toISOString().slice(0, 19) === x.slice(0, 19);
const nullableInstant = x => x === null || instant(x);
const id = x => typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(x);
const keys = (x, names, label) => check(object(x) && Object.keys(x).sort().join() === [...names].sort().join(), 'Invalid ' + label + ' keys');
const elapsed = (now, date) => (Date.parse(now) - Date.parse(date)) / 3600000;
const read = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));

// Validate both the lexical boundary and every existing path component. Never follow a link.
export function safePath(root, path, allowed = '.local') {
  check(typeof path === 'string' && path.length > 0 && !path.split(/[\\/]/).includes('..'), 'Unsafe source path');
  const components = path.replace(/^[A-Za-z]:[\\/]/, '').split(/[\\/]/);
  check(!components.some(p => /[:\x00-\x1f]/.test(p) || /[. ]$/.test(p)), 'Unsafe path component');
  const base = realpathSync(resolve(root)), target = resolve(base, path), boundary = resolve(base, allowed);
  check(target === boundary || target.startsWith(boundary + sep), 'Source path outside allowed directory');
  const rel = relative(base, target);
  check(rel && !rel.startsWith('..') && !isAbsolute(rel), 'Unsafe source path');
  let current = base;
  for (const part of rel.split(sep)) {
    current = join(current, part);
    try { check(!lstatSync(current).isSymbolicLink(), 'Symbolic link path refused'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}
function atomic(root, filename, value) {
  const target = safePath(root, filename, BASE);
  mkdirSync(dirname(target), { recursive: true });
  const temp = target + '.tmp-' + randomUUID();
  writeFileSync(temp, typeof value === 'string' ? value : json(value), { flag: 'wx', mode: 0o600 });
  renameSync(temp, target);
}

export function validateLedger(ledger) {
  keys(ledger, ['schema_version', 'owner_confirmed_at', 'weekly_budget_minutes', 'baseline', 'experiments'], 'ledger');
  check(ledger.schema_version === 1 && nullableInstant(ledger.owner_confirmed_at), 'Invalid ledger version or owner date');
  check(Number.isInteger(ledger.weekly_budget_minutes) && ledger.weekly_budget_minutes >= 0 && ledger.weekly_budget_minutes <= LIMITS.weekly_minutes, 'Weekly budget must be 0..600 minutes');
  keys(ledger.baseline, ['confirmed_at', 'weekly_actual_minutes', 'load'], 'baseline');
  check(nullableInstant(ledger.baseline.confirmed_at) && nullableNumber(ledger.baseline.weekly_actual_minutes) && [null, 'normal', 'high', 'paused'].includes(ledger.baseline.load), 'Invalid baseline');
  check(Array.isArray(ledger.experiments) && ledger.experiments.length <= 30, 'Experiments must be an array of at most 30 entries');
  const seen = new Set();
  for (const e of ledger.experiments) {
    keys(e, ['id', 'title', 'action_id', 'status', 'adopted_at', 'original_due_at', 'due_at', 'reschedule_reason', 'resume_condition', 'planned_minutes', 'actual_minutes', 'metric', 'evidence', 'decision', 'notes'], 'experiment');
    check(id(e.id) && !seen.has(e.id) && text(e.title) && id(e.action_id), 'Invalid or duplicate experiment ID/action'); seen.add(e.id);
    check(['PROPOSED', 'ACTIVE', 'AWAITING_DECISION', 'ADOPTED', 'REJECTED', 'PARKED'].includes(e.status), 'Invalid experiment status');
    check(nullableInstant(e.adopted_at) && nullableInstant(e.due_at) && Number.isInteger(e.planned_minutes) && e.planned_minutes > 0 && e.planned_minutes <= 600 && nullableNumber(e.actual_minutes), 'Invalid experiment dates/effort');
    check(['PROPOSED', 'REJECTED', 'PARKED'].includes(e.status) || e.adopted_at !== null, 'Active or reviewed experiment needs owner adoption date');
    check(e.status !== 'PROPOSED' || e.adopted_at === null, 'Proposed experiment cannot have adoption date');
    check(nullableInstant(e.original_due_at) && (e.reschedule_reason === null || text(e.reschedule_reason)) && (e.resume_condition === null || text(e.resume_condition)), 'Invalid original deadline or resume condition');
    check(e.due_at === null ? e.original_due_at === null : e.original_due_at !== null, 'Original deadline is required with due_at');
    check(e.due_at === e.original_due_at || text(e.reschedule_reason), 'Rescheduling requires a reason; preserve original_due_at');
    check(e.status !== 'PARKED' || text(e.resume_condition), 'Parked experiment needs resume_condition');
    check(!e.adopted_at || !e.original_due_at || Date.parse(e.original_due_at) >= Date.parse(e.adopted_at), 'Original deadline predates adoption');
    check([null, 'ADOPT', 'ITERATE', 'REJECT', 'PARK'].includes(e.decision) && (e.notes === null || text(e.notes)), 'Invalid decision/notes');
    const closing = { ADOPTED: 'ADOPT', REJECTED: 'REJECT', PARKED: 'PARK' };
    check(closing[e.status] ? e.decision === closing[e.status] && text(e.notes) : e.decision === null || (e.status === 'ACTIVE' && e.decision === 'ITERATE' && text(e.notes)), 'Status and owner decision disagree');
    keys(e.metric, ['name', 'unit', 'baseline', 'target', 'actual', 'direction'], 'metric');
    check(text(e.metric.name) && text(e.metric.unit) && [e.metric.baseline, e.metric.target, e.metric.actual].every(nullableNumber) && ['increase', 'decrease'].includes(e.metric.direction), 'Invalid metric');
    if (e.evidence !== null) {
      keys(e.evidence, ['path', 'sha256', 'data_kind', 'observed_at'], 'evidence');
      check(text(e.evidence.path) && typeof e.evidence.sha256 === 'string' && /^[a-f0-9]{64}$/.test(e.evidence.sha256) && ['measured', 'synthetic'].includes(e.evidence.data_kind) && instant(e.evidence.observed_at), 'Invalid evidence reference');
    }
  }
  return ledger;
}

function inspectSources(root, now) {
  const issues = [], sources = {}, fingerprints = [];
  const issue = (code, detail) => issues.push({ code, detail });
  const missingHint = { loop: '既存ポートフォリオループを実行して観測を保存する', loop_summary: '上流latestが参照する実行記録を確認する', career_profile: '本人が使っているキャリア台帳の場所と今週の条件を確認する。未作成ならCLI説明の初期化手順を使う', career_latest: '既存キャリア台帳を確認してからポートフォリオループで週計画を作る', career_plan: 'careerのlatestが参照する週計画を確認する', prosperity_checkin: '既存システムのcheck-inで本人の今週の負荷を確認する' };
  for (const file of ['.local/portfolio-operations/cycle.lock', '.local/engineer-career/plan.lock', '.local/autonomous-growth/plan.lock', '.local/server-innovation/discovery/discovery.lock', '.local/autonomous-prosperity/run.lock', '.local/portfolio-operations/pending.json']) {
    try {
      const path = safePath(root, file);
      if (existsSync(path)) issue(file.endsWith('.lock') ? 'UPSTREAM_LOCK' : 'UPSTREAM_URGENT', (file.endsWith('.lock') ? '上流の処理が実行中か確認し、終了を待つ: ' : '既存の修正案を確認し、採否と理由を記録する: ') + file);
    } catch (error) { issue('INVALID_SOURCE', file + ': ' + error.message); }
  }
  const load = (name, file, allowed) => {
    try {
      const path = safePath(root, file, allowed);
      if (!existsSync(path)) { sources[name] = { state: 'MISSING', path: relative(root, path).replaceAll('\\', '/') }; issue('MISSING_SOURCE', missingHint[name] ?? name); return null; }
      const bytes = readFileSync(path), value = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')); check(object(value), 'Expected JSON object');
      fingerprints.push({ path: relative(root, path), sha256: digest(bytes), allowed });
      sources[name] = { state: 'READ', path: relative(root, path).replaceAll('\\', '/') }; return value;
    } catch (error) { sources[name] = { state: 'INVALID' }; issue('INVALID_SOURCE', name + ': ' + error.message); return null; }
  };
  const dated = (name, date, hours) => {
    if (!instant(date)) { sources[name].state = 'INVALID'; issue('INVALID_SOURCE', name + ': invalid timestamp'); return; }
    sources[name].observed_at = date;
    const age = elapsed(now, date);
    if (age < 0) { sources[name].state = 'FUTURE'; issue('FUTURE_SOURCE', name); }
    else if (age > hours) { sources[name].state = 'STALE'; issue('STALE_SOURCE', name); }
  };
  let latest = load('loop', '.local/portfolio-loop/latest.json', '.local/portfolio-loop');
  let summary = null, plan = null;
  if (latest) {
    try {
      check(latest.schema_version === 1 && object(latest.audit) && Array.isArray(latest.audit.errors) && Array.isArray(latest.audit.findings) && object(latest.context) && typeof latest.context.occupied === 'boolean' && Array.isArray(latest.context.basis) && Array.isArray(latest.next_actions), 'Invalid loop shape');
      check(latest.next_actions.every(a => object(a) && text(a.code) && text(a.title)), 'Invalid upstream next action');
      check(typeof latest.demo === 'boolean' && typeof latest.synthetic === 'boolean' && ['LIVE', 'OFFLINE_REPLAY'].includes(latest.mode), 'Invalid loop provenance');
      dated('loop', latest.evaluated_at, LIMITS.upstream_hours);
      if (latest.demo || latest.synthetic || latest.mode !== 'LIVE') { sources.loop.state = 'SYNTHETIC'; issue('SYNTHETIC_SOURCE', 'loop'); }
      if (latest.audit.collection_status !== 'COMPLETE_FOR_CONFIGURED_SCOPE' || latest.audit.state !== 'COMPLETE' || latest.audit.errors.length > 0 || latest.outcome !== 'PROCESSED') { sources.loop.state = 'INCOMPLETE'; issue('FETCH_INCOMPLETE', 'loop'); }
      check(text(latest.run_dir), 'Loop run_dir missing');
      summary = load('loop_summary', join(latest.run_dir, 'summary.json'), '.local/portfolio-loop/runs');
      if (summary) {
        check(summary.schema_version === 1 && object(summary.audit) && summary.evaluated_at === latest.evaluated_at && summary.mode === latest.mode && summary.demo === latest.demo && summary.synthetic === latest.synthetic, 'Loop summary/pointer mismatch');
        check(summary.audit.collection_status === latest.audit.collection_status && summary.audit.state === latest.audit.state, 'Loop audit mismatch');
        dated('loop_summary', summary.audit.observed_at, LIMITS.upstream_hours);
        if (summary.audit.execution_mode !== 'LIVE') issue('SYNTHETIC_SOURCE', 'loop_summary execution_mode');
      }
    } catch (error) { sources.loop.state = 'INVALID'; issue('INVALID_SOURCE', 'loop: ' + error.message); latest = null; summary = null; }
  }
  let profile = load('career_profile', '.local/engineer-career/profile.json', '.local/engineer-career');
  if (profile) {
    try {
      check(profile.schema_version === 1 && (profile.weekly_minutes === null || Number.isInteger(profile.weekly_minutes) && profile.weekly_minutes >= 0) && ['normal', 'reduced', 'paused'].includes(profile.load_mode) && numeric(profile.commitments_minutes) && Array.isArray(profile.actions), 'Invalid career profile');
      const ids = new Set();
      for (const a of profile.actions) { check(object(a) && id(a.id) && !ids.has(a.id) && Number.isInteger(a.minutes) && a.minutes > 0 && text(a.status), 'Invalid career action'); ids.add(a.id); }
      dated('career_profile', profile.updated_at, LIMITS.owner_days * 24);
    } catch (error) { sources.career_profile.state = 'INVALID'; issue('INVALID_SOURCE', 'career_profile: ' + error.message); profile = null; }
  }
  const pointer = load('career_latest', '.local/engineer-career/latest.json', '.local/engineer-career');
  if (pointer) {
    try {
      check(pointer.schema_version === 1 && text(pointer.plan), 'Invalid career pointer');
      dated('career_latest', pointer.at, LIMITS.upstream_hours);
      plan = load('career_plan', pointer.plan, '.local/engineer-career/plans');
      if (plan) {
        check(plan.schema_version === 1 && plan.generated_at === pointer.at && Array.isArray(plan.selected) && Array.isArray(plan.warnings) && [plan.effective_minutes, plan.reserve_minutes, plan.commitments_minutes, plan.planned_minutes, plan.unallocated_minutes].every(numeric), 'Invalid career plan');
        check(plan.weekly_minutes === profile?.weekly_minutes && plan.commitments_minutes === profile?.commitments_minutes, 'Career plan/profile capacity mismatch');
        check(!profile || Date.parse(profile.updated_at) <= Date.parse(plan.generated_at), 'Career profile changed after plan');
        const effective = !profile || profile.weekly_minutes === null || profile.load_mode === 'paused' ? 0 : Math.floor(profile.weekly_minutes * (profile.load_mode === 'reduced' ? 0.5 : 1));
        check(plan.effective_minutes === effective && plan.reserve_minutes === Math.floor(effective * 0.2), 'Career effective/reserve capacity mismatch');
        dated('career_plan', plan.generated_at, LIMITS.upstream_hours);
        const ids = new Set();
        for (const a of plan.selected) { check(object(a) && id(a.id) && !ids.has(a.id) && numeric(a.minutes), 'Invalid selected career action'); ids.add(a.id); }
        check(plan.selected.reduce((sum, a) => sum + a.minutes, 0) === plan.planned_minutes, 'Career planned total mismatch');
        for (const a of plan.selected.filter(a => a.id !== 'weekly-review')) check(profile?.actions?.some(p => p.id === a.id && p.minutes === a.minutes && !['DONE', 'BLOCKED', 'CANCELLED'].includes(p.status)), 'Career selected action/profile mismatch');
        check(plan.selected.filter(a => a.id !== 'weekly-review').length <= 3, 'Career WIP limit exceeded');
      }
    } catch (error) { sources.career_latest.state = 'INVALID'; issue('INVALID_SOURCE', 'career_latest: ' + error.message); plan = null; }
  }
  const checkin = load('prosperity_checkin', '.local/autonomous-prosperity/review.json', '.local/autonomous-prosperity');
  if (checkin) {
    try {
      validateReview(checkin, profile ?? { actions: [] }, now, file => {
        const path = safePath(root, file, '.local/engineer-career/records'), bytes = readFileSync(path);
        fingerprints.push({ path: relative(root, path), sha256: digest(bytes), allowed: '.local/engineer-career/records' });
        return bytes;
      });
      dated('prosperity_checkin', checkin.updated_at, 7 * 24);
      if (checkin.data_kind !== 'measured') issue('SYNTHETIC_SOURCE', 'prosperity_checkin');
      else if (checkin.load === 'paused') issue('CAPACITY_UNAVAILABLE', '既存自律繁栄システムの本人入力が休止中');
      else if (checkin.load === 'unknown') issue('MISSING_BASELINE', '既存自律繁栄システムで本人の負荷が未確認');
      else if (checkin.load === 'reduced' && profile?.load_mode === 'normal') issue('HIGH_LOAD', '既存check-inの縮小希望をキャリア計画へ反映してから見直す');
    } catch (error) { sources.prosperity_checkin.state = 'INVALID'; issue('INVALID_SOURCE', 'prosperity_checkin: ' + error.message); }
  }
  return { sources, issues, latest, summary, profile, plan, fingerprints };
}

function inspectEvidence(root, e, now) {
  if (!e.evidence) return { state: 'NOT_RUN', verified: false };
  if (e.evidence.data_kind === 'synthetic') return { state: 'SYNTHETIC', verified: false };
  if (elapsed(now, e.evidence.observed_at) < 0) return { state: 'FUTURE', verified: false };
  try {
    const path = safePath(root, e.evidence.path, BASE + '/evidence');
    if (!existsSync(path)) return { state: 'MISSING', verified: false };
    check(lstatSync(path).isFile(), 'Evidence must be a file');
    const bytes = readFileSync(path);
    if (digest(bytes) !== e.evidence.sha256) return { state: 'HASH_MISMATCH', verified: false };
    const body = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
    check(body.schema_version === 1 && body.experiment_id === e.id && body.action_id === e.action_id && body.data_kind === 'measured' && body.observed_at === e.evidence.observed_at && body.recorded_by === 'owner' && text(body.method), 'Evidence identity/provenance mismatch');
    check(object(body.metric) && ['name', 'unit', 'baseline', 'target', 'actual', 'direction'].every(key => body.metric[key] === e.metric[key]), 'Evidence metric mismatch');
    check(instant(body.period_start) && instant(body.period_end) && Date.parse(body.period_start) <= Date.parse(body.period_end) && Date.parse(body.period_end) <= Date.parse(body.observed_at), 'Invalid evidence measurement period');
    check(e.adopted_at !== null && Date.parse(body.period_start) >= Date.parse(e.adopted_at), 'Evidence period predates owner adoption');
    return { state: 'REFERENCE_VERIFIED', verified: true, data_kind: 'measured', observed_at: e.evidence.observed_at, sha256: e.evidence.sha256, path: e.evidence.path };
  } catch (error) { return { state: 'INVALID', verified: false, error: error.message }; }
}

export function evaluate({ root = REPO_ROOT, now = new Date().toISOString(), previous = null, synthetic = false } = {}) {
  root = realpathSync(resolve(root)); check(instant(now), 'Invalid evaluation time');
  const upstream = inspectSources(root, now), reasons = [...upstream.issues];
  let ledger = null;
  try { const path = safePath(root, BASE + '/ledger.json', BASE); if (existsSync(path)) ledger = validateLedger(read(path)); else reasons.push({ code: 'MISSING_LEDGER', detail: 'init で私用の未採用雛形を作成する' }); }
  catch (error) { reasons.push({ code: 'INVALID_LEDGER', detail: error.message }); }
  const add = (code, detail) => reasons.push({ code, detail });
  // Keep the first deadline even when a later ledger is invalid or omits an experiment.
  const originalDeadlines = { ...(previous?.original_deadlines ?? {}) };
  const experimentViews = [], active = ledger?.experiments.filter(e => ['ACTIVE', 'AWAITING_DECISION'].includes(e.status)) ?? [];
  let capacity = null;
  if (ledger) {
    if (ledger.owner_confirmed_at === null || ledger.baseline.confirmed_at === null || ledger.baseline.weekly_actual_minutes === null || ledger.baseline.load === null) add('MISSING_BASELINE', '本人の確認日・直近1週間の総実施分・負荷が未記録');
    for (const [name, date, hours] of [['owner', ledger.owner_confirmed_at, LIMITS.owner_days * 24], ['baseline', ledger.baseline.confirmed_at, LIMITS.baseline_days * 24]]) if (date) {
      if (elapsed(now, date) < 0) add('FUTURE_LEDGER', name);
      else if (elapsed(now, date) > hours) add('STALE_LEDGER', name);
    }
    if (upstream.profile && upstream.plan && !upstream.issues.some(i => i.code === 'INVALID_SOURCE' && i.detail.startsWith('career'))) {
      const p = upstream.profile, plan = upstream.plan;
      const total = plan.planned_minutes + plan.commitments_minutes + plan.reserve_minutes;
      capacity = { limit_minutes: Math.min(ledger.weekly_budget_minutes, p.weekly_minutes ?? 0, plan.effective_minutes), career_planned_minutes: plan.planned_minutes, commitments_minutes: plan.commitments_minutes, reserve_minutes: plan.reserve_minutes, accounted_minutes: total, experiment_added_minutes: 0, active_experiment_detail_minutes: active.reduce((sum, e) => sum + e.planned_minutes, 0), actual_week_minutes: ledger.baseline.weekly_actual_minutes };
      if (total > capacity.limit_minutes || (ledger.baseline.weekly_actual_minutes !== null && ledger.baseline.weekly_actual_minutes > capacity.limit_minutes)) add('TIME_OVERRUN', '既存計画総枠または本人の週総実施分が上限超過');
      if (p.weekly_minutes === null || p.load_mode === 'paused') add('CAPACITY_UNAVAILABLE', '既存キャリア計画の時間枠が未設定または休止');
    }
    if (['high', 'paused'].includes(ledger.baseline.load)) add('HIGH_LOAD', '本人が高負荷または休止を記録');
    if (active.length > LIMITS.active_experiments) add('ACTIVE_LIMIT', '進行中・結果採否待ちの合計は最大1件');
    for (const e of ledger.experiments) {
      const formerDue = Object.hasOwn(originalDeadlines, e.id) ? originalDeadlines[e.id] : null;
      if (formerDue && formerDue !== e.original_due_at) add('INVALID_LEDGER', e.id + ': original_due_at cannot change; preserve the original deadline');
      if (!formerDue && e.adopted_at && e.original_due_at) Object.defineProperty(originalDeadlines, e.id, { value: e.original_due_at, enumerable: true, writable: true, configurable: true });
      if (e.adopted_at && elapsed(now, e.adopted_at) < 0) add('FUTURE_LEDGER', e.id + ': adoption date');
      const evidence = inspectEvidence(root, e, now), metric = e.metric;
      if (['INVALID', 'FUTURE', 'HASH_MISMATCH', 'MISSING', 'SYNTHETIC'].includes(evidence.state)) add('EVIDENCE_UNAVAILABLE', e.id + ': ' + evidence.state);
      const measured = evidence.verified && metric.actual !== null;
      const difference = measured && metric.baseline !== null ? metric.actual - metric.baseline : null;
      const targetMet = measured && metric.target !== null ? (metric.direction === 'decrease' ? metric.actual <= metric.target : metric.actual >= metric.target) : null;
      experimentViews.push({ id: e.id, title: e.title, action_id: e.action_id, status: e.status, original_due_at: e.original_due_at, due_at: e.due_at, reschedule_reason: e.reschedule_reason, resume_condition: e.resume_condition, overdue_days: e.original_due_at && elapsed(now, e.original_due_at) > 0 && ['ACTIVE', 'AWAITING_DECISION', 'PARKED'].includes(e.status) ? Math.floor(elapsed(now, e.original_due_at) / 24) : 0, planned_minutes: e.planned_minutes, actual_minutes: e.actual_minutes, evidence, metric: { name: metric.name, unit: metric.unit, baseline: metric.baseline, target: metric.target, recorded_actual: metric.actual, verified_actual: measured ? metric.actual : null, difference, target_met: targetMet }, result: measured ? 'RECORDED_MEASUREMENT' : metric.actual === null ? 'NOT_RUN' : 'UNKNOWN' });
      if (active.includes(e) && upstream.plan && upstream.profile) {
        const selected = upstream.plan.selected?.find(a => a.id === e.action_id);
        if (!selected) add('ACTION_NOT_SELECTED', e.id + ': 既存週計画に action_id の割当がない');
        else if (e.planned_minutes > selected.minutes || e.actual_minutes !== null && e.actual_minutes > selected.minutes) add('TIME_OVERRUN', e.id + ': 親actionの分数を超過');
        if (e.actual_minutes !== null && ledger.baseline.weekly_actual_minutes !== null && e.actual_minutes > ledger.baseline.weekly_actual_minutes) add('INVALID_ACCOUNTING', e.id + ': 内訳実施分が週総実施分を超える');
        if (metric.baseline === null || metric.target === null || e.due_at === null) add('MISSING_EXPERIMENT_BASELINE', e.id + ': 開始前の基準値・目標・見直し日が必要');
      }
    }
  }
  const emergency = upstream.latest?.next_actions?.find(a => ['LOCK_PRESENT', 'CORRUPT_STATE', 'REVIEW_PENDING_DRAFT', 'REVIEW_AUDIT_FINDING', 'FIX_INBOX'].includes(a.code));
  if (emergency) add('UPSTREAM_URGENT', emergency.code + ': ' + emergency.title);
  const occupied = upstream.latest?.context?.occupied === true || upstream.latest?.discovery?.selected != null;
  if (occupied) add('UPSTREAM_OCCUPIED', '既存loopが共通作業枠を使用中: ' + (upstream.latest.context.basis ?? []).join(', '));
  const unknownCodes = ['MISSING_LEDGER', 'MISSING_SOURCE', 'MISSING_BASELINE', 'MISSING_EXPERIMENT_BASELINE', 'FUTURE_SOURCE', 'STALE_SOURCE', 'SYNTHETIC_SOURCE', 'FETCH_INCOMPLETE', 'FUTURE_LEDGER', 'STALE_LEDGER', 'EVIDENCE_UNAVAILABLE'];
  const groups = [['UPSTREAM_LOCK'], ['INVALID_LEDGER', 'INVALID_SOURCE', 'INVALID_ACCOUNTING'], ['UPSTREAM_URGENT'], ['HIGH_LOAD', 'TIME_OVERRUN', 'CAPACITY_UNAVAILABLE', 'ACTIVE_LIMIT', 'ACTION_NOT_SELECTED'], unknownCodes, ['UPSTREAM_OCCUPIED']];
  let next, state;
  const priorityReason = groups.flatMap(group => reasons.filter(r => group.includes(r.code)))[0];
  if (priorityReason) {
    state = unknownCodes.includes(priorityReason.code) ? 'UNKNOWN' : 'STOP';
    next = { code: priorityReason.code, title: priorityReason.detail, experiment_id: null, action_id: null, execution: 'OWNER_REVIEW_REQUIRED' };
  } else if (active.length) {
    const e = active[0], view = experimentViews.find(v => v.id === e.id);
    const review = e.status === 'AWAITING_DECISION' || view.result === 'RECORDED_MEASUREMENT' || (e.due_at && Date.parse(e.due_at) <= Date.parse(now));
    state = review ? 'WAITING_FOR_OWNER' : 'IN_PROGRESS';
    next = { code: review ? 'REVIEW_EXPERIMENT' : 'CONTINUE_EXPERIMENT', title: review ? '原期限・実測・負荷を見て本人が採用/見直し/却下/保留を判断する' : '既存actionの時間内で採用済みの観察を1件だけ進め、実測を本人が記録する', experiment_id: e.id, action_id: e.action_id, execution: 'OWNER_ACTION_REQUIRED' };
  } else {
    const proposed = ledger?.experiments.find(e => e.status === 'PROPOSED');
    state = proposed ? 'WAITING_FOR_OWNER' : 'NO_ACTION';
    next = { code: proposed ? 'REVIEW_PROPOSAL' : 'NO_ACTION', title: proposed ? '未採用案の目的・既存action枠・基準値・目標・見直し日を本人が確認し採否を決める' : '新規作業はない。次回の本人レビューまで待つ', experiment_id: proposed?.id ?? null, action_id: proposed?.action_id ?? null, execution: proposed ? 'OWNER_REVIEW_REQUIRED' : 'NONE' };
  }
  const eligible = experimentViews.filter(e => ['ACTIVE', 'AWAITING_DECISION', 'ADOPTED'].includes(e.status));
  const measured = eligible.filter(e => e.result === 'RECORDED_MEASUREMENT').length;
  const allValid = upstream.issues.length === 0;
  const observation = allValid ? upstream.summary?.audit.observed_at ?? null : null;
  const verifiedAt = observation && (!previous?.verified_at || Date.parse(observation) > Date.parse(previous.verified_at)) ? observation : previous?.verified_at ?? null;
  const report = { schema_version: 1, evaluated_at: now, verified_at: verifiedAt, verification_scope: 'upstream read and structure/provenance/freshness only; not runtime or outcome certification', demo: synthetic, synthetic, state, next_action: next, reasons, sources: upstream.sources, original_deadlines: originalDeadlines, capacity, metrics: { eligible_experiments: eligible.length, measured_experiments: measured, measurement_rate: eligible.length ? measured / eligible.length : null, income: 'UNKNOWN', causal_success: 'UNKNOWN' }, experiments: experimentViews, ...STAMP };
  // Generated/observed timestamps alone never cause notifications. Changes in freshness states do.
  const semantic = { state, next_action: next, reasons, sources: Object.fromEntries(Object.entries(upstream.sources).map(([k, v]) => [k, v.state])), capacity, metrics: report.metrics, experiments: experimentViews.map(({ evidence, overdue_days, ...e }) => ({ ...e, evidence: { state: evidence.state, path: evidence.path ?? null, sha256: evidence.sha256 ?? null } })) };
  report.signature = digest(json(semantic)); report.notify = previous?.signature !== report.signature;
  Object.defineProperty(report, '_fingerprints', { value: upstream.fingerprints });
  return report;
}

export function render(report) {
  const cell = x => String(x ?? '未確認').replace(/[\r\n|<>]/g, ' ');
  return ['# 自律繁栄レビュー', '', `評価: ${report.evaluated_at} / 状態: ${report.state}`, `上流を最後に確認できた観測日時: ${report.verified_at ?? '未確認'}（実機合格・本人実施の証明ではない）`, '',
    `次の一手: **${report.next_action.code}** — ${report.next_action.title}`, '', '## 停止・見直し理由', ...(report.reasons.length ? report.reasons.map(r => `- ${cell(r.code)}: ${cell(r.detail)}`) : ['- 制御上の停止理由なし。本人の判断・実施が必要。']), '',
    '## 時間と実測', report.capacity ? `上限 ${report.capacity.limit_minutes}分 / 既存計画+既約束+余白 ${report.capacity.accounted_minutes}分 / 実験の追加計上 0分 / 実験内訳 ${report.capacity.active_experiment_detail_minutes}分 / 本人の週総実施分 ${report.capacity.actual_week_minutes ?? '未確認'}` : '既存計画と時間枠は未確認。',
    `実測率: ${report.metrics.measurement_rate === null ? '未計測（分母0）' : (report.metrics.measurement_rate * 100).toFixed(1) + '%'} (${report.metrics.measured_experiments}/${report.metrics.eligible_experiments})。収入/因果的成功: UNKNOWN。`, '',
    '| 観察 | 状態 | 原期限 | 次の見直し日 | 超過日 | 証跡 | 計測 |', '| --- | --- | --- | --- | --- | --- | --- |', ...report.experiments.map(e => `| ${cell(e.id)} ${cell(e.title)} | ${e.status} | ${cell(e.original_due_at)} | ${cell(e.due_at)} | ${e.overdue_days} | ${e.evidence.state} | ${e.result} |`), '',
    '本人の入力と証跡ファイルの一致を確認する補助機能。記録内容の真実性・因果関係・技能・就職・収入を保証しない。', 'authorization NONE / publication_allowed false / external_actions_allowed false / se_record_writes_allowed false / runtime_status NOT_RUN', ''].join('\n');
}

function prior(root, now) {
  const path = safePath(root, BASE + '/latest.json', BASE);
  if (!existsSync(path)) return null;
  const p = read(path);
  check(p.schema_version === 1 && typeof p.signature === 'string' && /^[a-f0-9]{64}$/.test(p.signature) && instant(p.evaluated_at) && nullableInstant(p.verified_at) && Date.parse(p.evaluated_at) <= Date.parse(now) && (p.verified_at === null || Date.parse(p.verified_at) <= Date.parse(now)), 'Invalid or newer previous prosperity state; preserve it for recovery');
  check(object(p.original_deadlines) && Object.entries(p.original_deadlines).every(([key, date]) => id(key) && instant(date)), 'Invalid previous original deadlines; preserve it for recovery');
  return p;
}
export function init({ root = REPO_ROOT } = {}) {
  root = realpathSync(resolve(root));
  const path = safePath(root, BASE + '/ledger.json', BASE);
  check(!existsSync(path), 'Ledger already exists; refusing to overwrite');
  const example = validateLedger(read(join(dirname(fileURLToPath(import.meta.url)), 'ledger.example.json')));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, json(example), { flag: 'wx', mode: 0o600 });
  return { schema_version: 1, state: 'UNADOPTED_TEMPLATE_CREATED', ledger: path, owner_confirmed_at: null, ...STAMP };
}
export function status({ root = REPO_ROOT, now = new Date().toISOString(), synthetic = false } = {}) { root = realpathSync(resolve(root)); return evaluate({ root, now, previous: prior(root, now), synthetic }); }
export function review({ root = REPO_ROOT, now = new Date().toISOString(), synthetic = false } = {}) {
  root = realpathSync(resolve(root));
  const lock = safePath(root, BASE + '/review.lock', BASE); mkdirSync(dirname(lock), { recursive: true });
  const fd = openSync(lock, 'wx');
  try {
    writeFileSync(fd, json({ pid: process.pid, at: now }));
    const ledgerPath = safePath(root, BASE + '/ledger.json', BASE), beforeLedger = existsSync(ledgerPath) ? digest(readFileSync(ledgerPath)) : null;
    const result = status({ root, now, synthetic });
    for (const input of result._fingerprints) check(digest(readFileSync(safePath(root, input.path, input.allowed))) === input.sha256, 'Source changed during review; retry after upstream finishes');
    check((existsSync(ledgerPath) ? digest(readFileSync(ledgerPath)) : null) === beforeLedger, 'Ledger changed during review; retry');
    const history = `${BASE}/history/${now.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.json`;
    atomic(root, history, result); atomic(root, BASE + '/report.md', render(result)); atomic(root, BASE + '/latest.json', result);
    return result;
  } finally { closeSync(fd); unlinkSync(lock); }
}

export function demo({ now = new Date().toISOString() } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ns7jp-prosperity-demo-'));
  init({ root });
  // Demonstrates missing-input handling using an isolated, unadopted template.
  const result = review({ root, now, synthetic: true });
  return { ...result, demo: true, synthetic: true, demo_root: root, note: '隔離した未採用雛形の例。実績・本運用の合格ではない。' };
}
export function execute(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { root: { type: 'string' }, json: { type: 'boolean', default: false } } });
  const [command = 'status', ...rest] = positionals;
  check(rest.length === 0 && ['init', 'review', 'status', 'demo'].includes(command), 'Usage: node tools/prosperity/prosperity.mjs init|review|status|demo [--root PATH] [--json]');
  const options = { root: values.root ? resolve(values.root) : REPO_ROOT };
  // --root is deliberately ignored by demo: it cannot touch a production root.
  const result = command === 'demo' ? demo() : ({ init, review, status })[command](options);
  return values.json || command === 'init' ? json(result) : (command === 'demo' ? `DEMO: ${result.demo_root}\n` : '') + render(result);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.stdout.write(execute()); }
  catch (error) { process.stderr.write('Prosperity review stopped: ' + error.message + '\n'); process.exitCode = 2; }
}
