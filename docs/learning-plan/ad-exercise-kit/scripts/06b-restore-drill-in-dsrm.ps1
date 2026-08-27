<#
.SYNOPSIS
    権威復元演習（4.10）の中盤：DSRM 内で非権威復元 → 権威復元のマーキング → 通常起動へ戻す。

.DESCRIPTION
    08 AD構築演習設計の 4.10-5〜4.10-7 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧

    **このスクリプトは DSRM（セーフモード）で、ローカル .\Administrator（ドメインアカウントではなく、
    windows-ad-lab.md §4.3 で設定した DSRM パスワードを使うローカル管理者）としてサインインした状態で
    実行する。** ドメインアカウントは AD DS が停止している DSRM では認証できない。

    権威復元のマーキング（ntdsutil）は、DC が通常起動してレプリケーションパートナーへ接続する**前**に
    完了させる必要がある。そのため本スクリプトは、通常起動への復帰（bcdedit /deletevalue safeboot と
    再起動）まで一括で行う。

.PARAMETER BackupVersion
    06a の 4.10-2 で控えた wbadmin のバージョン識別子（例: 01/01/2027-00:00）。

.PARAMETER DriveLetter
    バックアップ先のドライブレター（05-system-state-backup.ps1 と同じ値。既定 E）。

.PARAMETER SubtreeDN
    権威復元の対象サブツリー。既定は本演習専用の TestRestore OU。

.NOTES
    このスクリプトはこの AI 支援セッション（Windows 実行環境にも AD ラボドメインにも到達できない
    Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ完了している
    （[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$BackupVersion,
    [string]$DriveLetter = 'E',
    [string]$SubtreeDN = 'OU=TestRestore,OU=PortfolioLab,DC=ad,DC=example,DC=test'
)

$ErrorActionPreference = 'Stop'

Write-Host '=== 実行前の確認（必須・省略しない） ==='
$confirmation = Read-Host @'
DSRM でローカル .\Administrator としてサインインしていることを確認し
IN DSRM READY と入力してください
'@
if ($confirmation -cne 'IN DSRM READY') {
    throw '確認フレーズが一致しないため中止します。'
}

Write-Host ''
Write-Host '=== 4.10-5 DSRM でサインインし非権威復元を実行 ==='
$versionArg = "-version:$BackupVersion"
$backupTargetArg = "-backupTarget:${DriveLetter}:"
wbadmin start systemstaterecovery $versionArg $backupTargetArg -quiet
if ($LASTEXITCODE -ne 0) {
    throw "wbadmin start systemstaterecovery が失敗しました（終了コード $LASTEXITCODE）。"
}
Write-Host 'システム状態の非権威復元が完了しました。'

Write-Host ''
Write-Host '=== 4.10-6 権威復元のマーキング（DSRM のまま） ==='
$ntdsutilCommands = @"
activate instance ntds
authoritative restore
restore subtree $SubtreeDN
quit
quit
"@
$ntdsutilCommands | ntdsutil
if ($LASTEXITCODE -ne 0) {
    throw "ntdsutil が失敗しました（終了コード $LASTEXITCODE）。対象オブジェクトのバージョン番号が引き上げられた旨のログを確認してください。"
}
Write-Host "サブツリー '$SubtreeDN' を権威復元としてマーキングしました。"

Write-Host ''
Write-Host '=== 4.10-7 通常起動へ戻す ==='
$restartConfirmation = Read-Host '続行するには RESTART TO NORMAL と入力してください（この直後に ADLAB-DC1 が再起動します）'
if ($restartConfirmation -cne 'RESTART TO NORMAL') {
    Write-Warning '確認フレーズが一致しないため再起動を中止しました。safeboot 設定は dsrepair のままです。'
    return
}

bcdedit /deletevalue safeboot
if ($LASTEXITCODE -ne 0) {
    throw "bcdedit /deletevalue safeboot が失敗しました（終了コード $LASTEXITCODE）。"
}
Write-Host '通常起動の設定に戻しました。まもなく再起動します。'
Write-Host '再起動後、ドメインアカウントでサインインし、06c-restore-drill-post-dsrm.ps1 を実行してください。'
Restart-Computer -Force
