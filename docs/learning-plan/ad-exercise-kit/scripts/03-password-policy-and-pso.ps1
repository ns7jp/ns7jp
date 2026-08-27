<#
.SYNOPSIS
    ADLAB-DC1 上で既定ドメインパスワードポリシーを確認し、細分化パスワードポリシー（PSO）を作成する。

.DESCRIPTION
    08 AD構築演習設計の 4.7 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#47-パスワードロックアウトポリシーの確認と-pso-の作成

    既定ドメインパスワードポリシーは変更しない（確認のみ）。'pf-g-service-accounts' グループに
    対してだけ、より厳しい PSO（PF-Strict-ServiceAccounts）を新設して適用する。

    ADLAB-DC1 の管理者 PowerShell（ActiveDirectory モジュール導入済み）で、このファイルをそのまま
    実行する。01-ou-and-groups.ps1 を先に実行し、'pf-g-service-accounts' グループが存在すること。

.NOTES
    このスクリプトはこの AI 支援セッション（ActiveDirectory モジュールにも AD ラボドメインにも
    到達できない Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ
    完了している（[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

Write-Host '=== 4.7-1 既定ドメインパスワードポリシーの確認（変更しない） ==='
Get-ADDefaultDomainPasswordPolicy |
    Select-Object MinPasswordLength, PasswordHistoryCount, ComplexityEnabled, ReversibleEncryptionEnabled,
        MaxPasswordAge, MinPasswordAge, LockoutThreshold |
    Format-List

if (-not (Get-ADGroup -Filter "SamAccountName -eq 'pf-g-service-accounts'" -ErrorAction SilentlyContinue)) {
    throw "グループ 'pf-g-service-accounts' が見つかりません。01-ou-and-groups.ps1 を先に実行してください。"
}

Write-Host '=== 4.7-2 PSO の作成 ==='
if (-not (Get-ADFineGrainedPasswordPolicy -Identity 'PF-Strict-ServiceAccounts' -ErrorAction SilentlyContinue)) {
    New-ADFineGrainedPasswordPolicy -Name 'PF-Strict-ServiceAccounts' `
        -Precedence 10 `
        -MinPasswordLength 20 `
        -PasswordHistoryCount 24 `
        -ComplexityEnabled $true `
        -ReversibleEncryptionEnabled $false `
        -MaxPasswordAge '90.00:00:00' `
        -MinPasswordAge '1.00:00:00' `
        -LockoutThreshold 5 `
        -LockoutDuration '00:30:00' `
        -LockoutObservationWindow '00:30:00'
    Write-Host "PSO 'PF-Strict-ServiceAccounts' を作成しました（Precedence 10）。"
} else {
    Write-Host "PSO 'PF-Strict-ServiceAccounts' は既に存在します。スキップします。"
}

Write-Host ''
Write-Host '=== 4.7-3 PSO の適用対象を設定 ==='
$subjects = Get-ADFineGrainedPasswordPolicySubject -Identity 'PF-Strict-ServiceAccounts'
if ($subjects.SamAccountName -notcontains 'pf-g-service-accounts') {
    Add-ADFineGrainedPasswordPolicySubject -Identity 'PF-Strict-ServiceAccounts' -Subjects 'pf-g-service-accounts'
    Write-Host "'pf-g-service-accounts' を PSO の適用対象に追加しました。"
} else {
    Write-Host "'pf-g-service-accounts' は既に PSO の適用対象です。"
}

Write-Host ''
Write-Host '=== 4.7-4 適用結果の確認（対象ユーザー側から） ==='
if (Get-ADUser -Filter "SamAccountName -eq 'pf-svc01'" -ErrorAction SilentlyContinue) {
    Get-ADUserResultantPasswordPolicy -Identity 'pf-svc01' |
        Select-Object MinPasswordLength, LockoutThreshold, LockoutDuration | Format-List
} else {
    Write-Warning "ユーザー 'pf-svc01' が見つかりません。01-ou-and-groups.ps1 を先に実行してください。"
}

Write-Host ''
Write-Host '完了。次は 04-fsmo-and-health-check.ps1 を実行してください。'
