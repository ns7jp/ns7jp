# ビジュアルショーケース

> **本ドキュメントの位置付け**
>
> 採用ご担当者様が **数十秒で** 「何ができる人か」を判断できるよう、主要画面と動作のサンプルをまとめたページです。
>
> - **実機キャプチャ**：実際に動作している画面やログのみ掲載します
> - **テキストモックアップ部分**：設計済みの内容を ASCII で先行表示しています
> - **実機キャプチャ予定**：[server-monitor](https://github.com/ns7jp/server-monitor) 本体への [改善計画](../server-monitor-improvements/README.md) 実装が進むタイミングで、実画面のスクリーンショットへ差し替えます
>
> 「実物（既に動いているもの）」「設計サンプル」「未実装の計画」を **混同せず提示する** ことを意識しています。

---

## デモ（証跡リプレイ公開済み）

[2 分 15 秒の実測証跡リプレイ](https://ns7jp.github.io/demo.html)では、2026-08-18・19 に保存したサービス起動結果、Grafana 画面、D-1 復旧ログを時系列で確認できます。実操作の連続録画ではないことを、映像内とページ上に明記しています。ライブ実行の流れは [デモ案内](../demo-script.md) に分離しています。

| 区分 | 内容 | 状態 |
| --- | --- | --- |
| 証跡リプレイ | 保存済み実測画面と復旧ログ、字幕、文字起こし | **公開済み** |
| 自動デモ | 起動、障害注入、検知、復旧、証跡保存 | server-monitor に実装済み。結果は E2E artifact で判定 |
| 実操作の連続録画 | E2E 実行端末の cast | GitHub Actions artifact として保存。常設公開は未実施 |

> 編集済み動画だけを実測根拠にはしません。デモページから元のスクリーンショット、D-1 ログ、証跡台帳へ移動できます。

---

## 実機キャプチャ / 採録予定

| 区分 | 内容 | 状態 | 証跡 |
| --- | --- | --- | --- |
| 実機（**Linux(WSL2)**） | Server Monitor UI | 掲載済み（2026-08-18 起動、2026-08-19 差し替え） | [server-monitor screenshot](https://github.com/ns7jp/server-monitor/blob/main/docs/screenshot.png) ／ [実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| 実機 | Grafana 統合監視 dashboard（実データ表示） | 実測済み。ページ内スクリーンショットは未掲載 | [実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| 実機予定 | Alertmanager / Slack 通知 | 設定は実装済み。**実配信は未採録** | `server-monitor/docs/evidence/` |
| 実機 | D-1 復旧演習ログ（RTO 13 秒 PASS） | 実測済み | [D-1 演習記録](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) |
| 実機予定 | D-2 復旧演習ログ | テンプレート整備済み・未実施 | `server-monitor/docs/drills/logs/` |
| 実機予定 | AWS apply / destroy / Cost Explorer | テンプレート整備済み・未実施 | `server-monitor/docs/evidence/` |

![Server Monitor Dashboard（Linux(WSL2) 上での実行画面、2026-08-18）](https://raw.githubusercontent.com/ns7jp/server-monitor/main/docs/screenshot.png)

> **この画像について**: 上の画面は **Linux(WSL2) 上で実際に起動して撮影したもの**（[実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md)）。
> Grafana / Loki のダッシュボード自体のスクリーンショットは、本ページにはまだ未掲載（[チェックリスト](../evidence-capture-checklist.md)）。

採録時は秘密値、公開 IP、AWS account ID、個人名をマスクし、対象 commit と
実行日時を必ず併記します。

---

## 目次

- [1. 統合監視ダッシュボード（Grafana）](#1-統合監視ダッシュボードgrafana)
- [2. アラート通知（Slack）](#2-アラート通知slack)
- [3. SLO ダッシュボード](#3-slo-ダッシュボード)
- [4. インシデントタイムライン](#4-インシデントタイムライン)
- [5. ポストモーテム](#5-ポストモーテム)
- [6. 障害復旧演習の記録](#6-障害復旧演習の記録)

---

## 1. 統合監視ダッシュボード（Grafana）

### 1.1 現状（v1.0 — 実装済み・実測済み）

[server-monitor](https://github.com/ns7jp/server-monitor) で稼働。Linux(WSL2) 上で実データ表示を確認済み（[実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md)）。下記は数値をそのまま貼るのではなく、レイアウトを ASCII で示したモックアップ。

```text
┌──────────────────────────────────────────────────────────────────┐
│ server-monitor v1.0 — Grafana                          Last 6h ▼ │
├──────────────────────────────────────────────────────────────────┤
│ CPU 使用率                          メモリ使用率                  │
│   ┌─────────────────────┐            ┌─────────────────────┐     │
│   │     ╭─╮      ╭───╮  │            │   ╭────────────────╮ │     │
│   │   ╭─╯ ╰──────╯   ╰─ │ 28%        │ ╭─╯                │ 64%   │
│   │ ╭─╯               │ │            │─╯                  │     │
│   └─────────────────────┘            └─────────────────────┘     │
├──────────────────────────────────────────────────────────────────┤
│ ディスク使用率              HTTP ステータス分布（直近1h）           │
│   /     ████░░░░░░ 41%      2xx ████████████████░ 96.2%          │
│   /var  ███░░░░░░░ 33%      4xx ░░░░░░░░░░░░░░░░░  3.5%          │
│                              5xx ░░░░░░░░░░░░░░░░░  0.3%          │
├──────────────────────────────────────────────────────────────────┤
│ アラート状態：● Firing 0   ● Pending 0   ● OK 12                  │
└──────────────────────────────────────────────────────────────────┘
```

**キャプチャ予定**：上記レイアウトのスクリーンショット（解像度 1920×1080）

### 1.2 将来構想（v2.0）

Metrics + Logs + Traces を 1 画面に統合する構想があるが、現時点では未着手
（[ログ・メトリクス・トレースをまとめて見る構想](../roadmap/06-observability-traces.md)）。

---

## 2. アラート通知（Slack）

### 2.1 現状（v1.0 — 設定は実装済み。実配信は未採録）

Alertmanager → Slack Webhook の連携は実装済みだが、Webhook 秘密値を Git にコミットしない設計のため、**実際の Slack 配信はまだ試していない**（Alertmanager UI 上での FIRING 表示は別途確認済み）。下記はメッセージ形式のモックアップで、数値は架空のもの。

```text
┌─────────────────────────────────────────────────────────────┐
│ #alerts                                                      │
├─────────────────────────────────────────────────────────────┤
│ ⚠️  Alertmanager BOT     14:32                              │
│                                                              │
│  🔥 [FIRING] HighCpuUsage                                    │
│  ─────────────────────────────────                          │
│  instance: monitor-01:9100                                   │
│  severity: warning                                           │
│  value: 87.4%                                                │
│  threshold: 80%                                              │
│  for: 5 minutes                                              │
│                                                              │
│  📖 Runbook: docs/runbooks/cpu-high.md                       │
│  📊 Grafana: https://monitor.example.com/d/host             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 バジェット消費ペースによる通知（実装済み）

閾値型だけでなく、目標消費のペースが速いときに知らせる通知も実装している。詳細は
[SLO 設計](https://github.com/ns7jp/server-monitor/blob/main/docs/slo.md) を参照。

---

## 3. SLO ダッシュボード

Grafana に SLO ダッシュボードを実装済み（可用性達成率、エラーバジェット残量、
レイテンシの推移を表示）。実機での画面キャプチャは採録待ち。詳細は
[SLO 設計](https://github.com/ns7jp/server-monitor/blob/main/docs/slo.md) を参照。

---

## 4. インシデントタイムライン

障害の検知から復旧までの時系列を記録する運用を将来的には整備する予定だが、
[インシデント対応プロセス](../roadmap/07-incident-response.md)は複数人チームを前提にした
設計サンプルの段階で、実際の運用実績はまだない。

---

## 5. ポストモーテム

障害後に原因と再発防止策を記録するテンプレートも同様に設計サンプルの段階。
実際にインシデントが起きた際は、ここに実測の記録を追加する。

---

## 6. 障害復旧演習の記録

[05. 復旧演習](../server-monitor-improvements/05-backup-recovery-drill.md) D-2「ホスト障害」シナリオの計測表（テンプレ）。

```text
┌────────────────────────────────────────────────────────┐
│ Drill: D-2 ホスト障害復旧            Date: 2026-MM-DD  │
├────────────────────────────────────────────────────────┤
│ 項目                       │ 目標   │ 実測   │ 評価   │
├────────────────────────────────────────────────────────┤
│ 検知（アラート受信）        │  1 分  │ ? 分   │  ?     │
│ 1 次切り分け完了           │  5 分  │ ? 分   │  ?     │
│ スナップショット特定        │  2 分  │ ? 分   │  ?     │
│ 新 EC2 起動完了            │ 10 分  │ ? 分   │  ?     │
│ Ansible 適用完了           │ 15 分  │ ? 分   │  ?     │
│ ヘルスチェック OK          │  5 分  │ ? 分   │  ?     │
├────────────────────────────────────────────────────────┤
│ RTO（合計）                │ 60 分 │ ? 分   │  ?     │
│ RPO                        │ 24 h  │ ? h    │  ?     │
└────────────────────────────────────────────────────────┘
```

**キャプチャ予定**：v1.3（[05](../server-monitor-improvements/05-backup-recovery-drill.md) の D-2 演習を初回実施した際の実測値）

---

## 関連ドキュメント

- [プロフィール README](../../README.md)
- [証跡採録チェックリスト](../evidence-capture-checklist.md)
- [デモ動画台本](../demo-script.md)
- [アーキテクチャ図（現状 / 将来構想）](../architecture-diagram.md)
- [サーバー監視ラボ 改善計画](../server-monitor-improvements/README.md)
- [ポートフォリオ進捗 STATUS](../../STATUS.md)
