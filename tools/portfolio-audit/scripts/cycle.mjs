import { readFileSync, writeFileSync, mkdirSync, openSync, closeSync, unlinkSync, existsSync, renameSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { assert, collect, digest, validateConfig, blobHash } from './github.mjs';

export function overlap(a, b) {
  const clean = p => p.replace(/\/\*\*$/, '').replace(/\/$/, '');
  a = clean(a); b = clean(b);
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
}

const repairPath = 'docs/target-roles.md';
const oldSentence = '- role として実装済みでも、実機で適用していなければ実績としません（AlmaLinux 対応が該当）';
const oldCell = 'AlmaLinux 実機への適用、network / UFW';
const newSentence = '- AlmaLinux は[2026-09-04の再利用VMで基盤設定とDocker導入を確認](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md)しています。新規VMでの最小公開と、監視全体の `site.yml` 適用は未実施です';
const newCell = '新規AlmaLinux VMでの最小公開と監視全体（site.yml）の適用、network / UFW';
const repairKey = 'CLAIM_BOUNDARY:ns7jp/ns7jp:el9-foundation';

export function inspectSnapshot(snapshot, config, now) {
  validateConfig(config);
  assert(snapshot?.schema_version === 2 && snapshot.kind === 'github-api-read-only', 'Invalid live snapshot');
  assert(Array.isArray(snapshot.repositories) && Array.isArray(snapshot.errors), 'Invalid snapshot arrays');
  assert(typeof snapshot.collection_complete === 'boolean', 'Invalid collection_complete');
  const observed = Date.parse(snapshot.observed_at), completed = Date.parse(snapshot.completed_at);
  const evaluated = Date.parse(now);
  assert(Number.isFinite(observed) && Number.isFinite(completed) && Number.isFinite(evaluated) && completed >= observed && evaluated >= completed, 'Invalid or future snapshot timestamps');
  const seen = new Set();
  for (const r of snapshot.repositories) {
    const spec = config.repositories.find(x => x.full_name === r.full_name);
    assert(spec && spec.id === r.id && !seen.has(r.full_name), 'Unexpected repository identity'); seen.add(r.full_name);
    assert(/^[a-f0-9]{40}$/.test(r.head_sha), 'Invalid HEAD SHA');
    assert(Array.isArray(r.tree_paths) && Array.isArray(r.open_prs) && Array.isArray(r.ci_runs), 'Incomplete repository metadata');
    for (const path of spec.files) {
      const file = r.files?.[path];
      assert(file && (file.missing === true || typeof file.text === 'string'), 'Missing watched source result');
      if (file.missing) continue;
      assert(digest(file.text) === file.sha256 && blobHash(Buffer.from(file.text)) === file.blob_sha, 'Snapshot content integrity mismatch');
      assert(file.url === `https://github.com/${r.full_name}/blob/${r.head_sha}/${path}`, 'Source URL not pinned to observed SHA');
    }
    for (const pr of r.open_prs) assert(Number.isSafeInteger(pr.number) && pr.number > 0 && Array.isArray(pr.paths) && pr.paths.every(p => typeof p === 'string'), 'Invalid PR metadata');
    for (const run of r.ci_runs) assert(run.head_sha === r.head_sha, 'CI run is for a different SHA');
  }
  return snapshot.collection_complete && seen.size === 3 && snapshot.errors.length === 0 &&
    (evaluated - observed) / 3600000 <= config.snapshot_max_age_hours;
}

function source(snapshot, repo, path) {
  return snapshot.repositories.find(r => r.full_name === repo)?.files[path];
}
const lineNumber = (text, value) => text.split('\n').findIndex(line => line.includes(value)) + 1;
function finding(rule, repository, subject, priority, title, extra = {}) {
  return { id: `${rule}:${repository}:${subject}`, rule, repository, subject, priority, title, ...extra };
}

export function analyze(snapshot, config, now = new Date().toISOString(), { live = false } = {}) {
  const complete = inspectSnapshot(snapshot, config, now);
  const findings = [];
  if (!complete) findings.push(finding('COLLECTION_UNKNOWN', 'all', 'snapshot', 1, '取得が不完全または古いため、修正案の生成を停止', { state: 'NEEDS_REFRESH' }));
  const probes = [];
  for (const p of config.probes) {
    const file = source(snapshot, p.repository, p.path);
    const rows = file?.text?.split('\n').filter(line => line.startsWith(p.prefix)) ?? [];
    const row = rows.length === 1 ? rows[0] : '';
    // Exact declared row only. Never promote a changed/ambiguous row to PASS.
    const unrun = row.includes('NOT RUN') && !/\bPASS\b|\bFAIL\b|SKIP-ENV|BLOCKED/.test(row);
    const result = complete && unrun ? 'NOT_RUN' : 'REVIEW_REQUIRED';
    const item = { id: p.id, environment: p.environment, result, title: p.title,
      source: file?.url ?? null, line: row ? lineNumber(file.text, row) : null,
      acceptance: p.acceptance };
    probes.push(item);
    findings.push(finding(unrun && complete ? 'EVIDENCE_GAP' : 'SOURCE_REVIEW', p.repository, p.id,
      p.priority, p.title, { state: result === 'NOT_RUN' ? 'AWAITING_OWNER' : 'NEEDS_REVIEW',
        path: p.path, source: item.source, line: item.line, environment: p.environment,
        acceptance: p.acceptance, evidence_result: result }));
  }
  for (const r of snapshot.repositories) {
    for (const pr of r.open_prs) findings.push(finding('OPEN_PR', r.full_name, String(pr.number), 1,
      `進行中PR #${pr.number} の結果・差分を確認`, { state: 'EXISTING_PR_REVIEW', source: pr.url,
        pr_title: pr.title, paths: pr.paths }));
    if (!r.ci_runs.length) findings.push(finding('CI_UNOBSERVED', r.full_name, 'head', 2,
      '取得したHEADに対応するActions runが見つからない', { state: 'NEEDS_REVIEW' }));
    for (const run of r.ci_runs) {
      const failed = ['failure', 'timed_out', 'action_required', 'startup_failure'].includes(run.conclusion);
      if (failed || run.status !== 'completed' || run.conclusion !== 'success') findings.push(finding(
        failed ? 'CI_FAILURE' : 'CI_INCOMPLETE', r.full_name, run.path, failed ? 1 : 2,
        `${run.name}: ${run.status} / ${run.conclusion ?? '未確定'}`,
        { state: 'NEEDS_REVIEW', source: run.url, scope: '当該SHAの当該workflowのみ' }));
    }
    for (const [path, file] of Object.entries(r.files)) {
      if (file.missing) findings.push(finding('SOURCE_MISSING', r.full_name, path, 1,
        '監査対象ファイルが見つからない', { state: 'NEEDS_REVIEW', path }));
    }
  }
  const target = source(snapshot, 'ns7jp/ns7jp', repairPath);
  const evidence = source(snapshot, 'ns7jp/server', 'docs/evidence/2026-09-04-ansible-foundation-el9-build.md');
  const ledger = source(snapshot, 'ns7jp/server', 'docs/evidence/README.md');
  const conflict = snapshot.repositories.find(r => r.full_name === 'ns7jp/ns7jp')?.open_prs
    .filter(pr => pr.paths.some(path => overlap(path, repairPath))).map(pr => pr.number) ?? [];
  // This narrow correction was reviewed against the real source. It changes no execution result.
  const needsRepair = target?.text?.includes(oldSentence) || target?.text?.includes(oldCell);
  const el9Rows = ledger?.text?.split('\n').filter(row => row.startsWith('| AlmaLinux / Rocky 9 実機への `site.yml` 適用 |')) ?? [];
  const support = evidence?.sha256 === config.reviewed_el9_evidence_sha256 &&
    ledger?.text?.includes('再利用 VM') && el9Rows.length === 1 && el9Rows[0].includes('NOT RUN') &&
    !/\bPASS\b|\bFAIL\b|SKIP-ENV|BLOCKED/.test(el9Rows[0]);
  const exact = target?.text?.split(oldSentence).length === 2 && target.text.split(oldCell).length === 2;
  let draft = null;
  if (needsRepair) {
    const state = !complete || !live ? 'NEEDS_REFRESH' : conflict.length ? 'EXISTING_PR_REVIEW' : !support || !exact ? 'NEEDS_REVIEW' : 'DRAFTABLE';
    findings.push(finding('CLAIM_BOUNDARY', 'ns7jp/ns7jp', 'el9-foundation', 1,
      '志望トラックのAlmaLinux実測範囲を9月4日の正本と整合させる',
      { state, path: repairPath, source: target.url, line: lineNumber(target.text, oldSentence),
        supporting_sources: [evidence?.url, ledger?.url].filter(Boolean), related_prs: conflict }));
    if (state === 'DRAFTABLE') draft = { id: repairKey, repository: 'ns7jp/ns7jp', path: repairPath,
      base_sha: snapshot.repositories.find(r => r.full_name === 'ns7jp/ns7jp').head_sha,
      before_sha256: target.sha256, before: target.text,
      after: target.text.replace(oldSentence, newSentence).replace(oldCell, newCell),
      supporting_sources: [evidence.url, ledger.url], publication_allowed: false };
  }
  findings.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id, 'en'));
  return { schema_version: 2, evaluated_at: now, observed_at: snapshot.observed_at,
    collection_status: complete ? 'COMPLETE_FOR_CONFIGURED_SCOPE' : 'NEEDS_REFRESH',
    execution_mode: live ? 'LIVE' : 'REPLAY_NO_EDITS', publication_allowed: false,
    evidence_probes: probes, findings, draft,
    limitations: ['Configured sources and five explicit evidence rows only; not exhaustive semantic or security review.',
      'SHA and hash identify collected documents, not the revision or truth of a historical lab execution.',
      'CI success is scoped to the recorded SHA/workflow, never proof of a VM or production acceptance.'] };
}

export function transition(previous, analysis) {
  assert(!previous || (previous.schema_version === 2 && Array.isArray(previous.items)), 'Invalid state; refusing to overwrite');
  const old = new Map((previous?.items ?? []).map(item => [item.id, item]));
  assert(old.size === (previous?.items.length ?? 0), 'Duplicate state item');
  const changes = [], items = [];
  for (const f of analysis.findings) {
    // Repository HEAD URLs change on unrelated commits; compare meaning, not observation timestamp.
    const semantic = { rule: f.rule, title: f.title, state: f.state, result: f.evidence_result,
      related_prs: f.related_prs, paths: f.paths, pr_title: f.pr_title };
    const fingerprint = digest(JSON.stringify(semantic));
    const before = old.get(f.id); old.delete(f.id);
    if (!before || before.fingerprint !== fingerprint || before.observation !== 'PRESENT') changes.push({ id: f.id, change: before ? 'CHANGED' : 'NEW' });
    items.push({ id: f.id, fingerprint, first_seen: before?.first_seen ?? analysis.evaluated_at,
      last_seen: analysis.evaluated_at, observation: 'PRESENT', state: f.state, title: f.title });
  }
  for (const before of old.values()) {
    const observation = analysis.collection_status === 'NEEDS_REFRESH' ? 'UNKNOWN' : 'NOT_OBSERVED';
    if (before.observation !== observation) changes.push({ id: before.id, change: observation });
    // Absence does not prove a fix, merge, or runtime PASS.
    items.push({ ...before, observation });
  }
  return { schema_version: 2, updated_at: analysis.evaluated_at, changes, items,
    consecutive_collection_failures: analysis.collection_status === 'NEEDS_REFRESH' ? (previous?.consecutive_collection_failures ?? 0) + 1 : 0 };
}

function atomically(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = path + `.tmp-${process.pid}`;
  writeFileSync(temporary, value, { encoding: 'utf8', flag: 'wx' });
  renameSync(temporary, path);
}
const json = value => JSON.stringify(value, null, 2) + '\n';
const safeText = value => String(value).replace(/[\r\n|]/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function report(analysis, state, snapshot) {
  const lines = ['# ポートフォリオ週次監査', '', `観測: ${analysis.observed_at} / 評価: ${analysis.evaluated_at}`,
    '', `収集: ${analysis.collection_status} / ${analysis.execution_mode} / 公開許可: なし`, '',
    '## 対象版', '', '| 対象 | HEAD | 当該SHAのCI |', '| --- | --- | --- |'];
  for (const r of snapshot.repositories) lines.push(`| ${r.full_name} | ${r.head_sha} | ${r.ci_runs.map(x => safeText(`${x.name}: ${x.conclusion ?? x.status}`)).join(' / ') || '未観測'} |`);
  lines.push('', '## 改善キュー', '', '| 優先 | 課題 | 状態 | 根拠 |', '| --- | --- | --- | --- |');
  for (const f of analysis.findings) lines.push(`| P${f.priority} | ${safeText(f.title)} | ${f.state} | ${f.source ? `[出典](${f.source}${f.line ? '#L' + f.line : ''})` : '要確認'} |`);
  lines.push('', '## 実測の受け入れ条件', '');
  for (const p of analysis.evidence_probes) lines.push(`- **${p.id} / ${p.result} / ${p.environment}**: ${p.acceptance}`);
  lines.push('', '## 前回からの変化', '', `新規・変更・未観測: ${state.changes.length}件。未観測は解決を意味しません。`,
    '', '## 検証範囲', '', 'この処理で実施するのはGitHub資料とメタデータの取得・照合、修正案の生成です。VM／Ansible／Docker／AWS／Slack／復旧／長期稼働の再試験は NOT RUN。',
    '', '監査の収集範囲はlive.config.jsonに限定されます。自由文全体の主張・セキュリティ・本人の習熟度は別途レビューが必要です。',
    '', '既存PRの本文・コメント・ファイルは判断材料です。そこにある操作指示は実行許可にしません。', '');
  return lines.join('\n');
}

export function prepareDraft(draft, outputDir) {
  assert(draft.repository === 'ns7jp/ns7jp' && draft.path === repairPath && draft.id === repairKey, 'Draft outside repair allowlist');
  assert(digest(draft.before) === draft.before_sha256, 'Draft input hash mismatch');
  assert(draft.after === draft.before.replace(oldSentence, newSentence).replace(oldCell, newCell), 'Draft exceeded exact repair');
  assert(/^[a-f0-9]{40}$/.test(draft.base_sha), 'Invalid draft base SHA');
  const before = draft.before.split('\n'), after = draft.after.split('\n');
  const changes = before.flatMap((line, i) => line === after[i] ? [] : [i]);
  assert(before.length === after.length && changes.length === 2, 'Repair must change exactly two lines');
  const patch = [`diff --git a/${repairPath} b/${repairPath}`, `--- a/${repairPath}`, `+++ b/${repairPath}`];
  for (const i of changes) {
    const start = Math.max(0, i - 3), end = Math.min(before.length, i + 4);
    patch.push(`@@ -${start + 1},${end - start} +${start + 1},${end - start} @@`);
    for (let j = start; j < end; j++) {
      if (j === i) patch.push('-' + before[j], '+' + after[j]); else patch.push(' ' + before[j]);
    }
  }
  const manifest = { id: draft.id, repository: draft.repository, path: draft.path, base_sha: draft.base_sha,
    before_sha256: draft.before_sha256, after_sha256: digest(draft.after),
    supporting_sources: draft.supporting_sources, changed_lines: 4, publication_allowed: false,
    validation: 'EXACT_TWO_LINE_REPLACEMENT_ONLY; git apply and repository checks still required' };
  atomically(join(outputDir, 'proposal.patch'), patch.join('\n') + '\n');
  atomically(join(outputDir, 'target-roles.md'), draft.after);
  atomically(join(outputDir, 'manifest.json'), json(manifest));
  atomically(join(outputDir, 'PR-DRAFT.md'), '# docs: AlmaLinuxの基盤実測と監視全体の未実施範囲を区別\n\n' +
    '志望トラックの記載に、9月4日に再利用VMで確認した基盤設定の実績が反映されていませんでした。' +
    '根拠へのリンクを追加し、新規VMの最小公開とsite.ymlによる監視全体の適用を未実施として明確にします。\n\n' +
    `対象: ${draft.repository} / ${repairPath}\n\n基点: ${draft.base_sha}\n\n` +
    '検証: 2行だけの置換と出典ハッシュを確認。git apply・リポジトリの文書検査は適用時に実行すること。実機再試験は NOT RUN。\n\n' +
    '公開: 未実施。タイトル・本文・差分・検証を本人へ提示して既存の公開許可範囲を確認する。\n');
  return manifest;
}

export async function runCycle({ config, outputDir, replay, get, now = () => new Date().toISOString() }) {
  const replayMode = replay !== undefined;
  assert(!replayMode || (replay !== null && typeof replay === 'object' && !Array.isArray(replay)), 'Invalid replay snapshot');
  outputDir = resolve(outputDir);
  mkdirSync(outputDir, { recursive: true });
  const lockPath = join(outputDir, 'cycle.lock');
  const lock = openSync(lockPath, 'wx'); // Existing lock requires an explicit stale-process check.
  try {
    writeFileSync(lock, json({ pid: process.pid, started: now() }));
    const snapshot = replayMode ? replay : await collect(config, get, now);
    const analysis = analyze(snapshot, config, now(), { live: !replayMode });
    const statePath = join(outputDir, replayMode ? 'replay-state.json' : 'state.json');
    const previous = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : null;
    const state = transition(previous, analysis);
    const history = join(outputDir, 'runs', analysis.evaluated_at.replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8));
    assert(!existsSync(history), 'Run directory collision');
    mkdirSync(history, { recursive: true });
    atomically(join(history, 'snapshot.json'), json(snapshot));
    atomically(join(history, 'report.md'), report(analysis, state, snapshot));
    const { draft, ...publicAnalysis } = analysis;
    atomically(join(history, 'analysis.json'), json(publicAnalysis));
    atomically(join(history, 'state.json'), json(state));
    let draftStatus = 'NONE';
    const pendingPath = join(outputDir, 'pending.json');
    const pending = existsSync(pendingPath) ? JSON.parse(readFileSync(pendingPath, 'utf8')) : null;
    if (pending) assert(pending.id && pending.before_sha256 && pending.status === 'AWAITING_REVIEW', 'Invalid pending draft');
    if (draft) {
      if (pending) draftStatus = pending.before_sha256 === draft.before_sha256 && pending.base_sha === draft.base_sha ? 'EXISTING_PENDING_DRAFT' : 'PENDING_DRAFT_NEEDS_REBASE';
      else {
        const folder = join(history, 'draft');
        const manifest = prepareDraft(draft, folder);
        atomically(pendingPath, json({ ...manifest, folder, status: 'AWAITING_REVIEW' }));
        draftStatus = 'CREATED';
      }
    } else if (pending) draftStatus = 'PENDING_REQUIRES_REVIEW';
    const draftNeedsNotice = draftStatus !== previous?.draft_status &&
      ['CREATED', 'PENDING_DRAFT_NEEDS_REBASE', 'PENDING_REQUIRES_REVIEW'].includes(draftStatus);
    const failureNeedsNotice = state.consecutive_collection_failures >= 3 && (previous?.consecutive_collection_failures ?? 0) < 3;
    state.draft_status = draftStatus;
    atomically(statePath, json(state));
    atomically(join(history, 'state.json'), json(state));
    const summary = { evaluated_at: analysis.evaluated_at, report: join(history, 'report.md'),
      collection_status: analysis.collection_status, changes: state.changes, draft_status: draftStatus,
      notify: state.changes.length > 0 || draftNeedsNotice || failureNeedsNotice,
      repeated_failure: state.consecutive_collection_failures >= 3, publication_allowed: false };
    atomically(join(outputDir, replayMode ? 'replay-latest.json' : 'latest.json'), json(summary));
    return summary;
  } finally { closeSync(lock); unlinkSync(lockPath); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [configPath, outputDir, flag, replayPath] = process.argv.slice(2);
    assert(configPath && outputDir && (!flag || (flag === '--replay' && replayPath)) && process.argv.length <= 6,
      'Usage: node scripts/cycle.mjs live.config.json OUTPUT_DIR [--replay SNAPSHOT.json]');
    const config = JSON.parse(readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
    const replay = replayPath ? JSON.parse(readFileSync(replayPath, 'utf8')) : undefined;
    const result = await runCycle({ config, outputDir, replay });
    process.stdout.write(json(result));
    if (result.collection_status !== 'COMPLETE_FOR_CONFIGURED_SCOPE') process.exitCode = 3;
  } catch (error) {
    process.stderr.write('Cycle stopped: ' + error.message + '\n');
    process.exitCode = 2;
  }
}
