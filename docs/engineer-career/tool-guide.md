# 私用キャリア計画CLIの使い方

[入口](README.md) / [運用](operation.md) / [記録票](templates.md)

## 1. 初期化と計画

Node.js 22以上を使い、ns7jpリポジトリのルートで実行します。追加パッケージとAI APIキーは不要です。

```text
node tools/portfolio-audit/scripts/career.mjs init 10
node tools/portfolio-audit/scripts/career.mjs check
node tools/portfolio-audit/scripts/career.mjs plan
```

`init 10` は合計週10時間の私用計画を新規作成します。既存ファイルは上書きしません。
`plan` は入力を変更せず、行動と時間の計画を生成します。コマンド自体にネットワーク・応募送信・GitHub公開・実機操作はありません。
終了コード0は処理完了、2は入力・ファイル・ロック等の異常です。採用・技能・業務承認の合格コードではありません。

## 2. 保存場所

| 保存物 | 場所 |
| --- | --- |
| 本人が確認した計画・機会 | `.local/engineer-career/profile.json` |
| 本人の完了・選考等の記録 | `.local/engineer-career/records/` |
| 過去の生成計画 | `.local/engineer-career/plans/<日時>/plan.json` と `plan.md` |
| 最新計画への参照と通知差分 | `.local/engineer-career/latest.json` |
| 重複実行のロック | `.local/engineer-career/plan.lock` |

既存の `.gitignore` で `.local/` は除外されています。Git除外だけで暗号化や組織情報の持ち出し許可になるわけではありません。
顧客名、社内構成、原本の職務資料は許可された社内保管先で管理します。

## 3. 本人が調整する項目

初期化後のprofile.jsonを、自分で確認した事実に合わせて編集してから `check` を実行します。
この版に対話フォームや自動の選考状態更新はありません。

| キー | 値・意味 |
| --- | --- |
| `weekly_minutes` | 週の合計上限。10時間は600。未設定はnullで、無制限にはならない |
| `load_mode` | normal、reduced、paused。縮小時は上限半分、休止時は新規割当0 |
| `commitments_minutes` | その週に既に約束した時間。全期間の残作業時間ではない |
| `phase` | job-search、onboarding、growth。活動計画の区分 |
| `phase_basis` | その区分を選んだ理由。雇用や評価を推測して書かない |
| `updated_at` | 本人が計画を確認したUTC日時。例は `2026-09-08T04:00:00Z` |
| `connections.learner_id` | 既にあるSE台帳の本人ID。接続しない場合はnull |
| `connections.project_board` | 既存PJ boardを読む場合だけtrue。正本側の記録は書き換えない |

`learner_id` を設定すると既存 `server-engineer.mjs report --json` 相当を読みます。
PJ接続は `server-projects.mjs board --json` 相当です。PJの全残時間を週の割当に自動変換しません。
これらの台帳が未作成なら、この接続のためだけに本人の試行や承認を作りません。

## 4. 行動を更新する

行動IDは小文字英数字・ハイフンで1〜64文字。数値型のIDや重複を拒否します。
minutesは見積で、priorityは1〜3。ownerはhuman/codex。Codexの行動は本人の時間配分へ混ぜず保留欄の別キューにします。
depends_onは先行行動のIDです。同じ週に選ばれただけでは完了したことになりません。

statusはBACKLOG、ACTIVE、BLOCKED、DONE、CANCELLEDです。
DONEには本人が実際に残した非空ファイルのevidence_refを付けます。
参照は `.local/engineer-career/records/実際の記録.md` のような私用の相対パスに限定します。
絶対パス、`..`、symlink/junctionは拒否します。空白だけの記録を完了根拠にできません。

行動DONEは「その行動について記録がある」という申告です。SEのPASS、応募済み、内定、入社を自動生成しません。
日時はdue_atへUTCの完全な時刻で保存します。未定はnull。期日を変更した理由は本人の記録票に残します。
大きな行動を分ける場合、done_whenも各小作業の実際の完了条件に合わせます。

## 5. 求人候補の入力例

次は書式例です。実在する応募や企業を示しません。架空例を本人の実績として登録しません。
実際に読んだ募集URLと日時に置き換え、opportunities配列へ追加します。

```json
{
  "id": "candidate-a",
  "source_url": "https://example.com/careers/example",
  "checked_at": "2026-09-08T04:00:00Z",
  "status": "DISCOVERED",
  "required_fit": "UNKNOWN",
  "next_check_at": null,
  "record_ref": null
}
```

source_urlはHTTPS、checked_atは実際の確認日時です。URL先の内容をCLIが自動取得する機能はありません。
Codexまたは本人が原本を読みます。SUBMITTED・INTERVIEW・OFFER・CLOSEDには本人の実記録へのrecord_refが必要です。
required_fitはUNKNOWN/MEETS/GAPで、単語の一致だけでMEETSとしません。
送信が必要な行動には機会IDを対応させ、requires_fresh_opportunityをtrueにします。これも送信許可ではありません。

## 6. 障害と再開

- 未設定の時間：本人の合計枠を確認する。nullを大きな数に置き換えて回避しない。
- 期限と容量の衝突：延期・分割・相談のどれを選ぶか本人が判断する。自動で約束を変更しない。
- 求人が古い／条件不明：原本と本人の条件を再確認してから更新する。
- SE/PJ読取不全：正本のcheck/reportで確認する。キャリア側で合格や証跡を作らない。
- profile更新中：古い入力で保存しない。更新完了後に同じplanを再実行する。
- ロックあり：別実行の終了を待つ。残留ならPIDと実行状況を確認し、終了済みの当該ファイルだけを除去する。
- JSON破損：直前の私用バックアップと本人記録を確認する。initで上書きしない。

同じ意味の結果ならnotify=falseです。新しい期日、保留、容量、選考状態等の変化は通知候補になります。
CLIがnotify=trueを返しても通知を送信する機能はなく、週次タスクが意味のある変化を本人へ報告します。
