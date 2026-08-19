# ADR-0003: ログ集約に Loki を採用

- **Status**: Accepted
- **Date**: 2026-03-10
- **Deciders**: ns7jp（個人ポートフォリオ）

> 公式ドキュメントや技術記事を調べて書いた学習目的の判断記録であり、
> 実務でのログ運用・チーム意思決定の経験に基づくものではない。
> 代替案の比較も、深く使い込んだ上での判断ではなく、調べた範囲での判断である。

---

## 1. Context

v1.0 はメトリクス中心で、障害時のログ調査は SSH + `journalctl` / `docker logs` の手作業に依存していた。
可観測性の三本柱（Metrics / Logs / Traces）を完成させるため、ログ集約基盤を選定する。

---

## 2. Decision

**Grafana Loki + Grafana Alloy** を採用する（[01 設計書](../server-monitor-improvements/01-loki-log-aggregation.md)）。

Prometheus と同じラベル思想で全文インデックスを持たないため軽量で、既存の Grafana 上でメトリクスと同じ UI からログを見られる点を決め手にした。

---

## 3. 他に見た選択肢

- **Elasticsearch + Logstash/Filebeat（ELK）**: 機能は豊富だが個人ホストでは重く、Prometheus と同居が難しいと感じた
- **Splunk**: エンタープライズ標準だがライセンスが高額で個人では扱えない
- **CloudWatch Logs**: AWS 専用でオンプレでは使えず、Grafana 統合も別途必要
- **Fluentd / Fluent Bit + S3**: 集約はできるが検索 UI が別途必要で、Grafana から見にくいと判断した

---

## 4. Consequences

- 1 つの Grafana で「メトリクス → ログ」のドリルダウンができ、ストレージコストも低く抑えられた
- 全文検索は ELK ほど得意ではなく、複雑な文字列検索には向かない
- ラベルにリクエスト ID など高カーディナリティな値を入れると破綻するため、ラベル設計のルールを決めて運用している

| ラベルにして良い | ラベルにしない |
| --- | --- |
| `job`, `app`, `env`, `host` | リクエスト ID, ユーザー ID |
| `level` (INFO/WARN/ERROR) | URL パス（ID が入る可能性） |
| `container_name` | 自由文字列のエラーメッセージ |

→ 詳細は [01 §5 ラベル設計](../server-monitor-improvements/01-loki-log-aggregation.md)

---

## 5. 参考

- [Grafana Loki Architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Loki vs Elasticsearch (Grafana 公式比較)](https://grafana.com/blog/2020/12/08/loki-vs-elasticsearch-which-tool-to-choose-for-log-analytics/)
- [Grafana Tempo / Loki / Mimir 統合パターン](https://grafana.com/docs/grafana-cloud/observability/)
