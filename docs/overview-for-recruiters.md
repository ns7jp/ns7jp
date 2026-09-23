# 採用ご担当者さまへ — 島田則幸

## 30 秒の結論

第一志望は **Linux サーバー設計・構築**です。**Windows Server / Active Directory（AD）** の構築にも対応します。主作品 **[サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)** で、小さな Web アプリの稼働環境、異常を調べる監視、復旧手順をコードと文書にしています。

2026 年 9 月には、手元の Hyper-V（Windows の仮想化機能）上の仮想マシン（VM）で、次のことを行いました。

- **Windows Server 2022 で AD を構築**し、試験仕様書の必須 31 項目がすべて PASS しました。ドメインコントローラー（DC）を 2 台にして複製を確かめ、バックアップからの復元と、1 台を失った想定での FSMO 役割（特定の DC だけが担う管理役割）の奪取まで行いました。
- ドメインに参加させた **WSUS（更新配信サーバー）** を構築しました。判定は FAIL でしたが、残った 2 件の原因を翌日に特定し、手順書を直しました。
- **Ubuntu Server を初期構築**し（固定 IP・SSH 鍵認証・UFW・時刻同期・自動更新）、わざと起こした設定不備から復旧しました。同じ VM で、監視の停止・復帰の表示、ログの復元、アプリの自動再起動も確かめました。

> 個人の学習記録で、AI の支援（手順の案内など）を受けながら私が操作しました。前提と未実施の範囲は[正直な境界](#正直な境界)にまとめています。

| [主作品 `server`](https://github.com/ns7jp/server) | [最新の実測](#実測したこと) | [職務経歴書](./resume.md) |
| --- | --- | --- |
| 構成、コード、実行方法を確認 | 9 月に手元の VM で構築・試験・復旧した内容を確認 | これまでの経験、希望条件、AI 支援の範囲を確認 |

[案件概要（1 枚）](https://ns7jp.github.io/project-brief.html) ／ [2 分 15 秒デモ（保存済み画面の証跡リプレイ）](https://ns7jp.github.io/demo.html) ／ [詰まった記録](../LEARNINGS.md)

## 構築工程と証拠

| 工程 | 成果物・実行内容 | 状態 |
| --- | --- | --- |
| 要件・設計 | 要件定義、基本・詳細設計、パラメータシート、ネットワーク設計（Linux・AD・WSUS） | **実装済み**（文書を作成） |
| 構築・試験（Windows Server / AD） | AD の構築と必須 31 項目、2 台目の DC と複製、WSUS の構築（判定 FAIL）と原因特定 | **手元の VM で実測済み**（9/1〜8） |
| 復旧（Windows Server / AD） | System State からの復元、DC 1 台の停止と復帰、FSMO 役割の奪取 | **手元の VM で実測済み**（9/2〜4） |
| 構築・試験（Linux） | Ubuntu の初期構築、Ubuntu / 再利用 AlmaLinux への Ansible 基礎設定（2 回目の変更 0 件） | **手元の VM で実測済み**（9/4、9/7〜8） |
| 監視・復旧（Linux） | 停止・復帰の表示、Loki の別ボリュームへの復元、アプリ自動再起動（演習 D-1）での HTTP 復帰 | **手元の VM で個別に実測済み**（9/8） |
| 変更 | Git SHA を固定した配備と旧版へのロールバック | **実測済み**（CI の使い捨て環境、8/23） |
| 性能 | 段階負荷の実行と、HTTP エラーを含めた結果評価 | [旧集計の漏れ](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-performance-ci-analysis.md)を見つけて修正。[接続再利用を加えた比較](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-upstream-keepalive-comparison.md)では、2 回の CI で失敗 0 件（9/17。AI による分析・改善で、CI の使い捨て環境での短時間の測定） |
| 障害対応 | 手順書 5 本に対応する障害注入演習（プロセス停止・ディスク逼迫・メモリ圧迫・遅延・通知経路断） | **実装済み**。D-1 のみ実測済み |
| 引き渡し | 作業結果報告書、チェックリスト、受け入れ手順 | **実装済み**（[AD の作業結果・引き渡し報告](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md)。引き渡し先は自分で、ラボ検証の完了まで） |

**実装済み**は成果物・コードがある状態、**実測済み**は結果の記録がある状態、**未実施（NOT RUN）**は実行結果がない状態です。判定の正本は [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) です。

## 志望と現況

製造・物流の現場で 15 年以上続けてきた「測る・原因を絞る・手順化する・定着させる」を、サーバーの構築・運用に生かすエンジニア志望です。

**就業状況**: 人材派遣会社（アデコ株式会社）を通じた IT 企業でのトライアル就業（2026/07〜、Windows / Linux サーバー構築と AWS / Azure 構築の研修）は、2026-09-15 に終了しました。現在は求職中で、すぐに勤務を開始できます。就業先の社名は面談時に開示します。

| 項目 | 内容 |
| --- | --- |
| 勤務地 | 東京都内通勤可能圏 |
| 夜勤・交代制 | 24/365 監視業務のシフト勤務に対応可能 |
| 勤務開始時期 | すぐに勤務を開始できます |

雇用形態・英語力・運転免許などの条件は、[職務経歴書・スキルシート](./resume.md#3-希望条件働き方)または応募書類・面談時にお伝えします。

**Windows Server / AD の構築・運用**と、入口としてのインフラ監視・運用にも対応します。応募先によっては、IT サポート・社内 SE 補助も担当できます。

## 実測したこと

### Windows Server / AD（2026-09-01〜08）

Windows Server 2022 評価版の VM で、AI の手順案内を受けながら私が操作し、結果を画面で確認しました。

| 日付・記録 | 確認した結果 |
| --- | --- |
| 9/1〜2 [AD の構築・試験](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md) | `ad-dc01` に AD DS（ドメインの認証基盤）を構築し、試験仕様書のフェーズ 1 必須 31 項目がすべて PASS（ネットワーク 9 項目の詳細は[実機検証の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-network-host-validation-ad.md)）。手順書・設計書の欠陥 6 件を実機で見つけて修正 |
| 9/2 [System State の復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-ad-restore-drill.md) | バックアップ後に作った目印の OU が、復元で消えることを確認し PASS。復元処理 15 分 29 秒、復旧全体は約 40 分（うち約 18 分は `safeboot` 解除漏れによるやり直し） |
| 9/2 [作業結果・引き渡し報告](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md) | 試験 32 件中 PASS 31・BLOCKED 1 を集計。作業中の障害・課題 15 件の原因と対処を記録 |
| 9/3 [2 台目の DC と複製](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-second-dc-replication.md) | `repadmin /replsummary` の失敗 0/5、複製の遅延 17.8 秒。GPO（グループポリシー）が 2 台目に適用されない原因を、前日の復元で欠けた `gpt.ini` と特定して修復 |
| 9/3 [DC 1 台の計画停止](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-dc-outage-drill.md) | 停止中も残りの DC で DNS・LDAP・Kerberos・新規オブジェクト作成が継続。復帰後のサービス復旧 4 分 51 秒、完全な収束 18 分 31 秒（強制再同期が必要） |
| 9/4 [FSMO 役割の奪取](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ad-fsmo-seize.md) | 正常停止した DC を復旧不能と想定し、残りの DC で役割を奪取。`ntdsutil` で古い DC の情報を削除し、単一 DC で DNS・LDAP・Kerberos が正常 |
| 9/7 [WSUS の構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-07-wsus-build-validation.md) | ドメインに参加させた更新配信サーバーを構築。必須 28 項目中 26 PASS・1 FAIL・1 期待結果未達で、判定は FAIL。GPO の適用と[ネットワーク実機検証](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-07-network-host-validation-wsus.md) 9 項目は PASS |
| 9/8 [WSUS の原因特定](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md) | 残った 2 件の原因を実機で特定し、手順書を修正。FAIL の真因は、承認ルールの分類・製品が 0 件で保存され、「絞り込みなし」と解釈されたこと（通しの再試験は未実施） |

設計書・手順書・試験仕様書は [AD 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-ad)と [WSUS 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-wsus)にあります。

### 2026-09-07〜08 の Ubuntu VM での記録

対象は Hyper-V 上の Ubuntu Server 24.04.4 LTS の VM `lab-base01` です。AI の手順案内を受けながら私が操作し、結果の画像を残しました。9/8 の 3 件は、構成を切り替えた別々の演習です。

| 日付・記録 | 確認した結果 |
| --- | --- |
| 9/7〜8 [初期構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md) | 固定 IP、SSH 鍵認証（パスワード方式と root ログインは拒否）、sudo、UFW（SSH は 192.168.56.0/24 からのみ許可）、時刻同期、自動更新を手作業で設定。わざと起こした設定不備を、拒否の表示とサーバーのログを照合して復旧。教材 21 項目の判定は PASS 14 / 環境に合わせて変更し PASS 4 / 一部確認 2 / 未実施 1 |
| 9/8 [数値監視](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md) | 5 サービスの部分構成で、手動の停止・再開に合わせて Grafana の収集状態が 1→0→1 |
| 9/8 [Loki 復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md) | 同じ VM 内の別ボリュームに復元し、過去の目印付きログ 2 件を再取得 |
| 9/8 [アプリ自動再起動 D-1](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-d1-practice.md) | app / nginx 構成で再起動回数 0→1、HTTP 復帰 2 秒（1 回の計測）、その後 healthy を確認 |

9/9〜15 の Ansible と Git の小さな練習は、[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)に並べています。

### 2026-09-04 の基礎設定の実測

Ansible（サーバー設定の自動化ツール）で、手元の VM 2 台に OS の共通設定を適用しました。こちらも AI の手順案内を受けながら私が操作しています。

| 日付・記録 | 確認した結果 |
| --- | --- |
| 9/4 [Ubuntu / Hyper-V](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-build.md) | `foundation.yml`（OS の共通設定と Docker）を適用し、再実行で変更 0 件（監視ラボ全体の `site.yml` とは別） |
| 9/4 [AlmaLinux / Hyper-V](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md) | 再利用の VM へ同じ基礎設定を適用し、SELinux 設定の欠陥を修正。再実行で変更 0 件 |

### 2026 年 8 月の CI・WSL2 での記録

以下は当時のコード版・環境での記録で、上の 9 月の記録とは合算しません。

| 検証 | 結果 |
| --- | --- |
| 8/22 Full-stack E2E | [Docker 導入済みの使い捨て Ubuntu runner で `site.yml` 適用、2 回目変更 0 件、監視・network / UFW・backup / restore を含む 23/23 PASS](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| 8/23 変更・ロールバック | [PR ブランチの使い捨て runner で候補 `84e1492` → 旧版 `59aa88e` の配備・復帰、稼働版とハッシュ等を確認](./evidence/2026-08-23-server-monitor-git-rollback-ci.md) |
| 8/18〜19 WSL2 上の監視・復旧 | [Grafana / Loki の表示](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-08-18-local-observability.md)、[D-1 の HTTP 復帰 13 秒](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-19-D-1.md) |

Linux 側の設計、パラメータ、構築、試験、変更、引き渡しの成果物は、[案件概要](https://ns7jp.github.io/project-brief.html)と [Linux サーバー構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package)にあります。

## 追加の実測演習

2026-08-24 の次の演習は、**AI 支援セッションが自身の作業環境（私の VM ではありません）で実行したもの**です。B-1 は仮想ディスク（loop device）付き Ubuntu ゲスト、B-2 / B-3 は Docker コンテナ、B-4 は network namespace を使いました。

| 演習 | 実演内容 | 所要 | 結果 |
| --- | --- | --- | --- |
| B-1 | LVM で VG / LV を作り、容量を使い切らせ、PV を足して online 拡張する | 10 分 | [5 PASS](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-1.md) |
| B-2 | Web / AP / DB の 3 層構成で、どの層が原因かを層別 health から絞り込む | 10 分 | [9 PASS](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-2.md) |
| B-3 | `pg_dump` / `pg_restore` で復元し、RTO / RPO と内容ハッシュを突き合わせる | 10 分 | [7 PASS](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-3.md)（RTO 0.149 秒） |
| B-4 | 静的ルート、`ip_forward`、VLAN ID 不一致の 3 パターンを切り分ける | 10 分 | [6 PASS / 3 SKIP-ENV](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-4.md) |

[8 月 25 日の AlmaLinux / Rocky 9 向け Molecule](https://github.com/ns7jp/server/actions/runs/32811100007) もコンテナでの検証で、9/4 の AlmaLinux VM の記録とは別です。

## 入社後に任せやすいこと

| 領域 | 最初に貢献できること |
| --- | --- |
| Linux サーバー構築 | 手順に沿った設定、チェックリスト確認、単体試験、パラメータ・手順書更新。Ubuntu / RHEL 系の差分、ディスク（LVM）設計 |
| Windows Server / AD | 手順書に沿った DC・メンバーサーバーの構築、バックアップ・復元の確認、GPO・DNS の一次切り分け |
| インフラ運用 | アラート確認、コマンドとログによる一次切り分け（L2 / L3 / 層別 health）、エスカレーション |
| 自動化補助 | Ansible / shell / Python の小さな定型作業、CI の結果確認 |
| IT サポート | 再現条件と影響範囲の整理、キッティング、FAQ・台帳整備 |

## 現場経験とのつながり

物流現場では、1 週間の作業を 15 分単位で計測し、棚配置・動線・補充ルールを改善して、1 日あたり約 1 時間の作業時間短縮につなげました。さらに OJT 用マップとチェックリストを作り、改善が元へ戻りにくい形にしました。

サーバー構築でも、作って終わりではなく、設定値、試験結果、監視、復旧手順を残して、他の人が同じ品質で扱える状態を目指します。

## 正直な境界

このページの前提と、まだ確認していないことを、この節にまとめます。

サーバー構築・運用の実務経験はまだありません（トライアル就業では研修を受けました）。このページの結果は、CI の使い捨て環境、WSL2、AI 支援セッションの作業環境、手元の Hyper-V VM での個別の記録です。記録した時点・環境での結果で、本番環境での保証値ではありません。**コードや設計書があること**と**実際に動かして結果を残したこと**は、[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)で区別しています。実行ログが無い項目は、実績として書きません。

まだ実測していない主なものは次のとおりです。

- **Linux**: 監視ラボ全体を独立した引き渡し先ホストへ構築すること、ホスト再起動後の確認、別の新規 VM への復元、専用の新規 AlmaLinux VM での監視全体の `site.yml` 適用と最小公開の確認
- **Windows Server / AD**（検証は DC 2 台と WSUS サーバーまで）: 組織の DNS や実際のクライアント PC を含むドメイン環境、中央 Prometheus からの収集（BLOCKED）、サイト間複製、電源断からの復旧、WSUS の通しの再試験
- **共通**: 24 / 72 時間の連続稼働、Slack への実際の通知、AWS の `apply / destroy`、障害復旧演習の D-2 と D-6〜D-9、自分の環境での負荷試験、第三者による手順の確認

性能試験では、旧集計が HTTP 502（並列 4 で 39.15%、並列 8 で 1.96%）を失敗率から除いていたことを、9/17 に AI 支援で見つけました。修正前の数値は、性能の根拠には使いません。分析と原資料は[結果票](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-performance-ci-analysis.md)にあります。

**AI を使わずに再現した記録は、まだ 1 件もありません。** そのため「AI なしでどこまでできるか」は、今の資料からは読み取れません。最初の一件として、[元ログ 5 件のハッシュ照合と、自分の学びを一件書くこと](./portfolio-explanation.md#8-次に残す一件と自分の学び)に取り組みます。条件とテンプレートは[独力再現ガイド](https://github.com/ns7jp/server/blob/main/docs/independent-rerun-guide.md)に用意しました。

AI は文書だけでなく、実装コード（Ansible role、Terraform module、CI workflow、テスト、ラボ）の生成にも使っています。範囲の詳細は[職務経歴書・スキルシート §4-b](./resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)に書きました。

実機で外した仮説は、2026-08-25 から [LEARNINGS.md](../LEARNINGS.md) に私だけが書いています。技術的な深さより、この記録のほうが私の現在地を正確に伝えると考えています。ただし、**記録は 2026-08 のエントリで止まっていて、9 月分はまだ書けていません。**

## 経歴・学習

- 2026/07〜2026-09-15（終了）: 人材派遣会社（アデコ株式会社）を通じた IT 企業でのトライアル就業。Windows / Linux サーバー構築と AWS / Azure 構築の研修を受けました（就業先の社名は面談時に開示します）
- 製造・物流業務 15 年以上
- 中部大学 応用生物学部 応用生物化学科 卒業
- 公共職業訓練「情報処理（Python エンジニア）コース」修了（2025 年 10 月〜2026 年 1 月）
- Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級
- IT パスポート（2026-06 取得）／基本情報技術者（2026 Q4 受験予定）／LPIC-1 学習中

## 詳細

- [職務経歴書・スキルシート](./resume.md)
- [詰まった記録（実機で外した仮説の一次記録）](../LEARNINGS.md)
- [志望トラックと証跡](./target-roles.md)
- [現場経験とインフラの橋渡し](./career-bridge.md)
- [プロフィール README](../README.md)
- [ポートフォリオサイト](https://ns7jp.github.io/)
