# 参考資料と設計の位置付け

[案件運用の入口](README.md)

2026-09-05に次の公式資料を確認しました。8工程24条件、役割名、WIP2件、朝15分・夕方10分・週末30分などは、この教材の初期運用設計です。公的な認定基準、契約上の義務、すべての職場に共通する標準値ではありません。

| 公式資料 | 参照した考え方 | この仕組みでの利用 |
| --- | --- | --- |
| [Google SRE Workbook: Incident Response](https://sre.google/workbook/incident-response/) | 指揮、操作、連絡の役割と時系列の記録 | 障害時の役割と復旧判断 |
| [Google SRE Workbook: Canarying Releases](https://sre.google/workbook/canarying-releases/) | 変更の影響を観測し段階的に評価する | 本番変更の観測・中止条件の設計。全構成へカナリア方式を必須にはしない |
| [GitHub Projects best practices](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects) | 仕事を分け、目的・状態・情報を揃える | 案件と作業の分離、状態・担当・期限の管理 |

これらを参照して本教材独自のSOPと様式へ組み立てました。公式資料がこのCLIや24条件の妥当性を検証したものではありません。

## 確認した既存資産

| 対象 | 確認した版 | 活用するもの |
| --- | --- | --- |
| ns7jp/ns7jp | `80fe4f707b16a8e96bc3af980e655d9bcf9e4420` | 育成システム、24週教材、証跡の境界、既存CI |
| ns7jp/server | `44c52e733826b9b5239918c05010b8b68b60346c` | 構築案件パック、技術手順と試験様式 |

既存構築案件パックの実測は記録された対象・日時・版の範囲です。新しい案件の合格条件を埋めるために転記しません。

## 公式資料の更新と業務条件

導入する製品のOS・バージョン・サポート条件は案件ごとに公式資料で確認します。契約、価格、税、請求、保存期限、保守範囲は、この教材では決定しません。担当者が確認した条件とその根拠を記録する欄を用意します。

公開リポジトリのIssueやProjectsを実案件の置き場所として新設していません。既存の許可された社内ツールを使う場合は、本教材のID・状態・担当・期限・証跡・承認対象版を対応付けます。
