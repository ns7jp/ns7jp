# 接続とCLIの使い方

[入口](README.md) / [選択の規則](design.md) / [本人用の記録](templates.md)

## 1. 実行場所と前提

Node.js 22以上、`ns7jp/ns7jp` のルートで実行します。追加パッケージ、ネットワーク、AI APIキーは不要です。
既存の私用キャリア設定 `.local/engineer-career/profile.json` を読みます。
このCodexタスクでは週10時間の設定を作成済みです。既存の設定を再初期化して消す必要はありません。

```text
node tools/portfolio-audit/scripts/growth.mjs --help
node tools/portfolio-audit/scripts/growth.mjs check
node tools/portfolio-audit/scripts/growth.mjs bind-slot evidence-map
node tools/portfolio-audit/scripts/growth.mjs plan
```

`evidence-map` はこの計画での証拠整理の行動IDです。別の行動を使うときは、本人が学習の内訳を許可する行動IDに置き換えます。
bind-slotは枠の接続設定だけを保存し、careerやSEの正本を変更しません。
行動の目的・時間・完了条件等が変わると `ACTION_CHANGED_REBIND_REQUIRED` になり、確認するまで0分です。

## 2. 本人の台帳を接続する

career profileの `connections.learner_id` に、既にある本人用SE台帳のIDを指定します。
この版は同じリポジトリの `.local/server-engineer/<ID>/progress.json` を読みます。
別の作業場所に正本がある場合は、その場所・記録・添付を確認して明示的な移行を検討します。IDだけ同じ空台帳を作って代用しません。

まだ台帳がない場合だけ、[既存SEの操作手順](../server-engineer/tracker-guide.md)で空の本人用台帳を作ります。
最初はNOT RUNです。過去の著者や他者のPASSをコピーしません。
IDが未接続の場合は接続確認を候補にし、本人の能力の判定は行いません。

## 3. 保存物

| ファイル | 内容 |
| --- | --- |
| `.local/autonomous-growth/settings.json` | 明示したcareer行動IDと意味の署名 |
| `.local/autonomous-growth/followups.json` | 本人の再説明と実際の評価依頼への参照 |
| `.local/autonomous-growth/records/` | 本人の補助記録 |
| `.local/autonomous-growth/plans/<日時>/` | 候補JSONとMarkdown。実施実績ではない |
| `.local/autonomous-growth/latest.json` | 最新計画への参照、通知の差分 |
| `.local/autonomous-growth/plan.lock` | 同時実行の防止 |

全て私用領域です。Gitから除外されますが、暗号化や他組織の情報を持ち出す許可を提供するものではありません。
技能・実機出力・人の評価は既存SEに保存し、ここへ同じ合否台帳を作りません。

## 4. 再説明の記録

[空の補助記録](../../tools/portfolio-audit/growth.followups.example.json)を私用のfollowups.jsonへコピーして使えます。
`learner_id` は接続した本人IDと一致させます。未接続・空の場合はnullと空配列のままにします。

recallsへ記入する各項目は次です。これは記入仕様であり、実施済みの例ではありません。

| 項目 | 内容 |
| --- | --- |
| `id` | 一回の記録のUUID v4。既存の記録IDを再利用しない |
| `attempt_id` | 再説明の基点となる、実在するSEのPASS試行ID |
| `interval_days` | 1、7、28のいずれか |
| `performed_at` | 実際に再説明したUTC時刻。元の期日より前や未来は不可 |
| `result` | EXPLAINED、GAP、BLOCKED |
| `assistance` | guided、ai、independent。実際に受けた支援 |
| `record_ref` | `.local/autonomous-growth/records/` 内の非空の本人記録 |
| `record_sha256` | record-hashで確認した本文のSHA-256 |

UUIDが必要な場合は `node -e "console.log(require('node:crypto').randomUUID())"` で新規採番できます。
この採番は実施した証明ではありません。
実際の記録ファイルを保存した後、ハッシュだけを確認できます。

```text
node tools/portfolio-audit/scripts/growth.mjs record-hash .local/autonomous-growth/records/recall-actual.md
```

ファイル名は本人が保存した実際のものに置き換えます。存在しない記録を生成して埋めるコマンドではありません。
ハッシュはUTF-8本文（先頭BOMを除く）に対して計算します。同じrecord-hashを使って取得してください。
本文が変われば不一致を検出します。過去記録の修正理由や前版を保全し、内容を再確認して更新します。

同じUTC日に複数の間隔を独力完了とする記録は拒否します。
同じ間隔の再試行は別ID・実時刻・記録で追記し、最新の観察が次の提案に使われます。
再説明のGAPやBLOCKEDで、元のSE PASSを自動変更しません。

## 5. 実際の評価依頼を参照する

review_requestsの各記録は、`id`、`stage_id`、`attempt_ids`、`requested_at`、`next_check_at`、
`record_ref`、`record_sha256` を持ちます。
attempt_idsは当該段階の4条件の順に実在試行IDを並べます。依頼時刻はその試行の登録後です。
本人が実際に依頼した記録を付け、次回確認は依頼以降の時刻にします。

新しい試行へ差し替えた場合、過去の依頼は履歴として保持します。
元の4試行IDと異なる新しい提出に、過去の依頼・承認を自動で流用しません。
この補助記録へ依頼を書いても、SEの段階PASSにはなりません。

## 6. 結果と停止条件

- `check`：入力と接続の整合性を確認する。技能の合格確認ではない。
- `plan`：学習候補と時間内訳を私用領域に保存する。正本と候補行動は変更しない。
- `notify=false`：前回と意味のある提案差がない。実施不要という意味ではない。
- 終了コード2：入力・証跡・接続・ロック等の異常。成功扱いにしない。
- `NOT_BOUND`：学習枠をまだ明示していない。勝手に他の技術行動を使わない。
- `NO_TECHNICAL_SLOT`：指定した行動が今週の選択にない。時間を増やさず配分を確認する。

入力・SE正本・補助記録の原文が処理中に変わった場合は保存前に止めます。
古い計画を新しいlatestへ上書きしません。ロックが残ったら実行中か確認し、終了済みの当該ロックだけを除去します。
再確認日・本人の支援量・試行IDを結果が良くなるように書き換える対処はしません。

このCLIにBXの自動評価、実機操作、応募・依頼送信、公開、学習モデルの学習処理はありません。
Codexは同じ月曜の既存運用で準備と改善を進め、本人の実践・説明・人の評価へつなぎます。
