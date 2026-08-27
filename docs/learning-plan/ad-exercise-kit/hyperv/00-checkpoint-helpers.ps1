<#
.SYNOPSIS
    ADLAB-DC1 のチェックポイント（Hyper-V）を作成・復元・一覧する関数。

.DESCRIPTION
    08 AD構築演習設計が使う 3 つのチェックポイント名をそのまま関数化したもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/08-ad-exercise-design.md

    - before-ad-design（4.1-5、本演習の作業前）
    - ad-backup-taken（4.9-6、システム状態バックアップ取得直後）
    - ad-design-complete（4.11-5、本演習の作業完了後）

    使い方（このファイルを dot-source してから呼び出す）:
        . .\00-checkpoint-helpers.ps1
        New-AdLabCheckpoint -Name before-ad-design
        New-AdLabCheckpoint -Name ad-backup-taken
        Get-AdLabCheckpoints
        Restore-AdLabCheckpoint -Name before-ad-design

.NOTES
    [phase1-kit/hyperv/02-checkpoint-helpers.ps1] と同じ構造。Hyper-V は既定で「運用チェックポイント」
    （VSS 経由）を試み、ゲストが対応していない場合は「標準チェックポイント」へ自動フォールバックする。
    挙動を固定したい場合は VM 設定 → チェックポイント で「運用チェックポイントの作成」を外す。

    このスクリプトはこの AI 支援セッション（Hyper-V ホストへのアクセスが無い Linux コンテナ）では
    一度も実行していない。PowerShell 7 の構文パーサーでの検証のみ完了している
    （[../README.md の未検証の範囲](../README.md#未検証の範囲)を参照）。
#>

function New-AdLabCheckpoint {
    param(
        [string]$VMName = 'ADLAB-DC1',
        [Parameter(Mandatory)]
        [ValidateSet('before-ad-design', 'ad-backup-taken', 'ad-design-complete')]
        [string]$Name
    )
    try {
        Checkpoint-VM -VMName $VMName -SnapshotName $Name -ErrorAction Stop
        Write-Host "チェックポイント '$Name' を作成しました（$VMName）。"
    } catch {
        Write-Error "チェックポイント '$Name' の作成に失敗しました（$VMName）: $($_.Exception.Message)"
    }
}

function Restore-AdLabCheckpoint {
    param(
        [string]$VMName = 'ADLAB-DC1',
        [Parameter(Mandatory)]
        [ValidateSet('before-ad-design', 'ad-backup-taken', 'ad-design-complete')]
        [string]$Name
    )
    try {
        Get-VMSnapshot -VMName $VMName -Name $Name -ErrorAction Stop |
            Restore-VMSnapshot -Confirm:$false -ErrorAction Stop
        Write-Host "チェックポイント '$Name' へ復元しました（$VMName）。VM の起動状態を確認すること。"
    } catch {
        Write-Error "チェックポイント '$Name' への復元に失敗しました（$VMName）: $($_.Exception.Message)"
    }
}

function Get-AdLabCheckpoints {
    param([string]$VMName = 'ADLAB-DC1')
    Get-VMSnapshot -VMName $VMName | Select-Object Name, CreationTime, SnapshotType
}
