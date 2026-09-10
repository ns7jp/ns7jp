# CLIと成果記録の仕様

## コマンド

| 操作 | コマンド（リポジトリルートで実行） | 書き込み |
| --- | --- | --- |
| 初回設定 | `node tools/portfolio-loop/loop.mjs init 10` | 既存の私用設定。既存原本は保持 |
| 通常実行 | `node tools/portfolio-loop/loop.mjs run` | 既存4系統と繁栄の派生結果 |
| 同じ処理 | `node tools/portfolio-loop/loop.mjs weekly` | `run` と同じ |
| 本人の負荷入力 | `node tools/portfolio-loop/loop.mjs check-in normal` | 繁栄の週次確認。成果の数値は追加しない |
| 繁栄の点検 | `node tools/autonomous-prosperity/prosperity.mjs status --json` | なし |
| 既存の点検 | `node tools/portfolio-loop/loop.mjs status` | なし |

`check-in` は `normal`、`reduced`、`paused` の一つを指定します。複数をそのまま貼り付けません。
すべて同じ `--root "台帳を含むリポジトリの絶対パス"` を指定できます。指定しなければツールがあるリポジトリを使います。
既存の `run` / `weekly` の `--offline`、`--proposals`、`--occupied`、`--free`、`--json` は維持します。
専用CLIにも `init`、`run`、`check-in` がありますが、日常操作は既存CLIだけで足ります。

## 出力

テキストは状態、次の一行動、完了条件があればその条件、時間、成果比較、権限表示を出します。
変化がない再実行は短い表示になります。`--json` なら毎回全体を取得できます。

既存CLIのJSONには従来の結果と `prosperity` が入り、トップレベル `notify` は統合後の通知判定です。
停止中は既存ループを実行しないため、トップレベルの `outcome` は `NOT_RUN` です。

| キー | 意味 |
| --- | --- |
| state | [状態表](design.md)の判断状態 |
| next_action | 一つの次の行動。必要なら既存行動の詳細を含む |
| budget | 既存時間の内訳。`added_minutes` は常に0 |
| outcomes | 同条件ごとの成果比較。本人の技能合否ではない |
| selected_actions | READYの場合だけ既存の選択済み主行動 |
| notify | 意味が変化したか、新規の結果取り込みがあったか |
| signature | 評価時刻や使い捨てレポートパスを除いた判断のSHA256 |
| input_sha256 | 読んだキャリア原本と週次索引のSHA256。未接続時は省略 |
| authorization | 常にNONE。公開・実機・外部操作の許可ではない |

終了コードは0が処理完了、3が既存収集の不全、2が入力・ロックなどによる停止です。
0でも本人の判断待ちや未実測が残ります。エラー本文と既存レポートを合わせて確認します。

## 保存先

| パス | 内容 |
| --- | --- |
| `.local/autonomous-prosperity/review.json` | 本人の負荷と成果比較の索引 |
| `.local/autonomous-prosperity/latest.json` | 最新の判断。前回との差の比較にも使う |
| `.local/autonomous-prosperity/run.lock` | 同時実行の抑止。自分が作ったロックだけを通常終了時に除去 |

書き込みは一時ファイルを作ってから置き換えます。個人データは既存 `.gitignore` の `.local/` により公開対象外です。
Git管理外は暗号化やバックアップを意味しません。記録の保存・バックアップは本人の運用に従います。
入力は1ファイル2MiB以下、空でない通常ファイルです。管理対象の相対パスで `..`、絶対パス、シンボリックリンク・ジャンクションは拒否します。

## 週次索引

`check-in` を使えば、次の形を自動で用意できます。初期状態では成果は空です。

```json
{
  "schema_version": 1,
  "updated_at": "2026-09-10T00:00:00Z",
  "data_kind": "measured",
  "load": "normal",
  "observations": []
}
```

`updated_at` は本人が確認したUTC時刻です。実際の操作では自動設定されます。
`measured` は本人の入力を扱う区分であり、空の成果が測定済みになった意味ではありません。
合成テスト用の索引は `synthetic` とし、本人用へ切り替える `check-in` は拒否します。
成果の未実施は `observations` に架空の0を入れず、原本へ `NOT RUN` と記録します。

## 成果比較の一行

実際の原本を先に `.local/engineer-career/records/` に残してから、必要な比較だけ `observations` に追加します。
この索引を自動採録する機能は今回含みません。数値の入力を省くために実績を推測しません。

| 項目 | 形式・用途 |
| --- | --- |
| id | 英小文字・数字・ハイフンの1〜64文字。一意 |
| action_id | 既存キャリア原本に存在する行動ID |
| observed_at | 確認日以前のUTC日時。秒、または小数3桁 |
| metric / unit | 何を、どの単位で比較したか。空でない文字列 |
| context_key | 同じ比較条件の識別子。対象版・構成・負荷・試験方法を原本に記す |
| environment | 実施した環境を区別する識別子 |
| before / after | 比較前と比較後の有限な数値。未実測は登録しない |
| direction | 大きい方がよければhigher、小さい方ならlower |
| min_delta | 事前に決めた最小改善幅。正の有限値 |
| guardrail_ok | 機能・データ保全など事前に定めた品質条件を全て満たしたか |
| evidence_ref | `.local/engineer-career/records/` 配下の原本への相対パス |
| evidence_sha256 | 原本の生バイト列のSHA256。小文字64桁 |

最大100行です。同じ証拠内容を複数行へ登録できません。複数指標を確認する場合も、指標ごとの比較と根拠を明確にします。
原本には「予想・条件・操作・観測・本人の説明・限界」を残します。索引の数値が原文と一致するかは本人が確認します。

SHA256はPowerShellなら次のように取得できます。表示結果を小文字にして使います。

```powershell
(Get-FileHash -LiteralPath '.local/engineer-career/records/my-result.md' -Algorithm SHA256).Hash.ToLowerInvariant()
```

生バイト列に対する値なので、改行や文面を変えればハッシュも変わります。根拠が変わったときは、その変更を確認して索引を直します。
