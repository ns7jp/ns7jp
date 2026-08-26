<#
.SYNOPSIS
    LAB-WINOPS1 用のホストオンリー相当ネットワーク（Internal スイッチ）を作成する。

.DESCRIPTION
    [07 Python 運用自動化演習設計 1 章 前提条件 / 3.1 章] のとおり、LAB-WINOPS1 は
    lab-base01 が使う 192.168.56.0/24（phase1-kit/hyperv/00-create-internal-switch.ps1）とは
    別セグメントにする必要があるため、専用の Internal スイッチを別サブネットで作成する。
    lab-base01 の検証用セグメント（phase1-kit/hyperv/03-test-segment-setup.ps1 が使う
    192.168.57.0/24）とも衝突しないよう 192.168.58.0/24 を割り当てる。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#前提条件

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。実行した結果・日時・実行者は自分で記録すること。

.NOTES
    再実行しても安全なように、既存スイッチ／IP があれば作成をスキップする。
#>

$SwitchName = 'lab-winops-internal'
$HostIp = '192.168.58.1'
$PrefixLength = 24

if (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue) {
    Write-Host "スイッチ '$SwitchName' は既に存在します。作成をスキップします。"
} else {
    New-VMSwitch -SwitchName $SwitchName -SwitchType Internal
    Write-Host "スイッチ '$SwitchName'（Internal）を作成しました。"
}

$adapterAlias = "vEthernet ($SwitchName)"
$existing = Get-NetIPAddress -InterfaceAlias $adapterAlias -IPAddress $HostIp -ErrorAction SilentlyContinue

if ($existing) {
    Write-Host "$adapterAlias には既に $HostIp/$PrefixLength が設定済みです。"
} else {
    New-NetIPAddress -InterfaceAlias $adapterAlias -IPAddress $HostIp -PrefixLength $PrefixLength
    Write-Host "$adapterAlias に $HostIp/$PrefixLength を設定しました。"
}

Write-Host ''
Write-Host '確認: Get-VMSwitch, Get-NetIPAddress -InterfaceAlias "vEthernet (lab-winops-internal)"'
Write-Host '注意: lab-base01 の lab-internal（192.168.56.0/24）とは別スイッチ・別サブネットであること（1 章前提条件）。'
