# 島田則幸 (Noriyuki Shimada)

## サーバー設計・構築エンジニア志望

製造・物流の現場で 15 年以上続けてきた「計測する・原因を絞る・手順化する・改善を定着させる」を、サーバーの構築・監視・障害対応に生かします。

**現況（2026-08）**: 派遣社員としてトライアル就業中です。第一志望は **サーバー設計・構築**、入口業務としてインフラ監視・運用、IT サポート、社内 SE 補助にも対応します。

## 30 秒で確認する 4 点

| 確認先 | 分かること | 公開状態 |
| --- | --- | --- |
| **[主作品：server-monitor](https://github.com/ns7jp/server-monitor)** | Ubuntu 上の構築、監視、ログ、障害復旧を一つにしたラボ | コード・設定・文書を公開 |
| **[検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)** | 実行日時、環境、commit、コマンド、結果と未実施項目 | Linux 実測 4 件を公開 |
| **[2〜3 分デモ](./docs/demo-script.md)** | 構築 → 障害注入 → 検知 → 復旧を見せる台本 | **動画は未公開（収録準備中）** |
| **[Linux サーバー構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)** | 要件、設計、パラメータ、構築、試験、変更、ネットワーク、引き渡し | 工程別成果物 10 点を公開 |

採用ご担当者さま向けの要約は [1 ページ版](./docs/overview-for-recruiters.md)、経歴とスキルは [職務経歴書・スキルシート](./docs/resume.md) にまとめています。

## 実測できていること

| 実施した検証 | 結果・証跡 |
| --- | --- |
| Ansible 4 ロールを Linux 上で適用し、2 回目の冪等性と期待状態を確認 | [`molecule test` 4 ロール PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)。途中で静的検査では見つからなかった欠陥 2 件を修正 |
| 監視スタック 9 サービスを Linux (WSL2) 上で起動 | [Grafana の実データ表示、Loki のログ取得を確認](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| app プロセスを意図的に停止し、自動復旧を計測 | [D-1 復旧演習 PASS、RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) |
| client → proxy → app の二セグメント構成で通信断を注入 | [障害再現 → 経路・名前解決の切り分け → 復旧まで PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-network-drill.md) |

一方、**Alertmanager → Slack の実配信、D-2 復旧演習、`site.yml` を通した新規構築、AWS の `apply / destroy` は未実測**です。[試験結果票](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-build-validation.md)も 21 項目中 11 項目が PASS、10 項目が `NOT RUN` のため、現時点では「構築完了」と判定していません。

## 主作品で扱った範囲

| 工程 | 実装・作成したもの |
| --- | --- |
| 設計 | 基本・詳細設計、構成図、OS / ミドルウェアパラメータ、IP アドレス表 |
| 構築 | Ubuntu 初期設定、Ansible roles、Docker Compose、Nginx、Gunicorn、systemd |
| 監視・ログ | Prometheus、Grafana、Alertmanager、Loki、Grafana Alloy |
| 試験 | pytest、構成検証 CI、試験仕様書、認証・非 root・公開範囲の確認項目 |
| 障害対応 | CPU 高負荷、プロセス停止、二セグメント通信断、ランブック、復旧判定 |
| 引き渡し | 構築手順、試験結果票、チェックリスト、変更・ロールバック手順 |

実装、CI、実機実測の境界を含む詳しい構成は [アーキテクチャ図](./docs/architecture-diagram.md) と [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に委ねています。

## AI の利用について

文書の構成・整形・調査、コードレビュー、リンクや表記の確認には AI 支援を使っています。AI が生成した手順や説明を、本人が実行・理解していない状態で実績にはしません。

本人が実機を操作し、仮説を外した経緯も含めて記録したものが [学習の一次記録（つまずきログ）](./LEARNINGS.md) と [server-monitor の証跡](https://github.com/ns7jp/server-monitor/tree/main/docs/evidence) です。たとえば、UFW の競合、Molecule 上の systemd に対する誤診、`docker kill` と再起動ポリシーの違いを、症状 → 原因 → 対処 → 学びの順で残しています。技術選定の最終判断、実機操作、結果の採録、機密情報のマスク、面接での説明は本人が担当します。

## 現場経験から生かせること

物流現場では作業時間を 15 分単位で計測し、棚配置・補充ルール・OJT 用マップを改善して、1 日あたり約 1 時間の作業時間短縮につなげました。この経験を、metrics / logs に基づく切り分け、構築手順とランブックの標準化、変更後の確認に生かします。

詳細：[業務改善レポート](./docs/business-improvement/picking-improvement.md) ／ [現場経験とインフラの橋渡し](./docs/career-bridge.md)

## スキル・資格

Linux、Docker Compose、Nginx、systemd、Prometheus、Grafana、Loki、Ansible、Terraform、GitHub Actions、Python、Flask、pytest。Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級、ITパスポートを取得し、基本情報技術者を学習中です。

応募先ごとの提示順は [志望トラックと証跡](./docs/target-roles.md)、学習計画と未実施項目は [STATUS](./STATUS.md) にまとめています。

その他の作品：[post](https://github.com/ns7jp/post)（PHP / MySQL）／ [pulse](https://github.com/ns7jp/pulse)（PHP / SQLite）／ [works](https://github.com/ns7jp/works)（学習作品）／ [ポートフォリオサイト](https://ns7jp.github.io/)

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
