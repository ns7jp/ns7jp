# docs/learning-plan/06-shell-scripting-exercise-design.md 4.3 演習C（フラッグシップ）の実装
# 状態: 未実行。この AI 支援セッションには Windows 実行環境が無いため、Get-Service /
# Write-EventLog に依存する経路は一度も実行していない（このキットの README「未検証の範囲」を参照）。
# 実行には Windows PowerShell 5.1（*-EventLog 系コマンドレットのため）が前提。

# C-1 骨組み
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string[]]$Services,

    [Parameter(Mandatory = $true)]
    [int]$DiskThresholdPercent,

    [Parameter(Mandatory = $true)]
    [string[]]$CertPath,

    [Parameter(Mandatory = $true)]
    [int]$CertExpiryWarningDays,

    [Parameter(Mandatory = $true)]
    [string]$EventLogName,

    [Parameter(Mandatory = $true)]
    [string]$EventSource
)

$ErrorActionPreference = 'Stop'

# C-2 ディスク使用率チェック
function Test-DiskUsage {
    param(
        [int]$ThresholdPercent
    )
    $results = @()
    $drives = Get-PSDrive -PSProvider FileSystem
    foreach ($drive in $drives) {
        $used = $drive.Used
        $free = $drive.Free
        if ($null -eq $used -or $null -eq $free -or ($used + $free) -eq 0) {
            continue
        }
        $percent = [math]::Round(($used / ($used + $free)) * 100, 1)
        $status = if ($percent -gt $ThresholdPercent) { 'WARN' } else { 'OK' }
        $results += [pscustomobject]@{
            Check  = 'Disk'
            Target = $drive.Name
            Status = $status
            Detail = "${percent}% (threshold=${ThresholdPercent}%)"
        }
    }
    return $results
}

# 演習B S-5 相当: サービス障害の検知（存在しないサービス名も例外で止めない）
function Test-ServiceRunning {
    param(
        [string]$Name
    )
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if ($null -eq $svc) {
        return [pscustomobject]@{
            Check  = 'Service'
            Target = $Name
            Status = 'FAIL'
            Detail = 'サービスが存在しません'
        }
    }
    $status = if ($svc.Status -eq 'Running') { 'OK' } else { 'FAIL' }
    return [pscustomobject]@{
        Check  = 'Service'
        Target = $Name
        Status = $status
        Detail = "Status=$($svc.Status)"
    }
}

# C-4 証明書残日数チェック
function Test-CertificateExpiry {
    param(
        [string]$Path,
        [int]$WarningDays
    )
    $results = @()
    $certs = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue
    foreach ($cert in $certs) {
        $remainDays = [int]($cert.NotAfter - (Get-Date)).TotalDays
        $status = if ($remainDays -lt 0) {
            'FAIL'
        } elseif ($remainDays -lt $WarningDays) {
            'WARN'
        } else {
            'OK'
        }
        $results += [pscustomobject]@{
            Check  = 'Certificate'
            Target = $cert.Subject
            Status = $status
            Detail = "残り${remainDays}日"
        }
    }
    return $results
}

# C-5 ログとサマリ集約
$transcriptStarted = $false
$results = @()
try {
    $transcriptPath = Join-Path ([System.IO.Path]::GetTempPath()) 'invoke-environmentcheck.transcript.log'
    Start-Transcript -LiteralPath $transcriptPath -Append -ErrorAction Stop | Out-Null
    $transcriptStarted = $true

    $results += Test-DiskUsage -ThresholdPercent $DiskThresholdPercent
    foreach ($svcName in $Services) {
        $results += Test-ServiceRunning -Name $svcName
    }
    foreach ($path in $CertPath) {
        $results += Test-CertificateExpiry -Path $path -WarningDays $CertExpiryWarningDays
    }

    $results | Format-Table Check, Target, Status, Detail | Out-String | Write-Output

    # C-6 イベントログへの記録
    try {
        $summary = $results | ConvertTo-Json -Compress
        Write-EventLog -LogName $EventLogName -Source $EventSource -EventId 1000 `
            -EntryType Information -Message $summary -ErrorAction Stop
    }
    catch {
        Write-Warning "イベントログへの記録に失敗しました: $($_.Exception.Message)"
    }
}
finally {
    if ($transcriptStarted) {
        try { Stop-Transcript | Out-Null } catch { Write-Warning 'transcript は開始されていません。' }
    }
}

# C-7 終了コード決定
$failCount = @($results | Where-Object Status -eq 'FAIL').Count
$warnCount = @($results | Where-Object Status -eq 'WARN').Count

if ($failCount -gt 0) {
    exit 3
} elseif ($warnCount -gt 0) {
    exit 2
} else {
    exit 0
}
