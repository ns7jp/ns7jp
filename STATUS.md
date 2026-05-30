# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-05-30（README 冒頭を「まず見る 3 つ」へ圧縮、志望トラックを明確化、server-monitor 側に変更管理・証跡採録導線を追加）

---

## 1. 本リポジトリ（ns7jp/ns7jp）

| 項目 | 状態 |
| --- | --- |
| プロフィール README 整備 | ✅ 完了 |
| IT サポート設計サンプル（FAQ / TS / Account / Service Desk Metrics） | ✅ 完了（設計サンプルとして明示） |
| 業務改善レポート | ✅ 完了（実数と再構成想定値を区別） |
| 資格ロードマップ | ✅ 完了（計画案として明示） |
| アーキテクチャ図（実装済み構成 / 検証境界） | ✅ 完了 |
| server-monitor 改善設計 01-05 | ✅ server-monitor 側へ実装状態を同期（証跡待ちを明示） |
| server-monitor 改善設計 06-17 | ✅ 設計サンプル / 中長期ロードマップとして整備 |
| 証跡採録テンプレート | ✅ AWS / Molecule / D-1 / D-2 用を server-monitor 側へ追加 |
| ADR（アーキテクチャ決定記録）8 本 | ✅ 完了（主要技術選定の根拠） |
| 現場経験 ↔ インフラ運用 橋渡しページ | ✅ 完了 |
| ビジュアルショーケース | ✅ 実機キャプチャ枠とテキストモックアップを分離 |
| 採用ご担当者向け 1 枚サマリ | ✅ 完了（非技術者向け。英語要約付き） |
| 学習ログ Issue（#5-#7）/ 実証トラッキング Issue（#8） | ✅ 作成（「Issue で管理」を実運用化） |
| README の設計テーマ表示 | ✅ 06-17 を領域別サマリへ圧縮し「実装済み 01-05」を主軸化 |
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了 |
| 証跡採録チェックリスト（設計 → 実物の変換計画） | ✅ 追加（無料・ローカル優先の採録順） |
| デモ動画台本（壊して直す 2〜3 分） | ✅ 追加（収録待ち） |
| 学習の一次記録 LEARNINGS.md | ✅ 追加（記録中） |
| README / overview の連絡先 / CTA | ✅ 追加 |
| overview の壊れた resume リンク | ✅ 修正 |
| 志望トラックと証跡の対応 | ✅ 完了（インフラ運用を第一志望として明示） |
| 変更管理の実物化 | ✅ server-monitor 側に PR テンプレート / 変更管理ミニ運用を追加 |

### 未対応 / 将来対応（証跡採録フェーズ）

現在は**新規設計の追加を止め、実物の証跡採録を最優先**します（手順は [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に集約）。

- [ ] **実機の実測証跡を採録**（[#8](https://github.com/ns7jp/ns7jp/issues/8) で管理。[チェックリスト](./docs/evidence-capture-checklist.md) の優先 1〜5 は無料・ローカルで実施可能）
- [ ] **デモ動画を収録**（[台本](./docs/demo-script.md) 整備済み。最優先の差別化要素）
- [ ] **LEARNINGS.md に一次体験を記入**（つまずきの生ログで信頼性を裏付け）
- [ ] 応募先に応じて **社内 SE / Windows の最小証跡を追加**（PowerShell / AD / M365 など）
- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）
- [ ] IT サポート資料を **実体験ベース** に書き換え（IT サポート業務に従事してから）
- [ ] 資格ロードマップの日程確定（学習着手後に随時更新）

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor には Linux / Docker / Prometheus / Grafana / Nginx / Alertmanager に
加え、ログ集約、構成管理、SLO、復旧手順、AWS IaC のコードが実装されている。
一方、AWS の実適用・費用、Molecule 完全実行、復旧演習の実測ログはまだ
証跡として収録されていない。コード実装と実行実績を区別して表示する。

### 実装済み / 証跡待ち

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み（server-monitor 本体） | — |
| v1.1 | Loki + Grafana Alloy ログ集約 | ✅ 構成実装済み（Promtail EOL に伴い移行） | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ✅ roles / playbook 実装済み。full Molecule 証跡は未収録 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ✅ rules / dashboard 実装済み。ラボ内 SLI として扱う | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ✅ 手順・自動化実装済み。D-1 / D-2 実測は未収録 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ✅ IaC 実装済み。`apply` / Cost Explorer 証跡は未収録 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |

### 設計済み / 順次実装

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.1 | 分散トレーシング（Tempo + OpenTelemetry） | ⬜ 設計サンプル | [06](./docs/server-monitor-improvements/06-observability-traces.md) |
| v1.3 | インシデント対応プロセス・ポストモーテム | ⬜ 設計のみ・実装未着手 | [07](./docs/server-monitor-improvements/07-incident-response.md) |
| v1.3 | セキュリティ運用プロセス | ⬜ 設計のみ・実装未着手 | [09](./docs/server-monitor-improvements/09-security-operations.md) |
| v3.0 | Kubernetes / EKS 発展計画 | ⬜ 学習ロードマップ段階（2027 Q2 着手予定） | [08](./docs/server-monitor-improvements/08-kubernetes-roadmap.md) |
| v1.1 | メタモニタリング（監視の監視） | ⬜ 設計のみ・実装未着手 | [12](./docs/server-monitor-improvements/12-meta-monitoring.md) |
| v1.2 | 変更管理プロセス | ✅ PR / Issue テンプレートとミニ運用を server-monitor 側へ追加 | [11](./docs/server-monitor-improvements/11-change-management.md) |
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

### 実装ロードマップ

1. **v1.1（Tempo + メタ監視）** — 可観測性三本柱と監視自身の生存保証
2. **v1.2（変更管理）** — 構成変更を PR ベースの運用に寄せる
3. **v1.3（キャパ / IR / 復旧演習 / カオス / DB / セキュリティ）** — 運用品質レビューを一本化
4. **v2.0（AWS 実適用 + ネットワーク + ID + FinOps）** — IaC の実測とクラウド固有運用
5. **v3.0（Kubernetes / EKS）** — CKAD / CKA 取得と連動した中長期トラック

---

## 3. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント**（FAQ / TS / Account / Service Desk Metrics）は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません
- **server-monitor の改善コード 01-05 は別リポジトリに実装済み**。ただし AWS 稼働、費用、
  復元演習など実行を要する内容は、その証跡が追加されるまで実績として扱いません
- **06-17 は設計サンプル / ロードマップ** であり、実装コードや実測証跡と混同しません
- **ビジュアルショーケース** は実機キャプチャ枠とテキストモックアップを分離し、採録後に順次差し替えます

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
