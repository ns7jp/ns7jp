<#
.SYNOPSIS
    ADLAB-DC1 上で GPO の作成・レジストリ値設定・OU へのリンクを行う。

.DESCRIPTION
    08 AD構築演習設計の 4.5〜4.6（DC 側）をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#45-gpo-の作成と設定

    - PF-Baseline-Workstation（Computer Configuration、DontDisplayLastUserName）→ Computers OU にリンク
    - PF-Baseline-Users（User Configuration、DisableRegistryTools）→ Users OU にリンク

    リンク先は 2 章の決定事項どおり Computer 側 GPO と User 側 GPO を別 OU に分けている。1 本の GPO を
    Computers OU にリンクしただけでは User Configuration 側の設定は効かない（ループバック処理を使わない限り、
    User Configuration はユーザーオブジェクトの OU 位置を見るため）。

    ADLAB-DC1 の管理者 PowerShell（GroupPolicy モジュール導入済み）で、このファイルをそのまま実行する。
    クライアント側の適用確認（gpupdate/gpresult）は 02b-client-verify-gpo.ps1（ADLAB-CLI1 側）で行う。

.NOTES
    このスクリプトはこの AI 支援セッション（GroupPolicy モジュールにも AD ラボドメインにも
    到達できない Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ
    完了している（[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [string]$DomainDN = 'DC=ad,DC=example,DC=test',
    [string]$LabOuName = 'PortfolioLab'
)

$ErrorActionPreference = 'Stop'

$labOuDn = "OU=$LabOuName,$DomainDN"
$computersOuDn = "OU=Computers,$labOuDn"
$usersOuDn = "OU=Users,$labOuDn"

Write-Host '=== 事前確認（リンク先の誤り防止） ==='
$actualComputersDn = (Get-ADOrganizationalUnit -Identity $computersOuDn).DistinguishedName
$actualUsersDn = (Get-ADOrganizationalUnit -Identity $usersOuDn).DistinguishedName
if ($actualComputersDn -ne $computersOuDn -or $actualUsersDn -ne $usersOuDn) {
    throw 'リンク先 OU の DN がパラメータシートと一致しません。01-ou-and-groups.ps1 を先に実行してください。'
}
Write-Host "リンク先 OU を確認しました: $computersOuDn / $usersOuDn"

Write-Host ''
Write-Host '=== 4.5 GPO の作成と設定 ==='

if (-not (Get-GPO -Name 'PF-Baseline-Workstation' -ErrorAction SilentlyContinue)) {
    New-GPO -Name 'PF-Baseline-Workstation' -Comment 'PortfolioLab computers baseline' | Out-Null
    Write-Host "GPO 'PF-Baseline-Workstation' を作成しました。"
} else {
    Write-Host "GPO 'PF-Baseline-Workstation' は既に存在します。スキップします。"
}
Set-GPRegistryValue -Name 'PF-Baseline-Workstation' `
    -Key 'HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'DontDisplayLastUserName' -Type DWord -Value 1 | Out-Null
Write-Host "PF-Baseline-Workstation: DontDisplayLastUserName=1 を設定しました。"

if (-not (Get-GPO -Name 'PF-Baseline-Users' -ErrorAction SilentlyContinue)) {
    New-GPO -Name 'PF-Baseline-Users' -Comment 'PortfolioLab users baseline' | Out-Null
    Write-Host "GPO 'PF-Baseline-Users' を作成しました。"
} else {
    Write-Host "GPO 'PF-Baseline-Users' は既に存在します。スキップします。"
}
Set-GPRegistryValue -Name 'PF-Baseline-Users' `
    -Key 'HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\System' `
    -ValueName 'DisableRegistryTools' -Type DWord -Value 1 | Out-Null
Write-Host "PF-Baseline-Users: DisableRegistryTools=1 を設定しました。"

Write-Host ''
Write-Host '=== 4.6 GPO のリンク（DC 側） ==='

$computerLinks = (Get-GPInheritance -Target $computersOuDn).GpoLinks
if ($computerLinks.DisplayName -notcontains 'PF-Baseline-Workstation') {
    New-GPLink -Name 'PF-Baseline-Workstation' -Target $computersOuDn | Out-Null
    Write-Host "'PF-Baseline-Workstation' を '$computersOuDn' へリンクしました。"
} else {
    Write-Host "'PF-Baseline-Workstation' は既に '$computersOuDn' にリンク済みです。"
}

$userLinks = (Get-GPInheritance -Target $usersOuDn).GpoLinks
if ($userLinks.DisplayName -notcontains 'PF-Baseline-Users') {
    New-GPLink -Name 'PF-Baseline-Users' -Target $usersOuDn | Out-Null
    Write-Host "'PF-Baseline-Users' を '$usersOuDn' へリンクしました。"
} else {
    Write-Host "'PF-Baseline-Users' は既に '$usersOuDn' にリンク済みです。"
}

Write-Host ''
Write-Host '現在のリンク状態:'
Write-Host "  $computersOuDn -> $((Get-GPInheritance -Target $computersOuDn).GpoLinks.DisplayName -join ', ')"
Write-Host "  $usersOuDn -> $((Get-GPInheritance -Target $usersOuDn).GpoLinks.DisplayName -join ', ')"

Write-Host ''
Write-Host '完了。次は ADLAB-CLI1 上で 02b-client-verify-gpo.ps1 を実行してください。'
