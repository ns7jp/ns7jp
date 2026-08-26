<#
.SYNOPSIS
    T-09（許可セグメント外からの到達性）/ T-13 用に検証用 Internal スイッチを一時追加する。

.DESCRIPTION
    [05 Phase 1 演習設計 付録 A-3 Q-1〜Q-3] のとおり。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/05-phase1-exercise-design.md#a-3-検証用セグメントの一時追加p-1p-7-の代替

    このスクリプトはホスト側（Q-1〜Q-3）のみを行う。VM 側（Q-4: netplan で
    192.168.57.10/24 を付与）は ../netplan/61-lab-test.yaml を使って手作業で行うこと。

    Generation 2 VM はホットアド（起動中のアダプター追加）に対応するはずだが
    設計書の時点では未検証。失敗する場合は VM をシャットダウンしてから実行する。
#>

param(
    [string]$VMName = 'lab-base01'
)

$SwitchName = 'lab-test-segment'
$HostIp = '192.168.57.1'
$PrefixLength = 24

if (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue) {
    Write-Host "スイッチ '$SwitchName' は既に存在します。作成をスキップします。"
} else {
    New-VMSwitch -SwitchName $SwitchName -SwitchType Internal
    Write-Host "スイッチ '$SwitchName'（Internal）を作成しました。"
}

$adapterAlias = "vEthernet ($SwitchName)"
if (-not (Get-NetIPAddress -InterfaceAlias $adapterAlias -IPAddress $HostIp -ErrorAction SilentlyContinue)) {
    New-NetIPAddress -InterfaceAlias $adapterAlias -IPAddress $HostIp -PrefixLength $PrefixLength
    Write-Host "$adapterAlias に $HostIp/$PrefixLength を設定しました。"
}

Add-VMNetworkAdapter -VMName $VMName -SwitchName $SwitchName
Write-Host "VM '$VMName' に検証用 NIC を追加しました。"

Write-Host ''
Write-Host '次の手順:'
Write-Host '  1. VM 内で `ip a` を実行し、3 枚目の NIC 名を確認する'
Write-Host '  2. ../netplan/61-lab-test.yaml を（必要ならインターフェース名を書き換えて）配置・適用する'
Write-Host "  3. ホスト PC から ping -n 1 192.168.57.10（応答があれば経路は成立。Q-5）"
Write-Host '  4. Test-NetConnection -ComputerName 192.168.57.10 -Port 22 で T-09 外側 / T-13 を実施（Q-6）'
