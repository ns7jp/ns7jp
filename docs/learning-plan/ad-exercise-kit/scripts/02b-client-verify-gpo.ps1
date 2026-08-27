<#
.SYNOPSIS
    ADLAB-CLI1（クライアント側）で GPO の適用を強制し、結果を確認する。

.DESCRIPTION
    08 AD構築演習設計の 4.6（クライアント側）をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#46-gpo-のリンクとクライアント側の適用確認

    02-gpo-setup.ps1（ADLAB-DC1 側）でリンクした GPO を、windows-ad-lab.md §9 でドメイン参加済みの
    クライアント（本書では ADLAB-CLI1）側で強制適用し、gpresult と RSoP レポートで確認する。

    このスクリプトは ADLAB-CLI1 の管理者 PowerShell で実行する（ADLAB-DC1 側ではない）。

.NOTES
    このスクリプトはこの AI 支援セッション（Windows 実行環境にも AD ラボドメインにも到達できない
    Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ完了している
    （[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [string]$ReportPath = 'C:\temp\rsop.html'
)

$ErrorActionPreference = 'Stop'

$computerSystem = Get-CimInstance Win32_ComputerSystem
if (-not $computerSystem.PartOfDomain -or $computerSystem.Domain -ne 'ad.example.test') {
    throw 'このコンピュータはラボドメイン（ad.example.test）に参加していません。windows-ad-lab.md §9 を先に実施してください。'
}

Write-Host '=== GPO の強制適用 ==='
gpupdate /force
if ($LASTEXITCODE -ne 0) {
    throw "gpupdate が失敗しました（終了コード $LASTEXITCODE）。"
}

Write-Host ''
Write-Host '=== 適用結果の確認（サマリ） ==='
gpresult /r

Write-Host ''
Write-Host '=== 適用結果の確認（詳細レポート） ==='
$reportDir = Split-Path -Path $ReportPath -Parent
if ($reportDir -and -not (Test-Path -LiteralPath $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}
Get-GPResultantSetOfPolicy -ReportType Html -Path $ReportPath
Write-Host "RSoP レポートを '$ReportPath' へ出力しました。"
Write-Host "レポート内で 'DontDisplayLastUserName' と 'DisableRegistryTools' の適用を確認してください。"

Write-Host ''
Write-Host '=== 実機能の確認（手動） ==='
Write-Host '次はサインイン画面と regedit の起動を手動で確認する（4.6-7 / T-14 に対応）:'
Write-Host '  1. サインアウト → サインイン画面に前回サインインしたユーザー名が表示されないことを確認する'
Write-Host '  2. pf-user01 でサインインし、regedit を起動 → 「システム管理者によって無効にされています」の警告を確認する'
