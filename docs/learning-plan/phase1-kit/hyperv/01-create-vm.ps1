<#
.SYNOPSIS
    lab-base01 VM を作成する（3-1〜3-2 の代替、[付録 A-1] のとおり）。

.DESCRIPTION
    [05 Phase 1 演習設計 付録 A-1] の PowerShell 例をそのままスクリプト化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/05-phase1-exercise-design.md#a-1-vm-作成

    実行前に 00-create-internal-switch.ps1 を実行しておくこと（NIC2 の割り当てに必要）。
    実行後、OS インストール（3-3 相当。Subiquity の言語選択〜インストール完了までは
    このスクリプトでは行わない。GUI コンソールから手作業で進める）。

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。

.PARAMETER IsoPath
    Ubuntu Server 24.04 LTS の ISO ファイルへのフルパス
    （[05 Phase 1 演習設計 2 章] 作業前確認 2-2 で SHA256 を確認済みのものを指定する）。

.PARAMETER VmRoot
    VHDX の保存先ディレクトリ。既定は D:\HyperV\lab-base01。
#>

param(
    [Parameter(Mandatory)]
    [string]$IsoPath,

    [string]$VmRoot = 'D:\HyperV\lab-base01'
)

$VmName = 'lab-base01'
$InternalSwitch = 'lab-internal'
$DefaultSwitch = 'Default Switch'

if (-not (Test-Path $IsoPath)) {
    throw "ISO が見つかりません: $IsoPath"
}

if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) {
    throw "VM '$VmName' は既に存在します。作り直す場合は先に Remove-VM -Name $VmName -Force を実行してください（VHDX の削除は別途）。"
}

New-Item -ItemType Directory -Path $VmRoot -Force | Out-Null

New-VM -Name $VmName -Generation 2 -MemoryStartupBytes 2GB `
    -NewVHDPath "$VmRoot\$VmName.vhdx" -NewVHDSizeBytes 20GB

Set-VMProcessor $VmName -Count 2
Set-VMMemory $VmName -DynamicMemoryEnabled $false
Set-VMFirmware $VmName -SecureBootTemplate MicrosoftUEFICertificateAuthority
Add-VMDvdDrive $VmName -Path $IsoPath

# NIC1: NAT 相当（Default Switch。Windows Server の Hyper-V には無いことが多い。
# [付録 A-2] のとおり、その場合は External スイッチ等の代替が必要）
if (Get-VMSwitch -Name $DefaultSwitch -ErrorAction SilentlyContinue) {
    Get-VMNetworkAdapter -VMName $VmName | Connect-VMNetworkAdapter -SwitchName $DefaultSwitch
    Write-Host "NIC1 を '$DefaultSwitch' に接続しました。"
} else {
    Write-Warning "'$DefaultSwitch' が見つかりません。付録 A-2 の代替（External スイッチ等）を自分で用意し、Connect-VMNetworkAdapter で割り当ててください。"
}

# NIC2: ホストオンリー相当
Add-VMNetworkAdapter -VMName $VmName -SwitchName $InternalSwitch
Write-Host "NIC2 を '$InternalSwitch' に接続しました。"

Write-Host ''
Write-Host "VM '$VmName' を作成しました。次の手順:"
Write-Host '  1. VM の設定 -> セキュリティ で Secure Boot テンプレートが MicrosoftUEFICertificateAuthority になっていることを確認'
Write-Host '  2. Hyper-V マネージャーから接続し、VM を起動して Subiquity インストーラを進める（設計書 3-3）'
Write-Host '     この画面で SSH 鍵はインポートしない（設計書 3-3 の注意のとおり）'
