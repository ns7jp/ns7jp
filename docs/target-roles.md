# 志望トラックと証跡の対応

第一志望は **Linux サーバー設計・構築**で、すべての応募先で主作品の [server](https://github.com/ns7jp/server) を最初に提示します。成果物やコードがある状態を **実装済み**、日付・環境・commit SHA を含む結果がある状態を **実測済み**、実行ログがない状態を **未実施（NOT RUN）** と表記します。

## 優先順位

このページで挙げる 9 月の Windows Server / AD と Ubuntu の記録は、AI の支援（手順の案内など）を受けながら私が手元の Hyper-V 上の VM を操作し、結果を画面で確認したものです。

| 優先 | 志望領域 | 想定する入口業務 | 提示する証拠 | 次に必要な実測 |
| --- | --- | --- | --- | --- |
| 1 | Linux サーバー構築・運用 | OS 初期設定、ミドルウェア配備、試験、手順・パラメータ更新 | [9/7〜8 の Ubuntu Server 初期構築（手元の VM・手作業）](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md)、[構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package)、[使い捨て Ubuntu 24.04 の Full-stack E2E（試験項目 23 件中 23 件合格）](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)、[AlmaLinux / Rocky 9 対応 role](https://github.com/ns7jp/server/tree/main/ansible/roles/common)、[LVM storage role](https://github.com/ns7jp/server/tree/main/ansible/roles/storage) | Docker 未導入の独立した対象ホストでの新規構築、新規AlmaLinux VMでの最小公開と監視全体（site.yml）の適用、network / UFW・再起動後・受け入れ確認 |
| 1b | Windows Server / AD 構築・運用 | DC・メンバーサーバーの構築、DNS・GPO・バックアップ / 復元、手順書・試験 | [AD 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-ad) と [9 月の実測記録](../README.md#主な実測結果)（AD 構築の必須 31 項目 PASS、System State 復元、2 台目の DC、FSMO 役割の奪取。WSUS の構築は判定 FAIL で、原因を特定） | 実クライアント PC を含むドメイン参加・GPO 適用、永続ホストでの長期稼働 |
| 2 | インフラ監視・運用 | 監視確認、一次切り分け、障害対応、定型作業 | Prometheus / Grafana / Loki（実データ表示済み）、local webhook の FIRING / RESOLVED、ランブック、[障害ラボ](https://github.com/ns7jp/server/tree/main/labs/network-troubleshooting)（PASS） | Alertmanager → Slack の実配信記録 |
| 2b | データセンター現地オペレーター | 入退室管理、ラックマウント、ケーブル配線、資産棚卸し、一次切り分け（オンサイト） | 物流現場での重量物取扱い・現物管理実績、[現場経験とインフラの橋渡し §2.8](./career-bridge.md#28-現物スキルの転用物流現場--データセンター現地作業デスクワーク適応) | ラックマウント・ケーブル配線の実技（**未着手**） |
| 3 | IT サポート・社内 SE 補助 | 問い合わせ、キッティング、棚卸し | [AD の構築・試験の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md)（必須 31 項目 PASS）、[作業結果・引き渡し報告](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md)（障害・課題 15 件の対処）、[ドメイン参加時の名前解決障害の対処](./resume.md#取り組み事例-ad-ドメイン参加時の名前解決障害2026-08)（トライアル就業の研修） | 実クライアント PC でのログオン・GPO 適用の切り分け記録 |
| 3b | コールセンター型ヘルプデスク | 電話・チャットでの一次受付、切り分け、エスカレーション記録 | 現場での「困りごとを数値化し上長へ報告」した経験（[業務改善レポート](./business-improvement/picking-improvement.md)） | 想定問答・エスカレーション記録の練習（**未着手**） |
| 発展 | Cloud / IaC | Terraform の修正・レビュー、構築補助 | AWS Terraform modules、AWS / cost / backup 設計 | `plan / apply / destroy`、費用、復元 |
| 発展 | アプリ基盤 / DB | 3 層構成の構築補助、復元試験 | [Web / AP / DB 3 層ラボ](https://github.com/ns7jp/server/tree/main/labs/three-tier)、`pg_dump` / `pg_restore` 演習 | 実 VM 上での 3 層構築、DB 復元の実行証跡 |

## 応募先別の最短導線

| 応募先 | 最初に見せるもの | 面接で実演するもの |
| --- | --- | --- |
| サーバー構築 | [構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package) | Ansible の check / apply / 2 回目の冪等性、試験結果 |
| インフラ運用・監視 | [server](https://github.com/ns7jp/server) | Grafana → alert → logs → recovery |
| ネットワークを含む運用 | [L2 / L3 切り分けラボ](https://github.com/ns7jp/server/tree/main/labs/routing) | 静的ルート、`ip_forward`、VLAN ID 不一致の切り分け |
| RHEL 系が主な現場 | [AlmaLinux / Rocky 9 対応 role](https://github.com/ns7jp/server/tree/main/ansible/roles/common) | `dnf` / firewalld / SELinux の差分と、[Molecule `el9` シナリオの実行証跡](https://github.com/ns7jp/server/actions/runs/32811100007) |
| Windows Server / AD が中心の現場 | [AD 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-ad) と [作業結果・引き渡し報告（SM-AD-001）](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md) | System State 復元の流れと、GPO による設定の上書きを切り分けた説明 |
| IT サポート・社内 SE | [AD の構築・試験の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md)と[ドメイン参加時の名前解決障害の対処](./resume.md#取り組み事例-ad-ドメイン参加時の名前解決障害2026-08) | トライアル就業の研修で遭遇したドメイン参加の失敗（DNS の向き先の誤り）を例にした、確認順と記録方法 |

## 現時点の境界

実務でのサーバー構築・大規模インフラ運用経験はこれからです。
`server` は単一ホスト中心の学習ラボで、本番冗長化の実績ではありません。

試験項目ごとの結果は[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)にまとめています。特にご注意いただきたい区別は次のとおりです。

- 使い捨て runner 内の結果は、独立した管理端末・引き渡し対象ホストの証跡ではありません
- local webhook の通知試験は Slack 実配信ではありません
- AlmaLinux は[2026-09-04の再利用VMで基盤設定とDocker導入を確認](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md)しています。新規VMでの最小公開と、監視全体の `site.yml` 適用は未実施です
- 障害対応演習 B-1〜B-4（LVM の拡張、3 層構成の切り分け、DB の復元、L2 / L3 の切り分け）は **AI 支援セッションの作業環境（私の VM ではありません）での実行**で、自分の環境ではまだ再実行していません（実行環境は[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)に明記）
- Windows Server / AD は、手元の Hyper-V 上で DC 2 台と WSUS サーバーまでを構築・試験しました。組織の DNS、実クライアント PC を含むドメイン環境、永続ホストでの 24 / 72 時間稼働、サイト間複製、電源断からの復旧は、まだ確認していません

## AI 支援の範囲と、自分で書いた部分

文書だけでなく実装コードの生成にも AI を使っています（[内訳](../README.md#3-つの前提ai-の利用を含む)）。
**その中で、実機を触って外した仮説の一次記録
[LEARNINGS.md](../LEARNINGS.md) は、2026-08-25 以降、新規エントリを私だけが書く
運用にしています**（それ以前のエントリに AI の代筆が含まれる経緯は
[職務経歴書](./resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)に書いています）。面接では、成果物の網羅性より
こちらを起点にご質問いただくのが、現在地を正確にお伝えする近道だと考えています。

計画や資格数を増やすより、既存の一構成を新規構築し、試験し、壊して直した証跡を優先します。

## 関連ドキュメント

- [採用ご担当者さま向け 1 ページ版](./overview-for-recruiters.md)
- [職務経歴書・スキルシート](./resume.md)
- [プロフィール README](../README.md)
