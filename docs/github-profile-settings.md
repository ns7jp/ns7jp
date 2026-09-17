# GitHub プロフィール表示設定

> この文書は、リポジトリのファイル編集では変更できない GitHub アカウント設定の適用記録です。
> 以下の「2026-08-22 の適用記録」は当時の確認結果であり、**下記のとおり現況とずれています。**

## 現況と訂正（2026-09-17）

外部レビューで GitHub アカウントの公開状態を確認したところ、本文書の記載と実態に差がありました。
**記録を消さずに残したうえで、差分をここに書きます。**

| 記載 | 現況 | 差分 |
| --- | --- | --- |
| ピン留め 1 番目が `server-monitor` | リポジトリ名は **`server`** へ改名済み | 旧名の記載が残っていた |
| ピン留めに `post` と `pulse` | 公開リポジトリ一覧に **両方とも存在しない** | 削除または改名されたが記録が追随していない |
| 公開リポジトリの説明文 | 公開 15 個のうち **10 個に説明文が無い**（`support` / `shell` / `aws` / `automation` / `azure` / `design` / `network` / `sql` / `php` / `javascript`。いずれも 2026-08-28〜09-01 作成） | 2026-08-22 以降に増えた分が未整理 |
| — | `ns7jp` の GitHub 言語判定が **JavaScript** になっていた | 2026-09-17 に `archive/` 分離と `.gitattributes` で対応済み（反映待ち） |

**ピン留めの現在の設定内容は未確認です。** ログアウト状態での再確認が必要です。

採用担当者が `github.com/ns7jp` を開いて最初に見るのがこの一覧のため、主作品 `server` が
説明文の無い 10 個に埋もれる状態になっています。整理の手順は
**[GitHub プロフィール整理 作業指示書](./github-profile-cleanup.md)** にまとめました
（ピン留めの推奨 6 枠、10 個それぞれの扱いの判断表と説明文の案、言語判定の確認方法、所要時間の目安）。
**GitHub 側の設定操作なので、リポジトリのファイル編集では反映されません。本人が実施します。**

---

## 2026-08-22 の適用記録（当時の内容。現況は上記を参照）

## Bio

現在の公開文面です（2026-08-22 確認）。

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

> **2026-08-26 の見直し**: `docs/it-support/` を削除し IT サポート・社内 SE 補助の露出を縮小したため、`it-support` Topic は次回 GitHub 側で設定を見直す際に外す候補です（この Topics 変更は GitHub の Web UI / API 側の操作であり、本リポジトリのファイル編集だけでは反映されません）。`active-directory` / `windows-server` は、[06 シェルスクリプト演習設計](./learning-plan/06-shell-scripting-exercise-design.md#44-level-4-active-directory-運用スクリプト)と[Windows / AD 公開再現ラボ](./evidence/templates/windows-ad-lab.md)として最小限は残しているため、現時点では維持します。

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
