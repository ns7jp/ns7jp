# docs/learning-plan/06-shell-scripting-exercise-design.md 4.3 演習A の実装
# この AI 支援セッションの作業環境（Ubuntu 24.04 コンテナ、PowerShell 7.4.6）で
# A-1〜A-4 のハンズオンどおりに実際に実行し、生成物の展開一致・世代管理・排他制御
# （2 重起動の拒否）・異常系での transcript 終了と Mutex 解放を確認済み。
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$BackupDir,

    [Parameter(Mandatory = $true)]
    [int]$Keep
)

$ErrorActionPreference = 'Stop'

$mutex = [System.Threading.Mutex]::new($false, 'Global\PortfolioBackupRotate')
$acquired = $false
$transcriptStarted = $false
$exitCode = 0

try {
    # A-3 排他制御
    $acquired = $mutex.WaitOne(0)
    if (-not $acquired) {
        Write-Output '別のインスタンスが実行中のため終了します。'
        exit 1
    }

    # A-4 ログ記録
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    $transcriptPath = Join-Path $BackupDir 'backup-rotate.transcript.log'
    Start-Transcript -LiteralPath $transcriptPath -Append | Out-Null
    $transcriptStarted = $true

    # A-1 圧縮バックアップ
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $archivePath = Join-Path $BackupDir "backup-$stamp.zip"
    Compress-Archive -Path $SourcePath -DestinationPath $archivePath
    Write-Output "作成: $archivePath"

    # A-2 世代管理
    $existing = Get-ChildItem -Path $BackupDir -Filter 'backup-*.zip' |
        Sort-Object LastWriteTime -Descending
    $toRemove = $existing | Select-Object -Skip $Keep
    foreach ($old in $toRemove) {
        Remove-Item -LiteralPath $old.FullName -Force
        Write-Output "削除（世代超過）: $($old.Name)"
    }
}
catch {
    Write-Error "失敗: $($_.Exception.Message)"
    $exitCode = 1
}
finally {
    if ($transcriptStarted) {
        try { Stop-Transcript | Out-Null } catch { Write-Warning 'transcript は開始されていません。' }
    }
    if ($acquired) {
        $mutex.ReleaseMutex()
    }
    $mutex.Dispose()
}

exit $exitCode
