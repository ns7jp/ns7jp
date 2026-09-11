# プロフィール構成図の編集用ソース

[プロフィール](../README.md)には、GitHubの動的な図の描画処理に依存しない[SVG画像](images/architecture-overview.svg)を表示します。以下は同じ8要素・7本の矢印を表すMermaid原文です。図を変更する際はSVGとこの原文を同時に更新し、矢印の方向とラベルを照合します。

```mermaid
flowchart LR
    U["利用者"] -->|画面を要求| N["Nginx: 入口"]
    N -->|要求を渡す| A["Flask / Gunicorn: 本体"]
    P["Prometheus: 計測・条件判定"] -->|数値を取りに行く| A
    G["Grafana: 表示"] -->|数値を問い合わせる| P
    C["Alloy: ログを運ぶ"] -->|送信| L["Loki: ログを保存・検索"]
    G -->|ログを問い合わせる| L
    P -->|警告を渡す| M["Alertmanager: 通知をまとめる"]
```

矢印は要求・取得・送信の向きで、応答は要求元へ返ります。構成と実測範囲の詳細は[アーキテクチャ図](architecture-diagram.md)と[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)にあります。

SVGは固定背景と通常のテキスト・図形で構成し、JavaScript、外部画像・フォント、`foreignObject`を使いません。図の表示は構築・運用の実測結果を示すものではありません。
