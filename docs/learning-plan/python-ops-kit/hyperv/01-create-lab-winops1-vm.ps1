<#
.SYNOPSIS
    LAB-WINOPS1 VM（Windows Server 2022 評価版）を作成する。

.DESCRIPTION
    [07 Python 運用自動化演習設計 3.1 章] のスペック（2 vCPU / 4GB メモリ / 40GB ディスク）に
    合わせて Generation 2 VM を作成する。lab-base01 用の phase1-kit/hyperv/01-create-vm.ps1 と
    同じ構成方針だが、次の点が異なる:
      - ゲストが Windows のため Secure Boot テンプレートは既定の MicrosoftWindows のまま
        （lab-base01 は Linux ゲストのため MicrosoftUEFICertificateAuthority への変更が必要だった）
      - NIC は既定で LAB-WINOPS1 専用の Internal スイッチ（lab-winops-internal）のみに接続する。
        lab-base01 と同じセグメントに置かない、外部への inbound・port forwarding・bridge を
        無効にするという[1 章 前提条件]の隔離方針に従い、NAT 相当（Default Switch）は
        既定では接続しない（TLS 証明書チェック試験のみ 03-enable-external-nat.ps1 で一時追加する）
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#31-lab-winops1新規ホストの基本情報

    実行前に 00-create-lab-winops1-switch.ps1 を実行しておくこと。
    実行後の OS インストールは Windows Server 2022 評価版の GUI セットアップを手作業で進める
    （このスクリプトでは行わない）。

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。

.PARAMETER IsoPath
    Windows Server 2022 評価版 ISO へのフルパス。Microsoft評価版センターから取得する
    （[07 章 前提条件]の「使い捨ての評価版・業務端末や研修端末を対象にしない」原則に従う）。

.PARAMETER VmRoot
    VHDX の保存先ディレクトリ。既定は D:\HyperV\LAB-WINOPS1。
#>

param(
    [Parameter(Mandatory)]
    [string]$IsoPath,

    [string]$VmRoot = 'D:\HyperV\LAB-WINOPS1'
)

$VmName = 'LAB-WINOPS1'
$InternalSwitch = 'lab-winops-internal'

if (-not (Test-Path $IsoPath)) {
    throw "ISO が見つかりません: $IsoPath"
}

if (Get-VM -Name $VmName -ErrorAction SilentlyContinue) {
    throw "VM '$VmName' は既に存在します。作り直す場合は先に Remove-VM -Name $VmName -Force を実行してください（VHDX の削除は別途）。"
}

New-Item -ItemType Directory -Path $VmRoot -Force | Out-Null

New-VM -Name $VmName -Generation 2 -MemoryStartupBytes 4GB `
    -NewVHDPath "$VmRoot\$VmName.vhdx" -NewVHDSizeBytes 40GB

Set-VMProcessor $VmName -Count 2
Set-VMMemory $VmName -DynamicMemoryEnabled $false
# Windows ゲストの既定テンプレート。lab-base01（Linux ゲスト）とは異なり変更不要だが、
# 意図を明示するためスクリプト側でも明示的に設定する。
Set-VMFirmware $VmName -SecureBootTemplate MicrosoftWindows
Add-VMDvdDrive $VmName -Path $IsoPath

# 既定では外部接続を持たない。[1 章 前提条件]どおり隔離した状態からセットアップを始める。
Get-VMNetworkAdapter -VMName $VmName | Connect-VMNetworkAdapter -SwitchName $InternalSwitch
Write-Host "NIC を '$InternalSwitch' のみに接続しました（外部接続なし）。"

Write-Host ''
Write-Host "VM '$VmName' を作成しました。次の手順:"
Write-Host '  1. VM の設定 -> セキュリティ で Secure Boot テンプレートが MicrosoftWindows になっていることを確認'
Write-Host '  2. Hyper-V マネージャーから接続し、VM を起動して Windows Server 2022 評価版のセットアップを進める'
Write-Host '     （3.1 章のとおり NetBIOS 名は LAB-WINOPS1、standalone・workgroup のまま。ドメイン参加はしない）'
Write-Host '  3. セットアップ完了後、02-checkpoint-helpers.ps1 で base-clean チェックポイントを取得する（4.1-3 章）'
Write-Host '  4. TLS 証明書チェック試験（T-05 / TCK-05）の直前だけ 03-enable-external-nat.ps1 で外部疎通を一時追加する'
