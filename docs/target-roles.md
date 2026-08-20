# 志望トラックと証跡の対応

## 優先順位

| 優先 | 志望領域 | 想定する入口業務 | 提示する証拠 | 次に必要な実測 |
| --- | --- | --- | --- | --- |
| 1 | Linux サーバー構築・運用 | OS 初期設定、ミドルウェア配備、試験、手順・パラメータ更新 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、Ansible（4 ロール冪等性確認済み）、Compose | `site.yml` を通した Ubuntu 新規構築、結合試験の実行ログ |
| 2 | インフラ監視・運用 | 監視確認、一次切り分け、障害対応、定型作業 | Prometheus / Grafana / Loki（実データ表示済み）、ランブック、[障害ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting)（PASS） | Alertmanager → Slack の実配信記録 |
| 3 | IT サポート・社内 SE 補助 | 問い合わせ、キッティング、棚卸し、FAQ 更新 | [FAQ](./it-support/faq.md)、[アカウント管理](./it-support/account-management.md)（**設計サンプル。実務対応実績ではありません**） | 実機出力を添えた Windows / network 切り分け記録 |
| 発展 | Cloud / IaC | Terraform の修正・レビュー、構築補助 | AWS Terraform modules、AWS / cost / backup 設計 | `plan / apply / destroy`、費用、復元 |

## 応募先別の最短導線

| 応募先 | 最初に見せるもの | 面接で実演するもの |
| --- | --- | --- |
| サーバー構築 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package) | Ansible の check / apply / 2 回目の冪等性、試験結果 |
| インフラ運用・監視 | [server-monitor](https://github.com/ns7jp/server-monitor) | Grafana → alert → logs → recovery |
| ネットワークを含む運用 | [二セグメント障害ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting) | 正常 → 通信断 → 経路・名前解決確認 → 復旧 |
| IT サポート・社内 SE | [IT サポート資料](./it-support/faq.md) | 問い合わせの再現条件、影響範囲、確認順、記録方法 |

## 現時点の境界

- 実務でのサーバー構築・大規模インフラ運用経験はこれからです。
- `server-monitor` は単一ホスト中心の学習ラボで、本番冗長化の実績ではありません。
- Linux host、AWS、D-1 / D-2、full Molecule は、実行結果を採録するまで設計・コード・手順実装済みとして扱います。
- 計画や資格数を増やすより、既存の一構成を新規構築し、試験し、壊して直した証跡を優先します。
