# 証跡採録チェックリスト（設計 → 実物への変換計画）

> **本ドキュメントの位置付け**
>
> 本ポートフォリオは設計資料が充実している一方で、**実機で動かして測った証跡が不足**しています（[STATUS.md](../STATUS.md) でも最優先の伸びしろと明記）。
> このチェックリストは、**新規の設計を増やすのをやめ、既存の設計を「実物」に変換する**ための実行計画です。設計書ではなく作業手順として使います。

最終更新: 2026-07-03（ネットワーク切り分け・Windows 最小ラボを正式な優先項目へ昇格。デモ動画は「証跡が揃った後の集大成」へ位置付けを変更）

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
| 4 | **ネットワーク切り分けの一次メモ**（dig / traceroute / ss / tcpdump で既存ラボの経路と名前解決を実際に調べる） | 同上 | 0 円 | [15 ネットワーク運用](./server-monitor-improvements/15-network-operations.md) / [橋渡し](./career-bridge.md) |
| 5 | **D-1 復旧演習の実測**（検知 → 復旧の各ステップを実時間で計測） | 同上 | 0 円 | [05 バックアップ・復旧演習](./server-monitor-improvements/05-backup-recovery-drill.md) |
| 6 | **full `molecule test` の実行ログ**（converge → verify → idempotence） | 同上 | 0 円 | [02 Ansible 構成管理](./server-monitor-improvements/02-ansible-automation.md) |
| 7 | **Windows / AD 最小ラボ**（評価版 AD DS でユーザー作成〜棚卸し、PowerShell 実行ログ） | 自宅 PC + VirtualBox（評価版） | 0 円 | [アカウント管理](./it-support/account-management.md) |
| 8 | `terraform apply` → `destroy` と **Cost Explorer の実費** | 承認済み AWS アカウント | 数十〜数百円 | [03 AWS + Terraform](./server-monitor-improvements/03-terraform-aws.md) |

> 1〜7 は**すべて無料・ローカル完結**です。まず 1〜3（合計 1 晩で採録可能）を埋めるだけで、ポートフォリオの説得力は段違いになります。
> 8 の AWS 検証は「最後」に回さず、**1〜3 を終えた直後の週に 1 日で plan → apply → destroy まで実施** することを推奨します。数百円の実費と「即 destroy した」記録自体が、コスト意識（FinOps）の証跡になります。

### デモ動画との順序

デモ動画（[台本](./demo-script.md)）は差別化効果が高い一方で、収録前チェック 6 項目を要する**最重量のタスク**です。「動画を撮るまで何も出せない」状態を避けるため、順序は次のとおり固定します。

1. **スクショ 3 点（優先 1〜3）** — 1 晩で採録
2. **演習・実測（優先 4〜6）** — 各半日
3. **デモ動画** — 証跡が揃った後の**集大成**として収録（スクショはリハーサルの副産物として撮れるため、逆順にはしない）

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

### 4. ネットワーク切り分けの一次メモ

1. 既存ラボ（クライアント → Nginx → Gunicorn）を対象に、`ss -tlnp` で待ち受けポート、`dig +trace` で名前解決、`traceroute` で経路、`tcpdump` で実際のパケット（TLS ハンドシェイク・HTTP リクエスト）を観察する。
2. 「どのコマンドで・何が見えて・何が分かったか」を**一次メモ**として Markdown 1 枚に残す（清書しない。見たままを書く）。
3. 発展：「ping は通るが HTTP が返らない」状態を意図的に作り（Nginx 停止など）、L3 と L7 の切り分け手順を実際に通す。

### 5. D-1 復旧演習の実測

1. [ショーケース §6](./showcase/README.md) の計測表テンプレを使う。
2. 演習を**実際に 1 回実施**し、`目標` 列の隣の `実測` 列を**実時間**で埋める。
3. 演習ログ（コマンド履歴 + 時刻）を `server-monitor/docs/drills/logs/` に保存する。
4. この実測値を元に、ショーケースの「？分」を実数へ差し替える。

### 6. full molecule test

1. Linux ホスト（または手動 CI ワークフロー）で `molecule test` を流す。
2. converge / verify / idempotence の各フェーズが成功した**ログ末尾**を採録する。

### 7. Windows / AD 最小ラボ

1. VirtualBox に Windows Server 評価版（180 日無料）を入れ、AD DS をセットアップする。
2. [アカウント管理手順](./it-support/account-management.md) の OU 設計・ユーザー作成・「90 日未ログインの棚卸し」PowerShell サンプルを**実際に実行**し、コマンドと出力（マスク済み）を採録する。
3. 手元の Windows で winget 一括インストールスクリプトの実行ログも採録する。

### 8. AWS apply / destroy と実費

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

## 社内 SE / Windows トラックの位置付け（2026-07 見直し）

以前は Windows / ネットワーク系の証跡を「応募先次第の保険」に分類していましたが、次の理由から**正式な優先項目（優先 4・7）へ昇格**しました。

- **ネットワーク切り分け（優先 4）**は保険ではなく、第一志望（監視運用）の一次対応の中核スキルであり、未経験面接で最も深掘りされる領域です。
- **Windows / AD（優先 7）**は志望トラック 2 位（IT サポート / 社内 SE 補助）に対する唯一の「手を動かした証拠」になります。未経験者が現実に内定を得やすい入口求人（ヘルプデスク・監視オペレーター）は Windows スキルを求めることが多く、設計サンプルだけでは裏付けになりません。

> **進め方の判断**: Linux / SRE トラック（優先 1〜3・5・6）を主軸にしつつ、優先 4 と 7 を挟んで 3 トラックすべてに最低 1 本の実行証跡がある状態を作ります。応募先の比率に応じて順序は調整してください。

---

## 新規設計を増やさない運用ルール

設計の量はすでに十分で、これ以上増やすと「広く浅い／実体がない」と見られるリスクがあります。次のルールで**証跡採録フェーズ**へ移行します。

1. 改善設計 06 以降に**新規テーマを追加しない**（実装・実測が追いつくまで。2026-07 には逆に、着手が 1 年以上先の 4 本を[中長期ロードマップ](./roadmap/README.md)へ縮退した）。
2. 設計書を更新するのは、**対応する実測証跡を採録したとき**のみ（「設計 → 実物」の同期）。
3. 上表の優先 1〜7（無料・ローカル）を**全て採録するまで**は、ここに集中する。
4. 採録の進捗は [実証トラッキング Issue (#8)](https://github.com/ns7jp/ns7jp/issues/8) で**週 1 回**公開更新する（進まなかった週は「進まず。理由: 〇〇」の 1 行を残す）。

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
