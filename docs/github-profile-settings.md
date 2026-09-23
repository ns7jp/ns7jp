# GitHub プロフィール表示設定

> この文書は、リポジトリのファイル編集では変更できない GitHub アカウント設定の適用記録です。
> 以下の「2026-08-22 の適用記録」は当時の確認結果です。現在の設定と、作成した変更案を分けて記録します。

## 現況と訂正（2026-09-17）

公開 README とリポジトリ情報を確認しました。内容確認を伴わない整理案を [作品案内](./github-profile-cleanup.md)で訂正しています。過去の適用記録は以下に残し、再確認していない設定を現在の状態として扱いません。

| 対象 | 2026-09-17 の確認・準備内容 | 状態 |
| --- | --- | --- |
| 主作品の名称 | `server-monitor` の現在の名称は **`server`** | 名称確認済み。ピンの現在の順序を示すものではない |
| `design` の分類 | 架空企業のインフラ刷新を扱う設計書 13 文書 | 内容確認済み。画像・UI 素材という旧記述を訂正 |
| `design` / `shell` / `network` / `aws` の説明文 | 内容を確認し、[実態に合わせた Description](./github-profile-cleanup.md#about-欄の説明文) を設定。変更前はいずれも説明文が空 | GitHub API で適用・再取得して一致確認済み |
| ピン留め | [作品の役割に合わせた配置案](./github-profile-cleanup.md#ピン留めで見せる順番)を作成 | 現在の表示・変更適用は未確認 |
| 言語判定 | `.gitattributes` の `archive/** linguist-documentation` を維持 | `archive/tools/portfolio-loop/loop.mjs` で属性 `set` を確認。GitHub の表示は未確認 |

### 今回の設定適用記録

| 項目 | 状態 | 再確認 |
| --- | --- | --- |
| 4 リポジトリの Description | 適用・再取得確認済み | 2026-09-17 08:41:33〜37 UTC、各 `GET /repos/ns7jp/{repo}` の `description` が設定値と一致 |
| ピン留め | 未変更・現況未確認 | 採用担当者に見えるプロフィール画面を確認する |
| Bio / Topics | 今回は変更していない | 下の 8 月の記録は当時の値として残す |

確認順と UTC 時刻: `aws` 08:41:33、`design` 08:41:34、`network` 08:41:36、`shell` 08:41:37。いずれも変更前は `null`、変更後の値は [Description の表](./github-profile-cleanup.md#about-欄の説明文)に記載したとおりです。

リポジトリ名だけを根拠にした非公開化・統合・アーカイブは今回の作業に含めません。

---

## 2026-08-22 の適用記録（当時の内容。現況は上記を参照）

## Bio

2026-08-22 に確認した当時の公開文面です。

> サーバー設計・構築エンジニア志望｜Ubuntu / Ansible / Docker / Prometheus / Grafana｜構築・試験・障害復旧の実測記録を公開｜Python・PHP・ITパスポート（公共職業訓練修了・4資格取得）

README と同じくサーバー設計・構築を第一志望として先頭に置いています。「IT 技術系へキャリアチェンジ中」のような広い表現より、採用担当者が対象職種を判断しやすい文面です。

Web サイト欄は `https://ns7jp.github.io/` を維持します。

## ピン留めするリポジトリ

2026-08-22 にログアウト状態で確認した表示順です。

1. `server-monitor` — 第一志望に直結する主作品（**現在の名前は `server`**）
2. `ns7jp` — プロフィール README、経歴、証跡への入口
3. `post` — PHP / MySQL と Web セキュリティ基礎
4. `pulse` — PHP / SQLite の学習作品
5. `works` — Python / HTML / CSS の学習過程
6. `ns7jp.github.io` — ブラウザ向けポートフォリオ

`server-monitor` を先頭にして、学習期の Web 作品よりサーバー設計・構築の主作品を先に示しています。

## リポジトリ説明と Topics

`server-monitor`（現 `server`）の公開 About / Description は、2026-08-22 時点で次の文面です。

> Ubuntu サーバーの構築〜監視〜障害復旧を Ansible / Prometheus / Grafana / Loki で実装した Linux インフラ運用ラボ（実測証跡付き）

Topics は2026-08-23に適用・再確認済みです。

`ansible`, `docker`, `grafana`, `infrastructure-as-code`, `linux`, `loki`, `monitoring`, `prometheus`, `terraform`, `alertmanager`, `aws`, `backup`, `disaster-recovery`, `observability`, `ubuntu-server`

プロフィールリポジトリ `ns7jp` の公開 Description は、2026-08-22 時点で次の文面です。

> サーバー設計・構築エンジニア志望｜実測証跡と学習の一次記録

`ns7jp` の Topics も2026-08-23に適用・再確認済みです。

`active-directory`, `ansible`, `career-change`, `github-profile`, `infrastructure`, `it-support`, `linux`, `portfolio`, `powershell`, `windows-server`

ポートフォリオサイト `ns7jp.github.io` の Topics も同日に適用・再確認済みです。

`ansible`, `docker`, `github-pages`, `grafana`, `infrastructure`, `it-support`, `linux`, `monitoring`, `portfolio`, `prometheus`, `terraform`

> **2026-08-26 の見直し**: `docs/it-support/` を削除し IT サポート・社内 SE 補助の露出を縮小したため、`it-support` Topic は次回 GitHub 側で設定を見直す際に外す候補です（この Topics 変更は GitHub の Web UI / API 側の操作であり、本リポジトリのファイル編集だけでは反映されません）。`active-directory` / `windows-server` は、[06 シェルスクリプト演習設計](https://github.com/ns7jp/learning/blob/main/docs/learning-plan/06-shell-scripting-exercise-design.md#44-level-4-active-directory-運用スクリプト)と[Windows / AD 公開再現ラボ](./evidence/templates/windows-ad-lab.md)として最小限は残しているため、現時点では維持します。

## 適用後の確認（2026-08-22）

- [x] Bio、README 見出し、`docs/overview-for-recruiters.md` がサーバー設計・構築を第一志望として示している
- [x] `server-monitor` がピン留めの先頭にある
- [x] `server-monitor` の公開 Description で Ubuntu サーバーの構築・監視・障害復旧と実測証跡を示している
- [x] `ns7jp` の公開 Description でサーバー設計・構築を第一志望として示している
- [x] `server-monitor`、`ns7jp`、`ns7jp.github.io` の Topics を設定し、GitHub APIで反映を確認した（2026-08-23）
- [x] 保存済み実測証跡の編集リプレイを公開し、実操作の連続録画ではないことを明記している
- [x] ログアウト状態で、ピン留め先頭の `server-monitor` とプロフィール README から主作品・実測証跡へ移動できる

## 関連ドキュメント

- [GitHub プロフィール整理 作業指示書](./github-profile-cleanup.md)
- [プロフィール README](../README.md)
- [ポートフォリオ進捗 STATUS](../STATUS.md)
