# 志望トラックと証跡の対応

第一志望は **Linux サーバー設計・構築**で、すべての応募先で主作品の [server-monitor](https://github.com/ns7jp/server-monitor) を最初に提示します。成果物やコードがある状態を **実装済み**、日付・環境・commit SHA を含む結果がある状態を **実測済み**、実行ログがない状態を **未実施（NOT RUN）** と表記します。

## 優先順位

| 優先 | 志望領域 | 想定する入口業務 | 提示する証拠 | 次に必要な実測 |
| --- | --- | --- | --- | --- |
| 1 | Linux サーバー構築・運用 | OS 初期設定、ミドルウェア配備、試験、手順・パラメータ更新 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、[使い捨て Ubuntu 24.04 の Full-stack E2E（試験項目 23 件中 23 件合格）](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)、[AlmaLinux / Rocky 9 対応 role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/common)、[LVM storage role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/storage) | Docker 未導入の独立した対象ホストでの新規構築、AlmaLinux 実機への適用、network / UFW・再起動後・受け入れ確認 |
| 2 | インフラ監視・運用 | 監視確認、一次切り分け、障害対応、定型作業 | Prometheus / Grafana / Loki（実データ表示済み）、local webhook の FIRING / RESOLVED、ランブック、[障害ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting)（PASS） | Alertmanager → Slack の実配信記録 |
| 2b | データセンター現地オペレーター | 入退室管理、ラックマウント、ケーブル配線、資産棚卸し、一次切り分け（オンサイト） | 物流現場での重量物取扱い・現物管理実績、[現場経験とインフラの橋渡し §2.8](./career-bridge.md#28-現物スキルの転用物流現場--データセンター現地作業デスクワーク適応) | ラックマウント・ケーブル配線の実技（**未着手**） |
| 3 | IT サポート・社内 SE 補助 | 問い合わせ、キッティング、棚卸し | [AD 操作演習設計](./learning-plan/06-shell-scripting-exercise-design.md#44-level-4-active-directory-運用スクリプト)、[AD構築演習設計](./learning-plan/08-ad-exercise-design.md)、[Windows / AD 公開再現ラボ](./evidence/templates/windows-ad-lab.md)（**設計サンプル。実務対応実績ではありません**） | 実機出力を添えた Windows / AD 切り分け記録 |
| 3b | コールセンター型ヘルプデスク | 電話・チャットでの一次受付、切り分け、エスカレーション記録 | 現場での「困りごとを数値化し上長へ報告」した経験（[業務改善レポート](./business-improvement/picking-improvement.md)） | 想定問答・エスカレーション記録の練習（**未着手**） |
| 発展 | Cloud / IaC | Terraform の修正・レビュー、構築補助 | AWS Terraform modules、AWS / cost / backup 設計 | `plan / apply / destroy`、費用、復元 |
| 発展 | アプリ基盤 / DB | 3 層構成の構築補助、復元試験 | [Web / AP / DB 3 層ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/three-tier)、`pg_dump` / `pg_restore` 演習 | 実 VM 上での 3 層構築、DB 復元の実行証跡 |

## 応募先別の最短導線

| 応募先 | 最初に見せるもの | 面接で実演するもの |
| --- | --- | --- |
| サーバー構築 | [構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package) | Ansible の check / apply / 2 回目の冪等性、試験結果 |
| インフラ運用・監視 | [server-monitor](https://github.com/ns7jp/server-monitor) | Grafana → alert → logs → recovery |
| ネットワークを含む運用 | [L2 / L3 切り分けラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/routing) | 静的ルート、`ip_forward`、VLAN ID 不一致の切り分け |
| RHEL 系が主な現場 | [AlmaLinux / Rocky 9 対応 role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/common) | `dnf` / firewalld / SELinux の差分と、[Molecule `el9` シナリオの実行証跡](https://github.com/ns7jp/server-monitor/actions/runs/32811100007) |
| IT サポート・社内 SE | [AD 操作演習設計](./learning-plan/06-shell-scripting-exercise-design.md#44-level-4-active-directory-運用スクリプト) | 現職の Windows Server / AD 研修に基づく再現条件、確認順、記録方法 |

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
  手元 WSL2 での再実行証跡ではありません（[README](../README.md#主な実測結果)に実行環境を明記）

## AI 支援の範囲と、本人が書いた部分

文書だけでなく実装コードの生成にも AI を使っています（[内訳](../README.md#ai-の利用について)）。
**その中で、実機を触って外した仮説の一次記録
[LEARNINGS.md](../LEARNINGS.md) は、2026-08-25 以降、新規エントリを本人のみが書く
運用にしています**（それ以前の各エントリで AI がどこまで下書きしたかは
[README](../README.md#失敗から学んだこと)参照）。面接では、成果物の網羅性より
こちらを起点にご質問いただくのが、現在地を正確にお伝えする近道だと考えています。

計画や資格数を増やすより、既存の一構成を新規構築し、試験し、壊して直した証跡を優先します。

## 関連ドキュメント

- [採用ご担当者さま向け 1 ページ版](./overview-for-recruiters.md)
- [職務経歴書・スキルシート](./resume.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [プロフィール README](../README.md)
