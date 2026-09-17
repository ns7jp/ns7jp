import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 2026-09-17: 学習・案件システム一式を archive/ 配下へ移動した。
// root は archive/（このツール群の基準）、repoRoot はリポジトリ全体の基準。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');
const folders = ['docs/server-engineer', 'docs/server-projects', 'docs/portfolio-loop', 'docs/autonomous-prosperity', 'docs/server-innovation', 'docs/prosperity-review', 'tools/prosperity'].map(folder => path.join(root, folder));
function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
  });
}
const files = [
  ...folders.flatMap(markdownFiles),
  ...['README.md', 'docs/learning-plan/README.md', 'docs/learning-plan/00-start-here.md',
    'docs/learning-plan/02-curriculum.md'].map(file => path.join(repoRoot, file)),
];
let count = 0;
const errors = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  for (const match of source.matchAll(/\[[^\]\n]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const url = match[1].replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:|#)/i.test(url)) continue;
    let name;
    try { name = decodeURIComponent(url.split('#')[0]); }
    catch { errors.push(path.relative(repoRoot, file) + ': invalid URL ' + url); continue; }
    const target = path.resolve(path.dirname(file), name);
    const rel = path.relative(repoRoot, target);
    if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(target)) {
      errors.push(path.relative(repoRoot, file) + ': missing or outside repository: ' + url);
    }
    count++;
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS: ' + files.length + ' Markdown files, ' + count + ' local link targets exist. Anchors are checked separately by docs-check/lychee.');
}
