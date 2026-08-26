<#
.SYNOPSIS
    LAB-WINOPS1 のチェックポイントを作成・復元する関数。

.DESCRIPTION
    phase1-kit/hyperv/02-checkpoint-helpers.ps1（lab-base01 用）と同じ構成を LAB-WINOPS1 向けに
    書き換えたもの。[07 Python 運用自動化演習設計 4.1 章 / 6 章] が使うチェックポイント名:
    base-clean（4.1-3、導入直後）/ before-drill（6 章タイムテーブル、異常系 TW-07〜11 の前）。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#41-作業前確認共通

    使い方（このファイルを dot-source してから呼び出す）:
        . .\02-checkpoint-helpers.ps1
        New-Winops1Checkpoint -Name base-clean
        New-Winops1Checkpoint -Name before-drill
        Restore-Winops1Checkpoint -Name base-clean

.NOTES
    phase1-kit/hyperv/02-checkpoint-helpers.ps1 と同じ未検証事項が当てはまる:
    Hyper-V は既定で「運用チェックポイント」（VSS 経由）を試み、ゲストが対応していない場合は
    「標準チェックポイント」へ自動フォールバックする。挙動を固定したい場合は
    VM 設定 -> チェックポイント で「運用チェックポイントの作成」を外す。
#>

function New-Winops1Checkpoint {
    param(
        [string]$VMName = 'LAB-WINOPS1',
        [Parameter(Mandatory)]
        [ValidateSet('base-clean', 'before-drill')]
        [string]$Name
    )
    Checkpoint-VM -VMName $VMName -SnapshotName $Name
    Write-Host "チェックポイント '$Name' を作成しました（$VMName）。"
}

function Restore-Winops1Checkpoint {
    param(
        [string]$VMName = 'LAB-WINOPS1',
        [Parameter(Mandatory)]
        [ValidateSet('base-clean', 'before-drill')]
        [string]$Name
    )
    Get-VMSnapshot -VMName $VMName -Name $Name | Restore-VMSnapshot -Confirm:$false
    Write-Host "チェックポイント '$Name' へ復元しました（$VMName）。VM の起動状態を確認すること。"
}

function Get-Winops1Checkpoints {
    param([string]$VMName = 'LAB-WINOPS1')
    Get-VMSnapshot -VMName $VMName | Select-Object Name, CreationTime, SnapshotType
}
