# 月曜の運用

[入口](README.md) / [詳細設計](design.md) / [CLI](tool-guide.md)

## 1. 毎週の 1 コマンド

```text
node tools/portfolio-loop/loop.mjs run
```

これで[既存の週次運用](../portfolio-automation/weekly-operation.md)の収集・機械検査、[キャリア計画](../engineer-career/operation.md)、[自律型成長](../autonomous-growth/tool-guide.md)、[改善実験の探索](../server-innovation/operation.md)が同じ順で走ります。
終了コード 0 なら処理完了、3 なら収集不全、2 なら停止です。標準出力のカードと `summary.md` を読みます。

| 既存の週次手順（10 手順） | ループでの対応 |
| --- | --- |
| 1 前回の latest・pending・採否記録を読む | 点検（自動） |
| 2 `cycle.mjs` に `discovery.config.json` を渡して再取得 | 監査（自動） |
| 3 career と growth で計画・未達・再説明を確認 | キャリア計画・自律型成長（自動） |
| 4 緊急修正・レビュー待ち・実行中の実験があれば occupied=true | 作業枠の合成（自動、根拠付き） |
| 5 採否記録から除外 ID を context へ記入し `discovery.mjs cycle` | 台帳から合成し探索（自動） |
| 6 上位候補の原本・後続記録・コード・既存 PR を読む | 本人（`PREPARE_CANDIDATE`） |
| 7 空いている共通枠で一件だけ準備 | 本人 |
| 8 実測結果を `discovery.mjs feedback` へ渡す | 取り込み（自動、inbox から） |
| 9 出典・差分・PR 原稿・検証・NOT RUN を揃える | 本人と週次の Codex |
| 10 変化がある場合だけ伝える | `notify` と次の一手（自動） |

本人の時間は増えません。学習・作品改善・就職活動の合計は引き続き週 10 時間、Codex の修正は原則 1 件 45 分です。

## 2. 出力の読み方

```text
ループ完了: PROCESSED / 方式 LIVE / 2026-09-15T00:00:12.345Z
監査 COMPLETE_FOR_CONFIGURED_SCOPE / キャリア PLANNED / 成長 PLANNED / 取込 0 件 / 探索 DISCOVERED（選択 INV-001）
作業枠: 空き / 通知: あり
次の一手: [REGISTER_PROTOCOL] 候補 INV-001 の実験票の下書きがあります。比較条件を決め、実験の前に登録します
  実行例: node tools/portfolio-loop/loop.mjs register .../protocol.draft.json --candidate-sha <40hex> ...
記録: .local/portfolio-loop/runs/<時刻>-<id>/summary.md
公開許可: なし / 実機試験: NOT RUN
```

上の例は形式の説明です。実際の値は実行ごとに変わります。

- **作業枠: 使用中** のときは新しい準備を選びません。根拠コードを見て、pending のレビュー、inbox の整備、本人判断を先に進めます。
- **通知: なし** は意味のある変化がないという意味で、実施不要という意味ではありません。
- **次の一手** は優先順です。1 番目から着手し、コマンド例があればそのまま使えます。`--root` を使った実行では、コマンド例にも同じ `--root` が付きます。

## 3. 実験の一巡

1. `run` が候補を選び、実験票の下書き `protocol.draft.json` を作ります。
2. 根拠の原本、後続記録、コード、既存 PR を読み、比較条件（新版 SHA、環境、範囲、環境条件ファイル）を決めます。
3. `register DRAFT --candidate-sha ... --environment-id ... --scope "..." --context context.json` で登録します。inbox に骨組みができます。
4. 許可された環境で全試行を測定し、証拠を `evidence/` に、結果を `results.json` に置きます。雛形の `data_kind: NOT SET` を、実測した場合だけ `measured` に書き換えます。
5. 次の `run` が判定し、台帳に記録して `done/` へ移し、同じ実行で追試候補を出します。次の一手に `DECIDE` が出ます。全試行が揃わなければ `NOT_READY` として inbox に残り、`COMPLETE_MEASUREMENT` が出ます。
6. `done ID ADOPT|ITERATE|REJECT|PARK "理由"` で本人の判断を記録します。ADOPT / REJECT / PARK は次回から除外されます。

測定していない週を埋めるために、架空の値や `measured` の練習値を作りません。合成の練習は `demo` か、`data_kind: synthetic` のまま既存の `innovation.mjs evaluate` で行います。

## 4. 独自提案

探索の `CUSTOM_HYPOTHESIS` の問いに答える形で、出典を確認した提案を最大 4 件まで渡せます。

```json
{
  "schema_version": 1,
  "proposals": [
    { "signal_id": "現在の信号 ID", "title": "...", "hypothesis": "...", "change": "...", "paths": ["..."], "metric": { "name": "...", "unit": "...", "direction": "lower", "target_percent": 20 }, "rollback": "..." }
  ]
}
```

`run --proposals FILE` で渡します。信号 ID は直近の探索レポートにあります。古い候補の言い換えは重複として捨てられます。

## 5. 止める・戻す・再開する

- 定期実行の停止は、利用者側のタスク登録を止めます。稼働サーバーを止める処理はありません。
- ロックが残ったら `status` で pid の生死を確認し、動いていないと確認した当該ロックだけを除去します。ループは自動で外しません。読めないロックは書き込み途中の可能性があるため、しばらく待ってから再確認します。
- 学習枠の接続は `bind-slot evidence-map` で行えます。同じ `--root` が使われます。
- 状態ファイルの不整合は `CORRUPT_STATE` で止まります。上書きせず、直前の `runs/` と原本を照合して復元します。
- 公開後の不具合は、その変更の revert と再検証で戻します。ループは公開しないため、ループ側の戻し操作はありません。
- ループだけを外す場合は `.local/portfolio-loop/` を残したまま、既存 4 系統の運用手順に戻れます。各系統の状態ファイルは変わっていません。
- 再開時は `run` を実行するだけです。前回の台帳、inbox、探索の登録簿はそのまま使われます。

## 6. 毎月の問い

「困り事が一つ減ったか」「測る負担が重すぎないか」「誤検知を減らせたか」「本人が説明できるようになったか」を見ます。
候補の数、実行回数、記録の行数を増やすこと自体は成果にしません。改善しなかった方法を保留にし、根拠のない提案を取り下げることも正常な結果です。
`status` の保存量が増えたら、削除ではなく整理の判断を本人が行います。
