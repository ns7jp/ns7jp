# 06 シェルスクリプト演習（Windows/PowerShell側）実施キット

> **状態: 一部は AI 支援セッションの作業環境で実行済み、一部は未実行の雛形（2026-08-26 に AI 支援セッションで作成）。**
> このキットを置いただけでは [06 シェルスクリプト演習設計](../06-shell-scripting-exercise-design.md)の
> 4 章（Windows／PowerShell）の実施ステータスは変わらない。実施ステータスは、本人が実機
> （Windows 11 または Windows Server 評価版、AD 部分はラボドメイン構築後）で 4 章を実際に通した後、
> [8 章の手順](../06-shell-scripting-exercise-design.md#8-実施ステータスと次のアクション)に従って更新する。

## これは何か

**先に押さえる 3 語**（この節の説明と下の表は、この 3 語が前提になっている）

- **コマンドレット**: PowerShell の命令ひとつひとつのこと。`Get-Service` のように「動詞-名詞」の形をしている
- **Windows PowerShell 5.1 と PowerShell 7 は別物**: 5.1 は Windows に最初から入っている古い方で、Windows 専用。7 は後から入れる新しい方で、Windows / Linux / macOS で動く。使えるコマンドレットも、`.ps1` ファイルの文字コードの読み取り方も違うため、この先は「Windows PowerShell 5.1」と「PowerShell 7」のどちらの話なのかを見ながら読む
- **RSAT（Remote Server Administration Tools）**: Windows に追加で有効化するサーバー管理ツール一式。AD（Active Directory）をコマンドで操作するための `ActiveDirectory` モジュールはこれに含まれるため、Linux 上の PowerShell 7 には存在しない

[06 シェルスクリプト演習設計](../06-shell-scripting-exercise-design.md)の 4 章（Windows／PowerShell）のうち、
この AI 支援セッションには **PowerShell 7（Core）をインストールできる Linux コンテナ**がある。
Windows 実機・AD ラボドメインは無いが、PowerShell の言語機能とクロスプラットフォーム対応の
コマンドレット（`Compress-Archive`／`[System.Threading.Mutex]`／`Start-Transcript`／`Get-PSDrive`
等）は Linux 上の PowerShell 7 でも動作するため、**4.1・4.2・4.3 演習A の範囲は実際に実行して
確認した**。一方、`Get-Service`（Linux 版 PowerShell 7 にはコマンドレット自体が存在しない）・
`*-EventLog` 系（Windows PowerShell 5.1 専用）・`ActiveDirectory` モジュール（Windows Server の
RSAT 機能）に依存する範囲は、この環境では原理的に実行できない。

| 範囲 | この AI 支援セッションでの状態 |
| --- | --- |
| 4.1 Level 1・4.2 Level 2 | **実行済み**（Linux コンテナの PowerShell 7.4.6）。[06 文書](../06-shell-scripting-exercise-design.md#41-level-1-基礎文法)に実施記録を追記済み |
| 4.3 演習A `Backup-Rotate.ps1`（A-1〜A-4） | **実行済み**（同上）。生成物の展開一致・世代管理・排他制御（2 重起動の拒否）・異常系での transcript 終了と Mutex 解放を確認 |
| 4.3 演習B（サービス）・演習C（イベントログ）・演習C フラッグシップ `Invoke-EnvironmentCheck.ps1` | **未実行**。`Get-Service` は Linux 版 PowerShell 7 に存在せず、`*-EventLog` 系は Windows PowerShell 5.1 専用のため、この環境では実行不可能。ディスク使用率チェック（`Get-PSDrive` 部分）のみクロスプラットフォームのため実行して確認した |
| 4.4 Level 4（AD）・演習D・演習E フラッグシップ `New-LabUserBatch.ps1` | **未実行**。`ActiveDirectory` モジュールが無く実行不可能。CSV 読み込み・列検証・グループ名導出・`-WhatIf` 既定化ロジックなど AD 非依存部分のみ実行して確認した |

このディレクトリは、実施そのものを代行するのではなく、**実施時にコピー&ペーストの手間と
タイプミスを減らすための補助ファイル**を集めたものである。[06 章 4 章](../06-shell-scripting-exercise-design.md#4-windowspowershell演習設計)の
記述をコマンド単位で自動化・省略するものではない。

## 実行済み範囲の検証方法

Linux コンテナへ PowerShell 7.4.6（公式 tar.gz、GitHub Releases から取得）を展開して実行した。
生成物・終了コード・ファイル内容を実際に確認しており、[06 文書の実施記録](../06-shell-scripting-exercise-design.md#8-実施ステータスと次のアクション)に詳細がある。

## 未実行範囲の検証方法

`Get-Service`／`*-EventLog`／`ActiveDirectory` に依存する部分は実行できないため、次の 2 段階で確認した。

1. **構文検証**: `[System.Management.Automation.Language.Parser]::ParseFile()` で全スクリプトを
   パースし、構文エラーが無いことを確認した（[phase1-kit](../phase1-kit/README.md)・
   [python-ops-kit](../python-ops-kit/README.md)の「目視のみ」より一段階踏み込んだ検証だが、
   cmdlet の実際の挙動・戻り値の型・エラーメッセージまでは検証できていない）
2. **AD/Windows 非依存部分の実行確認**: `Invoke-EnvironmentCheck.ps1` のディスク使用率チェック
   関数（`Get-PSDrive` 利用部分）、`New-LabUserBatch.ps1` の CSV 読み込み・列検証・グループ名
   正規化・`-WhatIf` 既定化ロジックは、関数を単体で切り出して Linux コンテナ上で実行し、
   意図どおりの結果を確認した

`PSScriptAnalyzer` によるリンティングは、この環境から PSGallery（PowerShell Gallery）へ到達
できなかったため実施していない。

## 中身

| ファイル / ディレクトリ | 対応する設計書の節 | 用途 | この環境での状態 |
| --- | --- | --- | --- |
| [`checklist.md`](./checklist.md) | 4 章全体 | 実施中に開いておく進捗チェックリスト（正本ではない） | — |
| [`evidence-template.md`](./evidence-template.md) | [5 章](../06-shell-scripting-exercise-design.md#5-到達確認)・[7 章](../06-shell-scripting-exercise-design.md#7-証跡採録計画) | 実測結果・エビデンスの記入用テンプレート | — |
| `backup-rotate/Backup-Rotate.ps1` | [4.3 演習A](../06-shell-scripting-exercise-design.md#演習-a-backup-rotateps1) | A-1〜A-4 の実装 | **実行済み** |
| `flagship/Invoke-EnvironmentCheck.ps1` | [4.3 演習C-2（フラッグシップ）](../06-shell-scripting-exercise-design.md#演習-c-2フラッグシップ-invoke-environmentcheckps1) | C-1〜C-7 の実装（C-8 は別ファイル） | ディスクチェック部分のみ実行済み。`Get-Service`/`Write-EventLog` 依存部分は未実行 |
| `register-task/Register-EnvironmentCheckTask.ps1` | 同上 C-8 | タスクスケジューラへの日次登録 | 未実行（`ScheduledTasks` モジュールが Windows 専用） |
| `flagship/New-LabUserBatch.ps1` | [4.4 演習E（フラッグシップ）](../06-shell-scripting-exercise-design.md#演習-eフラッグシップ-new-labuserbatchps1) | E-1〜E-6 の実装 | CSV/検証ロジックのみ実行済み。AD 依存部分は未実行 |
| `sample-data/new-lab-users.csv` | 同上 | `New-LabUserBatch.ps1` の動作確認用サンプル CSV（3 件、うち 1 件は接頭辞なしでスキップ経路を試験できる） | 列検証・接頭辞判定・グループ名導出をこの CSV で実行済み |

演習B（サービス操作）・演習D（AD 基礎操作）は、[06 文書](../06-shell-scripting-exercise-design.md)の
ハンズオン表が単発コマンドレット中心（`Get-Service`／`New-ADUser` 等を 1〜2 行で試す）で
独立したスクリプトファイルを持たないため、このキットにも対応するファイルを置いていない。
実機で 06 文書のハンズオン列をそのまま入力する。

## 使い方の想定順序

> **実行ポリシーに関する注記**: Windows で `.ps1` スクリプトを初めて実行すると、既定の実行ポリシー
> （`Restricted`）によりスクリプトの実行自体がブロックされ、「このシステムではスクリプトの実行が
> 無効になっている」という趣旨のエラーになることがある。管理者権限の PowerShell で
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` を一度実行しておく（[06 文書の同注記](../06-shell-scripting-exercise-design.md#4-windowspowershell演習設計)と
> 同じ内容。組織管理の PC ではポリシーの変更が禁止されている場合があるため、その場合は管理者に確認する）。

1. **4.1・4.2・4.3 演習A**: 実機（Windows 11 または Windows Server 評価版）でも同じ結果になるか、
   [06 文書](../06-shell-scripting-exercise-design.md#41-level-1-基礎文法)のハンズオン列と
   `backup-rotate/Backup-Rotate.ps1` を実行して比較する
2. **4.3 演習B・演習C**: [06 文書](../06-shell-scripting-exercise-design.md#演習-b-windows-サービスの操作)の
   ハンズオン列を単体の Windows 端末で実行する。完了後、`flagship/Invoke-EnvironmentCheck.ps1` を
   Windows PowerShell 5.1 で実行し、`register-task/Register-EnvironmentCheckTask.ps1` でタスク登録する
3. **4.4 演習D・演習E**: [Windows / AD 公開再現ラボ](../../evidence/templates/windows-ad-lab.md)の
   Greenfield 手順でラボドメインを構築した後、[06 文書](../06-shell-scripting-exercise-design.md#演習-d-ad-オブジェクトの読み取り作成の基礎)の
   ハンズオン列を実行し、`flagship/New-LabUserBatch.ps1 -CsvPath sample-data/new-lab-users.csv`
   （既定で `-WhatIf` 相当、書き込むには `-WhatIf:$false` を明示）を実行する
4. `checklist.md` を開きながら進め、`evidence-template.md` に実測結果を記入する
5. 完了後、[06 文書 8 章](../06-shell-scripting-exercise-design.md#8-実施ステータスと次のアクション)の
   とおり STATUS.md・学習プランを更新する

## このキットに含まれないもの

- Windows 11 / Windows Server 評価版の ISO そのもの
- ラボドメインの構築そのもの（[Windows / AD 公開再現ラボ](../../evidence/templates/windows-ad-lab.md)を使う。
  [05 の phase1-kit](../phase1-kit/README.md)・[07 の python-ops-kit](../python-ops-kit/README.md)と同じ理由で、
  セットアップの自動化は意図的に含めていない）
- 実施結果そのもの（本人が実機で実施して記入する）

## 未検証の範囲

`flagship/Invoke-EnvironmentCheck.ps1` の `Test-ServiceRunning`（`Get-Service` 依存）と
イベントログ記録（`Write-EventLog` 依存）、`flagship/New-LabUserBatch.ps1` の AD 操作
（`Get-ADDomain`/`New-ADUser`/`Add-ADGroupMember` 等）、`register-task/Register-EnvironmentCheckTask.ps1`
（`ScheduledTasks` モジュール依存）は、Windows 実行環境にも AD ラボドメインにもこの AI 支援セッションからは
到達できないため、**一度も実行していない**。構文パーサーによる検証は行ったが、実際の挙動・戻り値の型・
エラーメッセージ・PowerShell バージョン差（Windows PowerShell 5.1 と PowerShell 7 の違いを含む）は未検証
（[phase1-kit README の未検証の範囲](../phase1-kit/README.md#未検証の範囲)と同じ制約）。

実施時に画面の表記やエラーが異なる場合は、実際の表記を優先し、差分を本人が
[LEARNINGS.md](../../../LEARNINGS.md) へ残す。

**追記（同日・本人が実機で初回実行）**: 本人が Windows PowerShell 5.1（`powershell.exe`）で
`backup-rotate/Backup-Rotate.ps1` を実行したところ、`ParserError: MissingCatchOrFinally` /
`式またはステートメントのトークン '}' を使用できません` で読み込み自体に失敗する事象に遭遇した。
その調査で、キットの `.ps1` 全 4 本に**実バグ**が見つかった。ファイルが UTF-8（BOM なし）で
保存されており、Windows PowerShell 5.1 は BOM なしの `.ps1` を既定でシステムの ANSI コード
ページ（日本語 Windows では Shift-JIS 系）として読み込むため、日本語コメント・文字列リテラルが
文字化けし、その結果パーサーが波かっこの対応を見失っていた（PowerShell 7／Core は BOM の有無に
関わらず UTF-8 として扱うため、この AI 支援セッションの Linux コンテナでは再現しなかった）。
4 本すべてに UTF-8 BOM を付与し、PowerShell 7 の構文パーサーで再検証した上で修正した
（`New-LabUserBatch.ps1` の AD 依存部分など、Windows PowerShell 5.1 での機能面の実行確認は
このバグ修正時点でもまだ未完了のまま残っている）。
