# ADR-0001: 監視スタックに Prometheus + Grafana を採用

- **Status**: Accepted
- **Date**: 2026-01-15
- **Deciders**: ns7jp（個人ポートフォリオ）

---

## 1. Context

サーバー監視ラボの基盤を構築するにあたり、メトリクス収集・可視化・アラートのスタックを選定する必要があった。

**要件：**

- ホストメトリクス（CPU / Mem / Disk / NW）とアプリメトリクス（HTTP）を統合
- 学習価値が高く、求人で出現頻度の高い OSS
- 単一ホストで完結し、Docker Compose で再現できる
- 将来 Kubernetes へ移行しても通用するメンタルモデル
- 個人で運用できるコスト（実質ゼロ）

---

## 2. Decision

**Prometheus（メトリクス収集）+ Grafana（可視化）+ Alertmanager（通知ルーティング）+ node-exporter（ホストメトリクス）** を採用する。

---

## 3. Alternatives

| 選択肢 | 評価 | 不採用理由 |
| --- | --- | --- |
| **Zabbix** | エージェント型で歴史が長い、日本企業に多い | Pull モデル / PromQL / Kubernetes 親和性で Prometheus が現代の主流。学習投資対効果で劣後 |
| **Datadog（SaaS）** | UI 完成度高、開封即利用、APM 統合 | コスト（ホスト 1 台でも $15+/月、本気で学ぶには複数台必要）。「自分で組み立てた」訴求が弱まる |
| **New Relic（SaaS）** | 無料枠 100GB/月、観測性が広い | 同上、SaaS のため内部構造が見えず学習用途で不利 |
| **CloudWatch のみ** | AWS と統合、コスト安 | オンプレ / マルチクラウド時に陳腐化、PromQL のような汎用クエリ言語が無い |
| **Nagios / Zabbix 互換 OSS** | 古典的、業務系で残存 | 設計思想がモニタリングのモダンプラクティス（Pull / 多次元ラベル / SLO ベース）と乖離 |
| **Grafana Cloud（マネージド Prometheus）** | OSS と互換、保守不要 | 無料枠は良いが「Prometheus を自分で運用できる」訴求が弱まる |

---

## 4. Consequences

### 4.1 良い影響

- **求人マッチ**：Prometheus / Grafana は「Linux + Docker + 監視」案件で第一選択肢
- **学習価値**：Pull モデル、多次元ラベル、PromQL、Recording Rules、Federation など、設計思想を体得できる
- **拡張性**：Loki（ログ）/ Tempo（トレース）が同じ Grafana で統合可能（[01](../server-monitor-improvements/01-loki-log-aggregation.md) / [06](../server-monitor-improvements/06-observability-traces.md)）
- **SLO 設計と直結**：histogram + Burn Rate アラート（[04](../server-monitor-improvements/04-slo-design.md)）が公式パターンとして確立

### 4.2 悪い影響・制約

- **長期保存に弱い**：Prometheus 単体では数週間が現実的、長期保存には Thanos / Mimir / Cortex が必要
- **アラートの構築コスト**：SaaS なら標準テンプレで済む部分を、Recording / Alerting Rule で自分で書く必要
- **モニタリングの監視（メタモニタリング）が課題**：Prometheus 自体が落ちた場合の検知設計が別途必要 → [12 メタモニタリング](../server-monitor-improvements/12-meta-monitoring.md) で対応

### 4.3 将来の見直しトリガー

- ホスト数が 20 台を超えたら：Thanos / Mimir 導入を検討
- マルチクラウド / EKS 移行：Grafana Cloud or kube-prometheus-stack に再評価
- 商用案件で SLA 必要：Datadog / New Relic SaaS への置換も比較対象

---

## 5. 参考

- [Prometheus: Use Cases](https://prometheus.io/docs/introduction/overview/)
- [Google SRE Book — Chapter 6: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Cindy Sridharan, "Distributed Systems Observability"](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)
