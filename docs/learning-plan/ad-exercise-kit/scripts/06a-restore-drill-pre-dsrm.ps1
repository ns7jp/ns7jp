<#
.SYNOPSIS
    権威復元演習（4.10）の前半：テストオブジェクト作成 → 再バックアップ → 誤削除の再現 → DSRM への再起動。

.DESCRIPTION
    08 AD構築演習設計の 4.10-1〜4.10-4 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧

    **この節は本演習で最もリスクが高い操作を含む。** 実行前に必ず、
    [4.9-6 のチェックポイント](../../08-ad-exercise-design.md#49-追加ディスクとシステム状態バックアップ)
    （ad-backup-taken）が取得済みであることと、windows-ad-lab.md §4.3 で設定した DSRM 管理者パスワードを
    本人が入力できることを確認すること。このスクリプトは末尾で ADLAB-DC1 を DSRM（セーフモード）へ
    再起動する。再起動後は通常のドメインサインインができなくなる（06b を DSRM 側で実行するまで）。

    ADLAB-DC1 の管理者 PowerShell で実行する。

.NOTES
    このスクリプトはこの AI 支援セッション（Windows 実行環境にも AD ラボドメインにも到達できない
    Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ完了している
    （[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [string]$DomainDN = 'DC=ad,DC=example,DC=test',
    [string]$LabOuName = 'PortfolioLab',
    [string]$DriveLetter = 'E'
)

$ErrorActionPreference = 'Stop'

$testRestoreOuDn = "OU=TestRestore,OU=$LabOuName,$DomainDN"

Write-Host '=== 実行前の確認（必須・省略しない） ==='
$confirmation = Read-Host @'
続行するには次の 2 点をどちらも満たしていることを確認し
RESTORE DRILL READY と入力してください:
  1. ad-backup-taken チェックポイントを取得済み
  2. DSRM 管理者パスワードを入力できる
'@
if ($confirmation -cne 'RESTORE DRILL READY') {
    throw '確認フレーズが一致しないため中止します。'
}

Write-Host ''
Write-Host '=== 4.10-1 復元対象のテストオブジェクトを作成 ==='
if (-not (Get-ADUser -Filter "SamAccountName -eq 'pf-restore-target'" -SearchBase $testRestoreOuDn -ErrorAction SilentlyContinue)) {
    New-ADUser -Name 'pf-restore-target' -SamAccountName 'pf-restore-target' -Path $testRestoreOuDn -Enabled $false
    Write-Host "'pf-restore-target' を作成しました（$testRestoreOuDn）。"
} else {
    Write-Host "'pf-restore-target' は既に存在します。削除演習をやり直す場合はそのまま次へ進みます。"
}

Write-Host ''
Write-Host '=== 4.10-2 バックアップを取り直す（pf-restore-target の作成後の状態を含める） ==='
$backupTargetArg = "-backupTarget:${DriveLetter}:"
wbadmin start systemstatebackup $backupTargetArg -quiet
if ($LASTEXITCODE -ne 0) {
    throw "wbadmin start systemstatebackup が失敗しました（終了コード $LASTEXITCODE）。"
}
Write-Host '新しいバージョンが増えたことを確認してください（06b で使うバージョン識別子を控える）:'
wbadmin get versions

Write-Host ''
Write-Host '=== 4.10-3 障害注入（誤削除の再現） ==='
Remove-ADUser -Identity 'pf-restore-target' -Confirm:$false
Write-Host "'pf-restore-target' を削除しました。"
if (Get-ADUser -Filter "SamAccountName -eq 'pf-restore-target'" -ErrorAction SilentlyContinue) {
    throw '削除に失敗しました（まだ取得できます）。原因を確認してから先へ進んでください。'
}
Write-Host '削除を確認しました（Get-ADUser で取得できなくなった）。'

Write-Host ''
Write-Host '=== 4.10-4 DSRM への再起動 ==='
$restartConfirmation = Read-Host '続行するには RESTART INTO DSRM と入力してください（この直後に ADLAB-DC1 が再起動します）'
if ($restartConfirmation -cne 'RESTART INTO DSRM') {
    Write-Warning '確認フレーズが一致しないため再起動を中止しました。bcdedit の safeboot 設定は変更していません。'
    return
}

bcdedit /set safeboot dsrepair
if ($LASTEXITCODE -ne 0) {
    throw "bcdedit /set safeboot dsrepair が失敗しました（終了コード $LASTEXITCODE）。"
}
Write-Host 'DSRM セーフモードでの起動を設定しました。まもなく再起動します。'
Write-Host '再起動後は、ローカル .\Administrator（DSRM パスワード）でサインインし、06b-restore-drill-in-dsrm.ps1 を実行してください。'
Restart-Computer -Force
