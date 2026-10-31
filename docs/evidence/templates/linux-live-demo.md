# Linux ライブ操作の結果票

これは未記入のテンプレートです。[デモ手順](https://github.com/ns7jp/ns7jp/blob/main/docs/demo-script.md#面接でのライブ操作5-分ai-なし)を本人が実行し、1 回ごとに Git 管理外へコピーして記入します。現時点の状態は **NOT RUN**。公開前に原ログ・録画と照合し、公開用コピーと一緒に `server/docs/evidence/YYYY-MM-DD-linux-live-demo.md` へ保存します。テンプレートの作成や AI による実行を、本人の実演完了には数えません。

## 実施情報

| 項目 | 実際の値 |
| --- | --- |
| 状態（PASS / FAIL / BLOCKED / NOT RUN） | NOT RUN |
| 実施者・操作した人 | NOT RUN |
| 支援区分（本人操作・実行中 AI 不使用 / ai-assisted / ai-executed） | NOT RUN |
| 実行中に参照した手順書・man・公式資料、AI へ相談した箇所 | NOT RUN |
| 準備開始・終了日時（タイムゾーン付き） | NOT RUN |
| 実演開始・終了日時（タイムゾーン付き）、所要時間 | NOT RUN |
| VM 名・OS・カーネル・仮想化環境 | NOT RUN |
| Docker / Compose の版・Docker 接続先 | NOT RUN |
| 対象リポジトリ・commit SHA・未コミット変更 | NOT RUN |
| 作業場所・Compose 名・公開ポート | NOT RUN |
| 手順の版（ns7jp の commit SHA） | NOT RUN |
| 原ログ・timing.log・録画の非公開保存先 | NOT RUN |
| 原ログ・録画の SHA-256 | NOT RUN |
| 公開用ログ・画像・動画の相対パスまたは URL | NOT RUN |
| 公開用コピーの SHA-256・加工箇所 | NOT RUN |

## 結果

期待値を実測値欄へ転記しないでください。実出力の行番号または録画の時刻を付けます。途中中断や未採録の項目はそのまま残します。

| ID | 確認内容・期待値 | 実出力・終了コード | 証拠の位置 | 判定 |
| --- | --- | --- | --- | --- |
| L-01 | 停止前：app healthy・nginx 稼働 | NOT RUN | NOT RUN | NOT RUN |
| L-02 | 停止前：入口経由の HTTP 200、curl 終了 0 | NOT RUN | NOT RUN | NOT RUN |
| L-03 | nginx のみ停止、app healthy 継続 | NOT RUN | NOT RUN | NOT RUN |
| L-04 | 停止中：入口へ接続失敗。curl の終了コードとエラー文を保存 | NOT RUN | NOT RUN | NOT RUN |
| L-05 | 状態・直近ログ・8080 番の観測から本人が判断を説明 | NOT RUN | NOT RUN | NOT RUN |
| L-06 | nginx 開始後：入口経由の HTTP 200、curl 終了 0 | NOT RUN | NOT RUN | NOT RUN |
| L-07 | 復旧後：app healthy・nginx 稼働 | NOT RUN | NOT RUN | NOT RUN |
| L-08 | 日時・版・原ログ・録画・本人の説明を保存 | NOT RUN | NOT RUN | NOT RUN |

`http_code=000` は HTTP 応答未受信の表示で、HTTP のエラーコードではありません。終了コード 7（接続失敗）と 28（タイムアウト）などを区別し、異なる現象を同じ原因と決めつけません。

全必須項目に実出力と証拠があり、期待値を満たした回だけ PASS とします。復旧できなかった場合は FAIL、前提を満たせず始められなかった場合は BLOCKED とし、原因と残した状態を下に書きます。

## 本人が記入する判断

AI に文章を代筆させず、実行時に考えたことを短く記録します。AI の提案を採用した部分は、その範囲も記録します。

| 問い | 本人の記録 |
| --- | --- |
| 最初に正常性を確認した理由と、基準にした出力は何か | NOT RUN |
| app が healthy でも入口へ接続できなかったのはなぜか | NOT RUN |
| どの出力から確認範囲を絞り、何を次に調べると決めたか | NOT RUN |
| `ss` の表示だけで Docker の転送を断定できない理由は何か | NOT RUN |
| nginx の再開後、復旧を何で判断したか | NOT RUN |
| 予想と違った点、調べた資料、修正して再確認したこと | NOT RUN |
| 終了時の状態、未解決の点、今回確認していない範囲 | NOT RUN |

## 反復練習のまとめ

各回の結果票・原ログは別々に保管します。最短時間だけを選ばず、失敗や中断も記録します。

| 回 | 結果票へのリンク | 実演時間 | 判定 | 次回変えること |
| --- | --- | --- | --- | --- |
| 1 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| 2 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| 3 | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

## 公開前の確認

- [ ] 操作した人、AI の支援範囲、参照資料を記録した
- [ ] 原ログと録画を保管し、公開用コピーの加工箇所とハッシュを記録した
- [ ] 日時・対象版・結果票の判定が、保存した出力と一致している
- [ ] 秘密値・個人情報を公開用コピーから除き、リンク先を確認した
- [ ] 手動復旧の範囲だけを説明し、新規 OS 構築・自動復旧・外部通知・別 VM 復元の実績へ広げていない
