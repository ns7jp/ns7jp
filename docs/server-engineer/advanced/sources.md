# 既存資産と根拠：何を再利用し、どこを拡張するか

[入口](README.md) / [能力設計](design.md) / [統合仕様](implementation-contract.md)

## 確認範囲

確認日：2026-09-06。[GitHubプロフィール](https://github.com/ns7jp)と下記2リポジトリの公開mainを確認しました。以下のリンクは調査時点のSHAへ固定しています。

| リポジトリ | 確認版 | 用途 |
| --- | --- | --- |
| ns7jp/ns7jp | `b3dd74756c53b6eeebb38c5fc65b16a7d27f8824` | 学習・評価・案件運営の正本を確認 |
| ns7jp/server | `d0a69321ffb3248c8e953d75bea5ff9512c1b838` | 実習、構築手順、実測索引を確認 |

調査時点のmainを根拠としています。公開mainは更新され得るため、実際に実習するときは使用版を記録し、最新差分を確認してください。

初期調査は読み取りと設計資料作成です。過去のCIや実機試験を現在の版で再実行していません。公開証跡に記された本人・環境・値の真正性を独立して認証したものでもありません。

## 再利用する教材の対応表

| 確認した資産 | 既存の役割 | 今回の接続 |
| --- | --- | --- |
| [SE育成入口](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/README.md) | 8段階・32条件、学習から小規模案件まで | BR0〜BR3の基本課程 |
| [SE00 準備](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/00-orientation.md) | 実行場所、再作成、予想・実測、説明 | 現在地診断と最初の行動 |
| [SE01 Linux](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/01-linux.md) | OS、権限、サービス、ディスク | BR1の一台構築 |
| [SE02 ネットワーク](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/02-network.md) | IP・DNS・SSH/FW・未知通信障害 | BR1からBR2の通信理解 |
| [最小実習ガイド](https://github.com/ns7jp/server/blob/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/beginner-learning-guide.md) | app/nginx、応答・認証・停止・再開 | 最初の2週間の具体的な実行元 |
| [一本道の順序](https://github.com/ns7jp/server/blob/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/learning-path.md) | Level 0〜5の必修、Level 6の選択 | serverという作品を学ぶ順序として維持 |
| [SE03 サービス](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/03-services.md) | 認証、TLS、DB権限、別DB復元 | BR2の利用者操作とデータ確認 |
| [SE04 設計](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/04-design.md) | 曖昧な依頼、非機能条件、試験対応 | BR3、BX05の設計比較の前提 |
| [Linux案件パック](https://github.com/ns7jp/server/tree/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/build-package) | 要件から引き渡しまでの文書 | 既存様式を使い、重複文書を増やさない |
| [SE05 自動化](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/05-automation.md) | Git、失敗停止、再適用、新規VM、旧版復帰 | BR3からBX01の再構築へ |
| [SE06 運用](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/06-operations.md) | 通知、復旧、別対象復元、再起動、7日観測 | BX03・04の復元と時間変化へ |
| [SE07 総合課題](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/stages/07-capstone.md) | 条件変更、新規VM、未知障害、他者実行 | BR3の基礎証拠、BR4の入口 |
| [評価手順](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/assessment.md) / [台帳手順](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/tracker-guide.md) | 支援量、最新試行、他者観察、非公開台帳 | 新しい評価枠も同じ証拠原則へ接続 |
| [PJ案件運営](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-projects/README.md) / [運用](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-projects/operations.md) | 受付・範囲・承認・検収・保守・終結、複数案件 | BX07・11で他者との実際の判断を評価 |
| [職場接続](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/server-engineer/workplace.md) | 30・60・90日と担当範囲 | 学習から実務への引き渡し |
| [既存24週教材](https://github.com/ns7jp/ns7jp/blob/b3dd74756c53b6eeebb38c5fc65b16a7d27f8824/docs/learning-plan/02-curriculum.md) | 読む内容とハンズオン、週15時間の計画 | 新計画ではSE条件ごとの素材として選択 |
| [設計判断](https://github.com/ns7jp/server/blob/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/design-decisions.md) / [SLO](https://github.com/ns7jp/server/blob/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/slo.md) | 比較・残存リスク・品質指標 | BX04・05・11で実際の測定と判断へ発展 |
| [実測の索引](https://github.com/ns7jp/server/blob/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/evidence/README.md) | 当時の対象・版・環境・未実施 | 本人の現在技能へ自動転記せず教材として読む |

## 実績の境界をどう扱うか

調査時の証跡索引には、8月の使い捨てUbuntu runnerでのE2E、9月の手元VMの基盤構築、ADの構築・復元・複製・停止・FSMO操作、DHCPのnetns/コンテナ内測定が記録されています。これらをすべて同一環境や同一案件の成果として合算しません。

ADは全面未実施とは書けません。一方で、既存記録を読んだだけで新しい学習者がADを独力で構築・復旧できるともしません。記録当時のVMが削除・再構成されている場合があり、過去のホスト名を現在の対象として操作しない設計にしています。

Ubuntu/AlmaLinuxの`foundation.yml`の記録と、監視全体を含む`site.yml`の適用、独立した対象ホストの受入は別です。索引上でD-2、AWS apply/destroy、永続hostの再起動・24/72時間、対象hostの受入などが未実施なら、そのまま残します。

これらの判断は[調査版の実測索引](https://github.com/ns7jp/server/blob/d0a69321ffb3248c8e953d75bea5ff9512c1b838/docs/evidence/README.md)の記述を根拠にしています。今回、記録された数値を再測定していないため、本設計は特定の復旧秒数を本人の新しい達成値として掲載していません。

## 一次資料と、この設計に使った範囲

確認日：2026-09-06。技術的な仕組みの根拠であり、BR/BXの段階数や学習時間の根拠ではありません。

| 一次資料 | 確認した内容 | 設計への反映 |
| --- | --- | --- |
| [Ubuntu Server documentation](https://ubuntu.com/server/docs/) | OS管理、ネットワーク、ストレージ、セキュリティ、サービス等の公式入口 | BR1の補習先。導入版に対応する説明を選ぶ |
| [Docker Compose stop](https://docs.docker.com/reference/cli/docker/compose/stop/) / [start](https://docs.docker.com/reference/cli/docker/compose/start/) | 停止と既存コンテナの再開 | 最小実習の計画停止をデータ削除と区別 |
| [Ansible check/diff](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html) | checkの制約、check指定でも通常実行するタスク、diffの秘密情報 | 静的/予行確認と実適用を分ける |
| [PostgreSQL 16 Backup and Restore](https://www.postgresql.org/docs/16/backup.html) | 論理ダンプ、ファイルシステム、継続アーカイブの方式区分 | 方式と版に応じて復元を設計する |
| [Google SRE Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) | 利用者視点と遅延・トラフィック・エラー・飽和 | BX04の測定観点 |
| [Google SRE Implementing SLOs](https://sre.google/workbook/implementing-slos/) | 利用者に基づくSLI/SLO、目標と運用方針の合意 | BX05・11で品質目標を意思決定へ接続 |
| [AWS Operational Readiness Reviews](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html) | 運用開始前の確認、障害の教訓の反映 | BX12で観測から標準改訂と再確認へ |
| [Microsoft AD Forest Recovery](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-guide) | 環境に応じたディレクトリ復旧計画 | ADの専門分岐と復旧の境界 |
| [Microsoft Hyper-V checkpoints](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/checkpoints) | チェックポイントの種類とバックアップとの違い | VMの巻戻しだけで復旧設計を完了にしない |

## 調査時の差異と対応

| 項目 | 今回確認した差異 | 今回の扱い | 統合時の対応 |
| --- | --- | --- | --- |
| 学習時間 | SE入口は週10時間程度、24週本文は週15時間 | 本設計は週10時間。旧素材すべての消化を保証しない | SE入口へ工数の違いを注記 |
| SE07-C2 | 詳細本文は変更2項目以上、評価要約は1項目 | 詳細本文の条件を採用 | 詳細本文の2項目以上に評価要約を統一。既存32条件は変更しない |
| 実測の現状 | 古い要約に後日の実測が反映されていない箇所がある | 現行索引から日付と範囲を読む | 当時の履歴は残し、現状への案内を追加 |

この追加文書と同じ変更で、SE入口には学習時間の違いを注記し、SE07-C2の評価要約を詳細本文へ合わせました。実測記録の履歴は変更していません。
