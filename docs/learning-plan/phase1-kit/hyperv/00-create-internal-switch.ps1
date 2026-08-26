<#
.SYNOPSIS
    lab-base01 用のホストオンリー相当ネットワーク（Internal スイッチ）を作成する。

.DESCRIPTION
    [05 Phase 1 演習設計 付録 A-2] の手順そのもの。管理者権限の PowerShell で実行する。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/05-phase1-exercise-design.md#a-2-ホストオンリー相当のネットワーク

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。実行した結果・日時・実行者は自分で記録すること。

.NOTES
    再実行しても安全なように、既存スイッチ／IP があれば作成をスキップする。
    New-VMSwitch 等が権限不足で失敗すると PowerShell の既定動作（非終了エラー）では
    後続の行がそのまま実行され、失敗したのに成功したかのようなメッセージが出てしまう。
    これを防ぐため、以下は -ErrorAction Stop と try/catch で実際の成否を判定する。
#>

$ErrorActionPreference = 'Stop'

$SwitchName = 'lab-internal'
$HostIp = '192.168.56.1'
$PrefixLength = 24

try {
    if (Get-VMSwitch -Name $SwitchName -ErrorAction SilentlyContinue) {
        Write-Host "スイッチ '$SwitchName' は既に存在します。作成をスキップします。"
    } else {
        New-VMSwitch -SwitchName $SwitchName -SwitchType Internal -ErrorAction Stop | Out-Null
        Write-Host "スイッチ '$SwitchName'（Internal）を作成しました。"
    }

    $adapterAlias = "vEthernet ($SwitchName)"
    $existing = Get-NetIPAddress -InterfaceAlias $adapterAlias -IPAddress $HostIp -ErrorAction SilentlyContinue

    if ($existing) {
        Write-Host "$adapterAlias には既に $HostIp/$PrefixLength が設定済みです。"
    } else {
        New-NetIPAddress -InterfaceAlias $adapterAlias -IPAddress $HostIp -PrefixLength $PrefixLength -ErrorAction Stop | Out-Null
        Write-Host "$adapterAlias に $HostIp/$PrefixLength を設定しました。"
    }
} catch {
    $ErrorActionPreference = 'Continue'
    Write-Error "失敗しました: $($_.Exception.Message)"
    Write-Error '管理者として PowerShell を実行しているか、Hyper-V Administrators グループに所属しているかを確認してください。'
    exit 1
}

Write-Host ''
Write-Host '確認: Get-VMSwitch, Get-NetIPAddress -InterfaceAlias "vEthernet (lab-internal)"'
