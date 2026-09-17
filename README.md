# 島田則幸 (Noriyuki Shimada)

## 未経験からサーバー設計・構築エンジニアへ

**Linux サーバーを作り、動作を確かめ、異常時に戻せるようにする**ことを学んでいます。製造・物流の現場で 15 年以上培った「計測する・原因を絞る・手順化する・改善を続ける」を、サーバー構築と運用に生かします。

主作品は **[サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)** です。サーバーとは、利用者や別のプログラムからの要求に応答するコンピューターやソフトウェアのこと。このラボでは、小さな Web アプリを動かす環境と、その状態を調べる仕組みを作っています。

> **設計する → 構築する → 試験する → 監視する → 復旧する → 記録する**

このポートフォリオは、**実行した記録と、まだ実行していない範囲を分けて書いています。** 言葉の定義・前提・未実施の一覧は [この資料の読み方](#この資料の読み方) にまとめました。各表の「限界」列と合わせてご確認ください。

**初めて学ぶ方は、[やさしいガイドの「最初の10分」](./docs/beginner-guide.md#最初の10分で行うこと)から始めます。** まず「利用者 → 入口 → アプリ」の流れを説明し、準備ができたら2サービスだけを動かします。環境の準備時間は別に取り、1回の確認結果を自分の言葉で話すところまでを最初の目標にします。

## 30 秒で選ぶ

採用の観点では、次の3つから確認できます。志望と検証範囲をまとめて読む場合は、[採用ご担当者さま向けページ](./docs/overview-for-recruiters.md)をご覧ください。

| 目的 | 最初に開くページ | 分かること |
| --- | --- | --- |
| 主作品を見る | [サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server) | 構成・コード・構築と復旧の手順 |
| 本人の最新実測を見る | [主な実測結果](#主な実測結果) | 9月8〜10日のVM操作・画像・確認範囲 |
| 経歴と応募条件を見る | [職務経歴書・スキルシート](./docs/resume.md) | 現場経験・志望・就業状況 |

### 副作品で確かめること

主作品の補足として、[design](https://github.com/ns7jp/design) に架空企業のインフラ刷新を題材にした設計書 13 文書、[shell](https://github.com/ns7jp/shell) に Bash / Python / PowerShell・Ansible の演習コードとテスト、[network](https://github.com/ns7jp/network) に架空のネットワーク案件 9 件、[aws](https://github.com/ns7jp/aws) に AWS CLI / Terraform の 6 段階の演習資料があります。設計書やコードの存在と本人の実行結果は分け、[作品ごとの確認範囲](./docs/github-profile-cleanup.md#主作品と副作品)を併記しています。

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
| 要件・設計 | 作る目的、構成、設定値を決める | [構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package) |
| 構築・試験 | 自動構築し、通信・認証・監視などを確かめる | 下の[実行記録](#主な実測結果) |
| 復旧・変更 | 停止からの復旧、バックアップ復元、旧版への戻し方を確かめる | [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) |
| 性能 | 負荷結果を読み、HTTP エラーを含めて合否を評価する | [CI 実測の再分析](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-performance-ci-analysis.md)。並列 4 / 8 で HTTP 502 を検出し、内部基準 1% を超過。旧 PASS 判定の集計漏れを訂正。処理能力の限界は未確定 |
| 障害対応 | 手順書どおりに切り分けて直せるかを演習で確かめる | [障害復旧演習](https://github.com/ns7jp/server/blob/main/docs/drills/README.md) |
| 引き渡し | 他の人が扱える手順とチェックリストを残す | [構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package)（対象ホストへの正式な引き渡しは未実施） |

## 主な実測結果

### 最近の本人による操作（2026-09-08〜10）

| 記録 | 本人が操作して確認したこと | この記録の限界 |
| --- | --- | --- |
| [9/8：数値監視](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md) | 5サービスでPrometheus収集・Grafana表示。手動停止と再開で収集状態1→0→1 | 部分構成。外部通知・長期稼働は未実施 |
| [9/8：ログ監視](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-loki-practice.md) | 6サービスでNginxの目印付きログ2件をGrafanaから検索 | 全10サービスの同時検証ではない |
| [9/8：バックアップ復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md) | Lokiのアーカイブを別名ボリュームへ復元し、過去ログ2件を取得 | 同じVM内の復元。別ホスト・全データの完全性は未確認 |
| [9/8：アプリ自動復旧](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-d1-practice.md) | 再起動回数0→1、HTTP復帰の計測2秒、後続のhealthyを確認 | app/nginxの1回の試験。2秒は全機能の復旧時間や本番保証ではない |
| [9/9：Ansible入力検証](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-09-lab-base01-validation-practice.md) | 不正ポート70000を変更前に拒否し、出力ファイルのSHA-256と本文維持を確認 | ホーム内のファイル生成演習。実ポート待受の試験ではない |
| [9/10：Gitマージ](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-10-lab-base01-git-merge-practice.md) | マージ・競合解消・中止後の一致を確認し、mainを元の状態へ復帰 | VM内のローカル演習。VMからのpush・Ansible反映は未実施 |

### 基礎設定と自動試験の記録

| 記録 | 確認したこと | 環境と限界 |
| --- | --- | --- |
| [2026-08-22：一連の構築・試験 23/23 PASS](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) | 構築、再実行、監視、ローカル通知、復旧、復元 | GitHub Actions の使い捨て Ubuntu。Docker は事前導入済み |
| [2026-09-04：Ubuntu の基礎設定](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-build.md) | `foundation.yml` で設定・Docker 導入、再実行で `changed=0` | 本人の Hyper-V VM。監視全体を構築する `site.yml` とは別の手順 |
| [2026-09-04：AlmaLinux への適用](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md) | 基礎設定の適用、再実行、SELinux 設定の欠陥修正 | 再利用した Hyper-V VM。新規構築・最小公開の証明は未完了 |

`changed=0` は、同じ設定をもう一度適用したときの変更が 0 件だったことです。これだけで全機能が正常と証明できるわけではなく、試験結果と合わせて確認します。その他の結果は[実測証跡ダイジェスト](https://ns7jp.github.io/evidence-demo.html)と[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)から追えます。

## 失敗から学んだこと

失敗の記録は [LEARNINGS.md](./LEARNINGS.md) にあります。たとえば、UFW（通信を許可・制限する設定ツール）の設定が毎回「変更あり」になった記録から、**初回の成功だけで終えず、もう一度実行して同じ状態になるか確かめる必要性**を学べます。

原因調査は **「事実を見る → 範囲を絞る → 1 つ変える → 再確認する」**。公開済みの記録と、自分が経験した失敗は分けて扱います。

9 月の実習から次に残すのは、[元ログのハッシュ照合を独力で再実施した記録と、本人が書く学び一件](./docs/portfolio-explanation.md#8-次に残す一件と本人の学び)です。今の状態はどちらも記入・実施待ちで、AI が本人の判断や学びを補完して完了にはしません。

## 学習中の方へ

最初の目標は、主作品を全部暗記することではなく、**小さな構成を 1 回動かし、何を確認したかを説明すること**です。

1. [やさしいガイド](./docs/beginner-guide.md)で、構成図を見ながら各部品の役割を言う。
2. [主作品の学習ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)で起動・確認・終了を行い、出力を残す。
3. [説明練習](./docs/portfolio-explanation.md)の記録欄に、自分の実施範囲・結果・未実施を記入する。
4. 手順を閉じて「目的 → 構成 → 自分の操作 → 確認結果 → 次の課題」を説明する。詰まった箇所だけ読み直す。

さらに学ぶ際は [24 週の学習プラン](./docs/learning-plan/README.md)へ進みます。学習期間は目安です。本人による演習と説明の確認をもって習得を判断します。

| 目的 | 資料 |
| --- | --- |
| PC・Linuxの準備 | [開始前診断と最初の30分](./docs/learning-plan/00-start-here.md) |
| 用語を確かめる | [IT基礎用語集](./docs/it-glossary.md) |
| 学習・案件・運営の仕組み | [archive/](./archive/README.md)（育成システム、案件運用、改善ループなど。採用の判断には不要です） |

## 経験・資格

- 製造・物流業務 15 年以上
- Python 3 エンジニア認定基礎・実践
- PHP 8 技術者認定初級
- IT パスポート
- 基本情報技術者を学習中

詳しい職歴とスキルは [職務経歴書・スキルシート](./docs/resume.md)、現場改善の経験は [業務改善レポート](./docs/business-improvement/picking-improvement.md)にまとめています。

## この資料の読み方

ここに、このポートフォリオ全体にかかる前提をまとめています。以降の各ページで繰り返さず、この節を正本とします。

### 言葉の定義

| 表記 | 意味 |
| --- | --- |
| **文書化済み** | 説明や手順がある |
| **実装済み** | コードや設定がある |
| **実測済み／検証済み** | 対象・日時・環境・結果の記録がある |
| **未実施（NOT RUN）** | 実行結果がない |

資料を読んだことと、本人が自力で再現できることも区別します。判定の正本は [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) です。

### 3 つの前提（AI の利用を含む）

1. **実務経験ではありません。** 個人の学習・検証で作ったものと、その実行記録です。サーバー構築の実務経験としては扱っていません。
2. **結果は、その記録に書かれた時点・環境・コード版のものです。** 現在のコード全体や本番環境の合格を示すものではありません。PASS は、その試験で決めた合格条件を満たした意味です。**個別の記録を合算して「全構成の合格」とは扱いません。**
3. **AI 支援を使っています。** 文書の構成・推敲に加え、実装コード（Ansible role、Terraform module、CI workflow、テスト、ラボ）の生成・レビューにも使っています。9月の本人 VM の記録は、**AI が手順を案内し、本人が操作して結果画像を提供した**ものです。生成物や自動試験の成功を、本人の習得や実務経験へ読み替えません。教材の作成も同様です。範囲と方針は [STATUS.md](./STATUS.md) と [職務経歴書・スキルシート](./docs/resume.md#4-b-ポートフォリオにおける-ai-支援の範囲) に記載しています。

### まだ実測していないこと

主な未実施範囲は、監視ラボ全体を独立した引き渡し対象ホストへ構築すること、組織 DNS を含む本番相当のネットワーク確認、Slack への実配信、AWS への実適用、ホスト再起動後の永続性・長期稼働、D-2 と D-6〜D-9 の障害復旧演習です。AlmaLinux は基礎設定までで、監視ラボ全体の `site.yml` 適用は未実施です。

負荷試験は [既存の CI 実行](https://github.com/ns7jp/server/actions/runs/35197884893)を 9 月 17 日に AI 支援で[再分析](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-performance-ci-analysis.md)しました。旧集計は HTTP エラーを失敗率に含めておらず、並列 4 で 39.15%、並列 8 で 1.96% の HTTP 502 がありました。**当時のCI成功を性能合格とは扱いません。** 集計修正後のCIでは502を正しくFAILとして検出し、[接続再利用の比較と復旧試験](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-17-upstream-keepalive-comparison.md)へ進めました。実行版・測定値・確認できた範囲は各記録で分けています。本人環境での再現、長期安定性、容量の確定は未実施です。

次は小さな構成の再起動後確認、24時間の観測、別VMへの復元、本人以外による手順確認を順に進めます。本人の判断を確認するための[実測一件を使った説明と問い返し](./docs/portfolio-explanation.md#7-最近の本人実測を使って判断を説明する)も用意しています。手順の用意と実施完了は区別します。

### AI を使わずに再現した記録について

現在の実測記録には、**AI 支援なしで再現した対照がありません。** そのため「AI なしでどこまでできるか」は、この資料からは読み取れません。最初の対象は既存の元ログ 5 件のハッシュ照合です。[独力再現ガイド](https://github.com/ns7jp/server/blob/main/docs/independent-rerun-guide.md)の条件で本人が実施し、参照資料・途中の判断・出力を残します（実施は未着手）。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
