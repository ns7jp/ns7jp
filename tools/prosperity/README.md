# 自律繁栄の詳細な価値レビュー（任意）

通常の負荷確認と成果比較は[既存の自律繁栄システム](../../docs/autonomous-prosperity/README.md)と `portfolio-loop` にあります。この補助CLIは、原期限・再計画理由・実験内訳まで管理したい場合に使います。既存の週次入力を読み取り、休止や縮小希望をこの台帳のnormalで解除しません。同一成果を二重登録せず、通常の成果は既存索引、詳細な観察の計画はこの台帳に置きます。

[全体の入口](../../docs/prosperity-review/README.md) / [運用](../../docs/prosperity-review/operation.md) / [記録票](../../docs/prosperity-review/templates.md) / [検証](../../docs/prosperity-review/validation.md)

Node.js 22以上、標準モジュールだけで動くローカルCLIです。既存の `portfolio-loop` が収集・計画した結果と、本人の負荷・運用価値の観察を読み、**一件の次の行動、待機、停止、見直し**を示します。GitHubの収集は既存ループに委ねます。この評価器にネットワーク・AI API・公開・外部送信・実機操作の機能はありません。

## 1. 最初に試す

リポジトリのルートで実行します。

```powershell
node --test tools/prosperity/tests/*.test.mjs
node tools/prosperity/prosperity.mjs demo
```

`demo` はOSの一時ディレクトリに未採用の雛形を作り、入力不足を `UNKNOWN` と示す例です。実績のあるデータを演出するデモではありません。`--root` が付いていてもデモは一時ディレクトリだけを使い、保存結果にも `demo: true` と `synthetic: true` が付きます。

## 2. 実運用へ接続する

既存の私用台帳がある場合は、その正本を持つリポジトリを使います。作業コピーへむやみに個人情報を複製したり、空の雛形で既存台帳を置き換えたりしません。別の正本ルートを使う場合は、各コマンドに `--root "C:\path with spaces\ns7jp"` を付けます。

まだ台帳がない場合は、既存キャリアの[初期化手順](../../docs/engineer-career/tool-guide.md)で今の条件を確認します。以下の `init 10` は、週10時間という既存選択を本人が現在も使う場合の操作です。

```powershell
node tools/portfolio-loop/loop.mjs init 10
node tools/portfolio-loop/loop.mjs check-in normal
node tools/portfolio-loop/loop.mjs run
node tools/prosperity/prosperity.mjs init
node tools/prosperity/prosperity.mjs review
```

初回の繁栄台帳は、確認日時・負荷・実績・測定値が未入力です。`review` で `UNKNOWN` になるのは、入力不足を正しく表示した結果です。[ledger.example.json](ledger.example.json)と同じ形式の `.local/prosperity/ledger.json` を本人の記録に従って編集します。

以後は上流の `run` で情報と計画を更新し、繁栄の `review` で評価します。上流の終了コード2は停止、3は収集不全です。収集に失敗しても前回の成功を今日の成功へ読み替えません。

## 3. コマンドと保存先

| コマンド | 動作 | 書き込み |
| --- | --- | --- |
| `init` | 未確認・未採用の雛形を作る。既存があれば拒否 | `.local/prosperity/ledger.json` |
| `review` | 現在の入力を評価し、一件と理由を保存 | `.local/prosperity/latest.json`、`report.md`、`history/<時刻>-<ID>.json` |
| `status` | 現在の入力を再評価して表示 | なし |
| `demo` | 未入力時の動作を一時ディレクトリで示す | 隔離した一時ディレクトリ |

`--json` は機械可読の出力です。`init` は常にJSONです。`status` は現在の入力を読み直すため、前回reviewから入力や鮮度が変わっていれば表示も変わります。通知履歴を確定するのは `review` です。

終了コード0は処理完了です。JSONの `state: UNKNOWN` や `STOP` も処理結果なので0です。入力引数の不正、書き込みロック、壊れた前回結果など処理そのものを完了できない場合は2です。**終了コードだけで続行・合格を決めず、state・next_action・reasonsを読みます。**

## 4. 読み取りの正本と鮮度

| 入力 | 確認すること |
| --- | --- |
| `.local/portfolio-loop/latest.json` | schema、LIVEであること、取得完了、エラー、共通枠、次の行動 |
| 同ループの `runs/.../summary.json` | ポインターとの版・時刻・取得状態の一致、実際の観測日時 |
| `.local/engineer-career/profile.json` | 週の総時間、負荷モード、既約束、行動ID |
| `.local/autonomous-prosperity/review.json` | 既存check-inの負荷・7日以内の確認・成果索引を既存の検査関数で確認 |
| 同careerの `latest.json` と `plans/.../plan.json` | 計画と現在profileの対応、余白・分数・選択行動 |
| 上流のロックと監査 `pending.json` | 前回の正常結果の後に始まった処理・レビュー待ち |

GitHub観測と計画の上限は24時間、本人の全体条件の確認は28日、週の負荷確認は7日です。評価時刻だけを新しくして古い観測を有効にしません。未来時刻・収集不全・合成データ・再生データは実運用の正常根拠にできません。

`verified_at` は、入力範囲の検査を満たした上流の観測日時です。本人の成果確認日時ではありません。検査できない回では前回値を保持し、初回で未確認ならnullです。

## 5. 私用台帳の記入

JSONに説明用の余分なキーを追加すると拒否します。文章での詳しい背景は[記録票](../../docs/prosperity-review/templates.md)へ書き、台帳は以下の仕様を守ります。日時はUTCのISO形式（例 `2026-09-10T00:00:00.000Z`）で記録します。記入例の日付を本人確認日に転記しません。

| 項目 | 入れるもの |
| --- | --- |
| `owner_confirmed_at` | 本人が目的・時間上限・運用条件を確認した日時。未確認はnull |
| `weekly_budget_minutes` | 繁栄側が使える上限。0〜600分で、careerの総枠以下 |
| `baseline.confirmed_at` | 対象週の実施分と負荷を本人が確認した日時 |
| `baseline.weekly_actual_minutes` | 直近1週間の全対象活動の実施分。未計測はnull、測って0なら0 |
| `baseline.load` | `normal`、`high`、`paused`、未確認はnull |
| `experiments` | 最大30件の運用価値の観察。技術比較のINV台帳を複製しない |

各実験は[雛形](ledger.example.json)のキーをすべて持ちます。

| 実験項目 | 入れるもの |
| --- | --- |
| `id` / `title` | 安定したIDと、誰の何を確かめるか |
| `action_id` | 既存careerで実際に選ばれた親行動ID。例 `evidence-map` |
| `status` | `PROPOSED`、`ACTIVE`、`AWAITING_DECISION`、`ADOPTED`、`REJECTED`、`PARKED` |
| `adopted_at` | この観察を始めると本人が決めた日時。成功した日時ではない |
| `original_due_at` | 初めに決めた見直し期限。初回記録後は同じIDで変更不可 |
| `due_at` | 次に見直す日時。初回はoriginal_due_atと同じ |
| `reschedule_reason` | 次回期限を変える場合の本人の理由。原期限を残す |
| `resume_condition` | 保留から再開する条件。PARKEDでは必須 |
| `planned_minutes` / `actual_minutes` | 親行動の内訳の予定分・実施分。実施未計測はnull |
| `metric` | `name`、`unit`、`baseline`、`target`、`actual`、`direction`。方向はincreaseまたはdecrease |
| `evidence` | 下記の証拠参照。証拠なしはnull |
| `decision` / `notes` | 本人のADOPT・ITERATE・REJECT・PARKと理由。通常の未採否はnull |

`ACTIVE` と `AWAITING_DECISION` の合計は最大1件です。`ADOPTED`にはADOPT、REJECTEDにはREJECT、PARKEDにはPARKと理由が必要です。ITERATEは理由付きACTIVEとして扱います。CLIは本人に代わって採否・状態・日付を書き換えません。

時間は `既存計画の分数 + 既約束 + 既存の余白` を確認し、実験の予定分をその上へ加算しません。実験分は親行動内の明細です。親行動から外れた場合、内訳が親行動の分数を超えた場合、週全体の実施分を超えた場合は見直します。

## 6. 実測を記録するJSON

証拠は `.local/prosperity/evidence/` 配下のJSONです。以下は**形式説明用の架空値**で、実運用へそのまま入れません。`metric` の6項目は台帳と一致する必要があります。日時・方法・値は本人の実際の記録へ置き換えます。

```json
{
  "schema_version": 1,
  "experiment_id": "P-001",
  "action_id": "evidence-map",
  "data_kind": "measured",
  "recorded_by": "owner",
  "method": "形式説明用。実運用では対象・試行数・条件・計測方法・元記録の場所を記す",
  "period_start": "2026-09-10T00:00:00.000Z",
  "period_end": "2026-09-10T00:10:00.000Z",
  "observed_at": "2026-09-10T00:12:00.000Z",
  "metric": {
    "name": "本人が記録を読み次の一手を決めるまでの時間",
    "unit": "minutes",
    "baseline": 20,
    "target": 10,
    "actual": 8,
    "direction": "decrease"
  }
}
```

本人が実測ファイルを確定したら、PowerShellでハッシュを確認します。

```powershell
(Get-FileHash -Algorithm SHA256 -LiteralPath '.local/prosperity/evidence/P-001.json').Hash.ToLowerInvariant()
```

台帳の `evidence` には `path`、`sha256`（上で求めた64桁）、`data_kind`、`observed_at` を持たせます。`path` は `.local/prosperity/evidence/P-001.json` など、証拠配下の相対パスです。リンク経由の参照や範囲外への参照は拒否します。

内容のID・本人記録の区分・測定期間・指標・ハッシュを確認した場合だけ、`REFERENCE_VERIFIED` と `RECORDED_MEASUREMENT` になります。`verified_actual` はその一致確認を通った申告値です。本人の申告が現実と一致することや因果的な効果まで検証した意味ではありません。

## 7. 判断順序と出力

1. 上流の実行ロックがある場合は、その終了確認を先にします。
2. 入力破損・会計不整合を解消します。
3. 上流の緊急確認・修正案レビューを優先します。
4. 高負荷・上限超過・進行中件数・親行動の割当を確認します。
5. 欠測・鮮度・未来日・合成データ・証拠不足を確認します。
6. 共通作業枠が占有されていれば新規観察を進めません。
7. 採用済み一件を継続するか、測定後・期限到来の本人レビューへ進みます。
8. 進行中がなければ、未採用案の本人レビューを一件だけ示します。

| 出力 | 意味 |
| --- | --- |
| `state` | UNKNOWN / STOP / IN_PROGRESS / WAITING_FOR_OWNER / NO_ACTION |
| `next_action` | 一件の行動。指示文を自動でシェル実行することはない |
| `reasons` | 一件を選んだ理由と、併存する未解決事項 |
| `capacity` | 上限、既存割当、実験内訳、実際の週総分数 |
| `metrics.measurement_rate` | ACTIVE・AWAITING_DECISION・ADOPTEDのうち証拠照合済みの割合。分母0はnull |
| `metrics.income` / `causal_success` | 常にUNKNOWN。収入や因果を別指標から推定しない |
| `notify` | 前回保存結果と意味のある差があるか。実際の通知送信はしない |

日数の経過だけでは再通知しません。鮮度切れ・期限到来による行動変化・証拠ハッシュ変更・負荷変更などは意味のある差です。原期限の超過日数は表示を続けます。停止理由が複数あっても、次の一手は一件です。

## 8. 停止・復旧と限界

`review.lock` がある場合、CLIは上書きや自動削除をしません。実行プロセスが終了していることと前回の履歴を確認し、そのロックだけを扱います。壊れた `latest.json` は履歴と照合して復元するまで保持します。Git管理外の私用台帳は、別途バックアップと復元確認が必要です。

読み取り直後に入力ハッシュを再確認し、処理中に変わった入力を検出した場合は保存を止めます。上流の正本や技能判定は書き換えません。レポートは補助的な評価であり、本人の記録の真実性、雇用・技能・仕事の承認を認定しません。

指標の増減差と目標到達は表示しますが、比較対象の妥当性、試行数、交絡、品質条件、長期の維持コストは[実験手順](../../docs/prosperity-review/experiments.md)を使って内容を確認します。
