<#
.SYNOPSIS
    03-test-segment-setup.ps1 で追加した検証用セグメントを撤去する（Q-7）。

.DESCRIPTION
    [05 Phase 1 演習設計 付録 A-3 Q-7] のとおり。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/05-phase1-exercise-design.md#a-3-検証用セグメントの一時追加p-1p-7-の代替

    先に VM 側で netplan ファイル（61-lab-test.yaml）を削除し、
    `sudo rm /etc/netplan/61-lab-test.yaml && sudo netplan apply` を実行してから
    このスクリプトを実行すること（P-6 / Q-7 の順序）。
#>

param(
    [string]$VMName = 'lab-base01'
)

$SwitchName = 'lab-test-segment'

Get-VMNetworkAdapter -VMName $VMName |
    Where-Object { $_.SwitchName -eq $SwitchName } |
    Remove-VMNetworkAdapter

Write-Host "VM '$VMName' から検証用 NIC を削除しました。"

if (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue) {
    Remove-VMSwitch -Name $SwitchName -Force
    Write-Host "スイッチ '$SwitchName' を削除しました（ホスト側の 192.168.57.1 も併せて消える）。"
} else {
    Write-Host "スイッチ '$SwitchName' は既に存在しません。"
}

Write-Host ''
Write-Host '確認: VM 内で ip a を実行し、NIC が 2 枚（3 章のパラメータシートどおり）に戻っていること。'
