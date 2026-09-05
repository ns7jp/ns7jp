import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'docs/server-engineer');
function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
  });
}
const files = [
  ...markdownFiles(folder),
  ...['README.md', 'docs/learning-plan/README.md', 'docs/learning-plan/00-start-here.md',
    'docs/learning-plan/02-curriculum.md'].map(file => path.join(root, file)),
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
    catch { errors.push(path.relative(root, file) + ': invalid URL ' + url); continue; }
    const target = path.resolve(path.dirname(file), name);
    const rel = path.relative(root, target);
    if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.existsSync(target)) {
      errors.push(path.relative(root, file) + ': missing or outside repository: ' + url);
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
