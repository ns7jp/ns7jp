# 島田則幸 (Noriyuki Shimada)

製造・物流の現場で培った正確性と業務改善力を生かし、IT サポート、社内 SE 補助、インフラ運用へのキャリアチェンジを目指しています。

---

## インフラ運用ポートフォリオ概観

```mermaid
flowchart LR
    subgraph Current[現状 v1.0]
        C1[Linux + Docker]
        C2[Prometheus + Grafana]
        C3[Nginx + TLS]
        C4[Alertmanager → Slack]
    end

    subgraph Next[改善計画 v1.1 - v2.0]
        N1[+ Loki ログ集約]
        N2[+ Tempo + OTel<br/>分散トレース]
        N3[+ Ansible 構成管理]
        N4[+ SLO / バーンレート<br/>+ キャパシティ計画]
        N5[+ インシデント運用<br/>+ ポストモーテム<br/>+ 変更管理]
        N6[+ 復旧演習<br/>+ カオス / Game Day]
        N7[+ セキュリティ運用<br/>+ ID ライフサイクル]
        N8[+ AWS / Terraform<br/>2 AZ 冗長化<br/>+ FinOps / ネットワーク運用]
        N9[+ メタ監視<br/>+ DB 運用]
    end

    subgraph Long[学習トラック v3.0]
        L1[+ Kubernetes / EKS]
    end

    Current --> Next --> Long
```

詳細：[アーキテクチャ図（現状 / 将来構想）](./docs/architecture-diagram.md) ／ [ADR（技術選定の根拠）](./docs/adr/README.md) ／ [ビジュアルショーケース](./docs/showcase/README.md)

---

## ハンズオン：Server Monitor Infrastructure Lab

リポジトリ：[server-monitor](https://github.com/ns7jp/server-monitor)

Linux サーバーの監視を題材に、Flask 製ダッシュボードを **安全に配備し、収集・可視化・通知・障害対応まで設計する** ポートフォリオです。

| 観点 | 実装・作成した内容 |
| --- | --- |
| 配備 | 非 root Docker イメージ、Docker Compose、Nginx、Gunicorn、systemd / TLS 設定例 |
| セキュリティ | Basic 認証、metrics 用 Bearer token、秘密ファイル管理、ホスト名・ユーザー名の既定マスク |
| 監視 | Prometheus、node-exporter、Grafana dashboard、Alertmanager、CPU / メモリ / ディスクのアラートルール |
| 運用 | 構成図、セキュリティ設計、構築手順、バックアップ復旧設計、停止ランブック、CPU 高負荷演習記録 |
| 品質 | pytest、GitHub Actions による API と配備設定の検証 |

設計資料:
[構成設計](https://github.com/ns7jp/server-monitor/blob/main/docs/architecture.md) /
[セキュリティ設計](https://github.com/ns7jp/server-monitor/blob/main/docs/security.md) /
[構築手順](https://github.com/ns7jp/server-monitor/blob/main/docs/deployment.md) /
[障害対応ランブック](https://github.com/ns7jp/server-monitor/blob/main/docs/runbooks/service-down.md)

---

## 改善計画（v1.1 → v2.0）

server-monitor を実運用水準へ引き上げるため、本リポジトリ内に **改善設計書を 17 本 + ADR 8 本** 整備しました。
着手前に設計を固め、段階的に server-monitor 側へ実装します。

### コア改善（運用基盤）

| # | テーマ | 解決する課題 | 設計書 |
| --- | --- | --- | --- |
| 01 | **Loki + Promtail ログ集約** | メトリクスのみで、障害時にログ調査が分断 | [01-loki-log-aggregation.md](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| 02 | **Ansible 構成管理** | 手順書ベースで再現性・移植性が低い | [02-ansible-automation.md](./docs/server-monitor-improvements/02-ansible-automation.md) |
| 03 | **AWS + Terraform 化** | クラウド / IaC / 冗長化の経験不足 | [03-terraform-aws.md](./docs/server-monitor-improvements/03-terraform-aws.md) |
| 04 | **SLO / エラーバジェット設計** | 閾値アラート止まりで品質指標が無い | [04-slo-design.md](./docs/server-monitor-improvements/04-slo-design.md) |
| 05 | **バックアップ・復旧演習** | バックアップ設計はあるが復旧実証なし | [05-backup-recovery-drill.md](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| 06 | **分散トレーシング（Tempo + OTel）** | 可観測性が「Metrics + Logs」止まりで、レイテンシ調査の動線がない | [06-observability-traces.md](./docs/server-monitor-improvements/06-observability-traces.md) |
| 07 | **インシデント対応・ポストモーテム** | 障害「対応」はあるが、組織として学ぶ仕組みが未整備 | [07-incident-response.md](./docs/server-monitor-improvements/07-incident-response.md) |
| 08 | **Kubernetes / EKS 発展計画** | Docker Compose 止まりで K8s 経験が無い（学習ロードマップ） | [08-kubernetes-roadmap.md](./docs/server-monitor-improvements/08-kubernetes-roadmap.md) |
| 09 | **セキュリティ運用プロセス** | 設定はあるが、運用としての継続性（脆弱性管理 / 監査 / SSO）が抜けている | [09-security-operations.md](./docs/server-monitor-improvements/09-security-operations.md) |

### 運用品質・周辺技術の拡張

| # | テーマ | 解決する課題 | 設計書 |
| --- | --- | --- | --- |
| 10 | **キャパシティプランニング** | SLO はあるが「余裕度」「スケール判断」が定量化されていない | [10-capacity-planning.md](./docs/server-monitor-improvements/10-capacity-planning.md) |
| 11 | **変更管理プロセス** | 障害対応はあるが、平常時変更の統制が無い（ITIL Change Enablement） | [11-change-management.md](./docs/server-monitor-improvements/11-change-management.md) |
| 12 | **メタモニタリング** | Prometheus 自身が落ちた時の検知設計が無い | [12-meta-monitoring.md](./docs/server-monitor-improvements/12-meta-monitoring.md) |
| 13 | **FinOps（コスト最適化運用）** | クラウド化の月額試算・タグ規約・Rightsizing が薄い | [13-finops.md](./docs/server-monitor-improvements/13-finops.md) |
| 14 | **データベース運用設計** | DB バックアップ / PITR / スロークエリ調査の設計が無い | [14-database-operations.md](./docs/server-monitor-improvements/14-database-operations.md) |
| 15 | **ネットワーク・DNS 運用** | TLS 期限監視・SG 棚卸し・VPN / SSM が抜けている | [15-network-operations.md](./docs/server-monitor-improvements/15-network-operations.md) |
| 16 | **アイデンティティ運用** | ID ライフサイクル・SSO 統合・特権管理の設計が無い | [16-identity-operations.md](./docs/server-monitor-improvements/16-identity-operations.md) |
| 17 | **カオスエンジニアリング / Game Day** | 「想定外」を仕組みで気付く、メタ監視の実証手段が無い | [17-chaos-engineering.md](./docs/server-monitor-improvements/17-chaos-engineering.md) |

ロードマップと依存関係：[改善計画 一覧](./docs/server-monitor-improvements/README.md)

### ADR（アーキテクチャ決定記録）

主要な技術選定の「**なぜそれを選んだか**」を別立てで記録しています。

[ADR 一覧 →](./docs/adr/README.md)（Prometheus / Docker Compose / Loki / Ansible / Terraform / 自前運用 / Slack / 段階的認証 の 8 本）

---

## IT サポート・社内 SE 補助ドキュメント

問い合わせ対応・キッティング・棚卸しなど、社内 IT サポート業務で必要になる手順とフローを自作しました。

| ドキュメント | 内容 |
| --- | --- |
| [想定 FAQ](./docs/it-support/faq.md) | 「PC が遅い」「メール届かない」「VPN 繋がらない」など 10 カテゴリ、一次切り分け手順付き |
| [トラブルシューティングフロー](./docs/it-support/troubleshooting.md) | ネットワーク・印刷・パスワード・不審メール等の Mermaid フローチャート |
| [アカウント管理・キッティング手順](./docs/it-support/account-management.md) | 入社・異動・退職・四半期棚卸しの SOP、PowerShell / SQL サンプル付き |
| [Service Desk メトリクス設計](./docs/it-support/service-desk-metrics.md) | FCR / MTTR / CSAT / ABC 分析・Sev 別 SLO・SLO 思想との連続性 |

---

## 業務改善実績

物流現場でのピッキング工程を、計測 → 仮説 → 実施 → 検証 → 標準化の流れで改善し、**1 日あたり約 1 時間の作業時間短縮** を達成しました。

- 1 週間の作業時間ログを 15 分単位で計測し、ボトルネックを特定
- 棚ラベル更新・動線改善（ABC 分析）・在庫補充の閾値運用・OJT 用マップ整備
- 標準化（マップ・チェックリスト）で改善のリバウンドを防止

詳細レポート：[業務改善レポート（在庫管理・ピッキング工程）](./docs/business-improvement/picking-improvement.md)

> 当時の継続計測ルールを設計していなかった反省を踏まえ、サーバー監視ラボでは [SLO 設計](./docs/server-monitor-improvements/04-slo-design.md) として継続計測の仕組み化を進めています。

### 現場経験 ↔ インフラ運用の橋渡し

物流現場で培ったコア能力（計測 → 仮説 → 標準化、5S、ABC 分析、属人化排除）を、インフラ運用の各領域へどう転用するかを 1 ページにまとめました。

詳細：[現場経験とインフラ運用の橋渡し](./docs/career-bridge.md)

---

## ポートフォリオ作品一覧

| 作品 | 技術・取り組み | リンク |
| --- | --- | --- |
| サーバー監視・運用ラボ | Linux / Docker / Nginx / Prometheus / Grafana / Flask | [Code & Docs](https://github.com/ns7jp/server-monitor) |
| 作品集 | Python / HTML / CSS | [Code](https://github.com/ns7jp/works) |
| 掲示板アプリ | PHP / MySQL / CSRF 対策 / bcrypt / PDO | [Code](https://github.com/ns7jp/post) |
| SNS アプリ「Pulse」 | PHP / SQLite | [Code](https://github.com/ns7jp/pulse) |

ポートフォリオサイト: [https://ns7jp.github.io/](https://ns7jp.github.io/)

---

## スキル・学習実績

### 取得済み

- Python: Python 3 エンジニア認定基礎・実践 取得
- PHP: PHP 8 技術者認定初級 取得
- Web: HTML / CSS / JavaScript / SQL (SQLite, MySQL)
- Infrastructure: Linux サーバー監視、Docker Compose、Nginx、Prometheus / Grafana、運用手順書作成

### 取得計画

体系的にインフラ運用の専門性を裏付けるため、以下を計画的に取得していきます。

| 時期 | 資格 |
| --- | --- |
| 2026 Q2-Q3 | LPIC-1 (101 / 102)、ITIL 4 Foundation |
| 2026 Q4 - 2027 Q1 | CCNA、AWS Solutions Architect Associate |
| 2027 Q2-Q4 | LPIC-2、AWS SysOps Administrator Associate |

詳細：[資格取得ロードマップ](./docs/certifications/roadmap.md)

### 訓練校

公共職業訓練「情報処理 (Python エンジニア) コース」(ISP アカデミー川越校 / 2025 年 10 月 - 2026 年 1 月) 修了。

---

## これまでの経験

- 製造・物流業務 10 年以上
- 在庫管理・ピッキング業務で、作業時間を **1 日約 1 時間短縮** する改善を実施
- 中部大学 応用生物学部 応用生物化学科 卒業

---

## 目指す役割

問い合わせや障害の切り分け、手順書整備、サーバー監視、継続的な業務改善に、**現場経験と技術検証の両面** から貢献できるインフラ運用担当を目指しています。

「設計 → 実装 → 運用 → 改善」のサイクルを、机上の知識ではなく **手を動かしたアウトプット** で示すことを意識しています。

---

## ポートフォリオ進捗

各ドキュメントの「実績 / 設計サンプル / 計画」の区別と、server-monitor 側の実装進捗は [STATUS.md](./STATUS.md) で一覧管理しています。
採用ご担当者様は併せてご覧ください。
