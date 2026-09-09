# 自律型ポートフォリオ改善ループ（実装）

2026-09-09 作成。既存の監査・キャリア・成長・探索の各 CLI をライブラリとして 1 コマンドで回します。Node.js 22 以上、追加パッケージ不要です。

```text
node --test tools/portfolio-loop/tests/*.test.mjs
node tools/portfolio-loop/loop.mjs demo
node tools/portfolio-loop/loop.mjs init 10
node tools/portfolio-loop/loop.mjs run
```

| ファイル | 役割 |
| --- | --- |
| `loop.mjs` | 点検、工程の実行、作業枠の合成、実測の取り込み、集約、次の一手、CLI |
| `fixture.mjs` | 合成スナップショット、一時ルートの用意、フィクスチャ CLI |
| `tests/loop.test.mjs` | ループの回帰試験（ライブラリ呼び出しは `fetch` を無効化、CLI は `--offline` と `PORTFOLIO_LOOP_NO_NETWORK` で保護） |
| `tests/fixture.test.mjs` | フィクスチャの整合性試験 |

設計・入力仕様・運用・検証記録は [docs/portfolio-loop](../../docs/portfolio-loop/README.md) にあります。
終了コード 0 は処理完了で、課題 0 件・実機合格・公開可能の意味ではありません。合成データの結果は実測として扱いません。
