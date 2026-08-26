# ADR-0001: 監視スタックに Prometheus + Grafana を採用

- **Status**: Accepted
- **Date**: 2026-01-15
- **Deciders**: ns7jp（個人ポートフォリオ）

> 公式ドキュメントや技術記事を調べて書いた学習目的の判断記録であり、
> 実務での監視運用・チーム意思決定の経験に基づくものではない。
> 代替案の比較も、深く使い込んだ上での判断ではなく、調べた範囲での判断である。

---

## 1. Context

サーバー監視ラボの基盤を構築するにあたり、メトリクス収集・可視化・アラートのスタックを選定する必要があった。

単一ホストで完結し Docker Compose で再現できること、学習価値が高く求人で見かける頻度の高い OSS であることを重視した。

---

## 2. Decision

**Prometheus（メトリクス収集）+ Grafana（可視化）+ Alertmanager（通知ルーティング）+ node-exporter（ホストメトリクス）** を採用する。

---

## 3. 他に見た選択肢

- **Zabbix**: エージェント型の老舗 OSS。Prometheus の方が教材・情報が多く独学しやすいと感じた
- **Datadog / New Relic（SaaS）**: 導入は早いが有料で、「自分で組み立てた」という学習の訴求が弱まると考えた
- **CloudWatch のみ**: AWS 専用でオンプレでは使えないため見送った

深い比較検討というより、「教材が多く独学しやすいか」を基準に選んだ。

---

## 4. Consequences

- Prometheus / Grafana は監視系の求人でよく見かける組み合わせで、Pull モデルや PromQL など基本的な考え方を学べた
- Loki（ログ）と同じ Grafana 上で統合できる（[01](../server-monitor-improvements/01-loki-log-aggregation.md)）
- Prometheus 単体では長期保存に弱く、監視自体の死活監視（メタモニタリング）も別途必要（[今後の興味リスト](../roadmap/README.md)）

---

## 5. 参考

- [Prometheus: Use Cases](https://prometheus.io/docs/introduction/overview/)
- [Google SRE Book — Chapter 6: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Cindy Sridharan, "Distributed Systems Observability"](https://www.oreilly.com/library/view/distributed-systems-observability/9781492033431/)
