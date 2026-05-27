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
| アーキテクチャ図（現状 / 将来） | ✅ 完了 |
| server-monitor 改善計画 5 本 | ✅ 完了（設計のみ、実装は別リポジトリ） |
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了 |

### 未対応 / 将来対応

- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）
- [ ] IT サポート資料を **実体験ベース** に書き換え（IT サポート業務に従事してから）
- [ ] 資格ロードマップの日程確定（学習着手後に随時更新）

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor 本体（v1.0：Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager + CI）は **既に実装済み** です。
本 PR で新たに整備したのは、その上に積む **v1.1 〜 v2.0 の改善計画（設計）** であり、これらの **実装は未着手** です。

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み（server-monitor 本体） | — |
| v1.1 | Loki + Promtail ログ集約 | ⬜ 設計のみ・実装未着手 | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ⬜ 設計のみ・実装未着手 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ⬜ 設計のみ・実装未着手 | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ⬜ 設計のみ・実装未着手 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ⬜ 設計のみ・実装未着手 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |

### 着手予定順

1. **v1.1（Loki）** — 既存スタックへの最小コストでの統合、学習効果も高い
2. **v1.2（Ansible）** — 手順書のコード化、v2.0 への布石
3. **v1.3（SLO / 復旧演習）** — 既存環境のまま運用品質を可視化
4. **v2.0（AWS + Terraform）** — Ansible 完了後、IaC をフルに適用

---

## 3. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント** は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません
- **server-monitor 本体（v1.0）は実装済み**。本 PR で追加した **改善計画（v1.1 以降）は設計段階で、その実装コードは本リポジトリには含まれません**（server-monitor リポジトリで別途実装予定）

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
