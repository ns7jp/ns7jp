# Windows 実機 06 演習（4 章）実施記録（未記入テンプレート）

> **これは未記入のテンプレートであり、実施記録ではない。** 2026-08-26 に AI 支援セッションで
> 雛形として用意した。手順・期待結果の正本は [06 シェルスクリプト演習設計](../06-shell-scripting-exercise-design.md)
> であり、このファイルには**転記しない**（内容が食い違うと二重管理になるため）。ここに書くのは
> 実測結果・判定・実施日時・エビデンスへのリンクだけにする。
>
> AI 支援セッションが Linux コンテナ上の PowerShell 7 で実行した Level 1・Level 2・演習A の
> 結果は、[06 文書側](../06-shell-scripting-exercise-design.md#41-level-1-基礎文法)に既に記録済み
> （このファイルの対象ではない）。このテンプレートは**実機（Windows）での実施記録**専用。
>
> 記入し終えたら、[7 章 証跡採録計画](../06-shell-scripting-exercise-design.md#7-証跡採録計画)の方針どおり、
> PowerShell 側の raw transcript は Git 管理外へ保存し、マスク済み公開コピーを本リポジトリの
> `docs/evidence/` へ置く。Level 4（AD）は
> [Windows / AD 公開再現ラボ §6〜§11](../../evidence/templates/windows-ad-lab.md#6-raw-transcript-と公開用コピー)と
> 同じ運用（raw の非公開保存、マスク済み公開コピー、SHA-256、再確認）に揃える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| 実施者 | （記入） |
| 実施日時（開始・終了、JST） | （記入） |
| 対象ホスト | （記入。例: lab-base01 の Windows 版、LAB-WINOPS1） |
| Windows edition / build | （記入） |
| PowerShell version（`$PSVersionTable`） | （記入） |
| 参照した設計書のバージョン | [06-shell-scripting-exercise-design.md](../06-shell-scripting-exercise-design.md) 最終更新 2026-08-26 時点 |
| AI 支援セッションの Linux 実行結果との差分 | （記入。無ければ「差分なし」と明記する） |

## Level 1・Level 2（4.1・4.2）実機再実施

| # | 結果（OK / NG） | 実施時刻 | 備考（AI 実行結果との差分があれば） |
| --- | --- | --- | --- |
| L1-1〜L1-5 | | | |
| L2-1〜L2-5 | | | |

## 演習A `Backup-Rotate.ps1`（4.3）実機再実施

| # | 結果（OK / NG） | 実施時刻 | 備考 |
| --- | --- | --- | --- |
| A-1 圧縮バックアップ | | | |
| A-2 世代管理 | | | |
| A-3 排他制御 | | | |
| A-4 ログ記録 | | | |

## 演習B・演習C（4.3、サービス・イベントログ）実施ログ

| # | 結果（OK / NG） | 実施時刻 | 備考 |
| --- | --- | --- | --- |
| S-1〜S-5 | | | |
| E-1〜E-5 | | | |

## 演習C（フラッグシップ）`Invoke-EnvironmentCheck.ps1` 試験項目書 実測結果

観点・前提条件・手順・期待結果は [06 文書の試験項目書](../06-shell-scripting-exercise-design.md#試験項目書)を参照。

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

## AD ラボドメイン構築（前提）

[Windows / AD 公開再現ラボ](../../evidence/templates/windows-ad-lab.md)側のテンプレートに記入する。ここにはリンクだけを残す。

| 項目 | 記入先 |
| --- | --- |
| ラボドメイン構築記録 | （記入。例: `docs/evidence/YYYY-MM-DD-windows-ad-lab.md` へのリンク） |

## 演習D（4.4、AD 基礎操作）実施ログ

| # | 結果（OK / NG） | 実施時刻 | 備考 |
| --- | --- | --- | --- |
| D-1〜D-5 | | | |

## 演習E（フラッグシップ）`New-LabUserBatch.ps1` 試験項目書 実測結果

観点・前提条件・手順・期待結果は [06 文書の試験項目書](../06-shell-scripting-exercise-design.md#試験項目書-2)を参照。

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

エビデンスのファイル名は [7 章の命名規則](../06-shell-scripting-exercise-design.md#7-証跡採録計画)（`<試験No>_<対象>_<日付>.<拡張子>`）に従う。

## 発見した事実（症状 → 原因 → 対処）

設計書どおりに進まなかった箇所があれば、事実だけをここに残す。
**「学び」の言語化は本人が [LEARNINGS.md](../../../LEARNINGS.md) に書く（AI は代筆しない、[STATUS.md §0 ルール 7](../../../STATUS.md#0-更新の運用ルール2026-07-03-制定)）。**

| # | 症状 | 原因 | 対処 |
| --- | --- | --- | --- |
| | | | |

## 完了後に更新するもの

[06 文書 8 章](../06-shell-scripting-exercise-design.md#8-実施ステータスと次のアクション)のとおり。[checklist.md の 8 節](./checklist.md#8-完了後の更新8-章)も参照。

- [ ] [STATUS.md](../../../STATUS.md)
- [ ] [02 フェーズ別カリキュラム W4 / W18](../02-curriculum.md#w4-ディスクファイルシステムシェルスクリプト)からのリンク
- [ ] [06-shell-scripting-exercise-design.md](../06-shell-scripting-exercise-design.md)の各試験項目書の実測結果欄、またはこのファイルへのリンク
