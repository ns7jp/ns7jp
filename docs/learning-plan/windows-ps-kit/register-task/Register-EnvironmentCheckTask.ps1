# docs/learning-plan/06-shell-scripting-exercise-design.md 4.3 演習C（フラッグシップ）C-8 の実装
# 状態: 未実行（このキットの README「未検証の範囲」を参照）。
# Invoke-EnvironmentCheck.ps1 を日次実行するタスクスケジューラ登録の例。

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ScriptPath,

    [string]$TaskName = 'PortfolioEnvironmentCheck',

    [string]$TriggerTime = '06:00'
)

$ErrorActionPreference = 'Stop'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -File `"$ScriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $TriggerTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Description 'Invoke-EnvironmentCheck.ps1 の日次実行'

Write-Output "登録しました: $TaskName"
