# 志望トラックと証跡の対応

本ポートフォリオは「何でもできます」と広げるのではなく、第一志望を
**インフラ運用 / 監視運用** に置き、IT サポート・社内 SE 補助を入口業務として
接続する方針で整理しています。

---

## 優先順位

| 優先 | トラック | 狙う業務 | 現在の証拠 | 追加する証跡 |
| --- | --- | --- | --- | --- |
| 1 | インフラ運用 / 監視運用 | Linux サーバー監視、障害一次対応、運用手順整備 | [server-monitor](https://github.com/ns7jp/server-monitor)、ランブック、SLO、Alertmanager | Grafana 実画面、Slack 通知、D-1 復旧演習ログ |
| 2 | IT サポート / 社内 SE 補助 | 問い合わせ切り分け、FAQ、キッティング、棚卸し | [FAQ](./it-support/faq.md)、[アカウント管理](./it-support/account-management.md)、[Service Desk メトリクス](./it-support/service-desk-metrics.md) | PowerShell 実行ログ、ミニ AD / M365 ラボ、ネットワーク調査メモ |
| 3 | クラウド / IaC 発展 | Terraform、AWS 検証、費用管理、バックアップ | Terraform AWS 構成、Cost / Backup / Security 設計 | `terraform apply` / `destroy`、Cost Explorer 実費、AWS Backup 検証 |

---

## 応募先に合わせた見せ方

| 応募先 | 最初に見せるもの | 補足で見せるもの |
| --- | --- | --- |
| インフラ運用 | [server-monitor](https://github.com/ns7jp/server-monitor)、[検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md) | [アーキテクチャ図](./architecture-diagram.md)、[ADR](./adr/README.md)、[学習の一次記録](../LEARNINGS.md) |
| ヘルプデスク / 社内 SE | [採用ご担当者さまへ](./overview-for-recruiters.md)、[IT サポート資料](./it-support/faq.md) | [現場経験との橋渡し](./career-bridge.md)、[業務改善レポート](./business-improvement/picking-improvement.md) |
| クラウド運用補助 | [server-monitor Terraform](https://github.com/ns7jp/server-monitor/tree/main/terraform)、[AWS 設計](https://github.com/ns7jp/server-monitor/blob/main/docs/aws-architecture.md) | [コスト計画](https://github.com/ns7jp/server-monitor/blob/main/docs/cost-report.md)、[外部 probe / 中央 telemetry](https://github.com/ns7jp/server-monitor/blob/main/docs/external-probe-central-telemetry.md) |

---

## 現時点の正直な境界

- 実務での大規模インフラ運用経験はこれからです。
- `server-monitor` は単一ホスト中心の学習ラボであり、本番冗長化の実績ではありません。
- AWS、D-2 復元、full Molecule は、実行結果を採録するまで「設計・コード実装済み」として扱います。
- 社内 SE / Windows 系は設計資料が中心です。応募比率に応じて、PowerShell / AD / M365 の最小証跡を追加します。

---

## 次に増やす証跡

1. ローカル Linux + Docker で Grafana / Loki / Alertmanager の実画面を採録する。
2. D-1 プロセス停止演習を実行し、検知から復旧までの実測時間を記録する。
3. `molecule test` の full 実行結果を採録する。
4. 応募先に社内 SE が多い場合、PowerShell 実行ログを 1 本追加する。
