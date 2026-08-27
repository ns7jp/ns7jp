# ADLAB-DC1 / ADLAB-CLI1 08 AD構築演習 実施記録（未記入テンプレート）

> **これは未記入のテンプレートであり、実施記録ではない。** 2026-08-26 に AI 支援セッションで
> 雛形として用意した。手順・期待結果の正本は [08 AD構築演習設計](../08-ad-exercise-design.md)であり、
> このファイルには**転記しない**（内容が食い違うと二重管理になるため）。ここに書くのは実測結果・
> 判定・実施日時・エビデンスへのリンクだけにする。
>
> **これは作業中の下書きであり、最終的な保管場所ではない。** [7 章 証跡採録計画](../08-ad-exercise-design.md#7-証跡採録計画)の
> とおり、記入し終えたらこの内容を `docs/evidence/YYYY-MM-DD-windows-ad-lab.md`（windows-ad-lab.md のコピー）へ
> 新しい節として統合する。新しい採録の型・別の評価テンプレートは作らない。
>
> raw transcript の保存先・マスク方針・SHA-256 記録・独立した再確認は
> [windows-ad-lab.md §6・§11](../../evidence/templates/windows-ad-lab.md#6-raw-transcript-と公開用コピー)と
> 同じ運用に従う。DSRM パスワードは平文で一切記録しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| 実施者 | （記入） |
| 実施日時（開始・終了、JST） | （記入） |
| 対象ホスト | ADLAB-DC1 / ADLAB-CLI1 |
| 実行環境（仮想化基盤） | （記入。例: Hyper-V、Windows 11 Pro のビルド番号） |
| Windows Server edition / build（ADLAB-DC1） | （記入） |
| Client OS / build（ADLAB-CLI1） | （記入） |
| 参照した設計書のバージョン | [08-ad-exercise-design.md](../08-ad-exercise-design.md) 最終更新 2026-08-26 時点 |
| 前提（windows-ad-lab.md §4・§7・§9）の実施記録 | （リンクを記入） |

## 構築（4 章）実施ログ

手順の内容・コマンド・想定結果は [4 章 構築手順書](../08-ad-exercise-design.md#4-構築手順書)を参照。ここには結果だけを書く。

| 手順 No | 対象 | 結果（OK / NG） | 実施時刻 | 備考 |
| --- | --- | --- | --- | --- |
| 4.1 作業前確認 | 共通 | | | |
| 4.2〜4.4（`01-ou-and-groups.ps1`） | OU / グループ / オブジェクト移動 | | | |
| 4.5〜4.6 DC 側（`02-gpo-setup.ps1`） | GPO 作成・リンク | | | |
| 4.6 クライアント側（`02b-client-verify-gpo.ps1`） | GPO 適用確認 | | | |
| 4.7（`03-password-policy-and-pso.ps1`） | パスワードポリシー・PSO | | | |
| 4.8（`04-fsmo-and-health-check.ps1`） | FSMO・ヘルスチェック | | | |
| 4.9（`05-system-state-backup.ps1`） | 追加ディスク・バックアップ | | | |
| 4.10-1〜4.10-4（`06a-restore-drill-pre-dsrm.ps1`） | 復元演習前半 | | | |
| 4.10-5〜4.10-7（`06b-restore-drill-in-dsrm.ps1`） | 復元演習中盤（DSRM 内） | | | |
| 4.10-8（`06c-restore-drill-post-dsrm.ps1`） | 復元演習後半 | | | |
| 4.11 作業後確認 | 共通 | | | |

## 試験項目書 実測結果

観点・前提条件・手順・期待結果は [5 章 試験項目書](../08-ad-exercise-design.md#5-試験項目書)を参照。

| No | 実測結果 | 判定（PASS / FAIL / NOT RUN） | エビデンス | 実施日時 |
| --- | --- | --- | --- | --- |
| T-01 | | | | |
| T-02 | | | | |
| T-03 | | | | |
| T-04 | | | | |
| T-05 | | | | |
| T-06 | | | | |
| T-07 | | | | |
| T-08 | | | | |
| T-09 | | | | |
| T-10 | | | | |
| T-11 | | | | |
| T-12 | | | | |
| T-13 | | | | |
| T-14 | | | | |
| T-15 | | | | |
| T-16 | | | | |
| T-17 | | | | |
| T-18 | | | | |
| T-19 | | | | |
| T-20 | | | | |
| T-21 | | | | |
| T-22 | | | | |
| T-23 | | | | |
| T-24 | | | | |
| T-25 | | | | |
| T-26 | | | | |

エビデンスのファイル名は [7 章の命名規則を踏襲した windows-ad-lab.md の運用](../../evidence/templates/windows-ad-lab.md#6-raw-transcript-と公開用コピー)に従う。

## GUI 証跡（スクリーンショット）チェックリスト

- [ ] ADLAB-DC1 の追加仮想ディスク設定画面（初期化前・後）
- [ ] OU 階層（`dsa.msc` または `Get-ADOrganizationalUnit` の出力）
- [ ] GPO のリンク状態（`gpmc.msc` の Computers / Users OU、または `Get-GPInheritance` の出力）
- [ ] ADLAB-CLI1 の `gpresult /r` 出力、および RSoP レポート（`Get-GPResultantSetOfPolicy`）
- [ ] regedit 起動拒否のダイアログ（4.6-7 / T-14）
- [ ] チェックポイント一覧（`before-ad-design` / `ad-backup-taken` / `ad-design-complete` を含む）
- [ ] DSRM セーフモードのサインイン画面
- [ ] `wbadmin get versions` の出力（バックアップ取得前後）

## 権威復元演習の実施記録（4.10）

| 項目 | 内容 |
| --- | --- |
| 4.10-2 で控えたバックアップバージョン識別子 | （記入） |
| DSRM 再起動 1 回目の所要時間 | （記入） |
| DSRM 内での `ntdsutil` 実行結果 | （記入） |
| DSRM 再起動 2 回目（通常起動へ）の所要時間 | （記入） |
| `pf-restore-target` の復旧確認 | （Yes / No） |

## 切り戻し実施記録（4.12）

詳細は [4.12 章 切り戻し手順](../08-ad-exercise-design.md#412-切り戻し手順)を参照。

| 項目 | 内容 |
| --- | --- |
| 実施したか | （Yes / No） |
| 判断基準に該当した項目 | （記入） |
| `scripts/07-rollback.ps1` の実行結果（`-RemoveOrganizationalUnits` の有無） | （記入） |
| 切り戻し所要時間（実測） | （記入） |

## 発見した事実（症状 → 原因 → 対処）

設計書・キットのスクリプトどおりに進まなかった箇所があれば、事実だけをここに残す。
**「学び」の言語化は本人が [LEARNINGS.md](../../../LEARNINGS.md) に書く（AI は代筆しない、[STATUS.md §0 ルール 7](../../../STATUS.md#0-更新の運用ルール2026-07-03-制定)）。**

| # | 症状 | 原因 | 対処 |
| --- | --- | --- | --- |
| | | | |

## 完了後に更新するもの

[8 章](../08-ad-exercise-design.md#8-実施ステータスと次のアクション)のとおり。[checklist.md の 4 節](./checklist.md#4-完了後の更新8-章)も参照。

- [ ] [STATUS.md](../../../STATUS.md) の該当セクション
- [ ] [学習プラン README](../README.md) の 08 に関する記述
- [ ] [志望トラックと証跡の対応](../../target-roles.md)優先 3（IT サポート・社内 SE 補助）の Windows 実機出力欄
- [ ] [08-ad-exercise-design.md 5 章](../08-ad-exercise-design.md#5-試験項目書)の実測結果欄、またはこのファイルへのリンク
- [ ] `docs/evidence/YYYY-MM-DD-windows-ad-lab.md` への統合（このファイルの内容の最終的な保管先）
