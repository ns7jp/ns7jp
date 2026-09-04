<#
.SYNOPSIS
    03-enable-external-nat.ps1 で追加した外部疎通用 NIC を撤去する。

.DESCRIPTION
    [07 Python 運用自動化演習設計 1 章 前提条件] のとおり、T-05 / TCK-05 の確認が終わったら
    LAB-WINOPS1 を隔離状態（Internal スイッチのみ）へ戻す。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#前提条件

.NOTES
    対象の NIC が無い、または Remove-VMNetworkAdapter が失敗した場合でも、PowerShell の
    既定動作（非終了エラー）では後続の行がそのまま実行され、削除できていないのに
    成功したかのようなメッセージが出てしまう
    （phase1-kit/hyperv/00-create-internal-switch.ps1 の実機初回実行で発見・修正した不具合と同種）。
    これを防ぐため、以下は対象の有無を先に確認し、-ErrorAction Stop と try/catch で
    実際の成否を判定する。
#>

param(
    [string]$VMName = 'LAB-WINOPS1'
)

$ErrorActionPreference = 'Stop'

$DefaultSwitch = 'Default Switch'

try {
    $targetAdapters = Get-VMNetworkAdapter -VMName $VMName -ErrorAction Stop |
        Where-Object { $_.SwitchName -eq $DefaultSwitch }

    if (-not $targetAdapters) {
        Write-Host "VM '$VMName' に '$DefaultSwitch' 経由の NIC はありません（削除不要）。"
    } else {
        $targetAdapters | Remove-VMNetworkAdapter -ErrorAction Stop
        Write-Host "VM '$VMName' から '$DefaultSwitch' 経由の NIC を削除しました。"
    }
} catch {
    $ErrorActionPreference = 'Continue'
    Write-Error "失敗しました: $($_.Exception.Message)"
    Write-Error '管理者として PowerShell を実行しているか、Hyper-V Administrators グループに所属しているかを確認してください。'
    exit 1
}

Write-Host ''
Write-Host '確認: Get-VMNetworkAdapter -VMName LAB-WINOPS1 で NIC が lab-winops-internal のみ（1枚）に戻っていること。'
