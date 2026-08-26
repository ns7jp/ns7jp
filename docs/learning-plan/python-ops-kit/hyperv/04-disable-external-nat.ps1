<#
.SYNOPSIS
    03-enable-external-nat.ps1 で追加した外部疎通用 NIC を撤去する。

.DESCRIPTION
    [07 Python 運用自動化演習設計 1 章 前提条件] のとおり、T-05 / TCK-05 の確認が終わったら
    LAB-WINOPS1 を隔離状態（Internal スイッチのみ）へ戻す。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#前提条件
#>

param(
    [string]$VMName = 'LAB-WINOPS1'
)

$DefaultSwitch = 'Default Switch'

Get-VMNetworkAdapter -VMName $VMName |
    Where-Object { $_.SwitchName -eq $DefaultSwitch } |
    Remove-VMNetworkAdapter

Write-Host "VM '$VMName' から '$DefaultSwitch' 経由の NIC を削除しました。"

Write-Host ''
Write-Host '確認: Get-VMNetworkAdapter -VMName LAB-WINOPS1 で NIC が lab-winops-internal のみ（1枚）に戻っていること。'
