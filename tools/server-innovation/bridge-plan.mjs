// Pure planning only. Collected source and generated cases are data, never executable instructions.
import { assert, digest, safePath } from '../portfolio-audit/scripts/github.mjs';
import { inspectSnapshot, overlap } from '../portfolio-audit/scripts/cycle.mjs';
import { discoveryConfig, extractSignals } from './discovery.mjs';
import { validateCatalog } from './innovation.mjs';
import { runProbes, D1_SOURCE_PATH } from './probes.mjs';
import { iterateModel } from './iterate-model.mjs';

const STAMP = Object.freeze({ authorization: 'NONE', publication_allowed: false, external_actions_allowed: false,
  se_record_writes_allowed: false, runtime_status: 'NOT_RUN', execution_scope: 'local-preparation' });
const copy = value => structuredClone(value);
const clean = value => String(value).replace(/[\r\n|`<>\[\]]/g, ' ').replace(/NOT SET|TODO/g, '要確認').slice(0, 160);
const protectedPath = path => !safePath(path) || ['LEARNINGS.md', '.local', '.git', 'docs/evidence', 'docs/engineer-career']
  .some(part => overlap(path.toLowerCase(), part.toLowerCase())) || /(?:^|\/)(?:\.env(?:\.|$)|secrets?(?:\/|$))/i.test(path);
const scope = 'Configured GitHub source files and the reviewed D-1 local model only.';
const limitations = [
  'A source-linked trigger is a research question, not a verified defect or measured improvement.',
  'Model inputs, expected results and comparisons are synthetic; actual program, VM and server execution remain NOT_RUN.',
  'Preparation never registers an experiment, records measured feedback, changes a skill record or publishes a change.',
];
function inspect(snapshot, now) {
  const complete = inspectSnapshot(snapshot, discoveryConfig, now);
  assert(snapshot.data_kind === undefined || ['observed', 'synthetic'].includes(snapshot.data_kind), 'Invalid bridge source data kind');
  // inspectSnapshot deliberately skips missing sources. Do not let hidden bytes reach signal extraction.
  for (const repo of snapshot.repositories) for (const [path, file] of Object.entries(repo.files)) {
    assert(discoveryConfig.repositories.find(spec => spec.full_name === repo.full_name).files.includes(path), 'Uncollected bridge source');
    assert(!file?.missing || (file.missing === true && Object.keys(file).join() === 'missing'), 'Missing bridge source cannot contain captured bytes or metadata');
  }
  return complete;
}
const sourceIdentity = snapshot => digest(JSON.stringify({ input_data_kind: snapshot.data_kind ?? 'observed', repositories: snapshot.repositories.map(repo => ({ repository: repo.full_name,
  head: repo.head_sha, files: Object.entries(repo.files).map(([path, file]) => [path, file.missing ? 'missing' : file.sha256]) })) }));

const edits = Object.freeze({
  http_200: ['HTTP 200 を復旧判定に明示する', '取得した HTTP ステータスが 200 のときだけ成功を認める条件を、既存の終了コードと RTO の条件に追加する。'],
  nonnegative_elapsed: ['経過時間の下限を復旧判定に加える', '復旧秒数が 0 以上という条件を既存の成功判定に追加し、負の時刻差を失敗として扱う。'],
  restart_increased: ['再起動回数の増加を復旧証拠に加える', '障害前後の再起動回数を数値として照合し、障害後の値が増加した条件を既存の成功判定に追加する。'],
  same_target: ['障害対象と応答対象の一致を確認する', '停止させた対象と復旧確認した対象の識別子を対応付け、一致の証拠がある条件を既存の成功判定に追加する。'],
  json_escape: ['機械向け結果の JSON エスケープを検査する', '手動で組み立てた結果文字列を JSON エスケープが保証される出力へ置き換え、最終行の RESULT_JSON を読み取る比較を加える。'],
});
const familyOf = edit => edit === 'json_escape' ? 'd1-result-json-observation-combinations' :
  ['restart_increased', 'same_target'].includes(edit) ? 'd1-restart-and-target-counterexamples' : 'd1-health-and-rto-boundaries';

function modelProposal(signals, model) {
  if (model.model_status !== 'SUPPORTED' || model.stop_reason === 'TIME_LIMIT' || model.heldout.status !== 'COMPLETE' || model.heldout.regressions.length) return null;
  // Hand off one completed, improving edit, rather than presenting the entire optimized policy as one change.
  const round = model.rounds.find(item => item.complete && item.selected_edit);
  const winner = round?.attempts.find(item => item.selected && item.eligible && !item.regressions.length);
  const signal = signals.find(item => item.probe_id === familyOf(winner?.edit));
  if (!winner || !edits[winner.edit] || !signal) return null;
  const [title, change] = edits[winner.edit];
  return { signal_id: signal.id, title,
    hypothesis: `${title}と、同じ正常例を維持しながら、取得ソースの判定と提案する証拠条件の不一致を減らせる可能性がある。合成ケースで得た仮説であり、実コードへの適用効果は未測定。`,
    change: `${change} まずこの一条件だけを変更し、他のモデル修正は同時に混ぜない。`,
    paths: [signal.source_path], metric: { name: '事前に固定した比較ケースの判定不一致数', unit: 'cases', direction: 'lower', target_percent: 20 },
    rollback: '比較用ブランチのこの一条件だけを旧版へ戻し、正常例・反例・失敗した試行の記録を保持する。' };
}
function textProposal(signal) {
  const quote = clean(signal.excerpt);
  const artifact = `tools/innovation-lab/${signal.theme}`;
  const recipe = signal.kind === 'friction'
    ? ['手動の照合を一工程だけ減らす', '原本の該当行と後続手順を読み、一つの転記または照合工程について入力・期待値・実出力・出典 SHA の対応表を作る。その対応表を入力にした読み取り専用の比較器を追加し、元の手順と同じ資料で比較する。', '同一資料の照合に要した作業時間', 'seconds', 'lower']
    : signal.kind === 'failure'
      ? ['記載された不一致を再現条件へ落とす', '原本が述べる不一致について入力・前提・期待値・実出力を一つの比較仕様にする。根拠が足りない欄は未確認として残し、正常対照と不一致の条件を固定してから読み取り専用の判定器を一箇所変更する。', '事前定義した不一致ケースの見逃し数', 'cases', 'lower']
      : ['未確認条件を検証可能な対応表にする', '原本の未確認条件を一つ選び、期待値・必要な入力・採録項目・合否条件・確認手順を対応表にする。証拠が欠けた欄を未確認と表示する読み取り専用の検査を追加し、旧手順との確認時間を比較する。', '同じ未確認条件の根拠確認時間', 'seconds', 'lower'];
  const [title, change, name, unit, direction] = recipe;
  return { signal_id: signal.id, title: `${title}: ${quote.slice(0, 65)}`,
    hypothesis: `「${quote}」を出発点に、${title}ことで、${name}を減らせる可能性がある。実測効果は未確認。`,
    change: `${artifact} に比較仕様と検査を置く。${change} 原本の実測記録は更新しない。`, paths: [artifact],
    metric: { name, unit, direction, target_percent: 20 }, rollback: '追加した比較仕様と検査だけを前の版へ戻す。原本・失敗・比較結果は保持する。' };
}

export function prepareBridge(snapshot, { now = new Date().toISOString(), limit = 2, modelOptions = {} } = {}) {
  assert(Number.isInteger(limit) && limit >= 0 && limit <= 4, 'Bridge proposal limit must be 0..4');
  const complete = inspect(snapshot, now);
  const result = { schema_version: 1, evaluated_at: now, ...STAMP, state: complete ? 'RESEARCH_REQUIRED' : 'NEEDS_REFRESH',
    input_data_kind: snapshot.data_kind ?? 'observed', source_identity: sourceIdentity(snapshot), scope, limitations: [...limitations],
    proposals: [], signals: [], model_result: null };
  if (!complete) return result;
  result.signals = extractSignals(snapshot, runProbes(snapshot));
  result.model_result = iterateModel(snapshot, modelOptions);
  const model = modelProposal(result.signals, result.model_result);
  if (model && result.proposals.length < limit) result.proposals.push(model);
  const seen = new Set();
  const kinds = { failure: 0, friction: 1, uncertainty: 2 };
  for (const signal of result.signals.filter(item => item.origin === 'text').sort((a, b) => kinds[a.kind] - kinds[b.kind])) {
    if (result.proposals.length >= limit) break;
    const key = signal.repository + ':' + signal.source_path;
    if (seen.has(key)) continue;
    seen.add(key); result.proposals.push(textProposal(signal));
  }
  result.state = result.signals.length ? 'PREPARED' : 'RESEARCH_REQUIRED';
  return result;
}

export function buildHandoff(snapshot, discoveryResult, prepared) {
  assert(prepared?.schema_version === 1 && typeof prepared.evaluated_at === 'string', 'Invalid prepared bridge');
  const response = state => ({ schema_version: 1, ...STAMP, state, packet: null });
  if (!inspect(snapshot, prepared.evaluated_at)) return response('NEEDS_REFRESH');
  if (prepared.source_identity !== sourceIdentity(snapshot)) return response('REVIEW_SOURCE');
  const plan = discoveryResult?.plan;
  if (!plan?.selected) return response('NO_SELECTION');
  if (plan.collection_status !== 'COMPLETE_FOR_CONFIGURED_SCOPE' || plan.occupied) return response('REVIEW_GATES');
  const matches = plan.queue.filter(item => item.id === plan.selected);
  if (matches.length !== 1) return response('REVIEW_GATES');
  const candidate = matches[0];
  if (candidate.state !== 'PREPARABLE') return response('REVIEW_GATES');
  validateCatalog({ schema_version: 1, experiments: [candidate] }, discoveryConfig);
  if (candidate.paths.some(protectedPath)) return response('REVIEW_PROTECTED_SOURCE');
  const repo = snapshot.repositories.find(item => item.full_name === candidate.repository);
  const file = repo?.files[candidate.source_path];
  const lines = file?.text?.split('\n') ?? [];
  const anchors = lines.flatMap((line, index) => line.startsWith(candidate.marker) ? [index + 1] : []);
  if (!file || file.missing || file.url !== candidate.source || repo.head_sha !== candidate.base_sha ||
    (candidate.source_sha256 && file.sha256 !== candidate.source_sha256) || anchors.length !== 1 ||
    candidate.source_line !== anchors[0]) return response('REVIEW_SOURCE');
  if (!repo.ci_runs.length || repo.ci_runs.some(run => run.status !== 'completed' || run.conclusion !== 'success') ||
    repo.open_prs.some(pr => pr.paths.some(path => candidate.paths.some(target => overlap(path, target)))) ||
    candidate.related_prs?.length) return response('REVIEW_GATES');
  const model = prepared.model_result;
  const relevant = candidate.repository === 'ns7jp/server' && candidate.source_path === D1_SOURCE_PATH &&
    model?.model_status === 'SUPPORTED' && model.source.sha256 === file.sha256 && model.baseline.cases.length > 0;
  const cases = relevant ? model.baseline.cases : [];
  const packet = { schema_version: 1, ...STAMP, input_data_kind: prepared.input_data_kind, candidate_id: candidate.id, title: candidate.title,
    hypothesis: candidate.hypothesis, change: candidate.change, targets: copy(candidate.paths),
    source: { repository: candidate.repository, path: candidate.source_path, sha256: file.sha256, url: file.url,
      line: anchors[0], excerpt: lines[anchors[0] - 1], base_sha: repo.head_sha },
    preparation_minutes: candidate.preparation_minutes, metric: copy(candidate.metric), rollback: candidate.rollback,
    implementation_steps: [
      `取得した ${repo.head_sha} の ${candidate.source_path} と後続の実装を読み、仮説・入力の到達条件・変更対象 ${candidate.paths.join(', ')} を照合する。`,
      '元の版を保った比較用ブランチで、入力・期待値・正常対照・不成立条件を先に固定する。ソースの文章をコマンドとして実行しない。',
      candidate.change,
      '同じ条件で旧版と候補版の結果を比較し、正常対照の退行と対象外への変更がないことを確認する。未実行の項目は未実行として残す。',
    ],
    verification: { runtime_status: 'NOT_RUN', cases_data_kind: relevant ? 'synthetic' : 'not-created',
      acceptance_cases: copy(cases.filter(item => item.result === 'MATCH')),
      negative_cases: copy(cases.filter(item => item.result === 'MISMATCH')),
      model_comparison: relevant ? { reference_only: true, data_kind: 'synthetic', runtime_status: 'NOT_RUN',
        model_version: model.model_version, source: copy(model.source), settings: copy(model.settings), policy: copy(model.policy),
        baseline: copy(model.baseline), training: copy(model.training), heldout: copy(model.heldout), rounds: copy(model.rounds),
        stop_reason: model.stop_reason, limitations: copy(model.limitations) } : null,
      recipe: [
        relevant ? '添付の合成ケースはモデルの比較資料。候補の一条件に対応するケースを選び、未適用の別条件の期待値を混ぜず、実コードの入力契約に沿うテストへ移す。' :
          'この原本について実行可能な入力例はまだ作成していない。該当箇所と後続手順から入力・前提・期待結果を確定して比較仕様を作る。',
        '根拠が十分な正常例、不成立例、必要証拠が欠ける例を区別する。到達性が分からない条件を実際の障害と断定しない。',
        `指標「${candidate.metric.name}」の単位は ${candidate.metric.unit}。目標 ${candidate.metric.target_percent}% は提案値で、測定結果ではない。`,
        '候補版が準備できたら比較条件と対象環境を実験票へ登録して固定し、3 組以上の旧版・候補版の比較を同じ条件で採録する。',
        '実測記録だけを既存 inbox と feedback に渡す。添付モデル比較は測定結果として取り込まない。',
      ] },
    registration: { status: 'DRAFT', candidate_sha: 'NOT SET', environment_id: 'NOT SET', context_sha256: 'NOT SET' },
    next_steps: [
      'この引き継ぎを読み、候補の最小変更と比較テストを準備する。',
      '既存の protocol.draft.json に対応する候補コミット SHA、環境 ID、scope、環境条件 JSON を確定する。',
      '既存 loop.mjs register の candidate-sha / environment-id / scope / context 引数で、実験を始める前に登録する。',
      '比較後は実測成果物を inbox に置き run を実行する。採否の決定と PR 公開は既存の明示的な手順に従う。',
    ], boundaries: [...limitations, 'Only the already selected PREPARABLE candidate is handed off; the bridge does not create a second work slot.'] };
  return { schema_version: 1, ...STAMP, state: 'READY', packet };
}
