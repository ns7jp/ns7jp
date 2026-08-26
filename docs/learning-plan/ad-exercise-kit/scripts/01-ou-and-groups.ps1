<#
.SYNOPSIS
    ADLAB-DC1 上で OU 階層・AGDLP グループ・既存オブジェクトの再配置を行う。

.DESCRIPTION
    08 AD構築演習設計の 4.2〜4.4 をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#42-ou-階層の作成

    実行順序:
        1. 事前確認（フォレスト / ラボ OU / ラボユーザーの存在確認。1 章の前提条件）
        2. 4.2 OU 階層の作成（Users / Groups / Computers / ServiceAccounts / TestRestore）
        3. 4.3 グループの作成とネスト（AGDLP: pf-g-helpdesk-staff → pf-dl-helpdesk-share-ro、pf-g-service-accounts）
        4. 4.4 既存オブジェクト（pf-user01、ADLAB-CLI1）の新 OU への移動

    ADLAB-DC1 の管理者 PowerShell（ActiveDirectory モジュール導入済み）で、このファイルをそのまま
    実行する。新規テストユーザー（pf-user02、pf-svc01）はパスワードを対話入力で受け取る。

.PARAMETER DomainDN
    ラボドメインの識別名。windows-ad-lab.md §4 で構築したフォレストに合わせる。

.PARAMETER LabOuName
    windows-ad-lab.md §7.2 で作成済みのラボ OU 名。

.PARAMETER ClientComputerName
    windows-ad-lab.md §9 でドメイン参加済みのクライアント名（本書では ADLAB-CLI1 と呼ぶ）。

.NOTES
    このスクリプトはこの AI 支援セッション（ActiveDirectory モジュールにも AD ラボドメインにも
    到達できない Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ
    完了している（[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [string]$DomainDN = 'DC=ad,DC=example,DC=test',
    [string]$LabOuName = 'PortfolioLab',
    [string]$ClientComputerName = 'ADLAB-CLI1'
)

$ErrorActionPreference = 'Stop'

function Assert-LabDomain {
    param([string]$ExpectedDomainDN)

    $forest = Get-ADForest
    if ($forest.RootDomain -notlike 'ad.example.test') {
        throw "承認したラボフォレスト（ad.example.test）ではありません。実際: $($forest.RootDomain)"
    }
    $labOu = Get-ADOrganizationalUnit -Identity "OU=$LabOuName,$ExpectedDomainDN" -ErrorAction SilentlyContinue
    if (-not $labOu) {
        throw "ラボ OU '$LabOuName' が見つかりません。windows-ad-lab.md §7.2 を先に実施してください。"
    }
    $labUser = Get-ADUser -Filter "SamAccountName -eq 'pf-user01'" -ErrorAction SilentlyContinue
    if (-not $labUser) {
        throw "ラボユーザー 'pf-user01' が見つかりません。windows-ad-lab.md §7.2 を先に実施してください。"
    }
}

Write-Host '=== 事前確認 ==='
Assert-LabDomain -ExpectedDomainDN $DomainDN
Write-Host '事前確認 OK: ラボフォレスト / ラボ OU / ラボユーザーの存在を確認しました。'

$labOuDn = "OU=$LabOuName,$DomainDN"

Write-Host ''
Write-Host '=== 4.2 OU 階層の作成 ==='
foreach ($childOu in 'Users', 'Groups', 'Computers', 'ServiceAccounts') {
    $existing = Get-ADOrganizationalUnit -Identity "OU=$childOu,$labOuDn" -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "OU '$childOu' は既に存在します。スキップします。"
        continue
    }
    New-ADOrganizationalUnit -Name $childOu -Path $labOuDn -ProtectedFromAccidentalDeletion $true
    Write-Host "OU '$childOu' を作成しました（削除保護: 有効）。"
}

$testRestoreOu = Get-ADOrganizationalUnit -Identity "OU=TestRestore,$labOuDn" -ErrorAction SilentlyContinue
if ($testRestoreOu) {
    Write-Host "OU 'TestRestore' は既に存在します。スキップします。"
} else {
    New-ADOrganizationalUnit -Name 'TestRestore' -Path $labOuDn -ProtectedFromAccidentalDeletion $false
    Write-Host "OU 'TestRestore' を作成しました（削除保護: 無効。4.10 の権威復元演習専用）。"
}

Write-Host ''
Write-Host '現在の OU 階層:'
Get-ADOrganizationalUnit -Filter * -SearchBase $labOuDn | Select-Object Name, DistinguishedName | Format-Table -AutoSize

Write-Host ''
Write-Host '=== 4.3 グループの作成とネスト（AGDLP） ==='
$groupsOuDn = "OU=Groups,$labOuDn"

$groupDefs = @(
    @{ Name = 'pf-g-helpdesk-staff'; Scope = 'Global'; Category = 'Security' }
    @{ Name = 'pf-dl-helpdesk-share-ro'; Scope = 'DomainLocal'; Category = 'Security' }
    @{ Name = 'pf-g-service-accounts'; Scope = 'Global'; Category = 'Security' }
)
foreach ($def in $groupDefs) {
    $existing = Get-ADGroup -Filter "SamAccountName -eq '$($def.Name)'" -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "グループ '$($def.Name)' は既に存在します。スキップします。"
        continue
    }
    New-ADGroup -Name $def.Name -SamAccountName $def.Name -GroupScope $def.Scope `
        -GroupCategory $def.Category -Path $groupsOuDn
    Write-Host "グループ '$($def.Name)'（$($def.Scope) / $($def.Category)）を作成しました。"
}

$dlMembers = Get-ADGroupMember -Identity 'pf-dl-helpdesk-share-ro'
if ($dlMembers.SamAccountName -notcontains 'pf-g-helpdesk-staff') {
    Add-ADGroupMember -Identity 'pf-dl-helpdesk-share-ro' -Members 'pf-g-helpdesk-staff'
    Write-Host "'pf-g-helpdesk-staff' を 'pf-dl-helpdesk-share-ro' へネストしました。"
} else {
    Write-Host "'pf-g-helpdesk-staff' は既に 'pf-dl-helpdesk-share-ro' のメンバーです。"
}

Write-Host ''
Write-Host '追加テストユーザーを作成します（対話式でパスワードを入力してください）。'
$usersOuDn = "OU=Users,$labOuDn"
$serviceAccountsOuDn = "OU=ServiceAccounts,$labOuDn"

if (-not (Get-ADUser -Filter "SamAccountName -eq 'pf-user02'" -ErrorAction SilentlyContinue)) {
    $pwUser02 = Read-Host -AsSecureString 'pf-user02 の一時パスワードを入力'
    New-ADUser -Name 'pf-user02' -SamAccountName 'pf-user02' `
        -UserPrincipalName 'pf-user02@ad.example.test' -Path $usersOuDn `
        -AccountPassword $pwUser02 -Enabled $true -ChangePasswordAtLogon $true
    Write-Host "ユーザー 'pf-user02' を作成しました（$usersOuDn）。"
} else {
    Write-Host "ユーザー 'pf-user02' は既に存在します。スキップします。"
}

if (-not (Get-ADUser -Filter "SamAccountName -eq 'pf-svc01'" -ErrorAction SilentlyContinue)) {
    $pwSvc01 = Read-Host -AsSecureString 'pf-svc01 の一時パスワードを入力'
    New-ADUser -Name 'pf-svc01' -SamAccountName 'pf-svc01' `
        -UserPrincipalName 'pf-svc01@ad.example.test' -Path $serviceAccountsOuDn `
        -AccountPassword $pwSvc01 -Enabled $true -ChangePasswordAtLogon $true
    Write-Host "ユーザー 'pf-svc01' を作成しました（$serviceAccountsOuDn）。"
} else {
    Write-Host "ユーザー 'pf-svc01' は既に存在します。スキップします。"
}

foreach ($pair in @(
    @{ Group = 'pf-g-helpdesk-staff'; User = 'pf-user02' }
    @{ Group = 'pf-g-service-accounts'; User = 'pf-svc01' }
)) {
    $members = Get-ADGroupMember -Identity $pair.Group
    if ($members.SamAccountName -notcontains $pair.User) {
        Add-ADGroupMember -Identity $pair.Group -Members $pair.User
        Write-Host "'$($pair.User)' を '$($pair.Group)' へ追加しました。"
    } else {
        Write-Host "'$($pair.User)' は既に '$($pair.Group)' のメンバーです。"
    }
}

Write-Host ''
Write-Host '=== 4.4 既存オブジェクトの新 OU への移動 ==='

$user01 = Get-ADUser -Identity 'pf-user01'
if ($user01.DistinguishedName -ne "CN=pf-user01,$usersOuDn") {
    $user01 | Move-ADObject -TargetPath $usersOuDn
    Write-Host "'pf-user01' を '$usersOuDn' へ移動しました。"
} else {
    Write-Host "'pf-user01' は既に '$usersOuDn' にあります。"
}

$members = Get-ADGroupMember -Identity 'pf-g-helpdesk-staff'
if ($members.SamAccountName -notcontains 'pf-user01') {
    Add-ADGroupMember -Identity 'pf-g-helpdesk-staff' -Members 'pf-user01'
    Write-Host "'pf-user01' を 'pf-g-helpdesk-staff' へ追加しました。"
} else {
    Write-Host "'pf-user01' は既に 'pf-g-helpdesk-staff' のメンバーです。"
}

$computersOuDn = "OU=Computers,$labOuDn"
$clientComputer = Get-ADComputer -Identity $ClientComputerName -ErrorAction SilentlyContinue
if (-not $clientComputer) {
    Write-Warning "コンピュータオブジェクト '$ClientComputerName' が見つかりません。windows-ad-lab.md §9 のドメイン参加を先に確認してください。"
} elseif ($clientComputer.DistinguishedName -ne "CN=$ClientComputerName,$computersOuDn") {
    $clientComputer | Move-ADObject -TargetPath $computersOuDn
    Write-Host "'$ClientComputerName' を '$computersOuDn' へ移動しました（既定の Computers コンテナは GPO をリンクできないため）。"
} else {
    Write-Host "'$ClientComputerName' は既に '$computersOuDn' にあります。"
}

Write-Host ''
Write-Host '完了。次は 02-gpo-setup.ps1 で GPO を作成・リンクしてください。'
