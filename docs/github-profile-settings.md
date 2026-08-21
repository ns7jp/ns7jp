# GitHub プロフィール表示設定

> この文書は、リポジトリのファイル編集では変更できない GitHub アカウント設定の適用チェックリストです。
> **設定済みの実績を示す文書ではありません。** 2026-08-21 に公開プロフィールを確認した時点では、Bio とピン留めは下記の推奨状態へ未変更でした。

## Bio

次の文面へ統一します。

> Linux サーバー構築・運用エンジニア志望｜Ubuntu / Ansible / Docker / Prometheus / Grafana｜構築・試験・障害復旧の実測記録を公開

README の第一志望と同じ「Linux サーバー構築・運用」を先頭に置きます。「IT 技術系へキャリアチェンジ中」のような広い表現より、採用担当者が対象職種を判断しやすくします。

Web サイト欄は `https://ns7jp.github.io/` を維持します。

## ピン留めするリポジトリ

上から次の優先順にします。

1. `server-monitor` — 第一志望に直結する主作品
2. `ns7jp` — プロフィール README、経歴、証跡への入口
3. `post` — PHP / MySQL と Web セキュリティ基礎
4. `pulse` — PHP / SQLite の学習作品
5. `works` — Python / HTML / CSS の学習過程
6. `ns7jp.github.io` — ブラウザ向けポートフォリオ

`server-monitor` が先頭に表示されない状態では、学習期の Web 作品が第一印象になります。ピン留め後はログアウト状態でも `server-monitor` が最初に見えることを確認します。

## リポジトリ説明

`server-monitor` の About / Description は次を推奨します。

> Ubuntu / Ansible / Docker / Prometheus / Grafana で、設計・構築・試験・障害復旧を実測するインフララボ

Topics は次を候補とします。

`linux`, `ansible`, `docker`, `prometheus`, `grafana`, `loki`, `terraform`, `monitoring`, `infrastructure-as-code`

プロフィールリポジトリ `ns7jp` の Description は次を推奨します。

> Linux サーバー構築・運用エンジニア志望｜実測証跡と学習の一次記録

## 適用後の確認

- Bio、README 見出し、`docs/overview-for-recruiters.md` の第一志望が一致している
- `server-monitor` がピン留めの先頭にある
- `server-monitor` の説明だけで「設計・構築・試験・復旧」が分かる
- 公開動画がない間は、デモを「動画」ではなく「収録台本・準備中」と表示している
- ログアウト状態またはシークレットウィンドウで、30 秒以内に主作品と実測証跡へ移動できる
