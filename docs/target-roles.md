# 志望トラックと証跡の対応

## 優先順位

| 優先 | 志望領域 | 想定する入口業務 | 提示する証拠 | 次に必要な実測 |
| --- | --- | --- | --- | --- |
| 1 | Linux サーバー構築・運用 | OS 初期設定、ミドルウェア配備、試験、手順・パラメータ更新 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、[使い捨て Ubuntu 24.04 の Full-stack E2E（23/23 ID PASS）](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) | Docker 未導入の独立した対象ホストでの新規構築、network / UFW・再起動後・受け入れ確認 |
| 2 | インフラ監視・運用 | 監視確認、一次切り分け、障害対応、定型作業 | Prometheus / Grafana / Loki（実データ表示済み）、local webhook の FIRING / RESOLVED、ランブック、[障害ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting)（PASS） | Alertmanager → Slack の実配信記録 |
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
- 2026-08-22 の Full-stack E2E では、runtime 最終 commit `7622a9d`を使い捨て Ubuntu 24.04 上で検証しました。`site.yml` 一括適用、2 回目 `changed=0`、計 11 containers、Docker API proxy の GET 成功・POST 拒否・Loki log 到達、network / UFW、local webhook 通知、D-1 RTO 1 秒、3 volumes の backup / restore を実測し、23/23 ID PASS でした。
- Linux (WSL2) 上の監視スタック起動、2026-08-19 の D-1 RTO 13 秒、二セグメント障害ラボ、4 ロールの full Molecule も実測履歴として保持しています。
- local webhook の FIRING / RESOLVED は Slack 実配信ではなく、runner 内の network / UFW は独立した管理端末・引き渡し対象ホストの証跡ではありません。
- Slack 実配信、D-2、AWS `apply / destroy`、Docker 未導入の独立対象ホスト、ホスト再起動後の永続性、長期稼働は未実測です。
- 計画や資格数を増やすより、既存の一構成を新規構築し、試験し、壊して直した証跡を優先します。

## 関連ドキュメント

- [採用ご担当者さま向け 1 ページ版](./overview-for-recruiters.md)
- [職務経歴書・スキルシート](./resume.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [プロフィール README](../README.md)
