# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-05-27（v1.2 設計拡充：ADR 8 本 / キャパ / 変更管理 / メタ監視 / FinOps / DB / NW / ID / カオス / Service Desk 計 17 本追加）

---

## 1. 本リポジトリ（ns7jp/ns7jp）

| 項目 | 状態 |
| --- | --- |
| プロフィール README 整備 | ✅ 完了 |
| IT サポート設計サンプル（FAQ / TS / Account / Service Desk Metrics） | ✅ 完了（設計サンプルとして明示） |
| 業務改善レポート | ✅ 完了（実数と再構成想定値を区別） |
| 資格ロードマップ | ✅ 完了（計画案として明示） |
| アーキテクチャ図（実装済み構成 / 検証境界） | ✅ 完了 |
| server-monitor 改善設計 5 本 | ✅ 実装状態へ同期（実行証跡の有無を明示） |
| 資格ロードマップ | ✅ 完了（計画案として明示、K8s 系も追記） |
| アーキテクチャ図（現状 / 将来） | ✅ 完了（v2.0 に Tempo / セキュリティ運用反映） |
| server-monitor 改善計画 17 本 | ✅ 完了（設計のみ、実装は別リポジトリ） |
| ADR（アーキテクチャ決定記録）8 本 | ✅ 完了（主要技術選定の根拠） |
| 現場経験 ↔ インフラ運用 橋渡しページ | ✅ 完了 |
| ビジュアルショーケース（テキストモックアップ） | ✅ 完了（実機キャプチャは実装後に追加予定） |
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了 |

### 未対応 / 将来対応

- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）
- [ ] IT サポート資料を **実体験ベース** に書き換え（IT サポート業務に従事してから）
- [ ] 資格ロードマップの日程確定（学習着手後に随時更新）
- [ ] ビジュアルショーケースに 10-17 系のテキストモックアップを追加検討

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor には Linux / Docker / Prometheus / Grafana / Nginx / Alertmanager に
加え、ログ集約、構成管理、SLO、復旧手順、AWS IaC のコードが実装されている。
一方、AWS の実適用・費用、Molecule 完全実行、復旧演習の実測ログはまだ
証跡として収録されていない。コード実装と実行実績を区別して表示する。

### コア改善（01-09）

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み（server-monitor 本体） | — |
| v1.1 | Loki + Grafana Alloy ログ集約 | ✅ 構成実装済み（Promtail EOL に伴い移行） | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ✅ roles / playbook 実装済み。full Molecule 証跡は未収録 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ✅ rules / dashboard 実装済み。ラボ内 SLI として扱う | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ✅ 手順・自動化実装済み。D-1 / D-2 実測は未収録 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ✅ IaC 実装済み。`apply` / Cost Explorer 証跡は未収録 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |
| v1.1 | Loki + Promtail ログ集約 | ⬜ 設計のみ・実装未着手 | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.1 | 分散トレーシング（Tempo + OpenTelemetry） | ⬜ 設計のみ・実装未着手 | [06](./docs/server-monitor-improvements/06-observability-traces.md) |
| v1.2 | Ansible 構成管理 | ⬜ 設計のみ・実装未着手 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ⬜ 設計のみ・実装未着手 | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | インシデント対応プロセス・ポストモーテム | ⬜ 設計のみ・実装未着手 | [07](./docs/server-monitor-improvements/07-incident-response.md) |
| v1.3 | バックアップ・復旧演習 | ⬜ 設計のみ・実装未着手 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v1.3 | セキュリティ運用プロセス | ⬜ 設計のみ・実装未着手 | [09](./docs/server-monitor-improvements/09-security-operations.md) |
| v2.0 | AWS + Terraform 化 | ⬜ 設計のみ・実装未着手 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |
| v3.0 | Kubernetes / EKS 発展計画 | ⬜ 学習ロードマップ段階（2027 Q2 着手予定） | [08](./docs/server-monitor-improvements/08-kubernetes-roadmap.md) |

### 運用品質・周辺技術の拡張（10-17）

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.1 | メタモニタリング（監視の監視） | ⬜ 設計のみ・実装未着手 | [12](./docs/server-monitor-improvements/12-meta-monitoring.md) |
| v1.2 | 変更管理プロセス | ⬜ 設計のみ・実装未着手 | [11](./docs/server-monitor-improvements/11-change-management.md) |
| v1.3 | キャパシティプランニング・負荷試験 | ⬜ 設計のみ・実装未着手 | [10](./docs/server-monitor-improvements/10-capacity-planning.md) |
| v1.3 | データベース運用設計 | ⬜ 設計のみ・実装未着手 | [14](./docs/server-monitor-improvements/14-database-operations.md) |
| v1.3 | カオスエンジニアリング / Game Day | ⬜ 設計のみ・実装未着手 | [17](./docs/server-monitor-improvements/17-chaos-engineering.md) |
| v2.0 | ネットワーク・DNS 運用 | ⬜ 設計のみ・実装未着手 | [15](./docs/server-monitor-improvements/15-network-operations.md) |
| v2.0 | アイデンティティ運用 | ⬜ 設計のみ・実装未着手 | [16](./docs/server-monitor-improvements/16-identity-operations.md) |
| v2.0 | FinOps（コスト最適化運用） | ⬜ 設計のみ・実装未着手 | [13](./docs/server-monitor-improvements/13-finops.md) |

### ADR（アーキテクチャ決定記録）

| # | テーマ | 状態 |
| --- | --- | --- |
| 0001 | 監視スタックに Prometheus + Grafana | ✅ 設計完了 |
| 0002 | v1 デプロイ方式に Docker Compose | ✅ 設計完了 |
| 0003 | ログ集約に Loki | ✅ 設計完了 |
| 0004 | 構成管理に Ansible | ✅ 設計完了 |
| 0005 | IaC に Terraform | ✅ 設計完了 |
| 0006 | 監視は自前運用 | ✅ 設計完了 |
| 0007 | 通知チャネルに Slack | ✅ 設計完了 |
| 0008 | 認証を Basic → OIDC SSO 段階移行 | ✅ 設計完了 |

### 次に採録する実測証跡

1. Linux Docker ホストで Compose と Alloy の起動・ログ検索結果を記録
2. `ansible-integration.yml` または Linux ホストで full `molecule test` を記録
3. D-1 プロセス停止演習の RTO / 通知結果を記録
4. 承認された AWS 検証で `plan` / `apply` / `destroy` と Cost Explorer 実費を記録
1. **v1.1（Loki + Tempo + メタ監視）** — 既存スタックへの最小コストでの統合、可観測性三本柱を完成させる + 監視自身の生存保証
2. **v1.2（Ansible + 変更管理）** — 手順書のコード化、変更プロセスを PR ベースで運用化
3. **v1.3（SLO / キャパ / IR / 復旧演習 / カオス / DB / セキュリティ）** — 既存環境のまま運用品質を可視化、月次レビューを一本化
4. **v2.0（AWS + Terraform + ネットワーク + ID + FinOps）** — Ansible 完了後、IaC をフルに適用、クラウド固有運用を整備
5. **v3.0（Kubernetes / EKS）** — CKAD/CKA 取得と連動した中長期トラック

---

## 3. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント**（FAQ / TS / Account / Service Desk Metrics）は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません
- **server-monitor の改善コードは別リポジトリに実装済み**。ただし AWS 稼働、費用、
  復元演習など実行を要する内容は、その証跡が追加されるまで実績として扱いません
- **server-monitor 本体（v1.0）は実装済み**。本リポジトリの **改善計画（v1.1 以降の 17 本）と ADR は設計段階で、その実装コードは本リポジトリには含まれません**（server-monitor リポジトリで別途実装予定）
- **ビジュアルショーケース** はテキストモックアップで先行整備しており、実機キャプチャは v1.1 以降の実装と同期して順次差し替えます

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
