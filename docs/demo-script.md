# 2 分 15 秒デモとライブデモ案内

> **現在の公開状態**
>
> 2026-08-22 時点で、[2 分 15 秒の実測証跡リプレイ](https://ns7jp.github.io/demo.html)を公開しています。これは実操作の連続録画ではなく、2026-08-18・19 に保存した実測スクリーンショットと D-1 復旧ログを時系列で再構成した映像です。

最終更新: 2026-11-13（11/5〜6 の既存の本人操作・説明の記録への案内を追加。独力実演の完了とは扱いません）

## いま確認できるもの

| 項目 | 状態 | 確認先 |
| --- | --- | --- |
| 実測結果 | 公開済み | [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) |
| 実測証跡リプレイ | **公開済み** | [字幕・文字起こし・一次記録付きデモページ](https://ns7jp.github.io/demo.html) |
| 自動デモ | 実装済み・実行結果は E2E 証跡で確認 | [`scripts/demo/run-demo.sh`](https://github.com/ns7jp/server/blob/main/scripts/demo/run-demo.sh) |
| 一気通貫の構成検証 | 実装済み・PR #75 で 23/23 ID PASS | [`scripts/e2e/run-full-stack.sh`](https://github.com/ns7jp/server/blob/main/scripts/e2e/run-full-stack.sh) / [実測記録](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| 実操作の連続録画 | **未公開** | E2E を実行した端末 cast は GitHub Actions artifact として保存 |

証跡リプレイとライブ実行は混同しません。自動デモの実行結果は、日時・環境・commit・終了コードを含む E2E artifact が生成された場合だけ成功と扱います。

## デモで伝えること

初回の学習では、まず[主作品の最小起動ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)で起動・確認・終了を行います。以下は構築・監視を習得した後の発展デモです。口頭説明だけを練習する場合は[30 秒・3 分の説明練習](./portfolio-explanation.md)へ進んでください。

「設計資料がある」だけでなく、同じ commit から次の流れを再現できることを示します。下の時間配分は事前構築済み環境を使った説明・収録の目安です。初回インストールや構築の所要時間、未実施のライブ実演を 3 分以内と保証するものではありません。

1. 構成コードから環境を起動する
2. 正常性と監視データを確認する
3. app プロセスを意図的に停止する
4. 異常を検知し、ログと状態を確認する
5. 自動復旧と最終的な正常性を確認する
6. コマンド、時刻、結果を証跡として残す

Slack 通知は実配信の証跡がまだないため、動画の必須条件にしません。実配信を確認できた場合だけ追加カットとして掲載します。

## 2〜3 分の収録台本

| 時間 | 画面・操作 | 伝えること |
| --- | --- | --- |
| 0:00–0:20 | [構成図](./architecture-diagram.md) | 「構成管理、監視、障害復旧を一つのラボで扱う」 |
| 0:20–0:50 | 自動デモまたは構成検証を開始し、対象 commit を表示 | 「同じ手順から再現できる」 |
| 0:50–1:15 | サービス一覧、health check、Grafana / Loki | 「正常状態をメトリクスとログで確認する」 |
| 1:15–1:40 | app プロセスを停止 | 「意図的に異常を起こす」 |
| 1:40–2:10 | プロセス状態、ログ、health check の失敗を表示 | 「状態とログから影響を確認する」 |
| 2:10–2:35 | 自動復旧、再度 health check | 「復旧後の正常性まで確認する」 |
| 2:35–3:00 | 実行結果と証跡ファイル | 「成功・失敗を commit と時刻付きで残す」 |

2026-08-19 の WSL2 演習では app プロセス停止から 13 秒、PR #75 の使い捨て runner E2E では 1 秒での自動復旧を実測済みです。環境が異なるため優劣比較には使いません。動画では、数値だけを字幕にせず、開始・復旧時刻が分かる出力も同じ画面に含めます。

## 実操作の連続録画を常設公開する前の合格条件

- [x] server-monitor の自動デモが使い捨て runner で完走する（PR #75 E2E artifact）
- [x] 2 回目の構成適用 `changed=0` と成功・失敗を終了コードで判別できる
- [x] 実行 commit、開始・終了時刻、環境情報を artifact に記録する
- [x] 障害注入前後の health check と復旧後の確認を terminal cast / raw log に残す
- [x] credential、token、webhook secret を artifact へ記録しない
- [ ] 常設公開前に公開 IP、ホスト名、個人情報が映っていないかを最終確認する
- [ ] 音声なしでも分かる一行字幕を付ける
- [ ] 公開 URL を確認してから README の「証跡リプレイ」リンクを連続録画へ差し替えるか判断する

## 連続録画を常設公開した場合の更新

実操作の連続録画を常設公開した時だけ、次を同じ commit で更新します。

1. [プロフィール README](../README.md) のリンクを公開動画へ変更
2. [採用担当者向け 1 ページ版](./overview-for-recruiters.md) の状態を「公開済み」へ変更
3. [ビジュアルショーケース](./showcase/README.md) にサムネイルと実行証跡を掲載
4. 非公開の運営記録（STATUS.md）に公開日、対象 commit、収録環境を記録

## 本人による小さな構成の確認

まず app / nginx の2サービスで、**通信経路・確認する順序・復旧の判断根拠**を自分の言葉で説明します。手順書・man・公式資料は参照して構いません。最初の練習に時間制限は設けません。録画や3回の反復は任意で、1回の操作結果と本人の説明を記録することから始めます。

2026-10-31 の[本人操作の記録](https://github.com/ns7jp/server/blob/92609440727e6351a551da54e6d640a707902f0d/docs/evidence/2026-10-31-ubuntu-practice01-guided-recovery.md)では、AI の案内を受けて正常→停止→手動復旧を確認しました。原因の説明を受けた後に回答した範囲であり、独力の原因特定は未確認です。今回、録画・反復の要件を変えても、この確認範囲は変わりません。

2026-11-05 の見直し時には本人から「今の環境では使えません」と回答があり、その時点で予定していた対象 VM での再実施は **BLOCKED** でした。

後続の 11/5 KVM 実習では、AI の案内で7サービス部分構成の監視・ローカル FIRING / RESOLVED・手動復旧を本人が確認しました。11/6 は Nginx の停止・復旧と本人の説明を記録し、AI の補足と区別しています。[結果と確認範囲](./practice-status.md)に集約しています。独力実演・全構成の受け入れ・外部 Slack / メール通知は未確認、原画像・生ログは未収録です。

### 対象の確認

以下は旧 `ubuntu-practice01` の作業場所 `~/server-nginx-practice`、Compose 名 `nginx-practice` 向けの手順です。11/6 の実習ではこの作業場所は存在せず、既存の `server-monitor-lab` を使いました。次回は本人が接続先・作業場所・Compose 名を確認し、対象が一致する場合だけ下記を実行します。Hyper-V の表示名と VM 内のホスト名は一致するとは限りません。一致しなければ別の VM を推測で操作せず、[最小起動ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)を参照して対象環境の手順を確認します。

```bash
cd "$HOME/server-nginx-practice" || exit 1
hostname
docker context show
git rev-parse HEAD
git status --short
docker compose -p nginx-practice ps --all app nginx
```

対象が確認できたら、[短い結果票](./evidence/templates/linux-live-demo.md)をコピーし、実施日・環境・対象版・参照資料を記入します。出力はテキストまたは画像で保存します。端末全体を保存したい場合は `script` を利用できますが、録画・ハッシュの作成はこの練習の合格条件ではありません。公開用の出力に秘密値や個人情報を含めないでください。

### 1. 正常な状態を確認する

```bash
docker compose -p nginx-practice ps --all app nginx
curl --max-time 10 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
echo "curl_exit=$?"
```

app が healthy、nginx が稼働、HTTP 200・curl 終了0を確認してから停止へ進みます。正常でなければ、まずその状態を調べます。

操作前に「この curl はどこを通って app に届くか」「app の healthy はどの範囲を確認しているか」を自分の言葉で書いてください。分からない点は分からないまま記録し、資料で調べた後の説明と区別します。

### 2. 入口を止めて、違いを確認する

```bash
docker compose -p nginx-practice stop nginx
docker compose -p nginx-practice ps --all app nginx
curl --max-time 10 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
echo "curl_exit=$?"
docker compose -p nginx-practice logs --since 5m --tail 20 --no-color nginx
```

正常時との違いと、どの出力から原因の範囲を絞ったかを書きます。`http_code=000` は HTTP 応答未受信の表示です。curl 終了7（接続失敗）と28（タイムアウト）などは区別し、実際の出力を残します。計画的に nginx を止めた演習なので、初見の原因不明障害を解決した実績にはしません。

### 3. 再開して復旧を確認する

```bash
docker compose -p nginx-practice start nginx
curl --max-time 10 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
echo "curl_exit=$?"
docker compose -p nginx-practice ps --all app nginx
```

起動直後に応答しない場合はログと状態を確認し、同じ HTTP 確認を再実行します。「開始コマンドが成功した」ことに加え、HTTP 200・curl 終了0とサービス状態を確認し、復旧と判断した理由を書きます。説明に詰まっても停止したまま終えず、この復旧を行ってください。SSH が切れた場合も、再接続後に同じ対象を確認して復旧します。

### 記録の扱いと次の練習

正常・停止中・復旧後の実出力と、本人の説明がそろったら、その回で確認できた範囲を結果票へ記入します。AI が手順を案内した回は `ai-assisted`、本人が資料を参照して進めた回はその参照資料を記録します。AI が操作した場合は `ai-executed` とします。操作の成功と、本人の説明を確認できた範囲は別欄に残します。

次回は目的・期待結果を本人が説明しながら再実行し、対象版と実出力を残します。監視・通知へ進む場合は、11/5 の本人実習で確認したローカル通知の範囲と、残る外部通知を区別し、[既存の実測計画](https://github.com/ns7jp/server/blob/main/docs/real-environment-validation-plan.md)で通知先と対象を決めます。この2サービスの練習は、監視全体・外部通知・自動復旧・新規 OS 構築・別 VM 復元を確認するものではありません。

## 関連ドキュメント

- [実測証跡](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)
- [構成図](./architecture-diagram.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [ビジュアルショーケース](./showcase/README.md)
- [D-1 復旧演習（RTO 13 秒）](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-19-D-1.md)
