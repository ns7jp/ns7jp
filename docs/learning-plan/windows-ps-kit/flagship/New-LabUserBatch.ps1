# docs/learning-plan/06-shell-scripting-exercise-design.md 4.4 演習E（フラッグシップ）の実装
# 状態: 未実行。この AI 支援セッションには Active Directory 環境が無いため
# （ActiveDirectory モジュール自体が利用できない）、一度も実行していない
# （このキットの README「未検証の範囲」を参照）。
# 前提: docs/evidence/templates/windows-ad-lab.md の Greenfield 手順でラボドメイン
# （ad.example.test / ADLAB）を構築済みで、ラボ専用 OU（PortfolioLab）・接頭辞（pf-）を使う。

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath
)

$ErrorActionPreference = 'Stop'

# 既定は -WhatIf 相当（安全側）。実際に書き込む場合は呼び出し側で -WhatIf:$false を明示する
if (-not $PSBoundParameters.ContainsKey('WhatIf')) {
    $WhatIfPreference = $true
}

$ExpectedDomain = 'ad.example.test'
$ExpectedNetBIOS = 'ADLAB'
$LabOuName = 'PortfolioLab'
$TestPrefix = 'pf-'
$RequiredColumns = @('Name', 'SamAccountName', 'Department')

function Get-NormalizedGroupName {
    param([string]$Department)
    $trimmed = $Department.Trim()
    if ([string]::IsNullOrEmpty($trimmed)) {
        return $null
    }
    return "${TestPrefix}$trimmed"
}

$transcriptStarted = $false
$exitCode = 0

try {
    $transcriptPath = Join-Path ([System.IO.Path]::GetTempPath()) 'new-labuserbatch.transcript.log'
    Start-Transcript -LiteralPath $transcriptPath -Append -ErrorAction Stop | Out-Null
    $transcriptStarted = $true

    # E-1 骨組み・CSV 読み込み
    if (-not (Test-Path -LiteralPath $CsvPath)) {
        Write-Error "CSV が見つかりません: $CsvPath"
        exit 2
    }
    $rows = Import-Csv -Path $CsvPath -Encoding UTF8
    if ($rows.Count -eq 0) {
        Write-Error 'CSV に行がありません。'
        exit 2
    }
    $firstRow = $rows[0]
    $missingColumns = $RequiredColumns | Where-Object { $_ -notin $firstRow.PSObject.Properties.Name }
    if ($missingColumns) {
        Write-Error "CSV に必須列が不足しています: $($missingColumns -join ', ')"
        exit 2
    }

    # E-2 事前確認（fail-closed）
    $domain = Get-ADDomain -ErrorAction Stop
    if ($domain.DNSRoot -ne $ExpectedDomain -or $domain.NetBIOSName -ne $ExpectedNetBIOS) {
        Write-Error "想定外のドメインです: $($domain.DNSRoot) / $($domain.NetBIOSName)"
        exit 1
    }
    $labOuDn = "OU=$LabOuName,$($domain.DistinguishedName)"
    $labOu = Get-ADOrganizationalUnit -Identity $labOuDn -ErrorAction SilentlyContinue
    if (-not $labOu) {
        Write-Error "ラボ専用 OU が見つかりません: $labOuDn"
        exit 1
    }

    $created = 0
    $skipped = 0
    $failed = 0

    foreach ($row in $rows) {
        try {
            $sam = $row.SamAccountName

            # E-4 接頭辞のないユーザーはスキップ
            if (-not $sam.StartsWith($TestPrefix)) {
                Write-Output "スキップ（接頭辞なし）: $sam"
                $skipped++
                continue
            }

            # E-3 重複確認
            $existingUser = Get-ADUser -Filter "SamAccountName -eq '$sam'" `
                -SearchBase $labOuDn -ErrorAction SilentlyContinue
            if ($existingUser) {
                Write-Output "スキップ（既存）: $sam"
                $skipped++
                continue
            }

            # E-4 ユーザー作成
            if ($PSCmdlet.ShouldProcess($sam, 'New-ADUser')) {
                New-ADUser -Name $row.Name -SamAccountName $sam `
                    -UserPrincipalName "$sam@$ExpectedDomain" `
                    -Path $labOuDn -Enabled $false
                Write-Output "作成: $sam"
                $created++
            } else {
                Write-Output "[-WhatIf] 作成対象: $sam"
                $created++
            }

            # E-5 グループ追加
            $groupName = Get-NormalizedGroupName -Department $row.Department
            if (-not $groupName) {
                Write-Output "グループ追加スキップ（部署名が空）: $sam"
                continue
            }
            if ($PSCmdlet.ShouldProcess($groupName, 'New-ADGroup / Add-ADGroupMember')) {
                $group = Get-ADGroup -Filter "SamAccountName -eq '$groupName'" `
                    -SearchBase $labOuDn -ErrorAction SilentlyContinue
                if (-not $group) {
                    New-ADGroup -Name $groupName -SamAccountName $groupName `
                        -GroupScope Global -GroupCategory Security -Path $labOuDn
                    $group = Get-ADGroup -Filter "SamAccountName -eq '$groupName'" -SearchBase $labOuDn
                }
                $userObj = Get-ADUser -Filter "SamAccountName -eq '$sam'" -SearchBase $labOuDn
                $alreadyMember = Get-ADGroupMember -Identity $group.DistinguishedName |
                    Where-Object { $_.DistinguishedName -eq $userObj.DistinguishedName }
                if (-not $alreadyMember) {
                    Add-ADGroupMember -Identity $group.DistinguishedName -Members $userObj.DistinguishedName
                }
            }
        }
        catch {
            Write-Warning "行の処理に失敗しました（$($row.SamAccountName)）: $($_.Exception.Message)"
            $failed++
        }
    }

    # E-6 結果サマリと棚卸し
    Write-Output "サマリ: 作成=$created スキップ=$skipped 失敗=$failed"

    $cutoff = (Get-Date).AddDays(-90)
    $inventory = Get-ADUser -SearchBase $labOuDn -Filter "SamAccountName -like '$TestPrefix*'" `
        -Properties Enabled, LastLogonDate, whenCreated |
        Where-Object {
            $_.Enabled -and (
                ($_.LastLogonDate -and $_.LastLogonDate -lt $cutoff) -or
                (-not $_.LastLogonDate -and $_.whenCreated -lt $cutoff)
            )
        }
    Write-Output "90日未ログイン棚卸し件数: $(@($inventory).Count)"

    if ($failed -gt 0) {
        $exitCode = 3
    }
}
catch {
    Write-Error "致命的エラー: $($_.Exception.Message)"
    $exitCode = 1
}
finally {
    if ($transcriptStarted) {
        try { Stop-Transcript | Out-Null } catch { Write-Warning 'transcript は開始されていません。' }
    }
}

exit $exitCode
