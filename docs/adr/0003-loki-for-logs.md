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

## 5. 見直しのきっかけ（トリガー）

2026-09-28 に追加した節です。採用時に保守状況と EOL 予定を確認しておらず、Promtail の EOL（2026-03-02）で収集エージェントを Alloy へ移した経緯（[LEARNINGS.md](../../LEARNINGS.md)）を受けて、この判断を見直す条件をあらかじめ書いておきます。版の固定と更新の手順は、主作品の [ADR-008（監視 stack の image 版の固定と見直し）](https://github.com/ns7jp/server/blob/main/docs/design-decisions.md)を正本とし、この節はそれと同じ方針です。

次のいずれかが起きたら、この判断（Loki + Alloy）と使っている版を見直します。

- Loki・Alloy のうち、使っている系列の保守終了（EOL）が公式に告知された、または確認した
- 使っている版に、影響のあるセキュリティ修正が出た
- Loki のメジャーバージョンアップ（2.9 → 3 系など）で、設定の書き換えが必要になった（3 系では compactor の `shared_store` が廃止され、`store: tsdb`・`schema: v13` への移行が必要）
- 四半期に 1 回の定期確認（リリースノートと保守状況の確認）の時期になった
- 全文検索や高カーディナリティのラベルが必要になり、§4 の欠点が運用の支障になった

見直すときは、公式のリリースノートと移行ガイドで互換性のない変更を確かめてから、1 つの image だけを上げ、CI と E2E を再実行して結果を記録します。2026-09-28 時点で、どの更新も実施していません（`NOT RUN`）。

---

## 6. 参考

- [Grafana Loki Architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Loki vs Elasticsearch (Grafana 公式比較)](https://grafana.com/blog/2020/12/08/loki-vs-elasticsearch-which-tool-to-choose-for-log-analytics/)
- [Grafana Tempo / Loki / Mimir 統合パターン](https://grafana.com/docs/grafana-cloud/observability/)
