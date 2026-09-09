# CLIの使い方と入力仕様

## 準備

実行場所は `ns7jp/ns7jp` の取得先ルート。Node.js 22以上、追加パッケージ不要です。
WindowsでもLinuxでも判定CLIは動く設計です。今回の実行確認環境は[検証記録](validation.md)にあります。
実機操作やGitHub書き込みをするCLIではありません。

通常の週次運用は[発火点の探索と学習](discovery.md)のcycleを使います。
ここでは、その下流で共用するplan/register/evaluateの契約を説明します。

```text
node --test tools/server-innovation/tests/*.test.mjs
node tools/server-innovation/demo.mjs .local/innovation-demo
```

期待出力は `decision: DEMO_ONLY`。生成先に計画、環境、6試行の合成ログ、結果、判定が入ります。
既に同名の保存先がある場合は上書きせず終了2です。新しい保存先を指定してください。

## 1. 既存の監査で最新情報を取得する

```text
node tools/portfolio-audit/scripts/cycle.mjs tools/portfolio-audit/live.config.json .local/portfolio-operations
```

発火点探索も行うときは、上の設定パスを `tools/server-innovation/discovery.config.json` に置き換えて一度だけ収集します。
拡張snapshotは元の監査にも利用できます。

既存の週次運用では、その運用が既に使っている保存先を指定します。
結果の `report` と同じディレクトリに `snapshot.json` があります。
公開GitHub APIへのGETはこの既存収集器だけで行い、planは保存済みの取得結果を読みます。
収集不全・API制限は古い値で埋めず、取得不明として扱います。

## 2. 作業枠contextを確認して作る

ファイルの例は[context.example.json](../../tools/server-innovation/context.example.json)です。
例の時刻は固定なので、そのまま未来の週次実行に使いません。
以下の項目を実際のpending・採否記録と照合して、私用の `work-context.json` に保存します。

```json
{
  "schema_version": 1,
  "reviewed_at": "2026-09-09T01:15:00Z",
  "occupied": true,
  "closed": []
}
```

`occupied` は既存の共通作業枠にレビュー待ち・実行中の一件があるかです。
未確認ならtrue。空いていると実際に確認した場合だけfalseにします。
`closed` は採否記録に基づく候補除外IDの配列です。単に古い候補を消す目的では使いません。
CLIは確認から24時間を超えたcontext、未来の時刻、未知のID・項目を拒否します。

## 3. 改善キューを作る

`SNAPSHOT.json` と `WORK-CONTEXT.json` は、実際のファイルパスに置き換えます。

```text
node tools/server-innovation/innovation.mjs plan SNAPSHOT.json WORK-CONTEXT.json .local/server-innovation
```

動的カタログを直接planで再評価する場合は、末尾に `CATALOG.json tools/server-innovation/discovery.config.json` を付けます。
通常のdiscovery cycleはこの接続を内部で行います。動的候補は `INV-` と16桁hexのIDを持ち、原本hashが変われば再確認対象です。

出力の `selected` は準備する候補ID、`report` は詳細、`notify` は意味のある変化の有無です。
時刻や無関係なHEADの更新だけでは再通知しません。
選択は実験実行の許可ではなく、週次Codexが一件の根拠調査・実装準備へ進む提案です。

| キュー状態 | 意味 | 次の一手 |
| --- | --- | --- |
| PREPARABLE | 取得範囲で準備条件を満たす | 後続の実測記録とコードを読み一件を準備 |
| NEEDS_REFRESH | 収集が古い・不完全 | 同じ既存収集器で再取得 |
| SOURCE_REVIEW | 指定の根拠位置が欠落・重複 | 出典を読み、仮説や探索位置をレビュー |
| EXISTING_PR_REVIEW | 変更予定パスがopen PRと競合 | 既存PRの状態と目的を確認 |
| CI_REVIEW | 当該HEADのCI未観測・未成功 | 該当runを確認。実機の失敗と断定しない |
| CLOSED_BY_RECORD | 採否記録に基づき除外 | 再開条件が生じたら記録して見直す |

初めての意味のある候補には `runs/<ID>/protocol.draft.json` ができます。
同じ提案の次回実行は新しい実験票を量産しません。既存の実験票を進めます。

## 4. 比較条件を実験前に登録する

DRAFTの `NOT SET` を実際の条件で埋めます。
`baseline_sha` と `candidate_sha` は異なる完全SHAが必要です。
手順だけを変える比較でも、それぞれの手順を保存したコミットを使います。

環境条件ファイル `context.json` を実験専用ディレクトリに置きます。
OS・CPU/RAM・初期状態・負荷・対象データ・依存版・計測法・支援量・リセット方法を記録し、
ファイルそのもののSHA-256を `context_sha256` に入れます。

PowerShellの確認例です。表示される値はファイルのハッシュだけです。

```powershell
(Get-FileHash -Algorithm SHA256 .local/experiment-001/context.json).Hash.ToLowerInvariant()
```

3〜10組の予定試行数、主指標、改善目標、最悪値の許容悪化率、機能等のguardrailsを決めます。
guardrailは `id`、`operator`（eq/lte/gte）、`target`（数値）の3項目です。
0/1の意味を計画のscopeや補足文書に具体化し、実行後に基準を弱めません。

```text
node tools/server-innovation/innovation.mjs register DRAFT.json REGISTERED.json
```

期待出力はREGISTEREDと `protocol_sha256`。登録済みファイルの上書きは拒否されます。
このSHA-256をresultsに転記します。登録後の条件変更は別ファイル・別計画へ分けます。
discoveryの結果学習では、候補のrepository・hypothesis・changeと指標の名前/単位/向きが登録計画に一致する必要があります。
仮説そのものを変える場合は、独自提案として新しい候補を作ります。基点は同じ原本を収集で確認したSHAから選びます。
JSONの登録ファイルは結果と結ぶための形式であり、実験の実施許可書や改変不能な時刻証明ではありません。

## 5. 全試行を記録する

resultsの最上位は次の4項目です。実例はデモが生成するresults.jsonで確認できます。

```json
{
  "schema_version": 1,
  "protocol_sha256": "登録時に表示された64桁のSHA-256",
  "data_kind": "measured",
  "runs": []
}
```

`measured` は実際の測定だけに使います。練習値は必ず `synthetic`。
デモのラベルをmeasuredに変えて実績を作らないでください。

| 各runの項目 | 型と意味 |
| --- | --- |
| pair | 1から登録した組数までの整数。各組に旧・新一つずつ |
| variant | baseline / candidate |
| revision | そのvariantに登録された完全SHA |
| environment_id / context_sha256 | 登録計画と一致する環境IDと環境条件ハッシュ |
| started_at / finished_at | 時差付き日時。登録後、終了は開始以降かつ未来でない |
| status | PASS / FAIL / NOT_RUN / SKIP_ENV |
| value | 主指標の非負数。未実施はnull |
| guardrails | 登録済みのIDすべてに数値を記録。未確認はnull |
| artifact | 実行済みなら証拠の相対pathとsha256。未実施はnull |

PASSでは主指標・guardrails・証拠をすべて要求します。
FAILの試行にもその失敗が分かる証拠が必要です。未実施の値を0に置き換えません。
同じ組の重複、別SHA、別環境、証拠の使い回し、登録前や未来の測定、完了した全試行の時刻重複を拒否します。
比較は同じ環境で直列に実施する設計です。A/Bの実施順やリセットの実施内容は人が原本で確認します。

artifact.pathは証拠ディレクトリからの相対パスです。
絶対パス、`..`、ディレクトリ外へ出るリンクは拒否し、実ファイルのハッシュを確認します。
証拠本文から任意の指標を抽出・再計算する機能はありません。値と原本の意味の対応はレビュー対象です。

## 6. 評価する

```text
node tools/server-innovation/innovation.mjs evaluate REGISTERED.json RESULTS.json EVIDENCE_DIR
```

| 判定 | 意味 |
| --- | --- |
| PROMISING | 全試行が揃い、今回の比較で目標を満たし悪化なし。採用・再確認の候補 |
| ITERATE | 改善目標未達。結果を保持し次の仮説へ |
| REJECT | 実行失敗、機能等の悪化、最悪値の許容超過 |
| NOT_READY | 予定試行が揃わない、未実施・環境制約あり |
| INCONCLUSIVE | 旧中央値0で相対改善を判定できない |
| DEMO_ONLY | 合成値の練習結果。実績として採用不可 |

全ての判定に `authorization: NONE` と `publication_allowed: false` が付いています。
不正な入力や改変された証拠は通常の判定を返さず、終了2で拒否します。

結果を次の探索へ戻す場合は `discovery.mjs feedback STATE_DIR REGISTERED.json RESULTS.json EVIDENCE_DIR` を使います。
合成データは実際の学習台帳へ投入できません。同じ結果は一度だけ取り込み、実行失敗を含む終了結果を書き換えて再学習させません。

## 終了コードと困ったとき

| 終了コード | plan | evaluate |
| --- | --- | --- |
| 0 | 設定範囲の処理完了。候補なしも含む | PROMISING。ただし公開・実機・技能の合格ではない |
| 3 | 収集不全・古い観測 | PROMISING以外。失敗・未準備・デモを本文で区別 |
| 2 | 入力、状態、ロック、ファイル等が不正 | 入力、来歴、証拠等が不正 |

registerとdemoは正常0、不正2です。
`Context manifest hash mismatch` なら実際に使った条件ファイルと登録時のハッシュを確認します。
`Protocol digest mismatch` なら登録計画とresultsの対応を確認し、都合よくハッシュだけ更新しません。
`EEXIST` は既存ファイルまたはロックがある状態です。保存済み結果を消さず、対象を確認します。
`SOURCE_REVIEW` なら正本の構造や後続記録を読み、必要なカタログ変更とテストを用意します。

## 拡張する場合

新しい仮説は、既存8件と同じ形式でcatalogへ追加できます。
value・learning・時間・指標・対象パスを検証し、対応する出典と異常系の試験を用意します。
合格条件や証拠の検証を弱めて既存の結果をPROMISINGにする変更は行いません。
測定値を自動採録するadapterは将来の独立した変更です。対象環境・計測区間・秘密値・異常時を確認してから追加します。
