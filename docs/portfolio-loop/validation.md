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
| `node --test tools/portfolio-loop/tests/*.test.mjs` | 22 passed / 0 failed / 0 skipped（loop 15 件、fixture 7 件） |
| 既存試験を含む全体 `node --test`（監査・改善実験・育成・案件・本ループ） | 281 passed / 0 failed |
| `node tools/portfolio-loop/loop.mjs demo`（一時ルート、合成データ） | 終了コード 0、`outcome: PROCESSED`、`demo: true`、次の一手 `BIND_SLOT` |
| `run --offline` を未初期化ルートで実行 | 終了コード 0、キャリア `NOT_INITIALIZED`、作業枠使用中（`CAREER_CAPACITY_UNKNOWN`）、次の一手 `INIT_CAREER` |
| `run --offline` を 48 時間前の観測で実行 | 終了コード 3、探索 `SKIPPED_NEEDS_REFRESH`、次の一手 `REFRESH_COLLECTION` |
| 不正な引数・未知のコマンド | 終了コード 2、`Loop stopped:` と `[USAGE]` |
| Markdown lint（markdownlint-cli2、リポジトリ全体） | 164 files / 0 issues |
| Mermaid 構文（`scripts/check-mermaid.mjs`、リポジトリ全体） | 46 diagrams / 0 failed（本件で 3 図追加） |
| リポジトリ内リンク（`scripts/check-engineer-links.mjs` に `docs/portfolio-loop` を追加）とアンカーの解決 | 0 件 |

試験はファイル冒頭で `fetch` を例外に置き換え、ネットワークを使わないことを保証しています。書き込み先は `mkdtemp` の一時ルートだけです。
デモの所要時間は上記環境で 1 秒未満でしたが、参考値であり、実測記録として扱いません。

## 実装の限界

- 既存ツールの判定・鮮度・ロック・通知の意味をそのまま使います。ループが独自に緩めたり厳しくしたりしません。
- 作業枠の判定は監査結果・pending・採否台帳・inbox から機械的に決めます。open PR や優先度 1 の要確認課題があれば使用中です。空きの宣言は `--free` で本人が行います。
- 取り込みは `data_kind: measured` の結果だけです。合成・練習値は拒否し、その真正性は検証しません。
- 探索の候補・仮説・改善キューは提案です。実験の実施、採用、公開の許可ではありません。
- 保存物の削除・整理は行いません。保存量は `status` が表示します。

## 独立レビューで修正した点

本文書の作成時点では独立レビューを実施中です。修正があれば、対応する回帰試験とともにここへ追記します。

## NOT RUN

- 本ループの差分に対する GitHub Actions の実行（`docs-check` へのステップ追加は行ったが、この差分での実行結果は未確認）。
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
