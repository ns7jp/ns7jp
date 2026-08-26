# 志望トラックと証跡の対応

## 優先順位

| 優先 | 志望領域 | 想定する入口業務 | 提示する証拠 | 次に必要な実測 |
| --- | --- | --- | --- | --- |
| 1 | Linux サーバー構築・運用 | OS 初期設定、ミドルウェア配備、試験、手順・パラメータ更新 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、[使い捨て Ubuntu 24.04 の Full-stack E2E（試験項目 23 件中 23 件合格）](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)、[AlmaLinux / Rocky 9 対応 role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/common)、[LVM storage role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/storage) | Docker 未導入の独立した対象ホストでの新規構築、AlmaLinux 実機への適用、network / UFW・再起動後・受け入れ確認 |
| 2 | インフラ監視・運用 | 監視確認、一次切り分け、障害対応、定型作業 | Prometheus / Grafana / Loki（実データ表示済み）、local webhook の FIRING / RESOLVED、ランブック、[障害ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting)（PASS） | Alertmanager → Slack の実配信記録 |
| 3 | IT サポート・社内 SE 補助 | 問い合わせ、キッティング、棚卸し、FAQ 更新 | [FAQ](./it-support/faq.md)、[アカウント管理](./it-support/account-management.md)（**設計サンプル。実務対応実績ではありません**） | 実機出力を添えた Windows / network 切り分け記録 |
| 発展 | Cloud / IaC | Terraform の修正・レビュー、構築補助 | AWS Terraform modules、AWS / cost / backup 設計 | `plan / apply / destroy`、費用、復元 |
| 発展 | アプリ基盤 / DB | 3 層構成の構築補助、復元試験 | [Web / AP / DB 3 層ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/three-tier)、`pg_dump` / `pg_restore` 演習 | 実 VM 上での 3 層構築、DB 復元の実行証跡 |

## 応募先別の最短導線

| 応募先 | 最初に見せるもの | 面接で実演するもの |
| --- | --- | --- |
| サーバー構築 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package) | Ansible の check / apply / 2 回目の冪等性、試験結果 |
| インフラ運用・監視 | [server-monitor](https://github.com/ns7jp/server-monitor) | Grafana → alert → logs → recovery |
| ネットワークを含む運用 | [L2 / L3 切り分けラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/routing) | 静的ルート、`ip_forward`、VLAN ID 不一致の切り分け |
| RHEL 系が主な現場 | [AlmaLinux / Rocky 9 対応 role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/common) | `dnf` / firewalld / SELinux の差分と、[Molecule `el9` シナリオの実行証跡](https://github.com/ns7jp/server-monitor/actions/runs/32811100007) |
| IT サポート・社内 SE | [IT サポート資料](./it-support/faq.md) | 問い合わせの再現条件、影響範囲、確認順、記録方法 |

## 現時点の境界

実務でのサーバー構築・大規模インフラ運用経験はこれからです。
`server-monitor` は単一ホスト中心の学習ラボで、本番冗長化の実績ではありません。

**どの試験項目がどこまで実測済みかは
[検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
に 1 か所へまとめています。** この文書では繰り返さず、そちらを正本とします。

特に注意していただきたい区別:

- 使い捨て runner 内の結果は、独立した管理端末・引き渡し対象ホストの証跡ではありません
- local webhook の通知試験は Slack 実配信ではありません
- role として実装済みでも、実機で適用していなければ実績としません（AlmaLinux 対応が該当）
- B-1〜B-4 の演習は **AI 支援セッションの作業環境上での実行**で、独立した物理／VPS ホストや
  手元 WSL2 での再実行証跡ではありません（[README](../README.md#手を動かして実演できること2026-08-24-に実行採録)に実行環境を明記）

## AI 支援の範囲と、本人が書いた部分

文書だけでなく実装コードの生成にも AI を使っています（[内訳](../README.md#ai-の利用について)）。
**その中で、実機を触って外した仮説の一次記録
[LEARNINGS.md](../LEARNINGS.md) は、2026-08-25 以降、新規エントリを本人のみが書く
運用にしています**（それ以前の各エントリで AI がどこまで下書きしたかは
[README](../README.md#詰まった記録)参照）。面接では、成果物の網羅性より
こちらを起点にご質問いただくのが、現在地を正確にお伝えする近道だと考えています。

計画や資格数を増やすより、既存の一構成を新規構築し、試験し、壊して直した証跡を優先します。

## 関連ドキュメント

- [採用ご担当者さま向け 1 ページ版](./overview-for-recruiters.md)
- [職務経歴書・スキルシート](./resume.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [プロフィール README](../README.md)
