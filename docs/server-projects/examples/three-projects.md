# 架空3案件を一週間へ配分する

[案件運用の入口](../README.md) / [日々の運営](../operations.md)

**このページは架空の計画例です。顧客、受注、承認、実施、工数、検収の実績ではありません。** 読むだけで台帳へPASSを転記しません。CLIのIDは小文字の `demo-a` などを使い、文書内のDEMO-Aと対応させます。

## 3件の依頼が重なった

| ID | 依頼 | 未確認のこと | 最初に残すもの |
| --- | --- | --- | --- |
| DEMO-A | 研修用監視VM1台の構築・引き渡し | 受領者、対象VM、バックアップと保守の条件 | 受付票、質問、担当判断 |
| DEMO-B | 研修用Webの証明書更新 | 対象名、期限、秘密鍵の保管、戻し方 | 対象確認、変更計画 |
| DEMO-C | 研修用バックアップの復元調査 | 保存対象、復元先、必要な整合性 | 調査範囲、復元試験の計画 |

受付時に『一台だからすぐできる』と納期を決めず、PJ00とPJ01で何を受け取れば完了かを揃えます。DEMO-Bは納期が近い想定でも、実際の証明書・期限がまだ不明なら未確認のままです。

## ローカルに未実施の3案件を作る

リポジトリのルートで、GitとNode.js 22以上が使えることを確認してから実行します。これらは空の演習台帳を作るだけで、サーバーを操作しません。

```powershell
node scripts/server-projects.mjs init --project demo-a --title "研修用監視VM1台" --owner learner --mode training --priority 2 --due 2026-09-30
node scripts/server-projects.mjs init --project demo-b --title "研修用Web証明書更新" --owner learner --mode training --priority 1 --due 2026-09-25
node scripts/server-projects.mjs init --project demo-c --title "研修用バックアップ復元調査" --owner learner --mode training --priority 3 --due 2026-10-09
node scripts/server-projects.mjs board --capacity 24 --wip-limit 2
```

上の日付は架空の予定です。演習開始時に自分の計画へ置き換えます。作成後に変更するなら `reschedule` で理由を残します。初期表示は全工程NOT RUN、作業0件です。同名の既存案件があれば上書きせず、reportで内容を確認します。

## まず受付の仕事を分ける

```powershell
node scripts/server-projects.mjs task-add --project demo-a --task intake-note --stage PJ00 --title "目的と対象を受付票へ記入" --owner learner --hours 1 --due 2026-09-10
node scripts/server-projects.mjs task-add --project demo-a --task scope-question --stage PJ00 --title "不足条件を質問票に整理" --owner learner --hours 1 --due 2026-09-11 --depends intake-note
node scripts/server-projects.mjs report --project demo-a
```

依存を付けた作業は、前提の作業を終える前に完了へ進めません。実施したら自分の出力と判断を保存し、[ツール操作](../tracker-guide.md)で作業完了と工程条件をそれぞれ記録します。テスト用の架空文字列を本番作業の証拠にはできません。

## 要件が揃った後の配分例

次の表は、各案件が必要な確認を進めた後に作った仮の週次計画です。上のinitコマンドを実行した直後の台帳結果ではありません。

| 案件 | 全期間の残時間 | 翌週の割当 | 翌週の出口 | 待ち・リスク |
| --- | --- | --- | --- | --- |
| DEMO-A | 30時間 | 12時間 | 設計案と試験仕様を技術確認へ出す | 対象VMと運用受領者の確定待ち |
| DEMO-B | 8時間 | 8時間 | 対象版の検証結果と変更承認を揃える | 作業窓・戻しの確認 |
| DEMO-C | 10時間 | 4時間 | 復元対象と比較条件を整理する | 復元データの提供待ち |
| 合計 | 48時間 | 24時間 | 予定作業枠24時間 | 別に割込みの余白を確保 |

主担当一人の想定で、午前はDEMO-B、午後はDEMO-Aのように枠を決めます。DEMO-Cの調査枠は先に2件の区切りを作ってから確保します。作業中を無制限に増やしません。特定の顧客や曜日への実約束ではありません。

## 途中で追加要求が来た

DEMO-AにDBの追加要求が来たとします。CHG-001を `PROPOSED` として受け、メモリー、保存、権限、復元、保守、工数と期限への影響を調べます。ここではまだ追加作業を始めません。

責任者が採用した事実が実際に得られた場合は、その根拠を保存し、PJ01から `invalidate` して要件・見積以降を見直します。承認が来ていなければ、採否待ちと次の確認日時を残します。CLIの旧工程承認が残っているだけでは変更後の案件を進められません。

## 回答が来ないとき

元の期限、回答期限、依存と影響を記録します。案件全体を止める場合は次のように理由を残せます。

```powershell
node scripts/server-projects.mjs hold --project demo-a --reason "演習: 対象VMの条件が未確定。次回の確認日時は受付票で管理"
node scripts/server-projects.mjs report --project demo-a
```

これは保留の操作例です。実際の回答がないのにresumeを記録しません。保留は成功終了と区別され、元の期限も消えません。

## 最後までの確認

DEMO-Aは、PJ03で本番前の検証と変更承認を揃え、PJ04で実行と事後試験、PJ05で受領者の操作と検収を確認します。演習では対象を『演習用の引き渡しVM』と明記し、本番経験へ読み替えません。

受領者がいない間はレビュー待ちです。PJ06は合意した保守期間の観測と運用移管、PJ07は残課題の受領、実績差、原本保管とアクセスの処置を確認します。必要条件や未完了作業が残っていれば、終結したことにはしません。

一巡後に、自分がかかった時間、想定外の質問、やり直した試験を振り返ります。次の案件では受付質問、見積幅、必須試験を改善します。未実施の項目は未実施として残します。
