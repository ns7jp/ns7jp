# 採用ご担当者さまへ — 島田則幸

## 30 秒の結論

第一志望は **Linux サーバー設計・構築**です。主作品 **[サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)** で、小さな Web アプリの稼働環境、異常を調べる監視、復旧手順をコードと文書にしています。**個人の学習・検証の成果物で、サーバー構築の実務経験とは区別します。**

**2026-09-11 時点の本人実績**: Hyper-V 上の Ubuntu VM で、9 月 8 日に数値監視の停止・復帰表示、Loki の同一 VM 内の別ボリュームへの復元、アプリ自動再起動を確認しました。9 月 9〜10 日には、演習ファイルの Ansible 変更・入力検証と、ローカル Git の競合解消・中止まで進めています。**AI が手順を案内し、本人が操作・結果画像を提供した記録**です。独力での設計・説明や、継続運用・本番復旧の実績とは区別します。

初めて技術に触れる方は[やさしいガイド](./beginner-guide.md)、本人の説明練習は[30 秒・3 分の説明練習](./portfolio-explanation.md)をご覧ください。

| [主作品 `server`](https://github.com/ns7jp/server) | [本人の最新実測](#実測したこと) | [職務経歴書](./resume.md) |
| --- | --- | --- |
| 構成、コード、実行方法を確認 | 日付・環境・確認結果・未実施範囲を確認 | これまでの経験、希望条件、AI 支援の範囲を確認 |

[案件概要（1 枚）](https://ns7jp.github.io/project-brief.html) ／ [2 分 15 秒デモ（保存済み画面の証跡リプレイ）](https://ns7jp.github.io/demo.html) ／ [詰まった記録](../LEARNINGS.md)

## 構築工程と証拠

| 工程 | 成果物・実行内容 | 状態 |
| --- | --- | --- |
| 要件・設計 | 要件定義、基本・詳細設計、パラメータシート、ネットワーク設計 | **実装済み**（文書を作成） |
| 構築・試験 | Ubuntu / 再利用 AlmaLinux の基礎設定、2 回目の変更 0 件 | **本人 VM で実測済み**（9 月 4 日。全監視構成とは別） |
| 監視・復旧 | 停止・復帰表示、Loki の別ボリューム復元、D-1 の HTTP 復帰 | **本人 VM で個別に実測済み**（9 月 8 日。全構成を通した受け入れ・長期稼働は未実施） |
| 変更 | Git SHA を固定した配備と旧版へのロールバック | **実測済み**（PR ブランチの使い捨て runner） |
| 引き渡し | チェックリストと受け入れ手順 | **実装済み**。独立した対象ホストへの引き渡しは **未実施（NOT RUN）** |

**実装済み**は成果物・コードが存在する状態、**実測済み**は記録で結果を確認できる状態です。日付・環境・実施者・対象版と未採録の情報は各証跡に記載します。**未実施（NOT RUN）**は実行結果がない状態です。判定の正本は [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) です。

## 志望と現況

製造・物流の現場で 15 年以上続けてきた「測る・原因を絞る・手順化する・定着させる」を、Linux サーバーの構築・運用に生かすエンジニア志望です。

**公開版の現況（2026-09-11 時点）**: 人材派遣会社（アデコ株式会社）を通じ、IT 企業にてトライアル就業中です（2026/07〜）。**現在のトライアル就業は 2026-09-15 に終了予定**です。就業先の社名は面談時に開示します。Linux サーバー構築へのキャリア移行を進めています。

| 項目 | 内容 |
| --- | --- |
| 勤務地 | 東京都内通勤可能圏 |
| 夜勤・交代制 | 24/365 監視業務のシフト勤務に対応可能 |
| 勤務開始時期 | 個別相談（現在のトライアル就業は 2026-09-15 に終了予定。入社可能日は調整のうえ決定） |

個別に調整する応募条件（雇用形態・英語力・運転免許を含む）は、公開版に空欄や仮入力を残さず、[職務経歴書・スキルシート](./resume.md#3-希望条件働き方)または応募書類・面談時に提示します。

第一志望は **Linux サーバー設計・構築**。入口としてインフラ監視・運用にも対応します。IT サポート・社内 SE 補助は応募先に応じた補助トラックです。

## 実測したこと

### 2026-09-08〜10 の本人 VM での記録

いずれも AI の手順案内を受けて本人が操作し、結果画像を提供した個人学習です。対象は Hyper-V の Ubuntu VM `lab-base01`。9 月 8 日の監視・復元・D-1 は構成を切り替えた別々の演習で、同時稼働の一連の受け入れ試験ではありません。

| 日付・記録 | 確認した結果 | まだ確認していないこと |
| --- | --- | --- |
| 9/8 [数値監視](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md) | 5 サービスの部分構成で、手動停止・再開に伴う Grafana の収集状態 1→0→1 | 全 10 サービス、アラート発火・外部通知、長期稼働 |
| 9/8 [Loki 復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md) | 同一 VM 内の別ボリュームに復元し、過去の目印付きログ 2 件を再取得 | 別 VM への復元、全データの完全性、RTO / RPO |
| 9/8 [アプリ自動再起動 D-1](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-d1-practice.md) | app / nginx 構成で再起動回数 0→1、HTTP 復帰 2 秒、後続確認で healthy | 2 秒は当該 1 回のスクリプト計測。healthy 到達時間・全機能の復旧・本番の保証値ではない |
| 9/9 [Ansible テンプレート](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-09-lab-base01-template-practice.md)・[入力検証](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-09-lab-base01-validation-practice.md) | 変更予測時の旧本文維持、適用・再実行の変更 0 件、不正値 70000 の拒否と前後 SHA-256 一致 | ホーム内の演習ファイルが対象。サービス起動・リモート構築・全入力の検証 |
| 9/10 [Git のブランチ・履歴](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-10-lab-base01-git-practice.md)・[競合解消と中止](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-10-lab-base01-git-merge-practice.md) | Fast-forward、同じ行の競合解消、merge --abort 前後の一致、main clean への復帰 | VM 内のローカル演習。VM からの push・Ansible 反映・独力での説明 |

### 2026-09-04 の基礎設定の実測

| 記録 | 確認できること | 確認できないこと |
| --- | --- | --- |
| [Ubuntu / Hyper-V](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-build.md) | 本人の VM へ `foundation.yml`（OS の共通設定と Docker）を適用し、再実行で変更 0 件 | 監視ラボ全体の `site.yml`、再起動後・長期稼働・引き渡し |
| [AlmaLinux / Hyper-V](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md) | 再利用 VM へ同じ基礎設定を適用し、再実行と SELinux 設定の修正を確認 | まっさらな新規構築、SSH だけの最小公開、監視全体の構築 |

### 2026-08 の記録済み環境・コード版での結果

以下は当時のコード版・環境での記録です。本人 VM の上表と合算せず、復旧秒数を本番の保証値として使いません。詳しい試験内容はリンク先に記載します。

| 検証 | 結果 |
| --- | --- |
| 8/22 Full-stack E2E | [Docker 導入済みの使い捨て Ubuntu runner で `site.yml` 適用、2 回目変更 0 件、監視・network / UFW・backup / restore を含む 23/23 PASS](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| 8/23 変更・ロールバック | [PR ブランチの使い捨て runner で候補 `84e1492` → 旧版 `59aa88e` の配備・復帰、稼働版とハッシュ等を確認](./evidence/2026-08-23-server-monitor-git-rollback-ci.md) |
| 8/18〜19 WSL2 上の監視・復旧 | [Grafana / Loki の表示](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-08-18-local-observability.md)、[D-1 の HTTP 復帰 13 秒](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-19-D-1.md) |

設計、パラメータ、構築、試験、変更、引き渡しの成果物は [案件概要](https://ns7jp.github.io/project-brief.html) と [Linux サーバー構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package) に分離しています。このページでは技術名を広く並べるより、実際に実行して結果を残した項目を優先します。

## 追加の実測演習

2026-08-24 の以下の結果は、**AI 支援セッションの作業環境での実行**です。B-1 は仮想ディスク（loop device）付き Ubuntu ゲスト、B-2 / B-3 は Docker コンテナ、B-4 は network namespace を使用しました。本人の手元で再実行した証拠や、独立した物理／VPS ホストでの実績としては扱いません。

| 演習 | 実演内容 | 所要 | 結果 |
| --- | --- | --- | --- |
| B-1 | LVM で VG / LV を作り、容量を使い切らせ、PV を足して online 拡張する | 10 分 | [5 PASS](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-1.md) |
| B-2 | Web / AP / DB の 3 層構成で、どの層が原因かを層別 health から絞り込む | 10 分 | [9 PASS](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-2.md) |
| B-3 | `pg_dump` / `pg_restore` で復元し、RTO / RPO と内容ハッシュを突き合わせる | 10 分 | [7 PASS](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-3.md)（RTO 0.149 秒） |
| B-4 | 静的ルート、`ip_forward`、VLAN ID 不一致の 3 パターンを切り分ける | 10 分 | [6 PASS / 3 SKIP-ENV](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-4.md) |

[8 月 25 日の AlmaLinux / Rocky 9 向け Molecule](https://github.com/ns7jp/server/actions/runs/32811100007) もコンテナでの検証です。9 月 4 日の再利用 AlmaLinux VM への基礎設定適用は上記の別証跡です。

## 入社後に任せやすいこと

| 領域 | 最初に貢献できること |
| --- | --- |
| サーバー構築 | 手順に沿った設定、チェックリスト確認、単体試験、パラメータ・手順書更新。Ubuntu / RHEL 系の差分、ディスク（LVM）設計 |
| インフラ運用 | アラート確認、コマンドとログによる一次切り分け（L2 / L3 / 層別 health）、エスカレーション |
| 自動化補助 | Ansible / shell / Python の小さな定型作業、CI の結果確認 |
| IT サポート | 再現条件と影響範囲の整理、キッティング、FAQ・台帳整備 |

## 現場経験とのつながり

物流現場では、1 週間の作業を 15 分単位で計測し、棚配置・動線・補充ルールを改善して、1 日あたり約 1 時間の作業時間短縮につなげました。さらに OJT 用マップとチェックリストを作り、改善が元へ戻りにくい形にしました。

サーバー構築でも、作って終わりではなく、設定値、試験結果、監視、復旧手順を残して、他の人が同じ品質で扱える状態を目指します。

## 正直な境界

実務での大規模インフラ経験はこれからです。**コードや設計書があること**と、
**実環境で成功した結果があること**を混同しないよう、
[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)
の 1 か所で区別しています。上の結果は、使い捨て runner、WSL2、AI 支援環境、本人の Hyper-V VM での個別記録です。環境と対象手順を各証跡で確認します。

未実測の主なもの: Slack 実配信、AWS `apply / destroy`、D-2 復旧演習、
独立した引き渡し対象ホストの受け入れ、組織 DNS、ホスト再起動後の永続性、24 / 72 時間の稼働、別の新規 VM への復元、
AlmaLinux への監視全体の `site.yml` 適用と、専用の新規 VM での最小公開確認。**実行ログが無い項目を実績として書くことはしません。**

**AI 支援の範囲も同じ基準で開示しています。** 文書だけでなく実装コード（Ansible role、
Terraform module、CI workflow、テスト、ラボ）の生成にも AI を使っています。
リポジトリ別の実作業コミット内訳という技術評価の詳細は、この1枚サマリではなく
[職務経歴書・スキルシート §4-b](./resume.md#4-b-ポートフォリオにおける-ai-支援の範囲)に置いています。
本人の独力での再構築・説明、第三者による手順確認は未確認です。[説明練習](./portfolio-explanation.md)では、設定理由・正常異常の判断・外れた仮説・戻し方を本人の言葉で確認する対象にしています。
**その中で、実機を触って外した仮説の一次記録
[LEARNINGS.md](../LEARNINGS.md) は、2026-08-25 以降、新規エントリを本人のみが書く
運用にしています**（各記録と [STATUS](../STATUS.md) に示す作成経緯も併せて確認します）。技術的な深さより、ここを
読んでいただくのが、私の現在地を最も正確に伝える方法だと考えています。

## 経歴・学習

- 人材派遣会社（アデコ株式会社）を通じ、IT 企業にてトライアル就業中（2026/07〜、2026-09-15 終了予定。Windows / Linux サーバー構築・AWS / Azure 構築の研修。就業先の社名は面談時に開示します）
- 製造・物流業務 15 年以上
- 中部大学 応用生物学部 応用生物化学科 卒業
- 公共職業訓練「情報処理（Python エンジニア）コース」修了（2025 年 10 月〜2026 年 1 月）
- Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級
- IT パスポート（2026-06 取得）／基本情報技術者（2026 Q4 受験予定）／LPIC-1 学習中

## 詳細

- [職務経歴書・スキルシート](./resume.md)
- [詰まった記録（実機で外した仮説の一次記録）](../LEARNINGS.md)
- [志望トラックと証跡](./target-roles.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [現場経験とインフラの橋渡し](./career-bridge.md)
- [プロフィール README](../README.md)
- [ポートフォリオサイト](https://ns7jp.github.io/)
