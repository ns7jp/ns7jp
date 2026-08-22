# 島田則幸 (Noriyuki Shimada)

## サーバー設計・構築エンジニア志望

主作品の **[Server Monitor Infrastructure Lab](https://github.com/ns7jp/server-monitor)** は、Ubuntu 向け構成を Ansible で管理し、Linux 上で監視スタック 9 サービスの稼働と、障害注入後 13 秒での自動復旧を実測したインフラ構築ラボです。

## 30 秒で確認する 3 点

| [2 分 15 秒デモ（証跡リプレイ）](https://ns7jp.github.io/demo.html) | [構成図](./docs/architecture-diagram.md) | [実測証跡](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md) |
| --- | --- | --- |
| 保存済み実測画面と復旧ログを時系列で確認 | 実装済み構成と実測・未実測の境界 | 日時、環境、commit、コマンド、結果 |

## 志望と現況

製造・物流の現場で 15 年以上続けてきた「計測する・原因を絞る・手順化する・改善を定着させる」を、サーバーの構築・監視・障害対応に生かします。

**現況（2026-08）**: 派遣社員としてトライアル就業中です。第一志望は **サーバー設計・構築**、入口業務としてインフラ監視・運用、IT サポート、社内 SE 補助にも対応します。

採用ご担当者さま向けの要約は [1 ページ版](./docs/overview-for-recruiters.md)、経歴とスキルは [職務経歴書・スキルシート](./docs/resume.md) にまとめています。

## 実測できていること

| 実施した検証 | 結果・証跡 |
| --- | --- |
| Ansible 4 ロールを Linux 上で適用し、2 回目の冪等性と期待状態を確認 | [`molecule test` 4 ロール PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)。途中で静的検査では見つからなかった欠陥 2 件を修正 |
| 監視スタック 9 サービスを Linux (WSL2) 上で起動 | [Grafana の実データ表示、Loki のログ取得を確認](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| app プロセスを意図的に停止し、自動復旧を計測 | [D-1 復旧演習 PASS、RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) |
| client → proxy → app の二セグメント構成で通信断を注入 | [障害再現 → 経路・名前解決の切り分け → 復旧まで PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-network-drill.md) |

一方、**Alertmanager → Slack の実配信、D-2 復旧演習、`site.yml` を通した新規構築、AWS の `apply / destroy` は未実測**です。[試験結果票](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-build-validation.md)も 21 項目中 11 項目が PASS、10 項目が `NOT RUN` のため、現時点では「構築完了」と判定していません。

## 主作品の読み方

この README では、実機で確認した結果と未実施項目を中心に示します。設計、構築、試験、変更、引き渡しまでの成果物一覧は [Linux サーバー構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、実装・CI・実測の境界は [構成図](./docs/architecture-diagram.md) と [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) にまとめています。

使用技術の一覧、資格、他の学習作品は [職務経歴書・スキルシート](./docs/resume.md)、未着手を含む学習計画は [STATUS](./STATUS.md) に分離しています。README の項目数を増やすより、主作品で実際に構築・検証・復旧した結果を優先して更新します。

## AI の利用について

文書の構成・整形・調査、コードレビュー、リンクや表記の確認には AI 支援を使っています。AI が生成した手順や説明を、本人が実行・理解していない状態で実績にはしません。

本人が実機を操作し、仮説を外した経緯も含めて記録したものが [学習の一次記録（つまずきログ）](./LEARNINGS.md) と [server-monitor の証跡](https://github.com/ns7jp/server-monitor/tree/main/docs/evidence) です。たとえば、UFW の競合、Molecule 上の systemd に対する誤診、`docker kill` と再起動ポリシーの違いを、症状 → 原因 → 対処 → 学びの順で残しています。技術選定の最終判断、実機操作、結果の採録、機密情報のマスク、面接での説明は本人が担当します。

## 現場経験から生かせること

物流現場では作業時間を 15 分単位で計測し、棚配置・補充ルール・OJT 用マップを改善して、1 日あたり約 1 時間の作業時間短縮につなげました。この経験を、metrics / logs に基づく切り分け、構築手順とランブックの標準化、変更後の確認に生かします。

詳細：[業務改善レポート](./docs/business-improvement/picking-improvement.md) ／ [現場経験とインフラの橋渡し](./docs/career-bridge.md)

## 経歴・資格・その他の作品

Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級、IT パスポートを取得し、基本情報技術者を学習中です。技術ごとの習熟度、職歴、他の作品は [職務経歴書・スキルシート](./docs/resume.md)、応募先ごとの提示順は [志望トラックと証跡](./docs/target-roles.md) を参照してください。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
