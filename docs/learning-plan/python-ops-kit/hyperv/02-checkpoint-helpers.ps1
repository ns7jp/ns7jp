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

    このファイルは dot-source して使うため、ファイル先頭で $ErrorActionPreference を
    変更すると呼び出し元のセッション設定を書き換えてしまう。そのため
    ad-exercise-kit/hyperv/00-checkpoint-helpers.ps1・phase1-kit/hyperv/02-checkpoint-helpers.ps1
    と同じく、各関数内で -ErrorAction Stop と try/catch を使って成否を判定する
    （$ErrorActionPreference の既定値のままだと、失敗しても成功メッセージが出てしまう。
    phase1-kit/hyperv/00-create-internal-switch.ps1 の実機初回実行で発見した不具合と同種）。
#>

function New-Winops1Checkpoint {
    param(
        [string]$VMName = 'LAB-WINOPS1',
        [Parameter(Mandatory)]
        [ValidateSet('base-clean', 'before-drill')]
        [string]$Name
    )
    try {
        Checkpoint-VM -VMName $VMName -SnapshotName $Name -ErrorAction Stop
        Write-Host "チェックポイント '$Name' を作成しました（$VMName）。"
    } catch {
        Write-Error "チェックポイント '$Name' の作成に失敗しました（$VMName）: $($_.Exception.Message)"
    }
}

function Restore-Winops1Checkpoint {
    param(
        [string]$VMName = 'LAB-WINOPS1',
        [Parameter(Mandatory)]
        [ValidateSet('base-clean', 'before-drill')]
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

function Get-Winops1Checkpoints {
    param([string]$VMName = 'LAB-WINOPS1')
    Get-VMSnapshot -VMName $VMName | Select-Object Name, CreationTime, SnapshotType
}
