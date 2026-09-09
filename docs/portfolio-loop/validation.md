# 自律型ポートフォリオ改善イノベーションループの検証記録

確認日：2026-09-09。Linux 6.18.44-fc-v24 の Linux コンテナ（AI 支援セッションの作業環境）/ Node.js v22.22.2 のローカル実行。
上記はローカル確認であり、GitHub Actions の実行やサーバーの実測を示しません。合成データを本人の実績へ転記しません。

## 対象の版

| リポジトリ | 読み取った完全 SHA |
| --- | --- |
| ns7jp/ns7jp（本文書の基点、変更前の main） | `8a0a0ee48365472466167ea2976e61f830d5c3e2` |

本ループ自体は `ns7jp/server` を読みません。監査・探索の対象 3 リポジトリの取得は既存の収集器が行い、今回の確認では合成スナップショットで代替しました。
文書を置いたコミットと、サーバーの試験を実施したコミットは別です。

## 実行済み

| 確認 | 結果 |
| --- | --- |
| `node --test tools/portfolio-loop/tests/*.test.mjs` | 30 passed / 0 failed / 0 skipped（loop 23 件、fixture 7 件） |
| 既存試験を含む全体 `node --test`（監査・改善実験・育成・案件・本ループ） | 289 passed / 0 failed |
| `node tools/portfolio-loop/loop.mjs demo`（一時ルート、合成データ） | 終了コード 0、`outcome: PROCESSED`、`demo: true`、次の一手 `BIND_SLOT` |
| `run --offline` を未初期化ルートで実行 | 終了コード 0、キャリア `NOT_INITIALIZED`、作業枠使用中（`CAREER_CAPACITY_UNKNOWN`）、次の一手 `INIT_CAREER` |
| `run --offline` を 48 時間前の観測で実行 | 終了コード 3、探索 `SKIPPED_NEEDS_REFRESH`、次の一手 `REFRESH_COLLECTION` |
| 不正な引数・未知のコマンド | 終了コード 2、`Loop stopped:` と `[USAGE]` |
| `PORTFOLIO_LOOP_NO_NETWORK=1` で `--offline` なしの `run` | 終了コード 2、`[NO_NETWORK]`、収集も書き込みもしない |
| Markdown lint（markdownlint-cli2、リポジトリ全体） | 165 files / 0 issues |
| Mermaid 構文（`scripts/check-mermaid.mjs`、リポジトリ全体） | 46 diagrams / 0 failed（本件で 3 図追加） |
| リポジトリ内リンク（`scripts/check-engineer-links.mjs` に `docs/portfolio-loop` を追加）とアンカーの解決 | 0 件 |
| GitHub Actions（`docs-check` の markdownlint・mermaid-parse・link-check、`server-engineer-check`、`server-projects-check`） | PR #111 のコミット `282b1bf6b329b495201b380b72a95be2a94fcb8e`（main `34c6540` を取り込んだ版）で 5 ジョブ成功（2026-09-09 06:00 UTC）。以後のコミットは PR の CI で個別に確認する |

ライブラリ呼び出しの試験はファイル冒頭で `fetch` を例外に置き換えています。子プロセスで動かす CLI の試験は `--offline` と `PORTFOLIO_LOOP_NO_NETWORK=1` で収集を禁止しています。書き込み先は `mkdtemp` の一時ルートだけです。
デモの所要時間は上記環境で 1 秒未満でしたが、参考値であり、実測記録として扱いません。

## 実装の限界

- 既存ツールの判定・鮮度・ロック・通知の意味をそのまま使います。ループが独自に緩めたり厳しくしたりしません。
- 作業枠の判定は監査結果・pending・採否台帳・inbox から機械的に決めます。open PR や優先度 1 の要確認課題があれば使用中です。空きの宣言は `--free` で本人が行います。
- 取り込みは `data_kind: measured` の結果だけです。合成・練習値は拒否し、その真正性は検証しません。
- 探索の候補・仮説・改善キューは提案です。実験の実施、採用、公開の許可ではありません。
- 保存物の削除・整理は行いません。保存量は `status` が表示します。

## 独立レビューで修正した点

初版のコードと文書に対して、契約・不変条件・文書・試験・運用の 5 観点で独立レビューを行い、各指摘を別の 2 名が反証する形で確認しました。34 件が残り、7 件は反証で棄却されました。重複を除いた修正は次のとおりで、各項目に回帰試験を追加しています。

1. BOM 除去の正規表現が誤っており、BOM 付き JSON（Windows のエディタが付けるもの）をすべて拒否していた。文字コードで判定する実装に変え、BOM 付きの台帳とスナップショットを読む試験を追加。
2. 取り込みが探索へ記録した後に `done/` への移動と台帳記録を行っていたため、途中で失敗すると判定が台帳から永久に失われた。台帳記録を移動より前に置き、同じ実験票は一度だけ記録し、移動失敗は警告にした。再取り込みは重複として扱う試験を追加。
3. 全試行が揃わない `NOT_READY` の結果を最終判定として `done/` へ移していた。inbox に残して `COMPLETE_MEASUREMENT` を出す形に変更。
4. `status` の次の一手が、記録に含めていなかった項目（収集状態・探索状態）を参照していたため `SLOT_OCCUPIED` などが欠けていた。記録へ項目を追加し、run と status の一致を試験で確認。
5. 合成スナップショットを実在のルートで `--offline` 再生すると合成由来の候補が探索の登録簿に残った。フィクスチャに `data_kind: synthetic` の目印を付け、`demo` か一時ディレクトリ以外で拒否。`demo --root` はリポジトリのルートと既存の `.local` を持つルートを拒否。
6. 作業枠の根拠が広すぎ、プローブ行の PASS 更新や資料欠落でも占有になっていた。open PR・CI 失敗・主張境界に限定し、それ以外は `REVIEW_AUDIT_FINDING` として提示。根拠の課題 ID を記録に残す。
7. `status` の監査行が LIVE の古い記録を優先し、鮮度を観測時刻ではなく評価時刻で測っていた。新しい方の記録を選び、観測時刻で測り、収集不全は鮮度外とした。
8. 読めないロックを「停止済み」と誤報告し除去を促していた。書き込み途中の可能性を示す別の扱いにした。
9. 結果の雛形が `data_kind: measured` を先に埋めていた。`NOT SET` にし、実測した本人が書き換えるまで取り込みを拒否。
10. キャリア・成長の記録時刻が評価時刻と一致していなかった。収集後に確定した 1 時刻を全工程で使う。
11. 収集エラーの内容がどこにも表示されず、ヒントが常に「ネットワーク・API 制限」だった。エラーをカード・記録・次の一手に表示し、HTTP 401/403 のときの `GITHUB_TOKEN` 確認を添えた。
12. `--root` で実行してもコマンド例に `--root` が付かず、`bind-slot` の例が `--root` 非対応の CLI を指していた。例に `--root` を付け、`bind-slot` をループの副コマンドにした。
13. SE 台帳が読めず成長を飛ばしたときに何も提示していなかった。`FIX_LEARNER_CONNECTION` を追加。
14. 文書の過大表現を修正。探索は合成を拒否しない（取り込みだけが拒否する）こと、テキスト出力にも権限のフッターを付けること、`--json` が共通オプションであること、`demo --root` が指定先へ雛形を複製すること、既存文書からの導線が自動化する手順（1〜5・8・10）と本人の手順（6・7・9）を区別すること、markdownlint の対象数（165）を訂正。
15. 試験の空虚な否定（登録後の抑止を検証していなかった）、再利用され得る pid の使用、未検証だった分岐（open PR・CI 失敗・pending・古い profile・SE 台帳不在・4 つのロック・除外 ID の無視・RESEARCH と BACKLOG_FULL・NO_CHANGE・CLI の各副コマンド）を補った。

## NOT RUN

- GitHub Actions は上記コミットで確認済み。それ以後にこのブランチへ追加したコミットは、PR の CI 結果を個別に確認する。
- 本ループ経由での GitHub API の実収集（`run` を `--offline` なしで実行すること）。この作業環境では Node.js 22 の `fetch` がプロキシ設定を使わないため、収集不全（終了コード 3）になる見込み。
- 定期タスクからの週次実行、通知の実配信。
- 実測結果の `register` → 測定 → inbox → 取り込み → `done` の一巡を、実際の測定値で行うこと（試験はテスト構築値で経路だけを確認）。
- VM・Ansible・Docker・AWS・Slack・再起動・24h/72h の操作と確認。
- push、PR 作成、マージ、公開先の確認。
- 本人の技能、採用、就業に関する結果。

## 再実行

```text
node --test tools/portfolio-loop/tests/*.test.mjs
node tools/portfolio-loop/loop.mjs demo
node tools/portfolio-loop/fixture.mjs .local/portfolio-loop/snapshot.synthetic.json
node tools/portfolio-loop/loop.mjs run --root /tmp/loop-check --offline .local/portfolio-loop/snapshot.synthetic.json
npx -y markdownlint-cli2 "**/*.md" "#node_modules"
node scripts/check-engineer-links.mjs
```
