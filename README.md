# 島田則幸 (Noriyuki Shimada)

## Linux サーバー設計・構築エンジニア志望

主作品の **[Server Monitor Infrastructure Lab](https://github.com/ns7jp/server-monitor)** は、使い捨て Ubuntu 24.04 上で `site.yml` による新規構築から監視・障害復旧・バックアップ復元まで一気通貫で検証し、23/23 ID PASS を採録したインフラ構築ラボです。2026-08-22 に[配備の再現性と権限制御を強化した PR #75](https://github.com/ns7jp/server-monitor/pull/75)まで main へ反映しました。

2026-08-23 には [PR #77 の GitHub Actions](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)で、候補版を変更されない Git SHA で配備した後、指定した旧版へ戻して再検証するロールバック実演も PASS しました。これは使い捨て runner 上の CI 結果で、PR #77 の main 反映や永続ホストでの変更作業を示すものではありません。

## 30 秒で確認する 3 点

| [Linux サーバー構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package) | [最新の実測証跡](https://ns7jp.github.io/evidence-demo.html) | [詰まった記録](./LEARNINGS.md) |
| --- | --- | --- |
| 要件定義から引き渡しまでの成果物 12 本（1,242 行） | 2026-08-22 の 23/23 PASS と未実測範囲 | 実機で外した仮説を、症状 → 原因 → 対処 → 学びで記録 |

[案件概要（1 枚）](https://ns7jp.github.io/project-brief.html) ／ [2 分 15 秒デモ（保存済み画面の証跡リプレイ）](https://ns7jp.github.io/demo.html)

## 志望と現況

製造・物流の現場で 15 年以上続けてきた「計測する・原因を絞る・手順化する・改善を定着させる」を、サーバーの構築・監視・障害対応に生かします。

**現況（2026-08）**: 派遣社員としてトライアル就業中です。第一志望は **Linux サーバー設計・構築**、入口業務としてインフラ監視・運用にも対応します。IT サポート・社内 SE 補助は応募先に応じた補助トラックです。

採用ご担当者さま向けの要約は [1 ページ版](./docs/overview-for-recruiters.md)、経歴とスキルは [職務経歴書・スキルシート](./docs/resume.md) にまとめています。

## 実測できていること

| 実施した検証 | 結果・証跡 |
| --- | --- |
| 使い捨て Ubuntu 24.04 への Full-stack E2E | [Docker 導入済み runner で `site.yml` 適用、2 回目 `changed=0`、core 10 services + CI webhook sink（計 11 containers）、local webhook の FIRING / RESOLVED、network / UFW、D-1 RTO 1 秒、3 volumes の backup / restore を確認し、23/23 ID PASS](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| Git SHA を指定した変更・ロールバック実演 | [候補 `84e1492` を配備後、旧版 `59aa88e` へ復帰し、稼働中の版番号、実行ファイルのハッシュ、app コンテナ再生成、不要ファイル除去、ローカル限定公開、Loki 取り込みまで PASS](./docs/evidence/2026-08-23-server-monitor-git-rollback-ci.md) |
| Docker API の権限制御とログ経路 | [read-only proxy の GET 成功、POST 拒否、固有 Nginx log の Alloy 経由 Loki 到達を同じ E2E で確認](https://github.com/ns7jp/server-monitor/actions/runs/32572409469) |
| Ansible 4 ロールを Linux 上で適用し、2 回目の冪等性と期待状態を確認 | [`molecule test` 4 ロール PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)。途中で静的検査では見つからなかった欠陥 2 件を修正 |
| 監視スタック 9 サービスを Linux (WSL2) 上で起動 | [Grafana の実データ表示、Loki のログ取得を確認](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| app プロセスを意図的に停止し、自動復旧を計測 | [2026-08-19 の WSL2 上の D-1 復旧演習 PASS、RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) |
| client → proxy → app の二セグメント構成で通信断を注入 | [障害再現 → 経路・名前解決の切り分け → 復旧まで PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-network-drill.md) |

上記はいずれも**使い捨て runner または WSL2 上の実測**です。独立した引き渡し対象ホスト、組織 DNS、Slack 実配信、AWS `apply`、長期稼働は未実測で、何がどこまで確認済みかは[検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)に 1 か所へまとめています。実行ログのない項目を実績として書くことはしません。

## 手を動かして実演できること（2026-08-24 に実行・採録）

スクリプトが実行結果から証跡を自動生成し、判定は期待値との比較なので、手で PASS を書き込む余地がありません。

**実行環境を正確に書きます。** B-1 は仮想ディスク（loop device）を割り当てた Ubuntu 24.04 ゲスト、B-2 / B-3 は Docker コンテナ、B-4 は network namespace 上での実行です。**いずれも AI 支援セッションの作業環境上で実行しており、独立した物理／VPS ホストや、私の手元の WSL2 上での再実行証跡ではありません。** 証跡ファイルの「実施環境」欄に採録時の `uname` をそのまま残しています（B-2 / B-3 / B-4 は `Linux 6.18.44-fc-v21`）。手元での再実行と、実行者欄を含む再採録は着手予定です（[STATUS](./STATUS.md) 参照）。

| 演習 | 内容 | 結果 |
| --- | --- | --- |
| [B-1 ディスク設計・LVM 拡張](https://github.com/ns7jp/server-monitor/blob/main/scripts/labs/lvm-drill.sh) | VG / LV を作り、容量を使い切り、PV を足して online 拡張する | [5 PASS / 0 FAIL](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-1.md)（220M→457M） |
| [B-2 3 層構成の障害切り分け](https://github.com/ns7jp/server-monitor/tree/main/labs/three-tier) | Web / AP / DB のどの層で止まっているかを層別 health で絞り込む | [9 PASS / 0 FAIL](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-2.md) |
| [B-3 DB バックアップ・復元](https://github.com/ns7jp/server-monitor/blob/main/labs/three-tier/run-restore-drill.sh) | `pg_dump` / `pg_restore` で復元し、RTO / RPO と内容ハッシュを突き合わせる | [7 PASS / 0 FAIL](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-3.md)（RTO 0.149 秒） |
| [B-4 L2 / L3 切り分け](https://github.com/ns7jp/server-monitor/tree/main/labs/routing) | 静的ルート、`ip_forward`、802.1Q VLAN ID 不一致を切り分ける | [6 PASS / 0 FAIL / 3 SKIP-ENV](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-4.md)（VLAN 部は kernel 都合で未検証） |

実行して初めて見つかった実バグは、1 件ずつ「症状 / 原因 / どの静的検査が見逃したか / 修正 PR」を [欠陥台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/defects-found.md) に起こしました。件数はこの台帳が正本です。

Ansible role は Ubuntu 22.04 / 24.04 に加えて **AlmaLinux / Rocky 9** に対応しています（`dnf`、firewalld、SELinux、dnf-automatic）。Molecule の `el9` シナリオを用意していますが、**実行証跡は未採録**で、実機の AlmaLinux ホストへ適用した証跡もありません。

## 詰まった記録

うまくいった結果より、**外した仮説**のほうが読んでいただく価値があると考えています。実機を触って初めて分かったことを、症状 → 原因 → 対処 → 学びの順で [LEARNINGS.md](./LEARNINGS.md) に残しています。

| 症状 | 何を取り違えていたか |
| --- | --- |
| UFW を設定する playbook が、2 回目に必ず `changed` になる | `allow` と `limit` が同じ port を奪い合っていた。静的検査は通っていた |
| 「コンテナだから systemd が動かせない」と診断した | 診断そのものが誤りだった。動かせない理由は別にあった |
| `docker kill` したのにコンテナが戻ってこない | `restart: unless-stopped` の対象外になる操作だと分かっていなかった |
| Hyper-V 上の AD ドメイン参加で「ドメインが見つかりません」 | DC が動いていることと、クライアントがその DC を DNS として見ていることは別だった |

**この 4 件を含む一次記録は、私が実機を触って書いたものです。**[AI の利用について](#ai-の利用について)のとおり、このリポジトリの他の文書には AI 支援が広く入っていますが、`LEARNINGS.md` だけは 2026-08-25 以降、本人のみが編集します（[STATUS §0](./STATUS.md) のルール 7）。

## 主作品の読み方

この README では、実行して確認した結果と未実施項目を中心に示します。採用ご担当者向けの全体像は [案件概要](https://ns7jp.github.io/project-brief.html)、最新結果は [実測証跡ダイジェスト](https://ns7jp.github.io/evidence-demo.html) に整理しています。設計、構築、試験、変更、引き渡しまでの成果物一覧は [Linux サーバー構築案件パック](https://github.com/ns7jp/server-monitor/tree/main/docs/build-package)、実装・CI・実測の境界は [構成図](./docs/architecture-diagram.md) と [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) にまとめています。

使用技術の一覧、資格、他の学習作品は [職務経歴書・スキルシート](./docs/resume.md)、未着手を含む学習計画は [STATUS](./STATUS.md) に分離しています。README の項目数を増やすより、主作品で実際に構築・検証・復旧した結果を優先して更新します。

## AI の利用について

AI 支援を使っている範囲を、`git log` で確認できる実態に合わせて書きます。

| 範囲 | 具体例 |
| --- | --- |
| 文書の構成・整形・調査 | README、設計書、ランブックの下書きと推敲 |
| **実装コードの生成** | Ansible role、Terraform module、CI workflow、テスト、ラボの雛形 |
| コードレビュー、リンク・表記の確認 | PR 上でのレビューと修正提案 |

**範囲は `server-monitor` に限りません。3 リポジトリすべての履歴に `Author: Claude <noreply@anthropic.com>` または `Co-Authored-By: Claude` のコミットが含まれます。** この職務経歴書・この README 自体も対象です。マージコミットを除いた実作業コミットに占める割合は次のとおりです（2026-08-25 時点、`git log --no-merges` で再現できます）。

| リポジトリ | Claude が著者または共同著者 | 実作業コミット総数 |
| --- | --- | --- |
| [ns7jp/ns7jp](https://github.com/ns7jp/ns7jp)（このプロフィール） | 42 | 71 |
| [ns7jp/server-monitor](https://github.com/ns7jp/server-monitor)（主作品） | 49 | 95 |
| [ns7jp/ns7jp.github.io](https://github.com/ns7jp/ns7jp.github.io)（サイト） | 19 | 77 |

文書の整形だけでなく、実装コードの生成にも使っている、という意味です。

**AI が生成した手順や説明を、本人が実行・理解していない状態で実績にはしません。** 実機の操作、結果の採録、機密情報のマスク、技術選定の最終判断、面接での説明は本人が担当します。

本人が実機を操作し、仮説を外した経緯も含めて記録したものが [学習の一次記録（つまずきログ）](./LEARNINGS.md) と [server-monitor の証跡](https://github.com/ns7jp/server-monitor/tree/main/docs/evidence) です。たとえば、UFW の競合、Molecule 上の systemd に対する誤診、`docker kill` と再起動ポリシーの違い、Hyper-V 上の AD ドメイン参加での DNS 向き先を、症状 → 原因 → 対処 → 学びの順で残しています。

## 現場経験から生かせること

物流現場では作業時間を 15 分単位で計測し、棚配置・補充ルール・OJT 用マップを改善して、1 日あたり約 1 時間の作業時間短縮につなげました。この経験を、metrics / logs に基づく切り分け、構築手順とランブックの標準化、変更後の確認に生かします。

詳細：[業務改善レポート](./docs/business-improvement/picking-improvement.md) ／ [現場経験とインフラの橋渡し](./docs/career-bridge.md)

## 経歴・資格・その他の作品

Python 3 エンジニア認定基礎・実践、PHP 8 技術者認定初級、IT パスポートを取得し、基本情報技術者を学習中です。技術ごとの習熟度、職歴、他の作品は [職務経歴書・スキルシート](./docs/resume.md)、応募先ごとの提示順は [志望トラックと証跡](./docs/target-roles.md) を参照してください。

## Contact

- Email: [net7jp@gmail.com](mailto:net7jp@gmail.com)
- GitHub: [github.com/ns7jp](https://github.com/ns7jp)
