// A reproducible synthetic example. Never labels its output as a real measurement.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { catalog, draftProtocol, register, protocolDigest, evaluate } from './innovation.mjs';
import { digest } from '../portfolio-audit/scripts/github.mjs';

try {
  if (process.argv.length !== 3) throw new Error('Usage: node tools/server-innovation/demo.mjs NEW_OUTPUT_DIR');
  const root = resolve(process.argv[2]);
  mkdirSync(dirname(root), { recursive: true });
  mkdirSync(root); // Existing examples are not replaced.
  const json = x => JSON.stringify(x, null, 2) + '\n';
  const save = (p, x) => writeFileSync(join(root, p), json(x), { flag: 'wx' });
  const start = Date.now() - 600000;
  const at = offset => new Date(start + offset * 1000).toISOString();
  const context = { data_kind: 'synthetic', os: 'no-vm', load: 'fixture', subject: 'demo values only' };
  save('context.json', context);
  const draft = draftProtocol({ ...catalog.experiments[0], base_sha: 'a'.repeat(40) }, at(0));
  Object.assign(draft, { candidate_sha: 'b'.repeat(40), environment_id: 'synthetic-demo', context_sha256: digest(json(context)),
    scope: 'synthetic comparison only; no experiment executed' });
  const protocol = register(draft, at(1));
  save('protocol.registered.json', protocol);
  const runs = [];
  let offset = 2;
  for (let pair = 1; pair <= 3; pair++) {
    const variants = pair % 2 ? ['baseline', 'candidate'] : ['candidate', 'baseline'];
    for (const variant of variants) {
      const value = variant === 'baseline' ? 100 : 70;
      const artifact = { data_kind: 'synthetic', pair, variant, value, note: 'invented demonstration value' };
      const path = `${pair}-${variant}.json`; save(path, artifact);
      runs.push({ pair, variant, revision: protocol[variant + '_sha'], environment_id: protocol.environment_id,
        context_sha256: protocol.context_sha256, started_at: at(offset), finished_at: at(offset + 1), status: 'PASS', value,
        guardrails: { functional_acceptance: 1, data_integrity: 1, unexpected_exposure: 0 }, artifact: { path, sha256: digest(json(artifact)) } });
      offset += 2;
    }
  }
  const results = { schema_version: 1, protocol_sha256: protocolDigest(protocol), data_kind: 'synthetic', runs };
  save('results.json', results);
  const decision = evaluate(protocol, results, root);
  save('decision.json', decision);
  console.log(json({ decision: decision.decision, evidence_kind: 'synthetic', output: root }));
} catch (error) { console.error('Demo stopped: ' + error.message); process.exitCode = 2; }
