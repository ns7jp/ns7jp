# 04. SLO / SLI / エラーバジェット設計

> 状態更新（2026-05-27）: recording rules、burn-rate alerts、Grafana dashboard、
> runbooks は [server-monitor](https://github.com/ns7jp/server-monitor) に実装済みである。
> 現行 blackbox-exporter は対象と同一ホスト内のラボ観測点であり、AWS の利用者視点 SLO
> を主張するには外部 synthetic probe の追加と証跡が必要である。
>
> この設計は Google SRE Book / Workbook などの公開されているパターンを表面的に真似て
> 組み立てたものであり、実際の SRE 業務経験に基づくものではない。用語の使い方や数値の
> 設定根拠を面接で深く問われた場合、体系立てて説明できるレベルには達していない。

## 1. 背景

現状の server-monitor は「障害アラート」は仕込んでいるが、**「どこまでの品質を守るべきか」** の目安（SLO）が定義されていなかった。目安がないとアラートの優先度（即対応か翌営業日対応か）や、変更を止めて調査すべきかの判断がしづらい。そこで簡単な目標値を決め、それに連動したアラートとダッシュボードを用意した。

---

## 2. 用語整理

| 用語 | 意味 | 例 |
| --- | --- | --- |
| **SLI** (Service Level Indicator) | サービス品質の指標 | 月間可用性 |
| **SLO** (Service Level Objective) | SLI に対する目標値 | 月間可用性 99.5% |
| **エラーバジェット** | SLO 達成のために許容される「失敗の量」 | 99.5% SLO → 30 日窓で 216 分の失敗を許容 |

---

## 3. 対象サービスと特性

server-monitor は **個人ラボの監視ダッシュボード**。利用者は自分一人、アクセスは学習・検証のため不定期。「監視の監視」なので止まると一次障害に気づけない。許容ダウンタイムは計画停止（早朝・週末）で月 1 時間としている。

---

## 4. SLI / SLO 定義

| 指標 | SLI 定義 | 計測方法 | SLO |
| --- | --- | --- | --- |
| 可用性 | `(ALB の 2xx+3xx+4xx) / 全リクエスト`（1 分粒度） | blackbox-exporter で `/health` を 30 秒毎にプローブ | 30 日窓で **99.5%**（許容ダウンタイム 216 分、計画停止は分母から除外） |
| レイテンシ | `/health` の p95 応答時間 | Prometheus `histogram_quantile()` | 28 日間で **p95 < 500ms を 99%** |
| アラート発火 | テスト障害発生から Alertmanager 通知到達までの時間 | 月 1 回、手動テスト（CPU 高負荷）で計測 | **2 分以内**に Slack 通知到達 |

---

## 5. エラーバジェット

| SLO | 期間 | バジェット |
| --- | --- | --- |
| 可用性 99.5% | 30 日 = 43,200 分 | 0.5% × 43,200 = **216 分** |
| レイテンシ 99% | 28 日のリクエスト数 N | 0.01 × N リクエスト |

バジェットを使い切りそうなときは新しい変更を一旦止めて原因調査を優先し、それ以外は通常運用とする。月に一度、消費量をざっと見返して明らかな超過があれば振り返る程度の簡単な運用としている。

---

## 6. ダッシュボード設計

Grafana に SLO 専用ダッシュボードを作成し、可用性達成率・エラーバジェット残量・p95 レイテンシ・当月のインシデント履歴を 1 画面で確認できるようにしている。

```promql
# 当月の可用性
sum_over_time(probe_success{job="health"}[30d])
  /
count_over_time(probe_success{job="health"}[30d])
```

エラーバジェット残量は、この可用性の値と SLO（99.5%）との差分から算出している。

---

## 7. アラート設計（SLO ベース）

「とりあえず CPU 80%」のような閾値型アラートではなく、**SLO の消費ペース** でアラートするようにした。急に悪化したときと、じわじわ悪化したときの両方に気づけるよう、短い時間窓と長い時間窓を組み合わせた条件でアラートを設定している（設定は SRE Book のパターンをそのまま真似たもので、しきい値の数字を自分で導出したわけではない）。

```yaml
groups:
  - name: slo-burn-rate
    rules:
      - alert: SLOFastBurn
        expr: |
          (
            (1 - (sum(rate(probe_success[5m])) / sum(rate(probe_success[5m]) + rate(probe_failure[5m])))) > (14.4 * 0.005)
          )
          and
          (
            (1 - (sum(rate(probe_success[1h])) / sum(rate(probe_success[1h]) + rate(probe_failure[1h])))) > (14.4 * 0.005)
          )
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error budget being consumed too fast"
          description: "At current rate, the error budget for 30d will be exhausted within hours."
```

---

## 8. ランブックとの連動

各 SLO 違反パターンに対応するランブックを紐付ける。

| アラート | ランブック |
| --- | --- |
| SLOFastBurn (可用性) | `runbooks/service-down.md` |
| LatencyHigh | `runbooks/latency-spike.md` |
| AlertmanagerDown | `runbooks/alertmanager-down.md`（監視の監視） |

---

## 9. 段階的導入

| 週 | 内容 |
| --- | --- |
| 1 | SLI 計測（blackbox-exporter 導入、Prometheus に組込み） |
| 2 | SLO ダッシュボード作成（Grafana） |
| 3 | バーンレートアラート設定、ランブック紐付け |
| 4 | 初回月次レビュー実施、運用に乗せる |

---

## 10. 完了条件（Definition of Done）

- [ ] `docs/slo.md` に SLI / SLO 定義が文書化されている
- [x] Grafana に SLO 専用ダッシュボードがある
- [x] バーンレートアラートが Alertmanager に登録されている
- [ ] 各アラートにランブック URL が annotation で紐付いている
- [ ] 初回月次レビューを実施し、議事録を `docs/slo-reviews/YYYY-MM.md` に残す

---

## 11. 参考

- [Google SRE Book — Chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Prometheus: Multi-Window Multi-Burn-Rate Alerts](https://promlabs.com/blog/2024/04/08/multi-window-multi-burn-rate-alerts/)
