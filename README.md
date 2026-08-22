# 島田則幸 (Noriyuki Shimada)

## Linux サーバー設計・構築エンジニア志望

主作品の **[Server Monitor Infrastructure Lab](https://github.com/ns7jp/server-monitor)** は、使い捨て Ubuntu 24.04 上で `site.yml` による新規構築から監視・障害復旧・バックアップ復元まで一気通貫で検証し、23/23 ID PASS を採録したインフラ構築ラボです。2026-08-22 に[配備の再現性と権限制御を強化した PR #75](https://github.com/ns7jp/server-monitor/pull/75)まで main へ反映しました。

## 30 秒で確認する 3 点

| [案件概要](https://ns7jp.github.io/project-brief.html) | [最新の実測証跡](https://ns7jp.github.io/evidence-demo.html) | [2 分 15 秒デモ（証跡リプレイ）](https://ns7jp.github.io/demo.html) |
| --- | --- | --- |
| 設計から構築・試験・引き渡しまでの全体像 | 2026-08-22 の 23/23 PASS と未実測範囲 | 2026-08-18・19 の保存済み画面と復旧ログを再構成 |

## 志望と現況

製造・物流の現場で 15 年以上続けてきた「計測する・原因を絞る・手順化する・改善を定着させる」を、サーバーの構築・監視・障害対応に生かします。

**現況（2026-08）**: 派遣社員としてトライアル就業中です。第一志望は **Linux サーバー設計・構築**、入口業務としてインフラ監視・運用にも対応します。IT サポート・社内 SE 補助は応募先に応じた補助トラックです。

採用ご担当者さま向けの要約は [1 ページ版](./docs/overview-for-recruiters.md)、経歴とスキルは [職務経歴書・スキルシート](./docs/resume.md) にまとめています。

## 実測できていること

| 実施した検証 | 結果・証跡 |
| --- | --- |
| 使い捨て Ubuntu 24.04 への Full-stack E2E | [Docker 導入済み runner で `site.yml` 適用、2 回目 `changed=0`、core 10 services + CI webhook sink（計 11 containers）、local webhook の FIRING / RESOLVED、network / UFW、D-1 RTO 1 秒、3 volumes の backup / restore を確認し、23/23 ID PASS](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| Docker API の権限制御とログ経路 | [read-only proxy の GET 成功、POST 拒否、固有 Nginx log の Alloy 経由 Loki 到達を同じ E2E で確認](https://github.com/ns7jp/server-monitor/actions/runs/32572409469) |
| Ansible 4 ロールを Linux 上で適用し、2 回目の冪等性と期待状態を確認 | [`molecule test` 4 ロール PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)。途中で静的検査では見つからなかった欠陥 2 件を修正 |
| 監視スタック 9 サービスを Linux (WSL2) 上で起動 | [Grafana の実データ表示、Loki のログ取得を確認](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| app プロセスを意図的に停止し、自動復旧を計測 | [2026-08-19 の WSL2 上の D-1 復旧演習 PASS、RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) |
| client → proxy → app の二セグメント構成で通信断を注入 | [障害再現 → 経路・名前解決の切り分け → 復旧まで PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-network-drill.md) |

[2026-08-19 の試験結果票](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-build-validation.md)（21 項目中 11 項目 PASS、10 項目 `NOT RUN`）は当時の履歴として保持しています。その後、runtime 最終 commit [`7622a9d`](https://github.com/ns7jp/server-monitor/commit/7622a9da974f694ae75e0173135923701be9e5a5)を対象とする [PR #75 の E2E](https://github.com/ns7jp/server-monitor/actions/runs/32572409469)で 23/23 ID PASS を採録し、証跡文書を更新して main へマージしました。一方、**Alertmanager → Slack の実配信、AWS の `apply / destroy`、D-2 復旧演習、独立した管理端末・引き渡し対象ホスト、組織 DNS、ホスト再起動後の永続性、長期稼働の確認は未実測**です。local webhook の通知試験を Slack 実配信、使い捨て runner 内の network / UFW 試験を独立環境の証跡とは扱いません。また、runner には Docker が事前導入済みだったため、最小 OS への Docker 新規導入実績とも表現しません。

## 主作品の読み方

この README では、実行して確認した結果と未実施項目を中心に示します。採用ご担当者向けの全体像は [案件概要](https://ns7jp.github.io/project-brief.html)、最新結果は [実測証跡ダイジェスト](https://ns7jp.github.io/evidence-demo.html) に整理しています。設計、構築、試験、変更、引き渡しまでの成果物一覧は [Linux サーバー構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、実装・CI・実測の境界は [構成図](./docs/architecture-diagram.md) と [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) にまとめています。

使用技術の一覧、資格、他の学習作品は [職務経歴書・スキルシート](./docs/resume.md)、未着手を含む学習計画は [STATUS](./STATUS.md) に分離しています。README の項目数を増やすより、主作品で実際に構築・検証・復旧した結果を優先して更新します。

## AI の利用について

文書の構成・整形・調査、コードレビュー、リンクや表記の確認には AI 支援を使っています。AI が生成した手順や説明を、本人が実行・理解していない状態で実績にはしません。

本人が実機を操作し、仮説を外した経緯も含めて記録したものが [学習の一次記録（つまずきログ）](./LEARNINGS.md) と [server-monitor の証跡](https://github.com/ns7jp/server-monitor/tree/main/docs/evidence) です。たとえば、UFW の競合、Molecule 上の systemd に対する誤診、`docker kill` と再起動ポリシーの違いを、症状 → 原因 → 対処 → 学びの順で残しています。技術選定の最終判断、実機操作、結果の採録、機密情報のマスク、面接での説明は本人が担当します。

## 現場経験から生かせること

物流現場では作業時間を 15 分単位で計測し、棚配置・補充ルール・OJT 用マップを改善して、1 日あたり約 1 時間の作業時間短縮につなげました。この経験を、metrics / logs に基づく切り分け、構築手順とランブックの標準化、変更後の確認に生かします。

詳細：[業務改善レポート](./docs/business-improvement/picking-improvement.md) ／ [現場経験とインフラの橋渡し](./docs/career-bridge.md)

## 経歴・資格・その他の作品

Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級、IT パスポートを取得し、基本情報技術者を学習中です。技術ごとの習熟度、職歴、他の作品は [職務経歴書・スキルシート](./docs/resume.md)、応募先ごとの提示順は [志望トラックと証跡](./docs/target-roles.md) を参照してください。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
