<#
.SYNOPSIS
    ADLAB-DC1 上で 08 AD構築演習設計の変更を切り戻す（GPO リンク解除・OU 削除・PSO 削除）。

.DESCRIPTION
    08 AD構築演習設計の 4.12 切り戻し手順（R-1〜R-4）をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md#412-切り戻し手順

    既定では GPO リンク解除（R-1）と PSO 削除（R-3）だけを行う。OU 階層そのものの削除（R-2）は
    既定で行わない（削除保護の解除が必要で、対象を間違えると影響が大きいため）。OU も削除する場合は
    -RemoveOrganizationalUnits を明示する。

    ADLAB-DC1 の管理者 PowerShell で実行する。チェックポイントへの復元で足りる場合は、この
    スクリプトではなく hyperv/00-checkpoint-helpers.ps1 の Restore-AdLabCheckpoint を使うこと
    （[6 章の中断基準](../../08-ad-exercise-design.md#6-実施タイムテーブルと中断基準)参照）。

.PARAMETER RemoveOrganizationalUnits
    指定すると、本演習で作成した OU（Users / Groups / Computers / ServiceAccounts / TestRestore）を
    削除保護解除のうえ削除する（R-2）。既定では実行しない。

.NOTES
    このスクリプトはこの AI 支援セッション（ActiveDirectory / GroupPolicy モジュールにも AD ラボ
    ドメインにも到達できない Linux コンテナ）では一度も実行していない。PowerShell 7 の構文パーサーでの
    検証のみ完了している（[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

[CmdletBinding()]
param(
    [string]$DomainDN = 'DC=ad,DC=example,DC=test',
    [string]$LabOuName = 'PortfolioLab',
    [switch]$RemoveOrganizationalUnits
)

$ErrorActionPreference = 'Stop'

$labOuDn = "OU=$LabOuName,$DomainDN"
$computersOuDn = "OU=Computers,$labOuDn"
$usersOuDn = "OU=Users,$labOuDn"

Write-Host '=== R-1 GPO リンクの解除 ==='
foreach ($pair in @(
    @{ Gpo = 'PF-Baseline-Workstation'; Target = $computersOuDn }
    @{ Gpo = 'PF-Baseline-Users'; Target = $usersOuDn }
)) {
    $links = (Get-GPInheritance -Target $pair.Target -ErrorAction SilentlyContinue).GpoLinks
    if ($links -and $links.DisplayName -contains $pair.Gpo) {
        Remove-GPLink -Name $pair.Gpo -Target $pair.Target
        Write-Host "'$($pair.Gpo)' のリンクを '$($pair.Target)' から解除しました。"
    } else {
        Write-Host "'$($pair.Gpo)' は '$($pair.Target)' にリンクされていません。スキップします。"
    }
}

Write-Host ''
Write-Host '=== R-3 PSO の削除 ==='
if (Get-ADFineGrainedPasswordPolicy -Identity 'PF-Strict-ServiceAccounts' -ErrorAction SilentlyContinue) {
    Remove-ADFineGrainedPasswordPolicy -Identity 'PF-Strict-ServiceAccounts' -Confirm:$false
    Write-Host "PSO 'PF-Strict-ServiceAccounts' を削除しました。"
} else {
    Write-Host "PSO 'PF-Strict-ServiceAccounts' は存在しません。スキップします。"
}

if (-not $RemoveOrganizationalUnits) {
    Write-Host ''
    Write-Host '完了（OU は削除していません。削除するには -RemoveOrganizationalUnits を指定してください）。'
    return
}

Write-Host ''
Write-Host '=== R-2 OU の削除（削除保護の解除が必要） ==='
$confirmation = Read-Host "続行するには DELETE $LabOuName CHILD OUS と入力してください"
if ($confirmation -cne "DELETE $LabOuName CHILD OUS") {
    throw '確認フレーズが一致しないため中止します。OU は削除しません。'
}

foreach ($childOu in 'Users', 'Groups', 'Computers', 'ServiceAccounts', 'TestRestore') {
    $dn = "OU=$childOu,$labOuDn"
    $ou = Get-ADOrganizationalUnit -Identity $dn -ErrorAction SilentlyContinue
    if (-not $ou) {
        Write-Host "OU '$childOu' は存在しません。スキップします。"
        continue
    }
    if ($ou.ProtectedFromAccidentalDeletion) {
        Set-ADOrganizationalUnit -Identity $dn -ProtectedFromAccidentalDeletion $false
    }
    Remove-ADOrganizationalUnit -Identity $dn -Confirm:$false -Recursive
    Write-Host "OU '$childOu' を削除しました。"
}

Write-Host ''
Write-Host '=== R-4 復旧確認 ==='
Get-ADOrganizationalUnit -Filter * -SearchBase $labOuDn | Select-Object Name, DistinguishedName
Write-Host 'windows-ad-lab.md §4・§7・§9 が作った状態（ラボ OU 直下、子 OU なし）まで戻ったことを確認してください。'
