<#
.SYNOPSIS
    ADLAB-DC1 上で FSMO ロールを確認し、dcdiag / repadmin によるヘルスチェックを行う。

.DESCRIPTION
    08 AD構築演習設計の 4.8 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#48-fsmo-ロールとヘルスチェック

    既定では確認のみを行う（DNS 障害注入は行わない）。T-24 / T-25 の DNS 障害注入・復旧演習を
    続けて行いたい場合は -InjectDnsFault を指定する（DNS Server サービスを一時的に停止する）。

    ADLAB-DC1 の管理者 PowerShell で実行する。

.PARAMETER InjectDnsFault
    指定すると、DNS Server サービスを一時停止して dcdiag /test:dns の失敗を確認した後、
    サービスを再開して復旧を確認する（T-24 / T-25 に対応）。既定では実行しない。

.NOTES
    このスクリプトはこの AI 支援セッション（ActiveDirectory モジュールにも AD ラボドメインにも
    到達できない Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ
    完了している（[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [switch]$InjectDnsFault
)

$ErrorActionPreference = 'Stop'

Write-Host '=== 4.8-1 FSMO 保持者の一括確認 ==='
netdom query fsmo
if ($LASTEXITCODE -ne 0) {
    throw "netdom query fsmo が失敗しました（終了コード $LASTEXITCODE）。"
}

Write-Host ''
Write-Host '=== 4.8-2 フォレスト全体ロールの確認（PowerShell 側） ==='
Get-ADForest | Select-Object SchemaMaster, DomainNamingMaster | Format-List

Write-Host '=== 4.8-3 ドメインロールの確認（PowerShell 側） ==='
Get-ADDomain | Select-Object PDCEmulator, RIDMaster, InfrastructureMaster | Format-List

Write-Host ''
Write-Host '=== 4.8-4 ヘルスチェック（正常系） ==='
dcdiag /v /c
if ($LASTEXITCODE -ne 0) {
    Write-Warning "dcdiag が非 0 の終了コードを返しました（$LASTEXITCODE）。出力中の failed test を確認してください。"
}

Write-Host ''
Write-Host '=== 4.8-5 レプリケーション状況の確認 ==='
Write-Host '単一 DC ラボのため送信元／宛先パートナーが存在しない旨の出力になる想定（付録 A 参照）。'
repadmin /showrepl
repadmin /replsummary

if (-not $InjectDnsFault) {
    Write-Host ''
    Write-Host '完了（DNS 障害注入は未実施。-InjectDnsFault を指定すると T-24/T-25 を続けて実行します）。'
    Write-Host '次は 05-system-state-backup.ps1 を実行してください。'
    return
}

Write-Host ''
Write-Host '=== T-24 DC 側 DNS 障害の検知 ==='
Stop-Service -Name DNS
try {
    dcdiag /test:dns /v
    Write-Host 'DNS 停止中の dcdiag 結果を確認してください（DNS テストが失敗として報告される想定）。'
} finally {
    Write-Host ''
    Write-Host '=== T-25 DC 側 DNS 障害からの復旧確認 ==='
    Start-Service -Name DNS
    dcdiag /test:dns /v
    Write-Host 'DNS 再開後の dcdiag 結果を確認してください（全項目 passed test に戻る想定）。'
}

Write-Host ''
Write-Host '完了。次は 05-system-state-backup.ps1 を実行してください。'
