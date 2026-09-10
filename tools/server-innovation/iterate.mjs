// Fast local-model trials. Captured source is data; no fetched code or shell command is executed.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { safe } from '../portfolio-audit/scripts/career.mjs';
import { inspectSnapshot } from '../portfolio-audit/scripts/cycle.mjs';
import { discoveryConfig } from './discovery.mjs';
import { D1_SOURCE_PATH } from './probes.mjs';
import { MODEL_VERSION, iterateModel } from './iterate-model.mjs';
import { run as prosperityStatus } from '../autonomous-prosperity/prosperity.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const ITERATION_DIR = '.local/innovation-iterations';
export const MAX_CACHED_RUNS = 32;
const STAMP = Object.freeze({ execution_scope: 'local-model', data_kind: 'synthetic', runtime_status: 'NOT_RUN',
  authorization: 'NONE', publication_allowed: false, external_actions_allowed: false, se_record_writes_allowed: false });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const check = (ok, message) => { if (!ok) throw Error(message); };
const parse = bytes => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
export function readSnapshotFile(file) {
  const stat = fs.statSync(file);
  check(stat.isFile() && stat.size > 0 && stat.size <= 8 * 1024 * 1024, 'Snapshot file must be a nonempty regular file <= 8 MiB');
  return parse(fs.readFileSync(file));
}
const codeHash = () => hash(Buffer.concat(['iterate.mjs', 'iterate-model.mjs', 'probes.mjs'].map(name => fs.readFileSync(new URL(name, import.meta.url)))));
function read(root, relative, limit = 8 * 1024 * 1024) {
  const file = safe(root, relative), stat = fs.statSync(file);
  check(stat.isFile() && stat.size > 0 && stat.size <= limit, 'Iteration input must be a nonempty bounded regular file');
  return fs.readFileSync(file);
}
function write(root, relative, value) {
  const target = safe(root, relative), bytes = json(value);
  check(Buffer.byteLength(bytes) <= 2 * 1024 * 1024, 'Iteration result exceeds 2 MiB');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = target + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 });
  fs.renameSync(temporary, target);
}
function options({ rounds, seed, budgetMs }) {
  check(Number.isInteger(rounds) && rounds >= 1 && rounds <= 8, 'rounds must be 1..8');
  check(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'seed must be a uint32 integer');
  check(Number.isInteger(budgetMs) && budgetMs >= 1 && budgetMs <= 5000, 'budget-ms must be 1..5000');
}

export function latestSnapshot(root, now) {
  const pointers = ['latest.json', 'replay-latest.json'].flatMap(name => {
    const relative = '.local/portfolio-operations/' + name;
    if (!fs.existsSync(safe(root, relative))) return [];
    const pointer = parse(read(root, relative));
    const time = Date.parse(pointer.evaluated_at);
    check(Number.isFinite(time) && time <= Date.parse(now) && typeof pointer.report === 'string', 'Invalid or future audit pointer');
    return [{ pointer, time }];
  }).sort((a, b) => b.time - a.time);
  if (!pointers.length) return null;
  const report = pointers[0].pointer.report;
  const relative = path.relative(root, path.resolve(root, report)).replaceAll('\\', '/');
  check(relative.startsWith('.local/portfolio-operations/') && relative.endsWith('.md'), 'Audit pointer is outside its private directory');
  const snapshotPath = path.posix.join(path.posix.dirname(relative), 'snapshot.json');
  return parse(read(root, snapshotPath));
}

const NEXT = {
  NEEDS_REFRESH: '保存済みの新しい観測が必要です。既存の run を一度実行してください。',
  PAUSED: '本人が停止中です。負荷と再開条件を確認してください。',
  REVIEW_LOAD: '本人の負荷と既存計画の配分を確認してください。',
  LOCKED: '別の処理の完了を待ってから iterate を実行してください。',
  ARCHIVE_REVIEW: '保存上限です。必要な試行記録を保管し、整理対象を本人が確認してください。',
  MODEL_UNSUPPORTED: '取得したソースにモデルが未対応です。対応関係を確認してから試行してください。',
  CONVERGED: 'モデル内の反例が解消しました。実コードへの適用案と実機の比較条件を一件だけ確認してください。',
  NO_IMPROVEMENT: '許可された小変更では改善しませんでした。残った反例から仮説を見直してください。',
  ROUND_LIMIT: '試行回数の上限です。残った反例と、次に試す条件を確認してください。',
  TIME_LIMIT: '探索の時間上限です。途中の結果を確認し、必要なら budget-ms を範囲内で増やしてください。',
};

export async function runIteration({ root = ROOT, snapshot, rounds = 5, seed = 0, budgetMs = 1000,
  now = new Date().toISOString(), engine = iterateModel } = {}) {
  options({ rounds, seed, budgetMs });
  check(typeof now === 'string' && Number.isFinite(Date.parse(now)), 'Invalid iteration time');
  check(snapshot === undefined || Buffer.byteLength(JSON.stringify(snapshot)) <= 8 * 1024 * 1024, 'Snapshot exceeds 8 MiB');
  root = path.resolve(root);
  const started = performance.now();
  fs.mkdirSync(safe(root, ITERATION_DIR), { recursive: true });
  const lock = safe(root, ITERATION_DIR + '/run.lock');
  const fd = fs.openSync(lock, 'wx');
  try {
    fs.writeFileSync(fd, json({ pid: process.pid, started_at: now }));
    const latestPath = ITERATION_DIR + '/latest.json';
    const previous = fs.existsSync(safe(root, latestPath)) ? parse(read(root, latestPath, 2 * 1024 * 1024)) : null;
    check(!previous || (previous.schema_version === 1 && /^[a-f0-9]{64}$/.test(previous.signature)), 'Invalid iteration latest record');
    const finish = (status, result = null, cache = null, observed = null) => {
      const semantic = { status, settings: { rounds, seed, budget_ms: budgetMs }, result_key: cache?.key ?? null };
      const signature = hash(json(semantic));
      const view = { schema_version: 1, ...STAMP, evaluated_at: now, model_version: MODEL_VERSION, status,
        next_action: NEXT[status], settings: semantic.settings, signature, notify: previous?.signature !== signature,
        source_observed_at: observed?.observed_at ?? null, input_data_kind: observed ? observed.data_kind ?? 'observed' : 'unknown',
        source_url: observed?.repositories.find(r => r.full_name === 'ns7jp/server')?.files[D1_SOURCE_PATH]?.url ?? null,
        cache: { hit: cache?.hit ?? false, key: cache?.key ?? null, result_path: cache?.path ?? null },
        metrics: { network_requests: 0, engine_executed: !!result && !cache?.hit, elapsed_ms: Math.round((performance.now() - started) * 1000) / 1000 },
        summary: result ? { baseline_cases: result.baseline.cases.length, baseline_mismatches: result.baseline.mismatches,
          training_mismatches: result.training.mismatches, heldout_status: result.heldout.status,
          heldout_mismatches: result.heldout.mismatches, rounds: result.rounds.length, policy: result.policy, search_elapsed_ms: result.elapsed_ms } : null };
      write(root, latestPath, view);
      return view;
    };
    const locks = ['.local/portfolio-operations/cycle.lock', '.local/engineer-career/plan.lock', '.local/autonomous-growth/plan.lock',
      '.local/server-innovation/discovery/discovery.lock', '.local/autonomous-prosperity/run.lock'];
    if (locks.some(relative => fs.existsSync(safe(root, relative)))) return finish('LOCKED');
    const status = await prosperityStatus({ root, now });
    if (['PAUSED', 'REVIEW_LOAD'].includes(status.state)) return finish(status.state);
    snapshot = snapshot ?? latestSnapshot(root, now);
    if (!snapshot || !inspectSnapshot(snapshot, discoveryConfig, now)) return finish('NEEDS_REFRESH');
    const source = snapshot.repositories.find(r => r.full_name === 'ns7jp/server')?.files[D1_SOURCE_PATH];
    if (source?.missing === true) check(Object.keys(source).join() === 'missing', 'Missing model source cannot contain captured bytes or hashes');
    else check(typeof source?.text === 'string' && hash(source.text) === source.sha256, 'Model source integrity mismatch');
    const key = hash(json({ model_version: MODEL_VERSION, code_sha256: codeHash(), source_sha256: source?.missing ? null : hash(source.text),
      input_data_kind: snapshot.data_kind ?? 'observed', rounds, seed, budget_ms: budgetMs }));
    const runsDir = safe(root, ITERATION_DIR + '/runs');
    const files = fs.existsSync(runsDir) ? fs.readdirSync(runsDir) : [];
    const pattern = new RegExp(`^${key}(?:-[a-f0-9-]{36})?\\.json$`);
    const prior = files.filter(name => pattern.test(name)).sort();
    let reusable = null;
    for (const name of prior) {
      const relative = `${ITERATION_DIR}/runs/${name}`;
      const cached = parse(read(root, relative, 2 * 1024 * 1024));
      check(cached.schema_version === 1 && cached.key === key && cached.result_sha256 === hash(json(cached.result)), 'Cached iteration integrity mismatch');
      check(cached.result.model_version === MODEL_VERSION && Object.entries(STAMP).filter(([k]) => !['external_actions_allowed', 'se_record_writes_allowed'].includes(k)).every(([k,v]) => cached.result[k] === v), 'Invalid cached model stamp');
      check(NEXT[cached.result.stop_reason], 'Unknown cached model stop reason');
      if (cached.result.stop_reason !== 'TIME_LIMIT') reusable ??= { result: cached.result, relative };
    }
    if (reusable) return finish(reusable.result.stop_reason, reusable.result, { key, hit: true, path: reusable.relative }, snapshot);
    if (files.length >= MAX_CACHED_RUNS) return finish('ARCHIVE_REVIEW', null, null, snapshot);
    const relative = `${ITERATION_DIR}/runs/${key}${prior.length ? '-' + randomUUID() : ''}.json`;
    const result = engine(snapshot, { rounds, seed, budgetMs });
    check(NEXT[result.stop_reason], 'Unknown model stop reason');
    write(root, relative, { schema_version: 1, key, result_sha256: hash(json(result)), result });
    return finish(result.stop_reason, result, { key, hit: false, path: relative }, snapshot);
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}

export function renderIteration(view) {
  const s = view.summary;
  return ['高速な試行錯誤（ローカルモデル）', `状態: ${view.status}${view.cache.hit ? ' / 保存済み結果を再利用' : ''}`,
    ...(s ? [`反例の不一致: ${s.baseline_mismatches} → ${s.training_mismatches} / ${s.rounds} 回`,
      `探索後の別seed確認: ${s.heldout_status} / 不一致 ${s.heldout_mismatches ?? '未確認'}`] : []),
    `次の行動: ${view.next_action}`, ...(view.cache.result_path ? [`記録: ${view.cache.result_path}`] : []),
    '合成ケースによるモデル比較。実機・本人の技能: NOT RUN / authorization: NONE', ''].join('\n');
}

export async function iterationDemo(settings = {}) {
  const { buildSnapshot, updateFile } = await import('../portfolio-loop/fixture.mjs');
  const { sourceText } = await import('./fixtures/d1-model-source.mjs');
  const now = new Date().toISOString();
  const snapshot = updateFile(buildSnapshot({ observedAt: now }), 'ns7jp/server', D1_SOURCE_PATH, sourceText);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'innovation-iteration-demo-'));
  const view = await runIteration({ ...settings, root, snapshot, now });
  return { ...view, demo: true, demo_root: root };
}
