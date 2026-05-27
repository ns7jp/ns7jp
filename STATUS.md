# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-05-27（v1.1 設計の拡充：可観測性三本柱 / インシデント対応 / K8s ロードマップ / セキュリティ運用 / 橋渡しページ / ショーケース追加）

---

## 1. 本リポジトリ（ns7jp/ns7jp）

| 項目 | 状態 |
| --- | --- |
| プロフィール README 整備 | ✅ 完了 |
| IT サポート設計サンプル（FAQ / TS / Account） | ✅ 完了（設計サンプルとして明示） |
| 業務改善レポート | ✅ 完了（実数と再構成想定値を区別） |
| 資格ロードマップ | ✅ 完了（計画案として明示、K8s 系も追記） |
| アーキテクチャ図（現状 / 将来） | ✅ 完了（v2.0 に Tempo / セキュリティ運用反映） |
| server-monitor 改善計画 9 本 | ✅ 完了（設計のみ、実装は別リポジトリ） |
| 現場経験 ↔ インフラ運用 橋渡しページ | ✅ 完了 |
| ビジュアルショーケース（テキストモックアップ） | ✅ 完了（実機キャプチャは実装後に追加予定） |
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
| v1.1 | 分散トレーシング（Tempo + OpenTelemetry） | ⬜ 設計のみ・実装未着手 | [06](./docs/server-monitor-improvements/06-observability-traces.md) |
| v1.2 | Ansible 構成管理 | ⬜ 設計のみ・実装未着手 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ⬜ 設計のみ・実装未着手 | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | インシデント対応プロセス・ポストモーテム | ⬜ 設計のみ・実装未着手 | [07](./docs/server-monitor-improvements/07-incident-response.md) |
| v1.3 | バックアップ・復旧演習 | ⬜ 設計のみ・実装未着手 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v1.3 | セキュリティ運用プロセス | ⬜ 設計のみ・実装未着手 | [09](./docs/server-monitor-improvements/09-security-operations.md) |
| v2.0 | AWS + Terraform 化 | ⬜ 設計のみ・実装未着手 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |
| v3.0 | Kubernetes / EKS 発展計画 | ⬜ 学習ロードマップ段階（2027 Q2 着手予定） | [08](./docs/server-monitor-improvements/08-kubernetes-roadmap.md) |

### 着手予定順

1. **v1.1（Loki + Tempo）** — 既存スタックへの最小コストでの統合、可観測性三本柱を完成させる
2. **v1.2（Ansible）** — 手順書のコード化、v2.0 への布石
3. **v1.3（SLO / インシデント運用 / 復旧演習 / セキュリティ運用）** — 既存環境のまま運用品質を可視化、月次レビューを一本化
4. **v2.0（AWS + Terraform）** — Ansible 完了後、IaC をフルに適用
5. **v3.0（Kubernetes / EKS）** — CKAD/CKA 取得と連動した中長期トラック

---

## 3. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント** は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません
- **server-monitor 本体（v1.0）は実装済み**。本 PR で追加した **改善計画（v1.1 以降）は設計段階で、その実装コードは本リポジトリには含まれません**（server-monitor リポジトリで別途実装予定）
- **ビジュアルショーケース** はテキストモックアップで先行整備しており、実機キャプチャは v1.1 以降の実装と同期して順次差し替えます

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
