# 検証記録

[入口](README.md) / [CLI](../../tools/prosperity/README.md) / [出典と初期観測](sources.md)

作成日：2026-09-10。今回の変更の検証記録です。最終基点は `ns7jp/ns7jp` の `d029f4bd7c1d059e43d44951dc41110ddeb46d4e`。当初の観測基点から進んだmainの自律繁栄・試行錯誤・改善準備の実装を保持して統合しました。変更ファイルと対象版は、この基点との差分とPRのコミットSHAで確認します。

## 確認する範囲

繁栄評価器の役割は、上流の観測と私用の申告・証拠参照を検査して、次の一件・待機・縮退を判断することです。実在する人の技能、本人の実験、応募、就職、収入を自動認定するものではありません。

環境：Windows、PowerShell、Node.js v24.19.0。Node.js 22以上を対象とする既存構成に合わせています。今回の実機でのNode.js 22実行、Ubuntu実行、GitHub Actions上の新規変更の実行は未実施です。

## 初期検証

| 確認 | 結果 | 根拠と限界 |
| --- | --- | --- |
| 既存の技能・案件・監査・成長・改善探索・統合ループ | 289件 PASS | ローカルの既存Nodeテストを実行。合成データ・一時ディレクトリの試験を含む |
| 3リポジトリの現在情報収集 | 設定範囲の取得完了 | 2026-09-10 08:11:55〜08:12:05 JST。17設定ファイル。[baseline.json](baseline.json) |
| 本人の私用台帳 | このコピーでは未接続 | 別の既存台帳の有無、現在の能力・雇用・負荷を推測しない |
| 新機能の定期実行 | NOT RUN | 運用手順を作成。既存定例の設定変更・発火確認は行っていない |
| GitHubへの反映 | 未公開 | ローカル成果物と差分まで。旧mainのCI成功を新機能のCI結果にしない |

## 再現コマンド

リポジトリのルートで実行します。新CLIのテストとデモには追加パッケージやネットワークが不要です。

```text
node --test tools/prosperity/tests/*.test.mjs
node tools/prosperity/prosperity.mjs demo --json
node --test tests/*.test.mjs tools/portfolio-audit/tests/audit.test.mjs tools/server-innovation/tests/*.test.mjs tools/portfolio-loop/tests/*.test.mjs
node --test tools/autonomous-prosperity/tests/*.test.mjs
node scripts/server-engineer.mjs check
node scripts/server-projects.mjs check
node scripts/check-engineer-links.mjs
```

MarkdownとMermaidは、既存の `docs-check` が使う検査器でも確認します。ソースには新評価器のテストを同workflowへ追加しています。外部サイト全件の応答・すべての見出しアンカー・人による読者試験は、このローカル構造検査だけでは証明できません。

## 実装の限界

1. CLIは本人の入力の真実性や、ファイル内容が現実の活動と一致するかを認定できません。証拠ハッシュは取り違え・変更の検出に使います。
2. 指標ごとの比較条件、母数、第三者評価は人が内容を読む必要があります。指標が改善した原因を自動認定しません。
3. ローカル保存はバックアップそのものではありません。別の保存先で復元を確認するまでは復元試験を未実施とします。
4. 初回の公開情報取得が正常でも、次回は通信・権限・API制限で失敗し得ます。失敗時は観測の鮮度と本人の成果を進めません。

## 最終検証

最新mainと統合後、既存367件と今回の30件、合計397件がPASSでした。本人の負荷・成果を架空に記録しない初期化、収集失敗時の日時保持、24時間の鮮度、未来日、合成データ、時間の内訳、上流の休止・ロック・レビュー待ち、証拠内容とハッシュ、原期限を保持した再計画、変化のない反復を確認しています。

ナビゲーション検査は98文書・719のローカルリンク先を確認しました。技能カリキュラム8段階32条件と、案件運用8文書24条件の構造検査もPASSです。これらは本人の技能・案件評価の検査ではありません。

最終版の `init`、`review`、再度の `review`、`status`、`demo` を手動実行しました。私用キャリア台帳・負荷索引がこのコピーには未接続のため `UNKNOWN`、再実行は `notify: false` となりました。初期化で本人の確認日・実績は作っていません。

最新mainの `runLoop()` を読み取り収集として手動で実行し、2026-09-10 21:49 JSTに設定範囲の取得完了・エラー0件を確認しました。これはライブラリの収集確認であり、本人のcheck-inやスケジュール発火の証明ではありません。取得の最小記録は [baseline-final.json](baseline-final.json) です。

ここまでの結果は上記環境で行ったローカル検証です。この記録時点のNode.js 22・Linux・この差分のGitHub CI・定刻発火・本人実測は `NOT_RUN` です。PR作成後のCI結果は、PRの現在のコミットSHAに対応するChecksから別途確認します。
