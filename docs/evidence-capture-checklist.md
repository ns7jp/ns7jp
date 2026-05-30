# 証跡採録チェックリスト（設計 → 実物への変換計画）

> **本ドキュメントの位置付け**
>
> 本ポートフォリオは設計資料が充実している一方で、**実機で動かして測った証跡が不足**しています（[STATUS.md](../STATUS.md) でも最優先の伸びしろと明記）。
> このチェックリストは、**新規の設計を増やすのをやめ、既存の設計を「実物」に変換する**ための実行計画です。設計書ではなく作業手順として使います。

最終更新: 2026-05-30

---

## このチェックリストの原則

1. **コストが低く、信頼性への効果が高い順**に採録する（下表の優先度）。
2. 採録物は **server-monitor 側の [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)** に集約し、本リポジトリからリンクする。
3. **実物が貯まるまで、改善設計 06–17 に新規テーマを追加しない**（[新規設計を増やさない運用ルール](#新規設計を増やさない運用ルール)）。
4. 「設計サンプル」と「実測証跡」を**絶対に混同しない**（既存の honesty 方針を踏襲）。
5. 証跡を追加する変更は、server-monitor の PR テンプレートに沿って、変更理由・確認結果・ロールバック・証跡リンクを残す。

---

## 証跡採録の優先順位（ROI 順）

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| 1 | `docker compose up` 後の **Grafana 実画面**（CPU/メモリ/HTTP/アラート状態） | ローカル Linux + Docker | 0 円 | [アーキテクチャ図](./architecture-diagram.md) |
| 2 | Alertmanager → **Slack に実際に発火した通知** のスクショ | 同上 + Slack Webhook | 0 円 | [07 インシデント対応](./server-monitor-improvements/07-incident-response.md) |
| 3 | Loki + Grafana Alloy の **ログ検索実画面**（クエリ + 結果） | 同上 | 0 円 | [01 ログ集約](./server-monitor-improvements/01-loki-log-aggregation.md) |
| 4 | **D-1 復旧演習の実測**（検知 → 復旧の各ステップを実時間で計測） | 同上 | 0 円 | [05 バックアップ・復旧演習](./server-monitor-improvements/05-backup-recovery-drill.md) |
| 5 | **full `molecule test` の実行ログ**（converge → verify → idempotence） | 同上 | 0 円 | [02 Ansible 構成管理](./server-monitor-improvements/02-ansible-automation.md) |
| 6 | `terraform apply` → `destroy` と **Cost Explorer の実費** | 承認済み AWS アカウント | 数十〜数百円 | [03 AWS + Terraform](./server-monitor-improvements/03-terraform-aws.md) |

> 1〜5 は**すべて無料・ローカル完結**です。まずここを全部埋めるだけで、ポートフォリオの説得力は段違いになります。6 は費用と承認が要るため最後で構いません。

---

## 完了条件

採録 1 件ごとに、次を満たしたら「実測証跡」として扱います。

| 条件 | 内容 |
| --- | --- |
| 再現性 | 実行コマンド、対象 commit、環境、実行日時が残っている |
| 結果 | 成功 / 失敗、所要時間、主要ログまたはスクリーンショットがある |
| 安全性 | 秘密値、公開 IP、AWS account ID、個人名、webhook URL がマスク済み |
| 導線 | `server-monitor/docs/evidence/README.md` または `docs/drills/logs/` から辿れる |
| 変更管理 | PR 本文に確認結果、影響範囲、ロールバック、証跡リンクがある |

---

## 各証跡の最小採録手順

### 1. Grafana 実画面

1. ローカルで `docker compose up -d` を実行する。
2. Grafana にログインし、主要ダッシュボード（host / HTTP / SLO）を開く。
3. 解像度 1920×1080 でスクショを撮り、`server-monitor/docs/evidence/` に保存する。
4. ファイル名に**対象 commit の短縮ハッシュと撮影日**を含める（例: `grafana-host_2a1b3c4_20260530.png`）。
5. [ビジュアルショーケース](./showcase/README.md) の ASCII モックアップを、この実画像に差し替える。

### 2. Slack 実通知

1. アラートを**意図的に発火**させる（例: `stress-ng` で CPU を上げる / 監視対象プロセスを停止）。
2. Slack に届いた通知（FIRING）と、復旧後の RESOLVED を**両方**スクショする。
3. webhook URL・チャンネル名・実ホスト名は**マスク**する。

### 3. Loki ログ検索

1. Grafana の Explore で Loki を選び、実際のクエリ（例: `{job="nginx"} |= "error"`）を実行する。
2. クエリ文字列と結果行が見える状態でスクショする。

### 4. D-1 復旧演習の実測

1. [ショーケース §6](./showcase/README.md) の計測表テンプレを使う。
2. 演習を**実際に 1 回実施**し、`目標` 列の隣の `実測` 列を**実時間**で埋める。
3. 演習ログ（コマンド履歴 + 時刻）を `server-monitor/docs/drills/logs/` に保存する。
4. この実測値を元に、ショーケースの「？分」を実数へ差し替える。

### 5. full molecule test

1. Linux ホスト（または手動 CI ワークフロー）で `molecule test` を流す。
2. converge / verify / idempotence の各フェーズが成功した**ログ末尾**を採録する。

### 6. AWS apply / destroy と実費

1. **短時間で破棄する前提**で `terraform plan` → `apply` を実行する。
2. ALB health / CloudWatch alarm の動作を確認し、スクショする。
3. すぐに `terraform destroy` する。
4. 翌日 Cost Explorer で**実費**を確認し、金額をスクショ（account ID はマスク）。
5. account ID・public IP・秘密値は**全てマスク**する。

---

## マスキングと記録の鉄則

採録時は毎回**必ず**以下を守ります（[ショーケース](./showcase/README.md) の方針を集約）。

| 項目 | ルール |
| --- | --- |
| マスク対象 | 秘密値 / 公開 IP / AWS account ID / 個人名 / webhook URL |
| 必須メタ情報 | 対象 commit の短縮ハッシュ・実行日時（JST）・実行環境 |
| 保存先 | `server-monitor/docs/evidence/`（演習ログは `docs/drills/logs/`） |
| 差し替え | 実物採録後、ショーケースの ASCII モックアップを実画像へ置換 |

---

## 社内 SE / Windows トラックを開けておく場合

志望は「IT サポート / 社内 SE 補助 / インフラ運用」の 3 つですが、現状の証跡は **Linux / SRE 寄りに偏って**います。社内 SE / ヘルプデスク方向も本気で狙うなら、次の**最小証跡**だけでも別途採ると、IT サポート系設計書（[FAQ](./it-support/faq.md) / [アカウント管理](./it-support/account-management.md)）の裏付けになります。

| 最小証跡 | 採録方法 | コスト |
| --- | --- | --- |
| PowerShell 実行ログ | [アカウント管理](./it-support/account-management.md) のサンプルを**自宅環境で実行**し、出力をマスクして採録 | 0 円 |
| ミニ AD / M365 ラボ | Windows 評価版 + AD DS、または M365 開発者テナントでユーザー作成〜棚卸し | 0 円（評価版） |
| ネットワーク調査メモ | `dig` / `traceroute` / `tcpdump` で実際の名前解決・経路を調べた**一次メモ** | 0 円 |

> **進め方の判断**: まずは Linux / SRE トラック（優先 1〜5）を主軸に固め、社内 SE トラックは「最小証跡 1 本」を保険として確保する、という配分を推奨します。応募先の比率に応じて調整してください。

---

## 新規設計を増やさない運用ルール

設計の量はすでに十分で、これ以上増やすと「広く浅い／実体がない」と見られるリスクがあります。次のルールで**証跡採録フェーズ**へ移行します。

1. 改善設計 06–17 に**新規テーマを追加しない**（実装・実測が追いつくまで）。
2. 設計書を更新するのは、**対応する実測証跡を採録したとき**のみ（「設計 → 実物」の同期）。
3. 上表の優先 1〜5（無料・ローカル）を**全て採録するまで**は、ここに集中する。
4. 採録の進捗は [実証トラッキング Issue (#8)](https://github.com/ns7jp/ns7jp/issues/8) で公開更新する。

---

## 関連ドキュメント

- [STATUS.md（全体進捗）](../STATUS.md)
- [ビジュアルショーケース（差し替え対象）](./showcase/README.md)
- [デモ動画台本](./demo-script.md)
- [学習の一次記録（つまずきログ）](../LEARNINGS.md)
- [改善設計の実装対応表](./server-monitor-improvements/README.md)
- [server-monitor 検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
- [server-monitor ローカル証跡採録ガイド](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/local-evidence-quickstart.md)
- [server-monitor 変更管理ミニ運用](https://github.com/ns7jp/server-monitor/blob/main/docs/change-management.md)
