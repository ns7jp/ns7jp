# ADR-0006: 監視は自前運用（SaaS を採用しない）

- **Status**: Accepted（ポートフォリオ用途）
- **Date**: 2026-01-20
- **Deciders**: ns7jp（個人ポートフォリオ）

> 公式ドキュメントや技術記事を調べて書いた学習目的の判断記録であり、
> 実務での運用経験・チーム意思決定に基づくものではない。
> SaaS との比較も、深く使い込んだ上での判断ではなく、調べた範囲での判断である。

---

## 1. Context

監視スタック（Prometheus / Grafana / Loki / Tempo）を自前でホスティングするか、SaaS（Datadog / New Relic / Grafana Cloud）に任せるかを決める必要がある。商用案件ではコストや運用負荷の比較で SaaS が選ばれることも多いが、本ポートフォリオは学習と訴求が主目的なので、あえて自前運用を選ぶ。

---

## 2. Decision

**監視スタックを自前で運用する**（EC2 上に Prometheus / Grafana / Loki / Tempo / Alertmanager をホスト）。SaaS を否定するわけではなく、案件で SaaS が要件ならそちらを使う。

---

## 3. 他に見た選択肢

- **Datadog / New Relic**: 無料枠や完成度の高い UI があるが、使うだけでは内部の仕組みを学べないと考え見送った
- **Grafana Cloud**: OSS 互換で保守も不要な有力な選択肢だったが、「自分で Prometheus / Loki を運用した」という経験を積みたく自前を選んだ
- **AWS CloudWatch + X-Ray**: コストは予測しやすいが、PromQL のようなクエリの学習にはならないため見送った

深い比較というより、「自分の手で組み立てて学べるか」を基準にした。

---

## 4. Consequences

- 自分でストレージ設計やアラート設計を考える機会が増える一方、アップデートやバックアップなど運用の負荷も自分で負う
- APM（アプリ内部の自動計装）のような SaaS 標準機能は無く、必要なら OpenTelemetry で自分で実装する
- 「監視そのものが落ちたら気づけるか」という課題が残るため、[メタモニタリング](../roadmap/12-meta-monitoring.md)で外部からのヘルスチェックを検討している

---

## 5. 参考

- [Grafana Cloud Pricing](https://grafana.com/products/cloud/pricing/)
- [Datadog Pricing](https://www.datadoghq.com/pricing/)
- [「自前監視 vs SaaS 監視」議論まとめ（Cindy Sridharan）](https://copyconstruct.medium.com/monitoring-in-the-time-of-cloud-native-c87c7a5bfa3e)
