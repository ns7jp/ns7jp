<#
.SYNOPSIS
    lab-base01 のチェックポイント（VirtualBox のスナップショット相当）を作成・復元する関数。

.DESCRIPTION
    [05 Phase 1 演習設計 付録 A-4] のコマンドをそのまま関数化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/05-phase1-exercise-design.md#a-4-スナップショットチェックポイント

    使い方（このファイルを dot-source してから呼び出す）:
        . .\02-checkpoint-helpers.ps1
        New-LabCheckpoint -Name key-login-ok
        New-LabCheckpoint -Name base-clean
        New-LabCheckpoint -Name before-drill
        Restore-LabCheckpoint -Name base-clean

    設計書が使う 3 つのチェックポイント名: key-login-ok（3-7-5）/ base-clean（3-11-5）/
    before-drill（6 章タイムテーブル、異常系 T-12〜T-18 の前）。

.NOTES
    付録 A-4 の未検証事項: Hyper-V は既定で「運用チェックポイント」（VSS 経由）を試み、
    ゲストが対応していない場合は「標準チェックポイント」へ自動フォールバックする。
    挙動を固定したい場合は VM 設定 -> チェックポイント で「運用チェックポイントの作成」を外す。
#>

function New-LabCheckpoint {
    param(
        [string]$VMName = 'lab-base01',
        [Parameter(Mandatory)]
        [ValidateSet('key-login-ok', 'base-clean', 'before-drill')]
        [string]$Name
    )
    try {
        Checkpoint-VM -VMName $VMName -SnapshotName $Name -ErrorAction Stop
        Write-Host "チェックポイント '$Name' を作成しました（$VMName）。"
    } catch {
        Write-Error "チェックポイント '$Name' の作成に失敗しました（$VMName）: $($_.Exception.Message)"
    }
}

function Restore-LabCheckpoint {
    param(
        [string]$VMName = 'lab-base01',
        [Parameter(Mandatory)]
        [ValidateSet('key-login-ok', 'base-clean', 'before-drill')]
        [string]$Name
    )
    try {
        Get-VMSnapshot -VMName $VMName -Name $Name -ErrorAction Stop | Restore-VMSnapshot -Confirm:$false -ErrorAction Stop
        Write-Host "チェックポイント '$Name' へ復元しました（$VMName）。VM の起動状態を確認すること。"
    } catch {
        Write-Error "チェックポイント '$Name' への復元に失敗しました（$VMName）: $($_.Exception.Message)"
    }
}

function Get-LabCheckpoints {
    param([string]$VMName = 'lab-base01')
    Get-VMSnapshot -VMName $VMName | Select-Object Name, CreationTime, SnapshotType
}
