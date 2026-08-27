# 証跡採録チェックリスト（設計 → 実物への変換計画）

> **本ドキュメントの位置付け**
>
> 本ポートフォリオは、使い捨て Ubuntu 24.04 上の Full-stack E2E まで実測済みです。一方で、**独立した引き渡し対象ホストや外部サービスを使う証跡は不足**しています（[STATUS.md](../STATUS.md) でも次の伸びしろと明記）。
> このチェックリストは、**新規の設計を増やすのをやめ、既存の設計を「実物」に変換する**ための実行計画です。設計書ではなく作業手順として使います。

最終更新: 2026-08-23（**優先 1・2・3・5・6・7、PR #75 の Full-stack E2E、PR #77 の Git SHA 指定ロールバック CI を採録完了**。Windows / AD は研修中の構築・名前解決トラブルを記録済み。独立した対象ホスト、Slack 実配信、公開可能な Windows / AD・winget 実行ログ、AWS、D-2、再起動・24 / 72 時間、長期稼働は未採録）

## 現在の残タスク（Linux サーバー構築を最優先）

過去に付けた優先番号は完了履歴として下に残し、今後は次の順で採録します。

| 順位 | 次に採録するもの | 完了条件 |
| --- | --- | --- |
| 1 | Docker 未導入の独立した Ubuntu 対象ホスト + 別の管理端末 | Docker 導入を含む `site.yml` 初回適用、2 回目 `changed=0`、network / UFW、受け入れ試験、引き渡し資料を同じ commit で採録 |
| 2 | 対象ホストの再起動・継続稼働 | 再起動直後の自動起動・監視復帰・バックアップに加え、24時間後と72時間後の正常性を時刻付きで採録 |
| 3 | Alertmanager → Slack 実配信 | FIRING / RESOLVED の両方を秘密値を伏せて採録 |
| 4a | Windows / AD の公開可能な再現ログ | 隔離ラボでユーザー作成、棚卸し、DNS 障害から domain 参加復旧までを再実施 |
| 4b | Windows / winget 端末セットアップ | 使い捨て test VM で導入、2 回目実行、rollback、package ごとの exit code を採録 |
| 5 | D-2 ホスト障害復旧 | 別ホストへの復旧、RTO / RPO、失敗箇所を採録 |
| 6 | 承認済み AWS 短時間検証 | `plan / apply / destroy`、疎通、実費を採録。手順は [10 AWS基礎構築演習設計](./learning-plan/10-aws-foundational-exercise-design.md)（設計のみ・未実施） |

この表の項目はすべて**未実測または部分実施**です。予定を実績欄へは移しません。

---

## このチェックリストの原則

1. **冒頭の「現在の残タスク」表を唯一の現行優先順位**とする。2026-08-17には
   「必要な環境」順でLinux不要項目を先に進めたが、その項目は採録済みになった。
   2026-08-22以降は第一志望に直結する独立Ubuntu対象ホストの構築・再起動・引き渡しを先に採録し、
   旧優先番号とグループ分けは完了履歴としてだけ参照する。
2. Linux サーバーの採録物は **server-monitor 側の [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)** に集約する。Windows / AD・winget のプロフィール固有証跡は、本リポジトリの[補助トラック証跡台帳](./evidence/README.md)に保存する。
3. **実物が貯まるまで、改善設計 06–17 に新規テーマを追加しない**（[新規設計を増やさない運用ルール](#新規設計を増やさない運用ルール)）。
4. 「設計サンプル」と「実測証跡」を**絶対に混同しない**（既存の honesty 方針を踏襲）。
5. 証跡を追加する変更は、保存先リポジトリの PR テンプレートに沿って、変更理由・確認結果・ロールバック・証跡リンクを残す。

---

## これまでの証跡採録履歴（旧優先番号）

### グループ A — Linux 環境が不要

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| ✅ 1 | ~~**full `molecule test` の実行ログ**（converge → verify → idempotence、4 ロール分）~~ **2026-08-17 採録完了** → [実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) | **ブラウザのみ**（GitHub Actions） | 0 円・実績 2 分 42 秒 | [02 Ansible 構成管理](./server-monitor-improvements/02-ansible-automation.md) |
| ✅ 2 | ~~**既存 CI の成功ログを証跡台帳へ記録**（Python check / Terraform check / Security scan / Backup verify）~~ **2026-08-19 採録完了** → [記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-ci-baseline.md) | **ブラウザのみ** | 0 円・30 分 | [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md) |

> **優先 1 は 2026-08-17 に採録完了しました。** 4 ロール（common / docker / nginx / monitoring）すべてが
> create → converge → idempotence → verify を通過しています（0 円・2 分 42 秒）。
> 到達までに 6 回失敗しており、その過程で**静的検査では検出できないロールの欠陥を 2 件**発見・修正しました
> （`tzdata` の依存漏れ、UFW の `allow` と `limit` が同一ポートを奪い合う不具合）。
> 経緯は [実行記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) に残しています。
>
> **優先 2 は 2026-08-19 に採録完了しました。** `Backup verify` は毎日 04:00 UTC に自動実行されており、
> GitHub Actions API で実際に数えたところ累計 **102 回**の実行履歴があった（従来「400回超」と記載していたが誤りだったため訂正）。
> `python-check` / `terraform-check` / `security-scan` の直近成功ログとあわせて
> [server-monitor 側の記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-ci-baseline.md)に採録した。
>
> **2026-08-22 に PR #75 の Full-stack E2E も採録しました。** runtime 最終 commit `7622a9d`を Docker 導入済みの disposable Ubuntu 24.04 runner で検証し、`site.yml` の一括適用と 2 回目 `changed=0`、core 10 services + CI webhook sink（計 11 containers）、Docker API proxy の GET 成功・POST 拒否・Loki log 到達、local webhook、network / UFW、D-1 RTO 1 秒、3 volumes の backup / restore を確認して[23/23 ID PASS](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)でした。Slack 実配信、AWS、D-2、独立した管理端末・引き渡し対象ホスト、組織 DNS、再起動後、長期稼働の証跡へは読み替えません。
>
> **2026-08-23 に PR #77 の Git モード変更・ロールバック CI も採録しました。** [run 32611251044](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)で候補 SHA `84e1492` を `/opt/server-monitor` へ配備し、旧 SHA `59aa88e` へ復帰した後、revision marker、runtime manifest、app container 再生成、不要ファイル除去、loopback bind、Loki 取り込みを確認して PASS しました。これは使い捨て runner と PR ブランチの結果であり、main 反映、永続ホスト、再起動・24 / 72 時間、Slack、AWS、D-2 の証跡へは読み替えません。詳細は[プロフィール側の索引メモ](./evidence/2026-08-23-server-monitor-git-rollback-ci.md)に残しています。

### グループ B — Linux + Docker が必要（WSL2 で可）

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| ✅ 3 | ~~`docker compose up` 後の **Grafana 実画面**（CPU/メモリ/HTTP/アラート状態）~~ **2026-08-18 採録完了** → [記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) | ローカル Linux + Docker | 0 円 | [アーキテクチャ図](./architecture-diagram.md) |
| 4 | Alertmanager → **Slack に実際に発火した通知** のスクショ | 同上 + Slack Webhook | 0 円 | [今後の興味リスト](roadmap/README.md) |
| ✅ 5 | ~~Loki + Grafana Alloy の **ログ検索実画面**（クエリ + 結果）~~ **2026-08-18 採録完了**（上記記録に含む） | 同上 | 0 円 | [01 ログ集約](./server-monitor-improvements/01-loki-log-aggregation.md) |
| ✅ 6 | ~~**ネットワーク切り分けの一次メモ**（dig / traceroute / ss / tcpdump で既存ラボの経路と名前解決を実際に調べる）~~ **2026-08-21 実質完了** → [記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-21-network-firstlook.md)（`ss` / `docker port` / `docker inspect` で切り分け、`internal: true` ネットワークがホストへのポート公開を無効化する不具合を発見・原因特定。当初想定していたホスト公開ポート経由ではなく、コンテナ IP を直接指定する方法・`docker compose exec` 経由で、名前解決・経路（traceroute）・実際のパケット（tcpdump）のすべてを観察できた） | 同上 | 0 円 | [今後の興味リスト](roadmap/README.md) / [橋渡し](./career-bridge.md) |
| ✅ 7 | ~~**D-1 復旧演習の実測**（検知 → 復旧の各ステップを実時間で計測）~~ **2026-08-19 採録完了（PASS、RTO 13秒）** → [記録](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md) | 同上 | 0 円 | [05 バックアップ・復旧演習](./server-monitor-improvements/05-backup-recovery-drill.md) |

> **優先 3 は 2026-08-18 に採録完了しました。** あわせて `server-monitor/docs/screenshot.png` も
> Windows 11 端末の画面から Linux（WSL2）上の実画面へ差し替え済みです。
> **優先 6 は 2026-08-21 に実質完了しました**（当初想定していたホスト公開ポート経由ではなく、コンテナ IP を直接指定する方法で名前解決・経路・実際のパケットのすべてを確認できた。その過程で見つかったポート公開の不具合も切り分け・原因特定した）。
> **残るグループ B は優先 4（Alertmanager → Slack 通知）**です。

### グループ C — 追加の環境・費用が必要

| 優先 | 採録する証跡 | 必要環境 | 想定コスト | 紐づく設計書 |
| --- | --- | --- | --- | --- |
| △ 8a | **Windows / AD 公開用再現ラボ**（評価版 AD DS でユーザー作成〜棚卸し、DNS 障害復旧） | 自宅 PC + Hyper-V / VirtualBox（評価版） | 0 円 | [Windows / AD 公開再現ラボ](./evidence/templates/windows-ad-lab.md) |
| 9 | `terraform apply` → `destroy` と **Cost Explorer の実費** | 承認済み AWS アカウント | 数十〜数百円 | [03 AWS + Terraform](./server-monitor-improvements/03-terraform-aws.md)（大規模な本番想定設計）／ [10 AWS基礎構築演習設計](./learning-plan/10-aws-foundational-exercise-design.md)（VPC・EC2 1 台の最小構成。まずこちらを先に回し切る） |

> 優先 8a は**部分実施**です。トライアル就業先の研修で AD DS を構築し、クライアントの DNS 設定が原因だったドメイン参加障害を切り分けた経験は [LEARNINGS.md](../LEARNINGS.md) に記録しました。ただし、研修先の情報を含まない PowerShell のユーザー作成・棚卸し・domain 参加復旧ログは未採録です。公開実績にする場合は、隔離した自宅ラボ等で再現して機密情報を含まない一次出力を残します。
> 旧優先 9 の AWS 検証は、現在は冒頭表の順位 6 です。独立対象ホスト、再起動・72時間継続、
> Slack、Windows / AD、winget、D-2 の順に採録した後、承認済みアカウントで 1 日に
> plan → apply → destroy まで実施します。数百円の実費と「即 destroy した」記録自体が、
> コスト意識の証跡になります。

### 公開済みリプレイと実操作の連続録画

[2 分 15 秒の実測証跡リプレイ](https://ns7jp.github.io/demo.html)は公開済みです。これは2026-08-18・19の保存済みスクリーンショットとD-1復旧ログを編集したもので、実操作の連続録画ではありません。

1. ~~**CI 証跡（優先 1〜2）** — ブラウザのみ~~ → 優先 1・2 ともに ✅ 採録済み
2. ~~**スクショ 3 点（優先 3〜5）**~~ → 優先 3・5 は ✅ 採録済み（2026-08-18）。残るは優先 4（Alertmanager → Slack）
3. ~~**演習・実測（優先 6〜7）**~~ → 優先 7（D-1）は ✅ 採録済み（2026-08-19、PASS）。優先 6 も ✅ 2026-08-21 に実質完了（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-21-network-firstlook.md)）
4. ~~**証跡リプレイ**~~ → ✅ 2026-08-22 公開済み。編集済み動画だけを実測根拠にせず、元証跡へリンク
5. **実操作の連続録画** — 必須成果物ではなく追加候補。E2E artifact 内の terminal cast は全工程の連続動画ではないため、常設公開できた場合だけ別実績として追加

> 残るグループ B のタスクは優先 4（Alertmanager → Slack 通知）のみです。

---

## 完了条件

採録 1 件ごとに、次を満たしたら「実測証跡」として扱います。

| 条件 | 内容 |
| --- | --- |
| 再現性 | 実行コマンド、対象 commit、環境、実行日時が残っている |
| 結果 | 成功 / 失敗、所要時間、主要ログまたはスクリーンショットがある |
| 安全性 | 秘密値、公開 IP、AWS account ID、個人名、webhook URL がマスク済み |
| 導線 | Linux は `server-monitor/docs/evidence/README.md` または `docs/drills/logs/`、Windows は本リポジトリの `docs/evidence/README.md` から辿れる |
| 変更の記録 | PR 本文に確認結果、影響範囲、ロールバック、証跡リンクがある |

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

### 2. 既存 CI の成功ログを証跡台帳へ記録（Linux 環境不要）✅ 採録済み

> 2026-08-19 に採録完了（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-ci-baseline.md)）。
> `Backup verify` は毎日自動実行されており、GitHub Actions API で実際に数えたところ累計 **102 回**
> の実行履歴があった（本ファイルに以前あった「400回超」という記載は誤りだったため訂正した）。
> 以下は**再実行するときの手順**として残す。

1. Actions タブで `Python check` / `Terraform check` / `Security scan` / `Backup verify` の**成功した最新実行**を開く。
2. それぞれの実行 URL、実行日時、対象 commit SHA、検証内容を控える。
3. `server-monitor/docs/evidence/YYYY-MM-DD-ci-baseline.md` にまとめる。
4. 台帳（`docs/evidence/README.md`）の該当行に、この記録へのリンクを張る。

> **これは新しく何かを実行する作業ではなく、すでに存在する結果を拾う作業です。**
> ここで対象にしている従来の baseline CI は、構文・設定の整合・依存の脆弱性を確認するもので、起動・疎通・復旧時間は含みません。起動から復旧までを扱う [Full-stack E2E](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)とは区別して台帳へ記録します。

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

> 2026-08-19 の WSL2 演習で RTO 13 秒、2026-08-22 の使い捨て runner E2E で RTO 1 秒を採録済みです。以下は再実行時の手順として残します。

1. [ショーケース §6](./showcase/README.md) の計測表テンプレを使う。
2. 演習を**実際に 1 回実施**し、`目標` 列の隣の `実測` 列を**実時間**で埋める。
3. 演習ログ（コマンド履歴 + 時刻）を `server-monitor/docs/drills/logs/` に保存する。
4. この実測値を元に、ショーケースの「？分」を実数へ差し替える。

### 8a. Windows / AD 公開用再現ラボ（部分実施）

> 研修では AD DS の構築と名前解決障害の切り分けまで経験済みです。以下は、研修先の情報を
> 持ち出さずに、アカウント操作の一次出力を公開可能な形で再現するための未実施手順です。
> 実行時は[公開再現ラボの記録テンプレート](./evidence/templates/windows-ad-lab.md)を
> `docs/evidence/YYYY-MM-DD-windows-ad-lab.md` へコピーし、一次出力と判定を保存します。

1. Hyper-V / VirtualBox の Host-only または Internal switch 上に、Windows Server 評価版と
   Windows client の使い捨て VM を作り、外部 inbound・port forwarding・bridge を無効にする。
2. DC promotion 前 checkpoint、standalone / role 未導入、固定 domain / NetBIOS、internal
   interface / static IPv4 / gateway なしを fail-closed で確認し、AD DS / DNS role install、
   DSRM secure prompt、forest promotion、明示的な再起動を採録する。
3. promotion 後の domain / role / service を確認してから、ラボ専用 OU・group・test user だけを
   作成する。
4. 90 日棚卸しは検索範囲、基準日時、期待件数、実件数を記録する。自然に 90 日経過した
   user がなければ positive detection は `NOT RUN` とし、短縮時間の機能試験と区別する。
5. client checkpoint と正常 DNS を保存し、誤 DNS → SRV / DC 探索失敗 → DNS 復元 →
   domain 参加 → 再起動 → secure channel / domain user sign-in まで採録する。
6. raw transcript は Git 管理外へ置き、マスク済み公開コピーの SHA-256 と再確認結果を残す。

### 9. AWS apply / destroy と実費

> 具体的な手順（パラメータシート・構築手順書・試験項目書・課金ストップ基準）は [10 AWS基礎構築演習設計](./learning-plan/10-aws-foundational-exercise-design.md)にまとめている（設計のみ・未実施）。以下は概要のみ。

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
| マスク対象 | 秘密値 / 公開 IP / AWS account ID / 個人名 / webhook URL / 実在 domain / SID / machine GUID / MAC address |
| 必須メタ情報 | 対象 commit の短縮ハッシュ・実行日時（JST）・実行環境 |
| 保存先 | Linux は `server-monitor/docs/evidence/`、Windows 補助証跡は本リポジトリの `docs/evidence/`、raw は両リポジトリの外 |
| 公開導線 | 実物採録後、ショーケースの ASCII モックアップから実画像へリンクするか、実画像へ置換 |

---

## 社内 SE / Windows トラックの位置付け（2026-07 見直し）

以前は Windows / ネットワーク系の証跡を「応募先次第の保険」に分類していましたが、ネットワークは Linux サーバー構築の中核、Windows / AD は補助トラックの証跡として整理し直しました。

- **ネットワーク切り分け（優先 6）**は、第一志望（Linux サーバー構築・運用）で疎通確認と障害一次対応を行うための中核スキルです。
- **Windows / AD（旧優先 8a）**は IT サポート / 社内 SE 補助へ応募する場合の補助証跡です。研修中の AD DS 構築・名前解決の切り分けは記録済みですが、公開可能な一次出力はまだ不足しています。

> **進め方の判断**: Linux サーバー構築・運用を主軸とし、まず独立対象ホストの新規構築・受け入れ・再起動後確認を採録します。Windows / AD は研修内容を外部公開せず、隔離した自宅ラボ等で安全に再現できる範囲を補助証跡にします。

---

## 新規設計を増やさない運用ルール

設計の量はすでに十分で、これ以上増やすと「広く浅い／実体がない」と見られるリスクがあります。次のルールで**証跡採録フェーズ**へ移行します。

1. 改善設計 06 以降に**新規テーマを追加しない**（実装・実測が追いつくまで。2026-07 には逆に、着手が 1 年以上先の 4 本を[中長期ロードマップ](./roadmap/README.md)へ縮退した）。
2. 設計書を更新するのは、**対応する実測証跡を採録したとき**のみ（「設計 → 実物」の同期）。
3. 冒頭の「現在の残タスク」を順位どおり採録し、未実測の項目が残る間は新規設計より証跡化へ集中する。
4. 採録の進捗は [実証トラッキング Issue (#8)](https://github.com/ns7jp/ns7jp/issues/8) で**月 1 回**公開更新する（進まなかった月は「進まず。理由: 〇〇」の 1 行を残す。2026-08-17 に週 1 回から緩和。理由は [STATUS.md §0](../STATUS.md) を参照）。

---

## 関連ドキュメント

- [STATUS.md（全体進捗）](../STATUS.md)
- [採用ご担当者さま向け 1 ページ版](./overview-for-recruiters.md)
- [志望トラックと証跡](./target-roles.md)
- [サーバー構築エンジニア学習プラン](./learning-plan/README.md)（Phase 2 の成果物が優先 6、Phase 6 の成果物が優先 7・9 に対応）
- [ビジュアルショーケース（差し替え対象）](./showcase/README.md)
- [デモ動画台本](./demo-script.md)
- [学習の一次記録（つまずきログ）](../LEARNINGS.md)
- [改善設計の実装対応表](./server-monitor-improvements/README.md)
- [Windows 補助トラック証跡台帳](./evidence/README.md)
- [server-monitor 検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
- [server-monitor ローカル証跡採録ガイド](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/local-evidence-quickstart.md)
- [server-monitor 変更管理ミニ運用](https://github.com/ns7jp/server-monitor/blob/main/docs/change-management.md)
