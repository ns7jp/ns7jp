# 参考資料と今回の確認範囲

[育成システムへ戻る](README.md)

2026-09-05に現行リポジトリと次の公式資料を参照しました。8段階・32条件、24週後の総合演習、7日間観測、評価運用は、この教材の設計です。公式資格の認定基準ではありません。

## 技術の一次資料

| 資料 | この教材で使う観点 | 対応 |
| --- | --- | --- |
| [Ubuntu Server tutorial](https://ubuntu.com/server/docs/tutorial/) | OS導入、ターミナル、パッケージ管理の入口 | SE00・SE01 |
| [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/) | 対応環境と公式の導入経路 | SE03 |
| [Ansible check mode / diff mode](https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html) | 事前確認と実適用の違い。check mode非対応タスクの限界 | SE05 |
| [PostgreSQL 16 SQL Dump](https://www.postgresql.org/docs/16/backup-dump.html) | 論理バックアップと復元の考え方 | SE03・SE06 |
| [Prometheus alerting practices](https://prometheus.io/docs/practices/alerting/) | 利用者に影響する症状を監視し通知を扱う | SE06 |
| [Google SRE Workbook: Incident Response](https://sre.google/workbook/incident-response/) | 障害時の役割、連絡、復旧、記録 | SE06・SE07 |
| [GitHub Issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) | 提出・評価・不具合の入力欄 | 運営 |

外部手順は変更されます。導入前に対応OS・バージョン・設定値を再確認します。文書参照日と手順を実機で試した日は別です。

## 既存資産の確認

| 対象 | 確認した版 | 確認方法 |
| --- | --- | --- |
| ns7jp/ns7jp | `c0cc48275bcc9adabde76456e3b243e8808dbc40` | mainを取得、README・学習計画・キット・既存CIを確認 |
| ns7jp/server | `44c52e733826b9b5239918c05010b8b68b60346c` | 旧URLから取得した現在のコード。初心者ガイド、3層ラボ、案件パックを確認 |
| 分野別リポジトリ | [対応表](repository-map.md) | GitHubの現在の名前と公開URLを確認。全実装の実行試験はしていない |

## 確認できること・まだできないこと

ファイル整合、台帳の判定処理、リンク・書式はコードとCIで確認します。本人の実技、別ホストの動作、第三者の受領、7日間の観測、初心者の使いやすさは実際の記録を必要とします。既存の実測は、その記録の日時・環境・版に限る参考例です。

本システムを追加しただけでは、著者や新しい学習者の能力・職歴・資格・実測件数を更新しません。
