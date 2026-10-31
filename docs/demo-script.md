# 2 分 15 秒デモとライブデモ案内

> **現在の公開状態**
>
> 2026-08-22 時点で、[2 分 15 秒の実測証跡リプレイ](https://ns7jp.github.io/demo.html)を公開しています。これは実操作の連続録画ではなく、2026-08-18・19 に保存した実測スクリーンショットと D-1 復旧ログを時系列で再構成した映像です。

最終更新: 2026-10-31（AI 案内付き本人操作1回の結果を追加。ライブデモ全体は未合格）

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

## 面接でのライブ操作（5 分・AI なし）

本人が操作し、**何を確認し、なぜ次の操作を選んだか**を説明するデモです。手順書・man・公式資料は参照して構いません。実行中に AI へ相談した場合は、相談箇所を記録して `ai-assisted` とします。AI が操作した記録は `ai-executed` とし、本人の実演には数えません。

対象は [2026-10-01 の記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-10-01-ubuntu-practice01-nginx-manual-recovery.md)の `ubuntu-practice01`（Ubuntu VM）、作業場所は `~/server-nginx-practice`、Compose 名は `nginx-practice` です。旧 VM の `lab-base01` は使いません。2026-10-31 に、AI の案内を受けた本人操作で正常→停止→手動復旧を1回確認しました。AI の説明後に停止対象と復旧判断の根拠を回答しました。連続録画・5分以内の実演・独力説明・3回の反復は未確認で、ライブデモ全体は未合格です。

[2026-10-31 の手順動作確認](./evidence/2026-10-31-demo-procedure-check.md)では、Codex が別のクラウド環境で正常応答・停止・手動復旧と外形監視を確認しました。本人の VM での実演とは分けた記録です。

[10/31 の本人操作の結果票](https://github.com/ns7jp/server/blob/92609440727e6351a551da54e6d640a707902f0d/docs/evidence/2026-10-31-ubuntu-practice01-guided-recovery.md)には、操作時刻・HTTP結果・本人の回答・未確認範囲を記録しています。原ログは本人の手元にあり、リポジトリには未収録です。

### 準備と採録の開始

本人が対象 VM へ接続し、[結果票](./evidence/templates/linux-live-demo.md)を Git 管理外へコピーします。録画対象をこの演習用の端末に絞り、本人が画面録画を開始します。準備時間と下の 5 分の実演時間は分けて記録します。

まず、対象 VM・Docker の接続先・作業場所を確認し、app と nginx が起動済みであることを確かめます。想定と違う環境やサービスが出たら停止操作へ進まず、[最小起動ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md)に戻って準備します。

```bash
cd "$HOME/server-nginx-practice" || exit 1
docker context show
docker compose -p nginx-practice ps --all app nginx
curl --max-time 5 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
```

次に、公開リポジトリの外へ原ログを保存します。Ubuntu の util-linux 版 `script` を使い、入力専用ログは取りません。画面に表示された文字は出力ログにも入るため、秘密値を入力・表示する作業はこの録画に含めません。

```bash
umask 077
mkdir -p "$HOME/portfolio-private"
demo_record_dir="$(mktemp -d "$HOME/portfolio-private/live-demo-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")"
HISTFILE=/dev/null PS1='demo$ ' script --quiet --return --flush \
  --log-out "$demo_record_dir/terminal.log" \
  --log-timing "$demo_record_dir/timing.log" \
  --command 'bash --noprofile --norc -i'
```

`script` 内のシェルで次を定義します。以下の `run` はコマンド・時刻・終了コードを残すための関数です。期待どおりの接続失敗も採録するため、このシェルでは `set -e` を使いません。

```bash
run() {
  date -u '+TIME=%Y-%m-%dT%H:%M:%SZ'
  printf 'COMMAND'
  printf ' %q' "$@"
  printf '\n'
  "$@"
  local demo_exit=$?
  printf 'EXIT=%s\n' "$demo_exit"
  return "$demo_exit"
}
run git rev-parse HEAD
run git status --short
run cat /etc/os-release
run uname -r
run docker compose version
date -u '+DEMO_START=%Y-%m-%dT%H:%M:%SZ'
```

全環境変数、`.env`、秘密値ファイル、`docker inspect`、展開した Compose 設定、全コマンド履歴は表示しません。`set -x` も使いません。差分がある場合は結果票に対象ファイルと変更内容を記録し、同じ commit の無変更状態とは扱いません。

### 本人が操作する順序

| 時間 | 操作 | 口頭で伝えること |
| --- | --- | --- |
| 0:00–0:30 | 下の「正常確認」を実行 | app と nginx の状態、入口経由の HTTP 応答を比較の基準にする |
| 0:30–1:30 | nginx だけを停止し、同じ HTTP 確認を実行 | app の healthy と、利用者側の到達性は別の観点である |
| 1:30–3:00 | 状態一覧・直近ログ・8080 番のソケットを確認 | どの出力から入口の停止と判断したか。`ss` 単独では Docker の転送の有無を断定しない |
| 3:00–4:00 | nginx を開始し、同じ HTTP 確認を実行 | 再開コマンドの成功に加え、入口経由の 200 とサービス状態で復旧を確認する |
| 4:00–5:00 | 終了時刻を記録し、判断と未確認範囲を説明 | 今回確認したのは計画停止からの手動復旧。利用者経路の監視は次の検証で扱う |

正常確認は、app が healthy、nginx が稼働、curl の終了コードが 0・HTTP 応答が 200 であることを確かめます。一致しなければ停止演習へ進まず、実際の結果を残します。

```bash
run docker compose -p nginx-practice ps --all app nginx
run curl --max-time 5 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
```

正常を確認した後、nginx だけを止めます。

```bash
run docker compose -p nginx-practice stop nginx
run curl --max-time 5 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
run docker compose -p nginx-practice ps --all app nginx
run docker compose -p nginx-practice logs --since 5m --tail 20 --no-color nginx
run ss -ltn '( sport = :8080 )'
```

期待値は nginx の停止、app の healthy 継続、入口の接続失敗です。curl の `http_code=000` は HTTP ステータスコードではなく、HTTP 応答を受信していない表示です。通常の接続拒否は終了コード 7、タイムアウトなら 28 となるため、実際の終了コードとエラー文を記録します。予想と異なる出力を成功として処理しません。

途中で説明に詰まっても、nginx を停止したまま終えず、次の復旧を行います。

```bash
run docker compose -p nginx-practice start nginx
run curl --max-time 5 -sS -o /dev/null -w 'http_code=%{http_code}\n' http://127.0.0.1:8080/healthz
run docker compose -p nginx-practice ps --all app nginx
date -u '+DEMO_END=%Y-%m-%dT%H:%M:%SZ'
exit
```

起動直後の curl が失敗した場合は、`exit` の前にログと状態を確認し、同じ HTTP 確認を再実行して時刻も残します。200 に戻らなければ復旧失敗として記録します。SSH が切れた場合は再接続し、同じ作業場所・Compose 名を確認して nginx の開始と HTTP 確認を行い、録画中断も明記します。

### 原ログの保存と結果票

`exit` で元のシェルへ戻った後、画面録画を停止し、次のコマンドで原ログのハッシュを保存します。

```bash
(cd "$demo_record_dir" && sha256sum terminal.log timing.log > SHA256SUMS)
```

原ログと録画は Git 管理外に保管し、[結果票](./evidence/templates/linux-live-demo.md)へ日時・版・実出力・本人の判断・参照資料を記入します。公開用コピーから個人情報や秘密値を除き、加工箇所を明記します。原本のハッシュと公開用コピーのハッシュは別に残し、公開版を未加工の原本とは呼びません。記録は `server/docs/evidence/` に追加し、[代表実績と元資料](./evidence/featured-evidence.md)からリンクします。

練習のルール：

- 手順書・man・公式資料の参照箇所を記録し、詰まったときの調べ方も説明する
- 3 回を別々に採録し、所要時間と改善点を比較する。長くなっても復旧確認は省かない
- 合格は正常確認・停止中の差・手動復旧後の確認・本人の判断の記録がそろった回だけとする
- このデモだけで OS 初期構築、外部通知、自動復旧、別 VM 復元の実績にはしない。新規 Ubuntu 初期構築の独力再現は[採録計画の順位 0](./evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)で別に扱う

## 関連ドキュメント

- [実測証跡](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)
- [構成図](./architecture-diagram.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [ビジュアルショーケース](./showcase/README.md)
- [D-1 復旧演習（RTO 13 秒）](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-19-D-1.md)
