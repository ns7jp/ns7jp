# 島田則幸 (Noriyuki Shimada)

## 未経験からサーバー設計・構築エンジニアへ

製造・物流の現場で 15 年以上、「計測する・原因を絞る・手順化する・改善を続ける」を続けてきました。今はそれをサーバーの構築と運用に生かすため、**Linux と Windows Server の両方で、作る → 確かめる → 壊して直す → 記録する**を練習しています。

2026 年 9 月には、手元の Hyper-V（Windows の仮想化機能）上の仮想マシンで、次のことを行いました。

- **Windows Server 2022 で Active Directory を構築**し、試験仕様書の必須 31 項目がすべて PASS しました。
- ドメインコントローラー（DC）を 2 台にして複製を確かめ、1 台を失った想定で役割を移して復旧しました。
- **Ubuntu Server を初期構築**し（固定 IP・SSH 鍵認証・UFW・時刻同期・自動更新）、わざと起こした設定不備から復旧しました。

主作品は **[サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)** です。小さな Web アプリを動かす環境と、その状態を調べる監視の仕組みを、コードと手順書にしています。

> 個人の学習記録で、実務経験ではありません。9 月の記録は、AI の支援（手順の案内など）を受けながら私が操作し、結果を画面で確かめたものです。前提と未実施の範囲は[この資料の読み方](#この資料の読み方)にまとめました。

## 30 秒で選ぶ

志望と検証範囲をまとめて読む場合は、[採用ご担当者さま向けページ](./docs/overview-for-recruiters.md)をご覧ください。

| 目的 | 最初に開くページ | 分かること |
| --- | --- | --- |
| 最新の実測を見る | [主な実測結果](#主な実測結果) | 9 月に自分の VM で構築・試験・復旧した内容 |
| 主作品を見る | [サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server) | 構成・コード・構築と復旧の手順 |
| 経歴と応募条件を見る | [職務経歴書・スキルシート](./docs/resume.md) | 現場経験・志望・就業状況 |

副作品として、[design](https://github.com/ns7jp/design) に架空企業のインフラ刷新を題材にした設計書 13 文書、[shell](https://github.com/ns7jp/shell) に Bash / Python / PowerShell・Ansible の演習コードとテスト、[network](https://github.com/ns7jp/network) に架空のネットワーク案件 9 件、[aws](https://github.com/ns7jp/aws) に AWS CLI / Terraform の 6 段階の演習資料があります。作品ごとの確認範囲は[作品案内](./docs/github-profile-cleanup.md#主作品と副作品)に書いています。

## 主な実測結果

2026 年 9 月に、手元の Hyper-V 上の仮想マシンで行った記録です。AI の支援（手順の案内など）を受けながら私が操作し、結果を画面で確認しました。各記録には、日時・環境・判定と、確認できていない範囲を書いています。

### Windows Server / Active Directory（2026-09-01〜08）

| 記録 | 確認したこと |
| --- | --- |
| [9/1〜2：AD の構築・試験](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md) | Windows Server 2022 評価版の VM 1 台で AD DS（ドメインの認証基盤）を構築し、試験仕様書のフェーズ 1 必須 31 項目がすべて PASS。手順書・設計書の誤りを実機で見つけて直しました |
| [9/2：System State 復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-ad-restore-drill.md) | バックアップ後に作った目印の OU が、復元で消えることを確認。復元処理 15 分 29 秒、復旧全体は約 40 分（うち約 18 分は起動設定の解除漏れによるやり直し） |
| [9/3：2 台目の DC と複製](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-second-dc-replication.md) | 複製の失敗 0/5、複製の遅延 17.8 秒を実測。GPO（グループポリシー）が配られない原因を、前日の復元で消えていたファイルと突き止めて修復 |
| [9/3〜4：DC の停止と役割の奪取](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ad-fsmo-seize.md) | [1 台を止めても](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-dc-outage-drill.md) DNS・LDAP・Kerberos が続くことと、復帰後の収束 18 分 31 秒を確認。次に 1 台を失った想定で FSMO 役割を奪取し、`ntdsutil` で古い DC の情報を削除 |
| [9/7〜8：WSUS の構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-07-wsus-build-validation.md) | ドメインに参加させた更新配信サーバーを構築。必須 28 項目中 26 が PASS、1 件が FAIL、1 件が期待結果に届かず、判定は FAIL。翌日、[残った 2 件の原因](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)を特定して手順書を直しました |

作業結果と障害 15 件の対処は、[作業結果・引き渡し報告](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md)にまとめています。設計書・手順書・試験仕様書は [AD 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-ad)にあります。

### Linux（2026-09-04〜08）

| 記録 | 確認したこと |
| --- | --- |
| [9/7〜8：Ubuntu の初期構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md) | 固定 IP、SSH 鍵認証（パスワード方式は拒否）、sudo、UFW、時刻同期、自動更新を手作業で設定。設定不備を起こし、拒否の表示とサーバーのログを照合して復旧。教材 21 項目の判定は PASS 14 / 環境に合わせて変更し PASS 4 / 一部確認 2 / 未実施 1 |
| [9/4：Ansible での基礎設定](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-build.md) | Ubuntu と [AlmaLinux](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md) の VM に OS の共通設定と Docker を適用し、2 回目の変更 0 件。AlmaLinux では SELinux 設定の欠陥を修正 |
| [9/8：数値の監視](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md)・[ログ検索](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-loki-practice.md) | Prometheus / Grafana で、サービスの停止・再開に合わせて収集状態が 1→0→1 と変わることを表示。Nginx の目印付きログ 2 件を Loki で検索 |
| [9/8：復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md)・[自動復旧](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-d1-practice.md) | Loki のデータを同じ VM 内の別ボリュームへ復元し、過去のログ 2 件を再取得。アプリを止めた後の自動再起動で、HTTP の復帰を 2 秒と計測（1 回の計測） |

Ansible と Git の小さな練習（9/9〜15）の記録は、[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)に並べています。

### CI（自動試験）の記録

| 記録 | 確認したこと |
| --- | --- |
| [8/22：一連の構築・試験](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) | GitHub Actions の使い捨て Ubuntu で、構築・再実行・監視・ローカル通知・復旧・復元の 23 項目が PASS |
| [9/17：性能試験の見直し](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-performance-ci-analysis.md) | 以前の集計が HTTP 502 を失敗に数えていなかったことを見つけ、集計を修正。[修正後の比較](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-upstream-keepalive-comparison.md)では、同じ負荷設定の 2 回の CI で並列 1〜16 の失敗が 0 件（AI 支援による分析・改善） |

## 何を作ったか

「サーバーが止まっているのに誰も気づかない」状態を減らすため、**応答を返すアプリ**と、**異常を見つけて知らせる監視基盤**を組み合わせました。まず「入口・本体・計測・表示・通知」で覚えます。

[![利用者からNginx・アプリへの要求、Prometheusからアプリへの数値取得、GrafanaからPrometheus・Lokiへの問い合わせ、AlloyからLokiへのログ送信、PrometheusからAlertmanagerへの警告の流れ](./docs/images/architecture-overview.svg)](./docs/images/architecture-overview.svg)

矢印のラベルは、要求・取得・送信の動作です。応答は要求元へ返ります。一部を省略した図で、詳細は[構成図](./docs/architecture-diagram.md)にあります。ログは「いつ何が起きたか」の記録、数値は CPU 使用率などの測定値です。

| 役割 | 技術 | 何のために使うか |
| --- | --- | --- |
| 土台 | Linux（Ubuntu など） | アプリや監視を動かす |
| 入口と本体 | Nginx / Flask / Gunicorn | 通信を受け、アプリの応答を返す |
| 計測・判定 | Prometheus | 数値を集め、警告条件を判定する |
| ログ | Alloy / Loki | ログを運び、保存・検索する |
| 表示 | Grafana | 保存された数値やログを問い合わせて見せる |
| 通知 | Alertmanager | 受け取った警告を整理し、通知先へ送る |
| 構築・起動 | Ansible / Docker Compose | OS の設定をそろえる / 複数のコンテナを起動する |

## サーバー構築で示したこと

| 工程 | 成果物・確認対象 | 確認先 |
| --- | --- | --- |
| 要件・設計 | 要件定義、基本・詳細設計、パラメータシート | [Linux 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package)・[AD 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-ad) |
| 構築・試験 | 手順書どおりに構築し、試験仕様書で判定する | [主な実測結果](#主な実測結果) |
| 復旧・変更 | 停止からの復旧、バックアップからの復元、旧版への戻し | [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) |
| 障害対応 | 手順書どおりに切り分けて直せるかを演習で確かめる | [障害復旧演習](https://github.com/ns7jp/server/blob/main/docs/drills/README.md) |
| 引き渡し | 作業結果報告書とチェックリスト | [AD の作業結果・引き渡し報告](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md) |

## 失敗から学んだこと

失敗の記録は [LEARNINGS.md](./LEARNINGS.md) にあります。たとえば、UFW（通信を許可・制限する設定ツール）の設定が毎回「変更あり」になった記録からは、**初回の成功だけで終えず、もう一度実行して同じ状態になるか確かめる必要性**を学びました。

原因調査は **「事実を見る → 範囲を絞る → 1 つ変える → 再確認する」** の順で進めます。9 月の AD の記録にも、最初の仮説が外れた例を残しています。「強制停止でレジストリが巻き戻った」と考えた設定の変化は、実際には GPO による上書きでした。

次に取り組むのは、[AI を使わずに元ログ 5 件のハッシュ照合をやり直すことと、9 月の失敗から学びを 1 件、自分の言葉で書くこと](./docs/portfolio-explanation.md#8-次に残す一件と自分の学び)です。どちらもまだ終わっていません。

## 経験・資格

- 製造・物流業務 15 年以上
- IT 企業でのトライアル就業（2026/07〜09/15、人材派遣。Windows / Linux サーバーと AWS / Azure の構築研修）
- Python 3 エンジニア認定基礎・実践
- PHP 8 技術者認定初級
- IT パスポート
- 基本情報技術者を学習中

詳しい職歴とスキルは [職務経歴書・スキルシート](./docs/resume.md)、現場改善の経験は [業務改善レポート](./docs/business-improvement/picking-improvement.md)にまとめています。

## この資料の読み方

このポートフォリオ全体にかかる前提を、この節にまとめています。

### 言葉の定義

| 表記 | 意味 |
| --- | --- |
| **文書化済み** | 説明や手順がある |
| **実装済み** | コードや設定がある |
| **実測済み／検証済み** | 対象・日時・環境・結果の記録がある |
| **未実施（NOT RUN）** | 実行結果がない |

判定の正本は [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) です。

### 3 つの前提（AI の利用を含む）

1. **実務経験ではありません。** 個人の学習・検証で作ったものと、その実行記録です。
2. **結果は、その記録に書いた時点・環境・コード版のものです。** PASS は、その試験で決めた合格条件を満たしたという意味です。個別の記録を合算して「全構成の合格」とは扱いません。
3. **AI 支援を使っています。** 文書だけでなく、実装コード（Ansible role、Terraform module、CI workflow、テスト、ラボ）の生成・レビューにも使いました。9 月の VM の記録は、AI が手順を案内し、私が操作して結果の画像を残したものです。範囲は [職務経歴書・スキルシート](./docs/resume.md#4-b-ポートフォリオにおける-ai-支援の範囲) に書いています。

### まだ実測していないこと

主なものは次のとおりです。

- 監視ラボ全体を、独立した引き渡し先のホストへ構築すること（AlmaLinux は基礎設定まで）
- ホスト再起動後の確認と、24 時間以上の連続稼働
- 別の VM への復元、Slack への実際の通知、AWS への実際の構築
- 組織の DNS やクライアント PC を含むドメイン環境での確認（AD は DC 2 台と WSUS サーバーまで）
- 障害復旧演習の D-2 と D-6〜D-9、自分の環境での負荷試験、第三者による手順の確認

**AI を使わずに再現した記録は、まだありません。** 最初の一件として、元ログ 5 件のハッシュ照合を[独力再現ガイド](https://github.com/ns7jp/server/blob/main/docs/independent-rerun-guide.md)の条件でやり直します。

初心者向けの教材（やさしいガイド・学習プラン・用語集）は[やさしいガイド](./docs/beginner-guide.md)から、ポートフォリオ運営の仕組みは [archive/](./archive/README.md) から辿れます。どちらも採用の判断には不要です。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
