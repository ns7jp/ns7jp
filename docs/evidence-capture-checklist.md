# 証跡採録チェックリスト（設計 → 実物への変換計画）

> **本ドキュメントの位置付け**
>
> 本ポートフォリオは設計資料が充実している一方で、**実機で動かして測った証跡が不足**しています（[STATUS.md](../STATUS.md) でも最優先の伸びしろと明記）。
> このチェックリストは、**新規の設計を増やすのをやめ、既存の設計を「実物」に変換する**ための実行計画です。設計書ではなく作業手順として使います。

最終更新: 2026-08-17（**優先 1（full `molecule test`）を採録完了**。あわせて**必要な環境**順への組み替えを実施）

---

## このチェックリストの原則

1. **コストが低く、信頼性への効果が高い順**に採録する（下表の優先度）。
   2026-08-17 に「金銭コスト」ではなく **「必要な環境」** を第一の並び順に変更した。
   全項目が 0 円である一方、実際の着手障壁は「Linux を用意する手間」だったため、
   **Linux が要らない項目を先に置く**ほうが実際に進むと判断した。
2. 採録物は **server-monitor 側の [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)** に集約し、本リポジトリからリンクする。
3. **実物が貯まるまで、改善設計 06–17 に新規テーマを追加しない**（[新規設計を増やさない運用ルール](#新規設計を増やさない運用ルール)）。
4. 「設計サンプル」と「実測証跡」を**絶対に混同しない**（既存の honesty 方針を踏襲）。
5. 証跡を追加する変更は、server-monitor の PR テンプレートに沿って、変更理由・確認結果・ロールバック・証跡リンクを残す。

---

## 証跡採録の優先順位（必要な環境 順）

### グループ A — Linux 環境が不要（今週中に消化する）

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| ✅ 1 | ~~**full `molecule test` の実行ログ**（converge → verify → idempotence、4 ロール分）~~ **2026-08-17 採録完了** → [実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) | **ブラウザのみ**（GitHub Actions） | 0 円・実績 2 分 42 秒 | [02 Ansible 構成管理](./server-monitor-improvements/02-ansible-automation.md) |
| 2 | **既存 CI の成功ログを証跡台帳へ記録**（Python check / Terraform check / Security scan / Backup verify） | **ブラウザのみ** | 0 円・30 分 | [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md) |

> **優先 1 は 2026-08-17 に採録完了しました。** 4 ロール（common / docker / nginx / monitoring）すべてが
> create → converge → idempotence → verify を通過しています（0 円・2 分 42 秒）。
> 到達までに 6 回失敗しており、その過程で**静的検査では検出できないロールの欠陥を 2 件**発見・修正しました
> （`tzdata` の依存漏れ、UFW の `allow` と `limit` が同一ポートを奪い合う不具合）。
> 経緯は [実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) に残しています。
>
> **優先 2 は「すでに存在する証跡を拾っていないだけ」です。** `Backup verify` は毎日 04:00 UTC に自動実行されて成功が積み上がっており、
> 累計 400 回超の CI 実行履歴があります。これらは第三者が再確認できる機械検証の記録ですが、台帳に一度も記載されていません。
> 実機の実測証跡の代わりにはなりませんが、**「自動化された検証を継続的に回している」ことの証拠としては十分**です。

### グループ B — Linux + Docker が必要（WSL2 で可。1 晩）

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| 3 | `docker compose up` 後の **Grafana 実画面**（CPU/メモリ/HTTP/アラート状態） | ローカル Linux + Docker | 0 円 | [アーキテクチャ図](./architecture-diagram.md) |
| 4 | Alertmanager → **Slack に実際に発火した通知** のスクショ | 同上 + Slack Webhook | 0 円 | [07 インシデント対応](roadmap/07-incident-response.md) |
| 5 | Loki + Grafana Alloy の **ログ検索実画面**（クエリ + 結果） | 同上 | 0 円 | [01 ログ集約](./server-monitor-improvements/01-loki-log-aggregation.md) |
| 6 | **ネットワーク切り分けの一次メモ**（dig / traceroute / ss / tcpdump で既存ラボの経路と名前解決を実際に調べる） | 同上 | 0 円 | [15 ネットワーク運用](roadmap/15-network-operations.md) / [橋渡し](./career-bridge.md) |
| 7 | **D-1 復旧演習の実測**（検知 → 復旧の各ステップを実時間で計測） | 同上 | 0 円 | [05 バックアップ・復旧演習](./server-monitor-improvements/05-backup-recovery-drill.md) |

> **優先 3 は単なるスクショ 1 枚ではありません。** 現在ポートフォリオ内に存在する唯一の画面キャプチャは
> **Windows 11 端末のもの**であり、Linux サーバー構築を志望する資料としては不利に働きます。
> 優先 3 を採録した時点で `server-monitor/docs/screenshot.png` を差し替えてください。

### グループ C — 追加の環境・費用が必要

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| 8 | **Windows / AD 最小ラボ**（評価版 AD DS でユーザー作成〜棚卸し、PowerShell 実行ログ） | 自宅 PC + VirtualBox（評価版） | 0 円 | [アカウント管理](./it-support/account-management.md) |
| 9 | `terraform apply` → `destroy` と **Cost Explorer の実費** | 承認済み AWS アカウント | 数十〜数百円 | [03 AWS + Terraform](./server-monitor-improvements/03-terraform-aws.md) |

> 優先 8 は、**トライアル就業先が Windows / AD 環境の場合に優先度を上げます**（実務と学習が同じ方向を向くため効率が良い）。
> 優先 9 の AWS 検証は「最後」に回さず、グループ B を終えた直後の週に 1 日で plan → apply → destroy まで実施することを推奨します。
> 数百円の実費と「即 destroy した」記録自体が、コスト意識（FinOps）の証跡になります。

### デモ動画との順序

デモ動画（[台本](./demo-script.md)）は差別化効果が高い一方で、収録前チェック 6 項目を要する**最重量のタスク**です。「動画を撮るまで何も出せない」状態を避けるため、順序は次のとおり固定します。

1. ~~**CI 証跡（優先 1〜2）** — ブラウザのみ~~ → 優先 1 は ✅ 採録済み。残るは優先 2（30 分）
2. **スクショ 3 点（優先 3〜5）** — 1 晩で採録
3. **演習・実測（優先 6〜7）** — 各半日
4. **デモ動画** — 証跡が揃った後の**集大成**として収録（スクショはリハーサルの副産物として撮れるため、逆順にはしない）

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

### 1. full molecule test（GitHub Actions・Linux 環境不要）✅ 採録済み

> 2026-08-17 に採録完了（[実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)）。
> 以下は**再実行するときの手順**として残します。ロールを変更したら再実行し、冪等性が保たれているか確認してください。

1. `ns7jp/server-monitor` の **Actions** タブを開く。
2. 左の一覧から **Ansible integration evidence** を選ぶ。
3. 右上の **Run workflow** → branch は `main` → **Run workflow** を押す。
4. `common` / `docker` / `nginx` / `monitoring` の 4 ジョブが並列で走る（10〜15 分）。
5. 各ジョブのログから **converge / verify / idempotence** の成否が分かる末尾を控える。
6. `server-monitor/docs/evidence/YYYY-MM-DD-molecule.md` に、実行 URL・commit SHA・結果を記録する（テンプレートは [molecule.md](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/templates/molecule.md)）。

> **失敗しても採録します。** 「初回は idempotence で failed が出た。原因は〇〇。修正して再実行し changed=0 になった」という記録は、
> 成功ログだけの記録より価値があります（[LEARNINGS.md](../LEARNINGS.md) のエントリにもなります）。
> 詳しい手順は [Molecule を GitHub Actions で実行する](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/molecule-via-github-actions.md) を参照してください。

### 2. 既存 CI の成功ログを証跡台帳へ記録（Linux 環境不要）

1. Actions タブで `Python check` / `Terraform check` / `Security scan` / `Backup verify` の**成功した最新実行**を開く。
2. それぞれの実行 URL、実行日時、対象 commit SHA、検証内容を控える。
3. `server-monitor/docs/evidence/YYYY-MM-DD-ci-baseline.md` にまとめる。
4. 台帳（`docs/evidence/README.md`）の該当行に、この記録へのリンクを張る。

> **これは新しく何かを実行する作業ではなく、すでに存在する結果を拾う作業です。**
> `Backup verify` は毎日自動実行されており、CI の累計実行回数は 400 回を超えています。
> 「自動検証を継続的に回している」ことの裏付けとして提示できるのに、台帳に記載がないため
> 読み手には見えていません。**所要 30 分で、証跡台帳の空欄が目に見えて減ります。**
>
> ただし、これは**実機の実測証跡の代わりにはなりません**。CI で確認できるのは構文・設定の整合・
> 依存の脆弱性までであり、起動・疎通・復旧時間は含まれません。台帳にもその区別を明記してください。

### 3. Grafana 実画面

1. ローカルで `docker compose up -d` を実行する。
2. Grafana にログインし、主要ダッシュボード（host / HTTP / SLO）を開く。
3. 解像度 1920×1080 でスクショを撮り、`server-monitor/docs/evidence/` に保存する。
4. ファイル名に**対象 commit の短縮ハッシュと撮影日**を含める（例: `grafana-host_2a1b3c4_20260530.png`）。
5. [ビジュアルショーケース](./showcase/README.md) の ASCII モックアップを、この実画像に差し替える。

### 4. Slack 実通知

1. アラートを**意図的に発火**させる（例: `stress-ng` で CPU を上げる / 監視対象プロセスを停止）。
2. Slack に届いた通知（FIRING）と、復旧後の RESOLVED を**両方**スクショする。
3. webhook URL・チャンネル名・実ホスト名は**マスク**する。

### 5. Loki ログ検索

1. Grafana の Explore で Loki を選び、実際のクエリ（例: `{job="nginx"} |= "error"`）を実行する。
2. クエリ文字列と結果行が見える状態でスクショする。

### 6. ネットワーク切り分けの一次メモ

1. 既存ラボ（クライアント → Nginx → Gunicorn）を対象に、`ss -tlnp` で待ち受けポート、`dig +trace` で名前解決、`traceroute` で経路、`tcpdump` で実際のパケット（TLS ハンドシェイク・HTTP リクエスト）を観察する。
2. 「どのコマンドで・何が見えて・何が分かったか」を**一次メモ**として Markdown 1 枚に残す（清書しない。見たままを書く）。
3. 発展：「ping は通るが HTTP が返らない」状態を意図的に作り（Nginx 停止など）、L3 と L7 の切り分け手順を実際に通す。

### 7. D-1 復旧演習の実測

1. [ショーケース §6](./showcase/README.md) の計測表テンプレを使う。
2. 演習を**実際に 1 回実施**し、`目標` 列の隣の `実測` 列を**実時間**で埋める。
3. 演習ログ（コマンド履歴 + 時刻）を `server-monitor/docs/drills/logs/` に保存する。
4. この実測値を元に、ショーケースの「？分」を実数へ差し替える。

### 8. Windows / AD 最小ラボ

1. VirtualBox に Windows Server 評価版（180 日無料）を入れ、AD DS をセットアップする。
2. [アカウント管理手順](./it-support/account-management.md) の OU 設計・ユーザー作成・「90 日未ログインの棚卸し」PowerShell サンプルを**実際に実行**し、コマンドと出力（マスク済み）を採録する。
3. 手元の Windows で winget 一括インストールスクリプトの実行ログも採録する。

### 9. AWS apply / destroy と実費

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

以前は Windows / ネットワーク系の証跡を「応募先次第の保険」に分類していましたが、次の理由から**正式な優先項目（優先 6・8）へ昇格**しました（2026-08 の並べ替え前は優先 4・7）。

- **ネットワーク切り分け（優先 6）**は、第一志望（Linux サーバー構築・運用）で疎通確認と障害一次対応を行うための中核スキルです。
- **Windows / AD（優先 8）**は志望トラック 2 位（IT サポート / 社内 SE 補助）に対する唯一の「手を動かした証拠」になります。未経験者が現実に内定を得やすい入口求人（ヘルプデスク・監視オペレーター）は Windows スキルを求めることが多く、設計サンプルだけでは裏付けになりません。

> **進め方の判断**: Linux / SRE トラック（優先 1〜5・7）を主軸にしつつ、優先 6 と 8 を挟んで 3 トラックすべてに最低 1 本の実行証跡がある状態を作ります。
> **2026-08 追記**: トライアル就業先の環境が Windows / AD なら優先 8 を前倒しします。実務で毎日触るものを証跡化するのが最も効率的です。

---

## 新規設計を増やさない運用ルール

設計の量はすでに十分で、これ以上増やすと「広く浅い／実体がない」と見られるリスクがあります。次のルールで**証跡採録フェーズ**へ移行します。

1. 改善設計 06 以降に**新規テーマを追加しない**（実装・実測が追いつくまで。2026-07 には逆に、着手が 1 年以上先の 4 本を[中長期ロードマップ](./roadmap/README.md)へ縮退した）。
2. 設計書を更新するのは、**対応する実測証跡を採録したとき**のみ（「設計 → 実物」の同期）。
3. 上表のグループ A・B（優先 1〜7、無料）を**全て採録するまで**は、ここに集中する。
4. 採録の進捗は [実証トラッキング Issue (#8)](https://github.com/ns7jp/ns7jp/issues/8) で**月 1 回**公開更新する（進まなかった月は「進まず。理由: 〇〇」の 1 行を残す。2026-08-17 に週 1 回から緩和。理由は [STATUS.md §0](../STATUS.md) を参照）。

---

## 関連ドキュメント

- [STATUS.md（全体進捗）](../STATUS.md)
- [サーバー構築エンジニア学習プラン](./learning-plan/README.md)（Phase 2 の成果物が優先 6、Phase 6 の成果物が優先 7・9 に対応）
- [ビジュアルショーケース（差し替え対象）](./showcase/README.md)
- [デモ動画台本](./demo-script.md)
- [学習の一次記録（つまずきログ）](../LEARNINGS.md)
- [改善設計の実装対応表](./server-monitor-improvements/README.md)
- [server-monitor 検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
- [server-monitor ローカル証跡採録ガイド](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/local-evidence-quickstart.md)
- [server-monitor 変更管理ミニ運用](https://github.com/ns7jp/server-monitor/blob/main/docs/change-management.md)
