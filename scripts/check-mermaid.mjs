import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Element = dom.window.Element;

const { default: mermaid } = await import('mermaid');
mermaid.initialize({ startOnLoad: false });

const root = process.argv[2] || '.';

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.git')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (entry.endsWith('.md')) yield full;
  }
}

let total = 0;
const errors = [];

for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  const re = /```mermaid\n([\s\S]*?)```/g;
  let m;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    idx++;
    total++;
    try {
      await mermaid.parse(m[1]);
    } catch (err) {
      errors.push(`${file} (diagram #${idx}): ${err.message?.split('\n')[0] || err}`);
    }
  }
}

console.log(`scanned: ${total} diagrams, failed: ${errors.length}`);
if (errors.length) {
  console.log('\nERRORS:');
  for (const e of errors) console.log(' -', e);
  process.exit(1);
}
