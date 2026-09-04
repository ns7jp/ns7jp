<#
.SYNOPSIS
    TLS 証明書チェック試験（T-05 / TCK-05）のためだけに LAB-WINOPS1 へ外部疎通を一時追加する。

.DESCRIPTION
    [07 Python 運用自動化演習設計 1 章 前提条件] のとおり、LAB-WINOPS1 は既定では
    Host-only / Internal スイッチのみに接続し、外部からの inbound・port forwarding・bridge
    接続を無効にする。ただし check.py の check_tls_cert() の正常系試験（example.com:443 への
    実接続）だけは外部疎通が必要なため、このスクリプトで Default Switch 経由の NIC を一時的に
    追加する。確認が終わったら 04-disable-external-nat.ps1 で必ず外すこと。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#前提条件

    phase1-kit/hyperv/03-test-segment-setup.ps1（検証用セグメントの一時追加）と同じ
    「一時追加 → 確認 → 撤去」の運用パターンだが、こちらは lab-base01 側との到達性検証ではなく
    LAB-WINOPS1 単独の外部（インターネット）疎通が目的である点が異なる。

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。

.NOTES
    Add-VMNetworkAdapter 等が失敗すると PowerShell の既定動作（非終了エラー）では
    後続の行がそのまま実行され、失敗したのに成功したかのようなメッセージが出てしまう
    （phase1-kit/hyperv/00-create-internal-switch.ps1 の実機初回実行で発見・修正した不具合と同種）。
    これを防ぐため、以下は -ErrorAction Stop と try/catch で実際の成否を判定する。
#>

param(
    [string]$VMName = 'LAB-WINOPS1'
)

$ErrorActionPreference = 'Stop'

$DefaultSwitch = 'Default Switch'

if (-not (Get-VMSwitch -Name $DefaultSwitch -ErrorAction SilentlyContinue)) {
    throw "'$DefaultSwitch' が見つかりません。Windows Server の Hyper-V には無いことが多い（付録 A-2 と同じ制約）。External スイッチ等の代替を用意し、Add-VMNetworkAdapter で割り当ててください。"
}

try {
    if (Get-VMNetworkAdapter -VMName $VMName | Where-Object { $_.SwitchName -eq $DefaultSwitch }) {
        Write-Host "VM '$VMName' は既に '$DefaultSwitch' に接続済みです。"
    } else {
        Add-VMNetworkAdapter -VMName $VMName -SwitchName $DefaultSwitch -ErrorAction Stop
        Write-Host "VM '$VMName' に '$DefaultSwitch' 経由の NIC を追加しました。"
    }
} catch {
    $ErrorActionPreference = 'Continue'
    Write-Error "失敗しました: $($_.Exception.Message)"
    Write-Error '管理者として PowerShell を実行しているか、Hyper-V Administrators グループに所属しているかを確認してください。'
    exit 1
}

Write-Host ''
Write-Host '次の手順:'
Write-Host '  1. VM 内でネットワークアダプターの状態を確認し、DHCP で IP が振られていることを確認する'
Write-Host '  2. Test-NetConnection -ComputerName example.com -Port 443 で疎通を確認してから T-05 / TCK-05 を実施する'
Write-Host '  3. 確認が終わったら必ず 04-disable-external-nat.ps1 を実行し、外部接続を外す'
