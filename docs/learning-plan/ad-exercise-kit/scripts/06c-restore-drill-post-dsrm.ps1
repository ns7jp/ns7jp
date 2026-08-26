<#
.SYNOPSIS
    権威復元演習（4.10）の後半：通常起動後の復旧確認。

.DESCRIPTION
    08 AD構築演習設計の 4.10-8 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#410-権威復元演習ou-の誤削除からの復旧

    ADLAB-DC1 が通常起動に戻り、ドメインアカウントでサインインできる状態になってから実行する。

.NOTES
    このスクリプトはこの AI 支援セッション（Windows 実行環境にも AD ラボドメインにも到達できない
    Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ完了している
    （[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

Write-Host '=== 4.10-8 復旧確認 ==='
$restored = Get-ADUser -Identity 'pf-restore-target' -ErrorAction Stop
Write-Host "'pf-restore-target' が復活していることを確認しました:"
$restored | Format-List Name, SamAccountName, DistinguishedName, Enabled

Write-Host ''
Write-Host '権威復元演習（4.10）が完了しました。'
Write-Host '次は hyperv/00-checkpoint-helpers.ps1 の New-AdLabCheckpoint -Name ad-design-complete を'
Write-Host 'Hyper-V ホスト側で実行し、5 章の試験項目書（T-01〜T-26）へ進んでください。'
