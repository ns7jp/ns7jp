# ADR-0006: 監視は自前運用（SaaS を採用しない）

- **Status**: Accepted（ポートフォリオ用途）
- **Date**: 2026-01-20
- **Deciders**: ns7jp（個人ポートフォリオ）

---

## 1. Context

監視スタック（Prometheus / Grafana / Loki / Tempo）を **自前でホスティングする** か、**SaaS（Datadog / New Relic / Grafana Cloud）に任せる** かを決定する必要がある。

商用案件ではコスト・運用負荷の比較で SaaS が選ばれることも多いが、本ポートフォリオは **学習と訴求** が主目的である点を考慮する。

---

## 2. Decision

**監視スタックを自前で運用する**（同一 EC2 / 別 EC2 に Prometheus / Grafana / Loki / Tempo / Alertmanager をホスト）。

ただし、**SaaS を否定するわけではなく、案件で SaaS が要件なら使う** という姿勢を明文化する。本ポートフォリオでは「自分で組み立てられる」訴求のため自前運用を選ぶ。

---

## 3. Alternatives

| 選択肢 | 月額（個人想定） | 評価 | 不採用理由 |
| --- | --- | --- | --- |
| **Datadog** | $15-50（ホスト 1 台） | UI 完成度、APM、初期投資ゼロ | 「自分で組み立てた」訴求が消える、長期コスト高、学習が「Datadog の操作」に閉じる |
| **New Relic** | 無料枠 100GB/月 | 無料で APM 込み | 同上、内部構造が見えず学習用途で不利 |
| **Grafana Cloud（無料 / Pro）** | 無料 〜 $19 | OSS と互換、保守不要 | **代替候補として有力**。ただし「Prometheus / Loki を自前で運用した経験」の訴求が弱まる |
| **AWS CloudWatch + X-Ray** | $0.30/メトリクス + ログ料金 | AWS と統合、コスト予測可 | PromQL の汎用クエリ体験が無い、Grafana 統合は別途必要 |
| **自前運用（採用）** | EC2 1 台 $10-30 程度 | 学習価値最大、コスト透明 | 運用負荷を自分で負う |

---

## 4. Decision Rationale

### 4.1 なぜ自前運用か

1. **採用面接での訴求**：「Prometheus / Loki / Tempo を自前で運用しています」は「Datadog を使っています」より具体性が高い
2. **内部理解**：障害時に「Prometheus がデータをスクレイプできない」「Loki の ingester が詰まった」を切り分けられる経験は SaaS では得られない
3. **コスト透明性**：個人で運用するなら EC2 1 台で完結、SaaS の従量課金より予測可能
4. **マルチクラウド / オンプレ案件への対応**：自前経験があれば、SaaS の無いオンプレ案件でも通用する
5. **学習段階でのフィードバックループ**：「設定変えたら何が起きる」を直接観察できる

### 4.2 SaaS を採用する場合の判断基準

商用案件で以下が当てはまるなら SaaS を推奨：

- 監視自体を運用する人員がいない（インフラチーム 1〜2 名）
- SLA が厳しく、監視そのものの可用性に責任を取れない
- APM（アプリケーション内部の自動計装）が即座に必要
- マルチアカウント / マルチリージョンを統合的に見たい

---

## 5. Consequences

### 5.1 良い影響

- **設計判断の蓄積**：「ストレージ戦略」「ラベル設計」「Federation」など、自分で考える機会が連続して発生
- **メタモニタリング設計**（[12](../server-monitor-improvements/12-meta-monitoring.md)）の必然性：「監視そのものが落ちたら？」を真剣に考える契機
- **コスト最適化スキル**：Prometheus のリテンション、Loki のラベル基数を制御する経験は FinOps（[13](../roadmap/13-finops.md)）と直結
- **ポートフォリオの厚み**：8 本以上の設計書群が「自前運用の証拠」として揃う

### 5.2 悪い影響・制約

- **運用負荷**：自分でアップデート / バックアップ / 容量管理する責任
- **可用性の責任**：監視そのものの SLO は SaaS より低くなる
- **APM がない**：Datadog なら自動で取れるアプリ内部の計装を、OpenTelemetry で自分で実装する必要（[06](../server-monitor-improvements/06-observability-traces.md)）
- **アラート品質**：SaaS の機械学習ベースのアラート（異常検知）は自前では実装が重い

### 5.3 リスク低減策

- [12 メタモニタリング](../server-monitor-improvements/12-meta-monitoring.md)：外部からの Dead man's switch を組み込み、「監視が落ちたこと」を SaaS の Healthchecks.io 等で受ける
- 長期保管は S3 + Athena で実装、Prometheus 単体に依存しない設計

---

## 6. 案件で SaaS が必要になったら

「自前運用しか経験がありません」と思われないように、以下をリマインドメモとして残しておく：

- Datadog：アプリ内に Agent を入れる → Tags 設計が PromQL ラベルと同等の思想 → 自前経験がほぼそのまま活きる
- New Relic：NRQL は LogQL / PromQL とは方言が違うが、思想は同じ
- Grafana Cloud：自前運用の経験がそのまま移行可能、最も学習投資の活きる SaaS

---

## 7. 参考

- [Grafana Cloud Pricing](https://grafana.com/products/cloud/pricing/)
- [Datadog Pricing](https://www.datadoghq.com/pricing/)
- [「自前監視 vs SaaS 監視」議論まとめ（Cindy Sridharan）](https://copyconstruct.medium.com/monitoring-in-the-time-of-cloud-native-c87c7a5bfa3e)
