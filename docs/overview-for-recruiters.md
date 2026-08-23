# 採用ご担当者さまへ — 島田則幸

## 30 秒の結論

主作品の **[Server Monitor Infrastructure Lab](https://github.com/ns7jp/server-monitor)** は、使い捨て Ubuntu 24.04 上で `site.yml` による新規構築から監視・障害復旧・バックアップ復元まで一気通貫で検証し、23/23 ID PASS を採録したインフラ構築ラボです。[配備の再現性と権限制御を強化した PR #75](https://github.com/ns7jp/server-monitor/pull/75)まで main へ反映済みです。PR #77 では、Git SHA を固定した変更・ロールバック実演も CI で PASS しています（PR ブランチ・使い捨て runner の結果）。

| [案件概要](https://ns7jp.github.io/project-brief.html) | [最新の実測証跡](https://ns7jp.github.io/evidence-demo.html) | [2 分 15 秒デモ（証跡リプレイ）](https://ns7jp.github.io/demo.html) |
| --- | --- | --- |
| 設計から構築・試験・引き渡しまでの全体像 | 2026-08-22 の 23/23 PASS と未実測範囲 | 2026-08-18・19 の保存済み画面と復旧ログを再構成 |

## 志望と現況

製造・物流の現場で 15 年以上続けてきた「測る・原因を絞る・手順化する・定着させる」を、Linux サーバーの構築・運用に生かすエンジニア志望です。

**現況**: 派遣社員としてトライアル就業中（アデコ株式会社より株式会社Changeupへ就業。2026/07〜、トライアル期間 2 か月）。IT 業務に従事しながら、Linux サーバー構築へのキャリア移行を進めています。

| 項目 | 内容 |
| --- | --- |
| 夜勤・交代制 | 24/365 監視業務のシフト勤務に対応可能 |
| 勤務開始時期 | トライアル期間満了の 2026/09 以降。相談のうえ 1 か月以内の調整も可能 |

第一志望は **Linux サーバー構築・運用**。入口としてインフラ監視・運用にも対応します。IT サポート・社内 SE 補助は応募先に応じた補助トラックです。

## 実測したこと

| 検証 | 結果 |
| --- | --- |
| 使い捨て Ubuntu 24.04 への Full-stack E2E | [Docker 導入済み runner で `site.yml` 適用、2 回目 `changed=0`、core 10 services + CI webhook sink（計 11 containers）、local webhook の FIRING / RESOLVED、network / UFW、D-1 RTO 1 秒、3 volumes の backup / restore を確認し、23/23 ID PASS](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| Git SHA を固定した変更・ロールバック | [候補 `84e1492` → 旧版 `59aa88e` の配備・復帰後に、稼働中の版番号、実行ファイルのハッシュ、app コンテナ再生成、不要ファイル除去、ローカル限定公開、Loki 取り込みを確認](./evidence/2026-08-23-server-monitor-git-rollback-ci.md) |
| Docker API の権限制御とログ経路 | [read-only proxy の GET 成功、POST 拒否、固有 Nginx log の Alloy 経由 Loki 到達を確認](https://github.com/ns7jp/server-monitor/actions/runs/32572409469) |
| Ansible 4 ロールの適用・2 回目の冪等性・期待状態 | [全ロール PASS、欠陥 2 件を修正](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) |
| 監視スタック 9 サービスの起動と実データ表示 | [Grafana / Loki を Linux (WSL2) 上で確認](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| app プロセス停止からの自動復旧 | [2026-08-19 の WSL2 上の D-1 復旧演習 PASS、RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) |
| 二セグメント構成の通信断 | [再現、切り分け、復旧まで PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-network-drill.md) |

設計、パラメータ、構築、試験、変更、引き渡しの成果物は [案件概要](https://ns7jp.github.io/project-brief.html) と [Linux サーバー構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package) に分離しています。このページでは技術名を広く並べるより、実際に実行して結果を残した項目を優先します。

## その場で実演できること

証跡としては未採録ですが、面接の場で実行して結果をお見せできます。
判定はスクリプトが期待値と実測値を比較した結果で、証跡ファイルも自動生成されます。

| 演習 | 実演内容 | 所要 |
| --- | --- | --- |
| B-1 | LVM で VG / LV を作り、容量を使い切らせ、PV を足して online 拡張する | 10 分 |
| B-2 | Web / AP / DB の 3 層構成で、どの層が原因かを層別 health から絞り込む | 10 分 |
| B-3 | `pg_dump` / `pg_restore` で復元し、RTO / RPO と内容ハッシュを突き合わせる | 10 分 |
| B-4 | 静的ルート、`ip_forward`、VLAN ID 不一致の 3 パターンを切り分ける | 10 分 |

Ansible role は Ubuntu に加えて **AlmaLinux / Rocky 9** に対応しています
（`dnf`、firewalld、SELinux、dnf-automatic、`sshd_config.d` の上書き検査）。
[Molecule の `el9` シナリオ](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/common/molecule/el9)
で RHEL 系コンテナへの適用を検証しています。実機の AlmaLinux ホストへ適用した
証跡はまだありません。

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
[検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
の 1 か所で区別しています。上の「実測したこと」はすべて、使い捨て runner または
WSL2 上での結果です。

未実測の主なもの: Slack 実配信、AWS `apply / destroy`、D-2 復旧演習、
独立した管理端末・引き渡し対象ホスト、組織 DNS、再起動後の永続性、長期稼働、
AlmaLinux 実機への適用。**実行ログが無い項目を実績として書くことはしません。**

## 経歴・学習

- 派遣社員としてトライアル就業中（アデコ株式会社より株式会社Changeupへ就業。2026/07〜、Windows/Linux サーバー構築・AWS/Azure 構築の研修）
- 製造・物流業務 15 年以上
- 中部大学 応用生物学部 応用生物化学科 卒業
- 公共職業訓練「情報処理（Python エンジニア）コース」修了（2025 年 10 月〜2026 年 1 月）
- Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級
- LPIC-1 学習中

## 詳細

- [職務経歴書・スキルシート](./resume.md)
- [志望トラックと証跡](./target-roles.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [現場経験とインフラの橋渡し](./career-bridge.md)
- [プロフィール README](../README.md)
- [ポートフォリオサイト](https://ns7jp.github.io/)
