# ADR-0003: ログ集約に Loki を採用

- **Status**: Accepted
- **Date**: 2026-03-10
- **Deciders**: ns7jp（個人ポートフォリオ）

---

## 1. Context

v1.0 はメトリクス中心で、障害時のログ調査は SSH + `journalctl` / `docker logs` の手作業に依存している。
これでは「メトリクスでアラート → ログで原因特定」の動線が分断され、復旧時間が長くなる。

可観測性の三本柱（Metrics / Logs / Traces）を完成させるため、ログ集約基盤を選定する。

---

## 2. Decision

**Grafana Loki + Promtail** を採用する（[01 設計書](../server-monitor-improvements/01-loki-log-aggregation.md)）。

---

## 3. Alternatives

| 選択肢 | 評価 | 不採用理由 |
| --- | --- | --- |
| **Elasticsearch + Logstash + Kibana（ELK）** | 機能豊富、全文検索が強力 | リソース食う（JVM 数 GB）、個人ホストでは Prometheus と同居困難。運用コストが高い |
| **Elasticsearch + Filebeat + Kibana** | Logstash 抜きで軽量化 | それでも ES 自体が重い、同上 |
| **Splunk** | エンタープライズ標準 | ライセンス高額、個人で扱えない |
| **CloudWatch Logs** | AWS と統合、運用不要 | AWS 専用（オンプレ不可）、PromQL ライクのクエリ統合体験が無い、Grafana 統合は別途必要 |
| **Fluentd / Fluent Bit + S3** | 軽量、CNCF | 集約はできるが、検索 UI が別途必要（Athena 等）。Grafana から見にくい |
| **Graylog** | 機能豊富、OSS | ElasticSearch 依存で同じ問題、コミュニティが ELK / Loki ほど活発でない |
| **Vector + ClickHouse** | 高性能、注目株 | 学習教材が少ない、本ポートフォリオの段階では教材投資効率が悪い |

---

## 4. Decision Rationale

### 4.1 なぜ Loki か

1. **Grafana 完全統合**：同じ UI でメトリクスとログを切り替え可能。Trace（[06](../server-monitor-improvements/06-observability-traces.md)）も同 UI で繋がる
2. **ラベルベース索引**：全文インデックスを持たず、Prometheus と同じラベル思想。ストレージコストが ELK の 10 分の 1 程度
3. **PromQL に近い LogQL**：Prometheus を理解していればすぐ書ける
4. **軽量**：単一プロセス、個人ホストでも余裕で動く
5. **Promtail / Grafana Agent / Fluent Bit 等の多様な収集元**：柔軟

### 4.2 Trace 連携の重要性

Loki 採用の隠れた決め手は **「LogQL クエリ結果から traceID をワンクリックで Tempo にジャンプ」** という Grafana の DerivedFields 機能。

これにより、Metrics → Logs → Traces の **3 本柱を 1 UI で横断する動線** が成立する（[06 設計書 §5](../server-monitor-improvements/06-observability-traces.md)）。

---

## 5. Consequences

### 5.1 良い影響

- 1 つの Grafana で「メトリクス → ログ → トレース」のドリルダウン体験
- ストレージコストが低く、個人ホストでも数週間〜数ヶ月の保管が現実的
- 後の Kubernetes 移行で Loki Operator がそのまま使える

### 5.2 悪い影響・制約

- **全文検索が苦手**：「特定文字列が含まれる行を全期間検索」のような用途は ELK の方が速い → 必要な場合はラベル設計を工夫
- **ラベル設計を間違うと爆発**：高カーディナリティ（リクエスト ID 等）をラベルに入れると死ぬ。設計段階で「ラベルにする / しない」のルールを明文化
- **アラート機能はメトリクスより薄い**：LogQL アラートは可能だが、複雑な集計は Prometheus 側で行う方が安定

### 5.3 ラベル設計ルール（採用時の決め）

| ラベルにして良い | ラベルにしない |
| --- | --- |
| `job`, `app`, `env`, `host` | リクエスト ID, ユーザー ID |
| `level` (INFO/WARN/ERROR) | URL パス（IDが入る可能性） |
| `container_name` | 自由文字列のエラーメッセージ |

→ [01 §5 ラベル設計](../server-monitor-improvements/01-loki-log-aggregation.md) で詳細化

---

## 6. 参考

- [Grafana Loki Architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Loki vs Elasticsearch (Grafana 公式比較)](https://grafana.com/blog/2020/12/08/loki-vs-elasticsearch-which-tool-to-choose-for-log-analytics/)
- [Grafana Tempo / Loki / Mimir 統合パターン](https://grafana.com/docs/grafana-cloud/observability/)
