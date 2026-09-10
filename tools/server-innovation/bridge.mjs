// Materialize one reviewable implementation handoff, never apply the target change.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { safe } from '../portfolio-audit/scripts/career.mjs';

export const BRIDGE_DIR = '.local/improvement-bridge';
export const MAX_BRIDGE_BUNDLES = 32;
const STAMP = { authorization: 'NONE', publication_allowed: false, external_actions_allowed: false,
  se_record_writes_allowed: false, runtime_status: 'NOT_RUN', implementation_status: 'NOT_RUN' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const check = (ok, message) => { if (!ok) throw Error(message); };
const clean = value => String(typeof value === 'string' ? value : JSON.stringify(value)).replace(/[\x00-\x1f\x7f<>`]/g, ' ');
const FILES = ['handoff.json', 'implementation.md', 'regression-cases.json', 'proposals.json'];
const stable = value => JSON.parse(JSON.stringify(value, (key, item) => ['evaluated_at', 'elapsed_ms', 'prepared_at', 'created_at'].includes(key) ? undefined : item));

export function renderHandoff(packet) {
  const lines = ['# 改善への引き継ぎ', '', `候補: ${clean(packet.candidate_id)} / ${clean(packet.title)}`, '',
    '**状態: 実装・実機検証は NOT RUN。これは実装準備の一式です。**', '',
    `入力ソース: ${packet.input_data_kind === 'synthetic' ? 'synthetic（合成原本。本人の観測ではありません）' : 'observed（取得済み原本。実機実行の証明ではありません）'}`, '',
    '## 出発点と根拠', '', packet.hypothesis, '',
    `対象リポジトリ: ${clean(packet.source.repository)}`, `対象版: ${clean(packet.source.base_sha)}`,
    `本文SHA256: ${packet.source.sha256}`, `[確認した原本](${packet.source.url}#L${packet.source.line})`, '',
    `抜粋（入力データ）: ${clean(packet.source.excerpt)}`, '', '## 変更対象', '',
    ...packet.targets.map(target => `- ${clean(target)}`), '', '## 最小変更の手順', '',
    ...packet.implementation_steps.map((step, index) => `${index + 1}. ${clean(step)}`), '',
    '## 確認すること', '', `指標: ${clean(packet.metric)}`, '',
    ...packet.verification.recipe.map(step => `- ${clean(step)}`), '',
    '正常系・反例と期待結果は同じフォルダの regression-cases.json にあります。モデルの合成結果を実測値へ転記しません。', '',
    '## 戻し方', '', clean(packet.rollback), '', '## 次の操作', '',
    ...packet.next_steps.map((step, index) => `${index + 1}. ${clean(step)}`), '',
    '変更したコードを検証し、その変更後SHAを既存の実験登録へ渡します。取得した文章やコード片を無条件に実行しません。', '',
    'authorization: NONE / publication_allowed: false / external_actions_allowed: false / runtime_status: NOT_RUN', ''];
  return lines.join('\n');
}

function atomic(root, relative, content) {
  const file = safe(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temporary, content, { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file);
}
function boundedRead(root, relative) {
  const file = safe(root, relative), stat = fs.statSync(file);
  check(stat.isFile() && stat.size > 0 && stat.size <= 2 * 1024 * 1024, 'Bridge artifact must be a nonempty file <= 2 MiB');
  return fs.readFileSync(file);
}

export function readBridge(root) {
  const latestPath = BRIDGE_DIR + '/latest.json';
  if (!fs.existsSync(safe(root, latestPath))) return null;
  const latest = JSON.parse(boundedRead(root, latestPath));
  check(latest.schema_version === 1 && /^[a-f0-9]{64}$/.test(latest.signature), 'Invalid bridge latest record');
  if (!latest.bundle) return { latest, packet: null };
  check(/^[a-f0-9]{64}$/.test(latest.bundle.id) && latest.bundle.path === `${BRIDGE_DIR}/bundles/${latest.bundle.id}`, 'Invalid bridge bundle path');
  const manifest = JSON.parse(boundedRead(root, latest.bundle.path + '/manifest.json'));
  check(manifest.schema_version === 1 && manifest.id === latest.bundle.id && Object.keys(manifest.files).sort().join() === [...FILES].sort().join(), 'Invalid bridge manifest');
  check(hash(json(Object.fromEntries(FILES.map(name => [name, manifest.files[name]])))) === manifest.id, 'Bridge manifest integrity mismatch');
  const contents = {};
  for (const name of FILES) {
    const bytes = boundedRead(root, latest.bundle.path + '/' + name);
    check(manifest.files[name] === hash(bytes), `Bridge artifact integrity mismatch: ${name}`);
    contents[name] = bytes;
  }
  const packet = JSON.parse(contents['handoff.json']);
  check(packet.candidate_id === latest.candidate_id && packet.authorization === 'NONE' && packet.runtime_status === 'NOT_RUN', 'Invalid bridge packet');
  return { latest, packet, markdown: contents['implementation.md'].toString('utf8') };
}

export function persistBridge(root, prepared, handoff, now) {
  fs.mkdirSync(safe(root, BRIDGE_DIR), { recursive: true });
  const lock = safe(root, BRIDGE_DIR + '/bridge.lock'), fd = fs.openSync(lock, 'wx');
  try {
    fs.writeFileSync(fd, json({ pid: process.pid, at: now }));
    const previous = readBridge(root)?.latest ?? null;
    let state = handoff.state, bundle = null;
    const packet = handoff.packet ? stable(handoff.packet) : null;
    if (state === 'READY') {
      check(packet && packet.authorization === 'NONE' && packet.runtime_status === 'NOT_RUN', 'Ready bridge needs a non-authorizing packet');
      const artifacts = {
        'handoff.json': json({ ...packet, ...STAMP }), 'implementation.md': renderHandoff(packet),
        'regression-cases.json': json({ schema_version: 1, candidate_id: packet.candidate_id, ...packet.verification,
          ...STAMP, input_data_kind: prepared.input_data_kind }),
        'proposals.json': json({ schema_version: 1, input_data_kind: prepared.input_data_kind, proposals: stable(prepared.proposals) }),
      };
      check(Object.values(artifacts).every(value => Buffer.byteLength(value) <= 2 * 1024 * 1024)
        && Object.values(artifacts).reduce((n, value) => n + Buffer.byteLength(value), 0) <= 4 * 1024 * 1024, 'Bridge bundle exceeds bounded size');
      const hashes = Object.fromEntries(FILES.map(name => [name, hash(artifacts[name])]));
      const id = hash(json(hashes)), relative = `${BRIDGE_DIR}/bundles/${id}`, directory = safe(root, relative);
      const bundlesDir = safe(root, BRIDGE_DIR + '/bundles');
      if (!fs.existsSync(directory) && fs.existsSync(bundlesDir) && fs.readdirSync(bundlesDir).length >= MAX_BRIDGE_BUNDLES) state = 'ARCHIVE_REVIEW';
      else {
        if (fs.existsSync(directory)) {
          const manifest = JSON.parse(boundedRead(root, relative + '/manifest.json'));
          check(manifest.id === id && json(manifest.files) === json(hashes), 'Bridge bundle manifest changed');
          for (const name of FILES) check(hash(boundedRead(root, relative + '/' + name)) === hashes[name], `Bridge artifact changed: ${name}`);
        } else {
          // A staging directory is renamed only after every artifact and its manifest exist.
          const staging = relative + '.pending-' + randomUUID();
          fs.mkdirSync(safe(root, staging), { recursive: true });
          for (const name of FILES) fs.writeFileSync(safe(root, staging + '/' + name), artifacts[name], { flag: 'wx', mode: 0o600 });
          fs.writeFileSync(safe(root, staging + '/manifest.json'), json({ schema_version: 1, id, files: hashes }), { flag: 'wx', mode: 0o600 });
          fs.renameSync(safe(root, staging), directory);
        }
        bundle = { id, path: relative, implementation: relative + '/implementation.md', cases: relative + '/regression-cases.json' };
      }
    }
    const semanticPacket = packet ? JSON.parse(JSON.stringify(packet, (key, value) => key === 'base_sha' ? 'observed-revision'
      : typeof value === 'string' ? value.replace(/\b[a-f0-9]{40}\b/g, 'observed-revision') : value)) : null;
    const meaning = { state, packet: semanticPacket, signal_ids: prepared.signals.map(signal => signal.id),
      proposal_count: prepared.proposals.length, model_state: prepared.model_result?.stop_reason ?? 'NOT_RUN' };
    const signature = hash(json(meaning));
    const result = { schema_version: 1, evaluated_at: now, ...STAMP, input_data_kind: prepared.input_data_kind, state, candidate_id: packet?.candidate_id ?? null,
      signal_count: prepared.signals.length, proposal_count: prepared.proposals.length, model_state: meaning.model_state,
      notify: previous?.signature !== signature, signature, bundle };
    atomic(root, BRIDGE_DIR + '/latest.json', json(result));
    return result;
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
