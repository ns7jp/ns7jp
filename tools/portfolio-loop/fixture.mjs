// 合成スナップショットの組み立てと、デモ・テスト用の作業ルートの用意。
// ここで作る値はすべて合成データです。実測記録や本人の実績として扱いません。
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { digest, blobHash } from '../portfolio-audit/scripts/github.mjs';
import { catalog } from '../server-innovation/innovation.mjs';
import { discoveryConfig } from '../server-innovation/discovery.mjs';
import { inspectSnapshot } from '../portfolio-audit/scripts/cycle.mjs';
import { execute as careerExecute } from '../portfolio-audit/scripts/career.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const FIXTURE_TIME = '2026-09-08T03:00:00.000Z'; // observed_at = completed_at
export const FIXTURE_NOW = '2026-09-08T04:00:00.000Z'; // 評価時刻。observed_at 以降かつ 24 時間以内
export const HEADS = Object.freeze({ 'ns7jp/server': 'a'.repeat(40), 'ns7jp/ns7jp': 'b'.repeat(40), 'ns7jp/ns7jp.github.io': 'c'.repeat(40) });
const SYNTHETIC = '合成データ';

function ledgerText(config) {
  // 監査の 5 プローブ行はすべて NOT RUN。カタログの目印行は 1 行ずつ。行頭一致で重複しないよう先に並べる。
  const lines = ['# 検証証跡台帳（' + SYNTHETIC + '）', '', '| 項目 | 結果 |', '| --- | --- |'];
  for (const p of config.probes) lines.push(`${p.prefix} NOT RUN |`);
  lines.push('', '再利用 VM での基盤設定のみ確認済み。新規 VM は未確認。', '');
  for (const marker of new Set(catalog.experiments.map(x => x.marker))) {
    if (lines.some(l => l.startsWith(marker))) continue;
    lines.push(marker);
    if (marker.startsWith('## ')) lines.push('', `${SYNTHETIC}: この記録の復旧時間は 1 回・限定区間の値で、別日の再確認は未確認です。`, `${SYNTHETIC}: 判定の根拠を手動で突き合わせる作業が繰り返し必要でした。`, '');
  }
  return lines.join('\n') + '\n';
}
function defaultText(fullName, path) {
  if (fullName === 'ns7jp/server' && path === 'docs/evidence/README.md') return ledgerText(discoveryConfig);
  if (fullName === 'ns7jp/server' && path === 'scripts/drills/d1-process-down.sh') return '#!/bin/bash\n# synthetic inert placeholder; probes report MODEL_UNSUPPORTED\nexit 0\n';
  if (fullName === 'ns7jp/ns7jp' && path === 'docs/target-roles.md') return `# 志望トラック（${SYNTHETIC}）\n\nAlmaLinux 実機への適用、network / UFW\n\n## 範囲\n\n- 未確認の項目は NOT RUN として保持し、実測前に実績へ書き換えない。\n`;
  if (path.endsWith('.html')) return `<!doctype html>\n<title>${SYNTHETIC}</title>\n${SYNTHETIC}: 永続ホストでの受け入れ結果は未確認で、表示は手動で同期しています。\n`;
  return `# ${path}（${SYNTHETIC}）\n\n${SYNTHETIC}: この資料の手順は手動での再確認が繰り返し必要で、失敗時の戻し方は未確認です。\n`;
}

// inspectSnapshot が完全と判定する schema v2 スナップショットを、ネットワークなしで作る。
export function buildSnapshot({ config = discoveryConfig, observedAt = FIXTURE_TIME, texts = {}, openPrs = {}, ciRuns = 'success', d1Source = null } = {}) {
  const repositories = config.repositories.map(spec => {
    const head = HEADS[spec.full_name];
    const files = {};
    for (const path of spec.files) {
      let text = texts[`${spec.full_name}:${path}`];
      if (text === undefined) text = spec.full_name === 'ns7jp/server' && path === 'scripts/drills/d1-process-down.sh' && d1Source ? d1Source : defaultText(spec.full_name, path);
      if (text === null) { files[path] = { missing: true }; continue; }
      files[path] = { text, sha256: digest(text), blob_sha: blobHash(Buffer.from(text)), url: `https://github.com/${spec.full_name}/blob/${head}/${path}` };
    }
    const prs = (openPrs[spec.full_name] ?? []).map((pr, i) => ({ number: pr.number ?? i + 1, title: pr.title ?? `${SYNTHETIC} PR`,
      url: `https://github.com/${spec.full_name}/pull/${pr.number ?? i + 1}`, head_sha: 'd'.repeat(40), draft: false, paths: pr.paths ?? [] }));
    const runs = ciRuns === 'none' ? [] : [{ id: 1, name: 'docs-check', path: '.github/workflows/docs-check.yml', head_sha: head, status: 'completed',
      conclusion: ciRuns === 'success' ? 'success' : 'failure', url: `https://github.com/${spec.full_name}/actions/runs/1`, updated_at: observedAt }];
    return { id: spec.id, full_name: spec.full_name, head_sha: head, default_branch: 'main', files, tree_paths: spec.files.slice(), open_prs: prs, ci_runs: runs };
  });
  // data_kind は合成の目印。ループはこの目印を持つスナップショットをデモか一時ルート以外で拒否する。
  return { schema_version: 2, kind: 'github-api-read-only', data_kind: 'synthetic', observed_at: observedAt, completed_at: observedAt, collection_complete: true, errors: [], repositories };
}
export function updateFile(snapshot, fullName, path, text) {
  const repo = snapshot.repositories.find(r => r.full_name === fullName);
  Object.assign(repo.files[path], { text, sha256: digest(text), blob_sha: blobHash(Buffer.from(text)) });
  return snapshot;
}
export function assertFixture(snapshot, now = FIXTURE_NOW) {
  if (!inspectSnapshot(snapshot, discoveryConfig, now)) throw new Error('Fixture snapshot is incomplete or stale for the given time');
  return true;
}

// career init が読む雛形と参照文書だけを別ルートへ複製し、私用のキャリア計画を初期化する。実在の .local は触らない。
export async function seedRoot(dir, { hours = 10, now = () => new Date().toISOString(), source = REPO_ROOT } = {}) {
  dir = resolve(dir);
  for (const rel of ['tools/portfolio-audit/career.config.example.json', 'docs/server-engineer/curriculum.json', 'docs/server-projects/workflow.json']) {
    const target = join(dir, rel); mkdirSync(dirname(target), { recursive: true });
    if (!existsSync(target)) copyFileSync(join(source, rel), target);
  }
  const template = JSON.parse(readFileSync(join(dir, 'tools/portfolio-audit/career.config.example.json'), 'utf8'));
  for (const action of template.actions) {
    const file = join(dir, action.reference); mkdirSync(dirname(file), { recursive: true });
    if (!existsSync(file)) writeFileSync(file, `# ${SYNTHETIC}の参照文書\n\n${action.reference} の代わりに置いた雛形です。\n`);
  }
  if (!existsSync(join(dir, '.local/engineer-career/profile.json'))) await careerExecute(['init', String(hours)], { root: dir, now });
  return dir;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [out, ...rest] = process.argv.slice(2);
    const observedAt = rest[0] === '--observed-at' ? rest[1] : new Date(Date.now() - 3600000).toISOString();
    if (!out || (rest.length && (rest[0] !== '--observed-at' || rest.length !== 2))) throw new Error('Usage: node tools/portfolio-loop/fixture.mjs OUT.json [--observed-at ISO]');
    const target = resolve(out), inDocs = relative(join(REPO_ROOT, 'docs'), target);
    if (!inDocs.startsWith('..') && !isAbsolute(inDocs)) throw new Error('Refusing to write synthetic data under docs/');
    const snapshot = buildSnapshot({ observedAt });
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
    process.stdout.write(JSON.stringify({ output: target, data_kind: 'synthetic', observed_at: observedAt }, null, 2) + '\n');
  } catch (error) { process.stderr.write('Fixture stopped: ' + error.message + '\n'); process.exitCode = 2; }
}
