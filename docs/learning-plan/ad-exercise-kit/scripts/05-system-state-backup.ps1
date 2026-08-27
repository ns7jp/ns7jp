<#
.SYNOPSIS
    ADLAB-DC1 上でバックアップ先ディスクを初期化し、システム状態バックアップを取得する。

.DESCRIPTION
    08 AD構築演習設計の 4.9 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#49-追加ディスクとシステム状態バックアップ

    追加の仮想ディスク（20 GB 以上、OS ディスクとは別）を Hyper-V 側で ADLAB-DC1 へ取り付けた後、
    このスクリプトで初期化・フォーマットし、wbadmin でシステム状態バックアップを取得する。

    ADLAB-DC1 の管理者 PowerShell で実行する。

.PARAMETER DriveLetter
    バックアップ先のドライブレター（既定 E）。

.PARAMETER SkipDiskInit
    追加ディスクの初期化・フォーマットを飛ばし、バックアップ取得のみ行う（2 回目以降の実行、
    または 4.10-2 の「バックアップを取り直す」場合に使う）。

.NOTES
    このスクリプトはこの AI 支援セッション（Windows 実行環境にも AD ラボドメインにも到達できない
    Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ完了している
    （[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [string]$DriveLetter = 'E',
    [switch]$SkipDiskInit
)

$ErrorActionPreference = 'Stop'

if (-not $SkipDiskInit) {
    Write-Host '=== 4.9-1〜4.9-2 追加ディスクの初期化・フォーマット ==='
    $rawDisk = Get-Disk | Where-Object PartitionStyle -eq 'RAW' | Select-Object -First 1
    if (-not $rawDisk) {
        Write-Warning '未初期化（RAW）のディスクが見つかりません。既に初期化済みか、Hyper-V 側でディスクを取り付け忘れていないか確認してください。'
    } else {
        Initialize-Disk -Number $rawDisk.Number -PartitionStyle GPT
        New-Partition -DiskNumber $rawDisk.Number -UseMaximumSize -DriveLetter $DriveLetter | Out-Null
        Format-Volume -DriveLetter $DriveLetter -FileSystem NTFS -NewFileSystemLabel 'AD-Backup' -Confirm:$false | Out-Null
        Write-Host "ディスク $($rawDisk.Number) を初期化し、$DriveLetter`: としてフォーマットしました。"
    }
    Get-Volume -DriveLetter $DriveLetter | Format-List DriveLetter, FileSystemType, HealthStatus, SizeRemaining
}

Write-Host ''
Write-Host '=== 4.9-3 バックアップ取得前確認 ==='
wbadmin get versions

Write-Host ''
Write-Host '=== 4.9-4 システム状態バックアップ取得 ==='
# 変数展開の結果を先に 1 個の文字列へ組み立ててから渡す。
# "-backupTarget:${DriveLetter}:" をそのままコマンドの引数として書くと、
# 末尾の ':' がトークンとして分離され "-backupTarget:" と "E:" の 2 引数に
# 割れてしまう（実際に確認済み。ネイティブコマンドへの引数展開の罠）。
$backupTargetArg = "-backupTarget:${DriveLetter}:"
wbadmin start systemstatebackup $backupTargetArg -quiet
if ($LASTEXITCODE -ne 0) {
    throw "wbadmin start systemstatebackup が失敗しました（終了コード $LASTEXITCODE）。"
}

Write-Host ''
Write-Host '=== 4.9-5 バックアップ世代の確認 ==='
Write-Host '出力される「バージョン識別子」を控えておく（4.10-5 のシステム状態復元で使用）。'
wbadmin get versions

Write-Host ''
Write-Host '完了。4.9-6 のチェックポイント取得（hyperv/00-checkpoint-helpers.ps1 の'
Write-Host "New-AdLabCheckpoint -Name ad-backup-taken）は Hyper-V ホスト側で実行すること。"
