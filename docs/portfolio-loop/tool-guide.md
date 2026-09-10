# CLI と入力仕様

[入口](README.md) / [詳細設計](design.md) / [月曜の運用](operation.md)

2026-09-10追加：`run` / `weekly` のCLIは[自律繁栄の成果・負荷判断](../autonomous-prosperity/tool-guide.md)を実行します。
JSONは従来項目に `prosperity` を追加し、`notify` は統合結果になります。本人停止中は `outcome: NOT_RUN` です。
負荷は `check-in normal` / `check-in reduced` / `check-in paused` のいずれかで入力できます。
従来のテキストカードに代わり、一行動の表示または「変化なし」を返します。ライブラリと `demo` は従来どおりです。

## 1. 準備

Node.js 22 以上、`ns7jp/ns7jp` のルートで実行します。追加パッケージ、AI API、API キーは不要です。
`run` の実行時だけ、既存の収集器が GitHub API へ GET を行います。公開リポジトリは認証なしで読めます。環境変数 `GITHUB_TOKEN` があれば使い、値は表示も保存もしません。

```text
node --test tools/portfolio-loop/tests/*.test.mjs
node tools/portfolio-loop/loop.mjs demo
node tools/portfolio-loop/loop.mjs init 10
node tools/portfolio-loop/loop.mjs run
```

共通オプションは `--root DIR`（保存先のルート。既定はリポジトリのルート）と `--json`（結果を JSON で出力）です。
`--root` に雛形（`tools/portfolio-audit/career.config.example.json` と参照文書）がないディレクトリを指定した場合、`init` はデモと同じ複製をそのルートへ置いてから初期化します。それ以外の書き込みは `.local/` 配下だけです。
環境変数 `PORTFOLIO_LOOP_NO_NETWORK=1` を設定すると、`--offline` のない `run` は収集を行わず停止します。

## 2. コマンド

| コマンド | 動作 | 書き込み先 |
| --- | --- | --- |
| `run` / `weekly` | 点検 → 監査 → キャリア → 成長 → 取り込み → 作業枠 → 探索 → 集約 | 既存 4 系統の保存先と `.local/portfolio-loop/` |
| `status` | 読み取り専用の点検と次の一手 | なし |
| `init [HOURS]` | `career.mjs init` と採否台帳・inbox の作成。既存は上書きしない | `.local/engineer-career/profile.json`、`.local/portfolio-loop/` |
| `done ID DECISION "理由"` | 本人の採否を台帳へ記録 | `decisions.json` |
| `register DRAFT.json ...` | 実験票の下書きを登録し inbox を用意 | `inbox/<実験ID>/` |
| `dismiss INV-<16hex> "理由"` | 動的候補を探索の登録簿で却下し、台帳に REJECT を記録 | 探索の保存先、`decisions.json` |
| `bind-slot ACTION_ID` | 既存 `growth.mjs bind-slot` を同じ `--root` で実行し、学習枠を明示して接続 | `.local/autonomous-growth/settings.json` |
| `demo [--root 空のディレクトリ]` | 雛形を複製し、合成データで全工程を実行。既定は一時ディレクトリ。リポジトリのルートや既に `.local` を持つルートは拒否 | 指定したルート（雛形の複製を含む） |

### run のオプション

| オプション | 意味 |
| --- | --- |
| `--offline SNAPSHOT.json` | 保存済みの schema v2 スナップショットを再生。ネットワークなし。修正案を生成しない。`data_kind: synthetic` の合成スナップショットは `demo` か一時ディレクトリ配下の `--root` でだけ受け付ける |
| `--proposals FILE` | `{ "schema_version": 1, "proposals": [] }` 形式の独自提案（最大 4 件）。現在の信号 ID が必要 |
| `--occupied` | 作業枠を使用中として扱う |
| `--free` | 空いていると本人が確認した週に付ける。根拠に `HUMAN_CONFIRMED_FREE` を残す |

保存済みの実スナップショットを `--offline` で再生した実行は、`replay-state.json` に分けて記録され、修正案・pending は作られません。
探索はスナップショットの由来を検査しないため、合成スナップショットを実在のルートで再生すると合成由来の候補が登録簿に残ります。これを防ぐため、ループは合成の目印を持つスナップショットを `demo` か一時ディレクトリ以外で拒否します。

### register のオプション

| オプション | 意味 |
| --- | --- |
| `--candidate-sha SHA` | 新版の完全 40 桁 SHA。旧版（下書きの `baseline_sha`）と異なること |
| `--environment-id ID` | 環境 ID。1 行。`NOT SET` / `TODO` 不可 |
| `--scope "範囲"` | 比較の範囲。1 行 |
| `--context FILE` | 環境条件ファイル。SHA-256 を計算して実験票に入れ、`evidence/context.json` へ複製 |

`done` の判断は ADOPT / REJECT / PARK / ITERATE です。PARK には `--resume-condition "条件"` が必須です。
ID は既知の候補（カタログの `INV-001`〜`INV-008` と探索の登録簿）に限ります。

## 3. inbox の構成

`register` が作る `inbox/<実験ID>/` に、本人が測定後の結果と証拠を置きます。

```text
.local/portfolio-loop/inbox/INV-001-<uuid>/
  protocol.registered.json   register が作成。変更しない
  results.template.json      protocol_sha256 入りの雛形。data_kind は NOT SET
  results.json               本人が作成。runs を埋め、実測なら data_kind を measured に書き換える
  evidence/context.json      register が複製。ハッシュが実験票と一致する必要がある
  evidence/<artifact>        各試行の証拠。results の artifact.path と sha256 に対応
```

3 点（実験票、`results.json`、`evidence/context.json`）が揃った項目だけを `run` が取り込みます。
`results.json` の形式、各試行の項目、評価の判定は[改善実験の CLI](../server-innovation/tool-guide.md)の 5 節・6 節と同じです。
`data_kind` が `measured` 以外（`synthetic`、雛形のままの `NOT SET`）の結果は取り込みを拒否し、inbox に残し、作業枠を使用中にします。合成の練習値に `measured` と書かないでください。
全試行が揃っていない結果は `NOT_READY` として inbox に残り、探索にも台帳にも記録されません。次の一手に `COMPLETE_MEASUREMENT` が出ます。

取り込みが成功すると、台帳に `source: intake` の行が入り、項目は `done/<実験ID>-<時刻>-<id>/` へ移動します。移動に失敗しても判定と台帳の記録は残り、警告として報告されます。
同じ実験票と結果の再取り込みは重複として記録せず、移動だけ行います。

## 4. 採否台帳

`.local/portfolio-loop/decisions.json` は `done`、`dismiss`、取り込みだけが書きます。形式は[詳細設計の 5 節](design.md#5-実験のライフサイクルと採否台帳)にあります。
手で編集した場合、次の `run` が先頭で検証し、不正なら `Invalid decisions ledger` で停止します。

## 5. 出力

`run` はカード（既定）または JSON（`--json`）を標準出力へ出し、`summary.md` と `summary.json` を `runs/<時刻>-<id>/` に残します。

| summary の項目 | 意味 |
| --- | --- |
| `outcome` | `PROCESSED`（設定範囲の処理完了）または `NEEDS_REFRESH`（収集不全） |
| `mode` | `LIVE` または `OFFLINE_REPLAY` |
| `demo` | 合成データのデモなら true |
| `audit` / `career` / `growth` / `discovery` | 各工程の状態、通知、レポートの場所 |
| `intake` | 取り込んだ実験、失敗、未完 |
| `context` | 作業枠の 4 項目、根拠コード、無視した除外 ID |
| `next_actions` | 優先順の行動。`code`、`title`、`command`、`detail` |
| `notify` | いずれかの系統に意味のある変化があるか。時刻の変化では true にならない |

`status` は `--json` で点検結果を出します。実行はしません。次の一手は前回の `latest.json` と現在の状態から導き、直前の `run` と同じ判定になります。
カードやテキスト出力の末尾には、JSON と同じ権限表示のフッター（authorization NONE など 5 項目）が付きます。

## 6. 終了コード

| 終了コード | 意味 |
| --- | --- |
| 0 | 設定範囲の処理完了。課題 0 件、実機合格、公開可能の意味ではない |
| 3 | 収集不全または古い観測。他の工程は実行済みで、探索だけ止めた |
| 2 | 停止。`Loop stopped: <元のメッセージ>` と `[分類] 対処` を標準エラーへ出す |

## 7. エラー分類

| 分類 | 元のメッセージの例 | 対処 |
| --- | --- | --- |
| `LOCKED` | `Another run holds ...`、`EEXIST` | 別の実行の終了を待つ。動いていないと確認した当該ロックだけを除去 |
| `STALE_LOCK` | `Stale lock ... is not running` | 原因を確認し、当該ロックだけを手動で除去 |
| `NOT_INITIALIZED` | `ENOENT ... profile.json` | `init 10` |
| `CORRUPT_STATE` | `Invalid pending draft`、`Invalid decisions ledger`、`integrity mismatch`、`Refusing to overwrite a newer plan` | 上書きせず、直前の `runs/` と原本を照合して復旧 |
| `TIME` | `Refresh work context within 24 hours`、`Invalid or future snapshot timestamps` | 端末の時計、観測時刻、登録時刻を確認 |
| `LEARNER_UNAVAILABLE` | `Missing file: .local/server-engineer/...` | `learner_id` に対応する SE 台帳を確認 |
| `SYNTHETIC_REJECTED` | `Synthetic results cannot update ...`、`must be measured` | 合成結果を inbox から外す |
| `CONTEXT` | `Invalid work context` | 除外 ID が既知の候補か確認 |
| `CAPACITY` | `... capacity reached` | 候補の却下・保留と過去の feedback を本人がレビュー |
| `NO_NETWORK` | `Live collection is disabled by PORTFOLIO_LOOP_NO_NETWORK=1` | `--offline` を付けるか環境変数を外す |
| `USAGE` | `Usage: ...`、`Unknown command` | `--help` |
| `INVALID_INPUT` | 上記以外 | 入力ファイル・引数・状態を確認 |

分類はメッセージへの付記であり、元の文は変えません。既存ツールの試験や文書がメッセージの断片で照合できるようにするためです。

## 8. 困ったとき

- `status` で「監査: 未実行」なら、まだ `run` していないか、保存先が違います。`--root` を確認します。
- 探索の候補が `BACKLOG_FULL` なら、`dismiss` か `done ... PARK` で減らします。上限は未着手 12 件、登録 240 件、実測記録 100 件です。
- キャリア計画が確認から 28 日を超えると週次見直しだけの計画になります。ループは `updated_at` を更新しません。本人が内容を確認して更新します。
- `demo` のルートは一時ディレクトリです。残したい場合は空のディレクトリを `--root` に指定します。そのルートには雛形と参照文書の複製、合成由来の候補が入るため、実運用のルートと分けます。
- 収集不全のときはカードと `summary.md` に収集エラーが出ます。HTTP 401/403 なら `GITHUB_TOKEN` の有効性を確認するか、未設定に戻します。
- 定期実行は利用者側のタスク登録で行います。予定どおり動いたかは `latest.json` の時刻で確認します。
