# 島田則幸 (Noriyuki Shimada)

## 未経験からサーバー設計・構築エンジニアへ

**Linux サーバーを作り、動作を確かめ、異常時に戻せるようにする**ことを学んでいます。このページは、個人の学習・検証で作ったものと実行記録を紹介するポートフォリオです。サーバー構築の実務経験としては扱っていません。

製造・物流の現場で 15 年以上培った「計測する・原因を絞る・手順化する・改善を続ける」を、サーバー構築と運用に生かします。

主作品は **[サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)** です。サーバーとは、利用者や別のプログラムからの要求に応答するコンピューターやソフトウェアのこと。このラボでは、小さな Web アプリを動かす環境と、その状態を調べる仕組みを作っています。

> **設計する → 構築する → 試験する → 監視する → 復旧する → 記録する**

## 30 秒で選ぶ

まずは目的に合う **1 ページだけ** 開いてください。時間は読む目安で、習得を保証する時間ではありません。

| 目的 | 最初に開くページ | 分かること |
| --- | --- | --- |
| 採用の観点で知る | [採用ご担当者さま向け 1 ページ](./docs/overview-for-recruiters.md) | 志望、成果物、検証範囲 |
| 仕組みを理解する | [やさしい用語・見方ガイド](./docs/beginner-guide.md) | 役割、通信の流れ、用語の意味 |
| 自分で動かす | [主作品の初心者向け学習ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md) | 小さく起動し、結果を確認する手順 |
| 面接で説明する | [30 秒・3 分の説明練習](./docs/portfolio-explanation.md) | 例文、問い返し、自分の記録を使った説明 |
| 初心者から構築を担当できるまで進む | [8段階の育成システム](./docs/server-engineer/README.md) | 演習・32の到達条件・個人台帳・再試験・引き渡し |
| 案件を受付から終結まで進める | [サーバー案件の運用システム](./docs/server-projects/README.md) | 要件・見積・作業配分・本番承認・検収・保守・変更対応 |

PC や Linux の準備から必要な方は、[開始前診断と最初の30分](./docs/learning-plan/00-start-here.md)へ。体系的な学習には [24 週の学習プラン](./docs/learning-plan/README.md)を使います。

## 何を作ったか

「サーバーが止まっているのに誰も気づかない」状態を減らすため、**応答を返すアプリ**と、**異常を見つけて知らせる監視基盤**を組み合わせました。まず「入口・本体・計測・表示・通知」で覚えます。

```mermaid
flowchart LR
    U[利用者] -->|画面を要求| N[Nginx: 入口]
    N -->|要求を渡す| A[Flask / Gunicorn: 本体]
    P[Prometheus: 計測・条件判定] -->|数値を取りに行く| A
    G[Grafana: 表示] -->|数値を問い合わせる| P
    C[Alloy: ログを運ぶ] -->|送信| L[Loki: ログを保存・検索]
    G -->|ログを問い合わせる| L
    P -->|警告を渡す| M[Alertmanager: 通知をまとめる]
```

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
| 引き渡し | 他の人が扱える手順とチェックリストを残す | [構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package)（対象ホストへの正式な引き渡しは未実施） |

**文書化済み**は説明や手順があること、**実装済み**はコードや設定があること、**検証済み／実測済み**は対象・日時・結果の記録があることです。実行記録がない項目は **未実施（NOT RUN）** とします。資料を読んだこと、本人が自力で再現できることも区別します。

## 主な実測結果

以下は **各記録に書かれた時点・環境・コード版での結果**です。現在のコード全体や本番環境の合格を示すものではありません。PASS は、その試験で決めた合格条件を満たした意味です。

| 記録 | 確認したこと | 環境と限界 |
| --- | --- | --- |
| [2026-08-22：一連の構築・試験 23/23 PASS](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) | 構築、再実行、監視、ローカル通知、復旧、復元 | GitHub Actions の使い捨て Ubuntu。Docker は事前導入済み |
| [2026-09-04：Ubuntu の基礎設定](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-build.md) | `foundation.yml` で設定・Docker 導入、再実行で `changed=0` | 本人の Hyper-V VM。監視全体を構築する `site.yml` とは別の手順 |
| [2026-09-04：AlmaLinux への適用](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md) | 基礎設定の適用、再実行、SELinux 設定の欠陥修正 | 再利用した Hyper-V VM。新規構築・最小公開の証明は未完了 |

`changed=0` は、同じ設定をもう一度適用したときの変更が 0 件だったことです。これだけで全機能が正常と証明できるわけではなく、試験結果と合わせて確認します。その他の結果は[実測証跡ダイジェスト](https://ns7jp.github.io/evidence-demo.html)と[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)から追えます。

### まだ実測していないこと

主な未実施範囲は、監視ラボ全体を独立した引き渡し対象ホストへ構築すること、組織 DNS を含む本番相当のネットワーク確認、Slack への実配信、AWS への実適用、ホスト再起動後の永続性・長期稼働です。AlmaLinux は上記の基礎設定までで、監視ラボ全体の `site.yml` 適用は未実施です。

## 失敗から学んだこと

失敗の記録は [LEARNINGS.md](./LEARNINGS.md) にあります。たとえば、UFW（通信を許可・制限する設定ツール）の設定が毎回「変更あり」になった記録から、**初回の成功だけで終えず、もう一度実行して同じ状態になるか確かめる必要性**を学べます。

原因調査は **「事実を見る → 範囲を絞る → 1 つ変える → 再確認する」**。公開済みの記録と、自分が経験した失敗は分けて扱います。

## 学習中の方へ

最初の目標は、主作品を全部暗記することではなく、**小さな構成を 1 回動かし、何を確認したかを説明すること**です。

1. [やさしいガイド](./docs/beginner-guide.md)で、構成図を見ながら各部品の役割を言う。
2. [主作品の学習ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)で起動・確認・終了を行い、出力を残す。
3. [説明練習](./docs/portfolio-explanation.md)の記録欄に、自分の実施範囲・結果・未実施を記入する。
4. 手順を閉じて「目的 → 構成 → 自分の操作 → 確認結果 → 次の課題」を説明する。詰まった箇所だけ読み直す。

さらに学ぶ際は [24 週の学習プラン](./docs/learning-plan/README.md)へ進みます。[育成システム](./docs/server-engineer/README.md)で今日の課題と提出物を決め、24週後は条件変更・初見障害・第三者への引き渡しを含む総合演習へ進めます。学習期間は目安です。本人による演習と説明の確認をもって習得を判断します。

## 経験・資格

- 製造・物流業務 15 年以上
- Python 3 エンジニア認定基礎・実践
- PHP 8 技術者認定初級
- IT パスポート
- 基本情報技術者を学習中

詳しい職歴とスキルは [職務経歴書・スキルシート](./docs/resume.md)、現場改善の経験は [業務改善レポート](./docs/business-improvement/picking-improvement.md)にまとめています。

## AI の利用について

文書の構成・推敲に加え、実装コードの生成・レビューにも AI 支援を利用しています。生成物や自動試験の成功を、本人の習得や実務経験へ読み替えません。本人の作業・判断・説明は個別の記録で確認します。範囲と方針は [STATUS.md](./STATUS.md)と[職務経歴書・スキルシート](./docs/resume.md)に記載しています。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
