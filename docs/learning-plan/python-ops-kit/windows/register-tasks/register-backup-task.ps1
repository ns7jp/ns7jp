<#
.SYNOPSIS
    backup.py をタスクスケジューラに登録する（ConfigBackup、毎日 02:00）。

.DESCRIPTION
    [07 Python 運用自動化演習設計 4.4 章 構築手順書 No.16] のスクリプトそのもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#44-backuppylinux--windows-共通コアと-os-別実装

    実行前に No.10〜15（配置ディレクトリ作成・本体配置・venv 作成・依存導入・単体実行テスト）を
    終えていること。管理者権限の PowerShell で実行する。

    schtasks 版との違い・使い分けは同章の説明を参照（Register-ScheduledTask は戻り値が
    オブジェクトで返り、Get-ScheduledTaskInfo と合わせて状態確認しやすいためこちらを主とした）。

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。

.NOTES
    Register-ScheduledTask が失敗すると PowerShell の既定動作（非終了エラー）では
    後続の行がそのまま実行され、失敗したのに成功したかのようなメッセージが出てしまう
    （phase1-kit/hyperv/00-create-internal-switch.ps1 の実機初回実行で発見・修正した不具合と同種）。
    これを防ぐため、以下は -ErrorAction Stop と try/catch で実際の成否を判定する。
#>

$ErrorActionPreference = 'Stop'

try {
    $Action = New-ScheduledTaskAction -Execute "C:\ops\backup-tool\.venv\Scripts\python.exe" `
        -Argument 'C:\ops\backup-tool\backup.py --config C:\ops\backup-tool\backup_config.yaml backup' `
        -WorkingDirectory 'C:\ops\backup-tool'
    $Trigger = New-ScheduledTaskTrigger -Daily -At 02:00
    Register-ScheduledTask -TaskName "ConfigBackup" -Action $Action -Trigger $Trigger `
        -User "SYSTEM" -RunLevel Highest -ErrorAction Stop | Out-Null
    Write-Host "タスク 'ConfigBackup' を登録しました。"
} catch {
    $ErrorActionPreference = 'Continue'
    Write-Error "失敗しました: $($_.Exception.Message)"
    exit 1
}

Write-Host ''
Write-Host '確認 (No.17): Get-ScheduledTask -TaskName ConfigBackup | Select-Object TaskName, State'
Write-Host '手動起動試験 (No.18): Start-ScheduledTask -TaskName ConfigBackup'
