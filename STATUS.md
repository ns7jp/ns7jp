# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-05-27

---

## 1. 本リポジトリ（ns7jp/ns7jp）

| 項目 | 状態 |
| --- | --- |
| プロフィール README 整備 | ✅ 完了 |
| IT サポート設計サンプル（FAQ / TS / Account） | ✅ 完了（設計サンプルとして明示） |
| 業務改善レポート | ✅ 完了（実数と再構成想定値を区別） |
| 資格ロードマップ | ✅ 完了（計画案として明示） |
| アーキテクチャ図（実装済み構成 / 検証境界） | ✅ 完了 |
| server-monitor 改善設計 5 本 | ✅ 実装状態へ同期（実行証跡の有無を明示） |
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了 |

### 未対応 / 将来対応

- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）
- [ ] IT サポート資料を **実体験ベース** に書き換え（IT サポート業務に従事してから）
- [ ] 資格ロードマップの日程確定（学習着手後に随時更新）

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor には Linux / Docker / Prometheus / Grafana / Nginx / Alertmanager に
加え、ログ集約、構成管理、SLO、復旧手順、AWS IaC のコードが実装されている。
一方、AWS の実適用・費用、Molecule 完全実行、復旧演習の実測ログはまだ
証跡として収録されていない。コード実装と実行実績を区別して表示する。

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み（server-monitor 本体） | — |
| v1.1 | Loki + Grafana Alloy ログ集約 | ✅ 構成実装済み（Promtail EOL に伴い移行） | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ✅ roles / playbook 実装済み。full Molecule 証跡は未収録 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ✅ rules / dashboard 実装済み。ラボ内 SLI として扱う | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ✅ 手順・自動化実装済み。D-1 / D-2 実測は未収録 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ✅ IaC 実装済み。`apply` / Cost Explorer 証跡は未収録 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |

### 次に採録する実測証跡

1. Linux Docker ホストで Compose と Alloy の起動・ログ検索結果を記録
2. `ansible-integration.yml` または Linux ホストで full `molecule test` を記録
3. D-1 プロセス停止演習の RTO / 通知結果を記録
4. 承認された AWS 検証で `plan` / `apply` / `destroy` と Cost Explorer 実費を記録

---

## 3. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント** は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません
- **server-monitor の改善コードは別リポジトリに実装済み**。ただし AWS 稼働、費用、
  復元演習など実行を要する内容は、その証跡が追加されるまで実績として扱いません

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
