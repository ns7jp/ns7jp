# Windows / Active Directory 公開再現ラボ 記録テンプレート

このファイルを `docs/evidence/YYYY-MM-DD-windows-ad-lab.md` へコピーし、自宅 PC 等の
**公開可能な使い捨て評価版ラボ**で再実行した一次出力を記録します。研修環境の画面・名前・
IP・アカウントは転用しません。コマンド例を置いただけでは実績にせず、全結果の初期値は
`NOT RUN` とします。

## 1. 実施情報

| 項目 | 記録 |
| --- | --- |
| 全体状態 | `NOT RUN` |
| 実施日時・終了日時（JST） | `NOT RUN` |
| 対象リポジトリ commit SHA | `NOT RUN` |
| 実行した script / 手順の版 | `NOT RUN` |
| 仮想化製品 / version | `NOT RUN` |
| Windows Server edition / build | `NOT RUN` |
| Client OS / build | `NOT RUN` |
| Windows PowerShell version | `NOT RUN` |
| 評価版 ISO の公式入手元 / SHA-256 | `NOT RUN` |
| VM 構成（vCPU / RAM / disk） | `NOT RUN` |
| 隔離 network / adapter 構成 | `NOT RUN` |
| 公開専用 DNS domain / NetBIOS 名 | `NOT RUN` |
| ラボ専用 OU / test object 接頭辞 | `NOT RUN` |
| DC promotion 前 checkpoint 名 / 取得時刻 | `NOT RUN` |
| client checkpoint 名 / 取得時刻 | `NOT RUN` |
| raw transcript 群の非公開保存先 | `NOT RUN` |
| 公開用 transcript / screenshot 群 | `NOT RUN` |

公開専用名には `ad.example.test` のような架空名を使います。実在組織・研修環境・家庭内で
使用中の名前は使用しません。

## 2. 状態の判定方法

| 状態 | 意味 |
| --- | --- |
| `PASS` | 期待値と実出力が一致し、証跡への参照がある |
| `FAIL` | 実行したが期待値と一致しなかった |
| `BLOCKED` | 外部条件または未解決エラーにより完了できなかった |
| `NOT RUN` | 未実行、または実出力を保存していない |

一つでも必須項目が `FAIL / BLOCKED / NOT RUN` なら、全体状態を `PASS` にしません。

## 3. 公開前の安全条件

- [ ] 自宅または明示的に公開可能な使い捨て評価版ラボだけを使用した
- [ ] DC と client は Host-only / Internal switch 上に置き、外部からの inbound、
  port forwarding、bridge 接続を無効にした
- [ ] internet 接続が必要な更新時だけ NAT を一時追加し、AD DS / DNS の検証前に外した
- [ ] 研修先・勤務先・顧客・家庭内の DNS domain、NetBIOS 名、OU、ユーザー、IP を
  再利用していない
- [ ] ラボ専用 OU と test object 接頭辞を決め、その範囲外を変更しない
- [ ] test user は架空名で、password や credential をコマンド引数・出力へ記録していない
- [ ] Windows license key、tenant / subscription ID、machine GUID、SID、MAC address、
  個人名、ホスト側のパスを公開版から除いた
- [ ] 障害注入前に client checkpoint と正常時 DNS 設定を保存した
- [ ] raw transcript、未加工画像、VM export を Git 管理外へ置いた
- [ ] 公開用コピーを別人、または時間を空けた独立セッションで再確認した

> DC の稼働中 checkpoint を通常のロールバック手段にはしません。障害注入は client の
> DNS 設定だけに限定し、正常値へ戻します。ラボ全体を戻す必要がある場合は、使い捨て VM を
> 再構築します。

## 4. Greenfield AD DS / DNS forest の構築

この節は、まだ AD DS role を持たない**使い捨て standalone Windows Server**を、公開専用
forest `ad.example.test` / `ADLAB` の最初の DC にする手順です。既存 domain、member server、
業務・研修環境では実行しません。

### 4.1 Promotion 前の必須条件と checkpoint

- [ ] Windows Server 評価版 VM が workgroup / standalone server である
- [ ] hostname を `ADLAB-DC1` に設定し、再起動済みである
- [ ] Host-only / Internal switch だけを接続し、NAT、bridge、default gateway、port forwarding
  がない
- [ ] ラボ専用の private static IPv4 を設定した
- [ ] AD DS / DNS role が未導入である
- [ ] **promotion 前**の powered-off checkpoint 名・取得時刻・VM ID を記録した
- [ ] client をまだ domain 参加させておらず、この forest を破棄可能である

checkpoint と上記条件を確認した後だけ、管理者 PowerShell で承認 marker を作成します。

```powershell
$ApprovalRoot = 'C:\portfolio-lab'
$ApprovalMarker = Join-Path $ApprovalRoot 'DISPOSABLE-DC-APPROVED.txt'
New-Item -ItemType Directory -Path $ApprovalRoot -Force | Out-Null
Set-Content -LiteralPath $ApprovalMarker `
    -Value 'ad.example.test|ADLAB|ADLAB-DC1' -NoNewline
```

### 4.2 Fail-closed preflight

`REPLACE_` をラボ専用値へ置換します。期待値の変更、marker 不一致、既存 role、domain 参加、
default gateway の存在を一つでも検出したら、role install 前に停止します。

```powershell
$ErrorActionPreference = 'Stop'

$ExpectedDomain = 'ad.example.test'
$ExpectedNetBIOS = 'ADLAB'
$ExpectedHostname = 'ADLAB-DC1'
$LabInterface = 'REPLACE_WITH_INTERNAL_INTERFACE_ALIAS'
$LabDcIp = 'REPLACE_WITH_PRIVATE_STATIC_IPV4'
$ApprovalMarker = 'C:\portfolio-lab\DISPOSABLE-DC-APPROVED.txt'
$ExpectedMarker = 'ad.example.test|ADLAB|ADLAB-DC1'

if (
    $ExpectedDomain -ne 'ad.example.test' -or
    $ExpectedNetBIOS -ne 'ADLAB' -or
    $ExpectedHostname -ne 'ADLAB-DC1' -or
    $LabInterface -like 'REPLACE_*' -or
    $LabDcIp -like 'REPLACE_*' -or
    $LabDcIp -notmatch '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
) {
    throw '固定した公開ラボ値または private IPv4 の事前条件を満たしません。'
}

if (-not (Test-Path -LiteralPath $ApprovalMarker)) {
    throw 'promotion 前 checkpoint 後の承認 marker がありません。'
}
if ((Get-Content -Raw -LiteralPath $ApprovalMarker).Trim() -cne $ExpectedMarker) {
    throw '承認 marker が固定値と一致しません。'
}

$CurrentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$CurrentPrincipal = [Security.Principal.WindowsPrincipal]::new($CurrentIdentity)
if (-not $CurrentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw '管理者 PowerShell ではないため停止します。'
}

$ComputerSystem = Get-CimInstance Win32_ComputerSystem
$OperatingSystem = Get-CimInstance Win32_OperatingSystem
if (
    $env:COMPUTERNAME -cne $ExpectedHostname -or
    $ComputerSystem.PartOfDomain -or
    $ComputerSystem.DomainRole -ne 2 -or
    $OperatingSystem.ProductType -ne 3
) {
    throw '承認済み standalone Windows Server ではありません。'
}

$UnexpectedUpAdapters = @(
    Get-NetAdapter |
        Where-Object { $_.Status -eq 'Up' -and $_.Name -ne $LabInterface }
)
if ($UnexpectedUpAdapters.Count) {
    throw '承認した internal interface 以外の接続中 adapter があります。'
}

$LabIpConfig = Get-NetIPConfiguration -InterfaceAlias $LabInterface
$ConfiguredLabIps = @($LabIpConfig.IPv4Address | ForEach-Object IPAddress)
if ($ConfiguredLabIps -notcontains $LabDcIp -or $LabIpConfig.IPv4DefaultGateway) {
    throw '承認済み internal interface / static IPv4 / gateway 条件と一致しません。'
}

$RoleStateBefore = Get-WindowsFeature AD-Domain-Services, DNS
if (@($RoleStateBefore | Where-Object InstallState -eq 'Installed').Count) {
    throw 'AD DS または DNS role が既に導入済みです。greenfield 手順を停止します。'
}

[pscustomobject]@{
    ExpectedDomain = $ExpectedDomain
    ExpectedNetBIOS = $ExpectedNetBIOS
    ExpectedHostname = $ExpectedHostname
    InterfaceAlias = $LabInterface
    UnexpectedUpAdapterCount = $UnexpectedUpAdapters.Count
    HasDefaultGateway = [bool]$LabIpConfig.IPv4DefaultGateway
    DomainRoleBefore = $ComputerSystem.DomainRole
    RolesInstalledBefore = @(
        $RoleStateBefore | Where-Object InstallState -eq 'Installed'
    ).Count
}
```

### 4.3 Role install、forest promotion、明示的な再起動

preflight が完了してから transcript を開始します。固定フレーズによる二重確認、secure DSRM
prompt、role install、promotion の順で実行します。`-NoRebootOnCompletion` で自動再起動を
止め、raw transcript と secure 変数を `finally` で片付けた後だけ明示的に再起動します。

```powershell
$PrivateEvidenceRoot = Join-Path $env:USERPROFILE 'Documents\portfolio-evidence-private'
New-Item -ItemType Directory -Path $PrivateEvidenceRoot -Force | Out-Null
$PromotionTranscript = Join-Path $PrivateEvidenceRoot 'windows-ad-dc-promotion.raw.txt'
Start-Transcript -LiteralPath $PromotionTranscript -NoClobber -IncludeInvocationHeader

$PromotionReadyToRestart = $false
try {
    $PromotionApproval = Read-Host `
        '続行するには PROMOTE ad.example.test AS ADLAB と入力'
    $RestartApproval = Read-Host `
        '続行するには RESTART ADLAB-DC1 AFTER PROMOTION と入力'
    if (
        $PromotionApproval -cne 'PROMOTE ad.example.test AS ADLAB' -or
        $RestartApproval -cne 'RESTART ADLAB-DC1 AFTER PROMOTION'
    ) {
        throw 'promotion または再起動の明示承認が一致しません。'
    }

    $RoleInstall = Install-WindowsFeature AD-Domain-Services, DNS `
        -IncludeManagementTools
    $RoleInstall |
        Select-Object Success, RestartNeeded, ExitCode, FeatureResult
    $RoleRestartNeeded = $RoleInstall.RestartNeeded.ToString()
    if (-not $RoleInstall.Success -or $RoleRestartNeeded -ne 'No') {
        throw 'role install が完了していないか、promotion 前の再起動が必要です。'
    }

    Get-WindowsFeature AD-Domain-Services, DNS |
        Select-Object Name, InstallState
    Import-Module ADDSDeployment -ErrorAction Stop

    $DsrmPassword = Read-Host 'DSRM password を入力' -AsSecureString
    try {
        Install-ADDSForest `
            -DomainName $ExpectedDomain `
            -DomainNetbiosName $ExpectedNetBIOS `
            -InstallDns:$true `
            -CreateDnsDelegation:$false `
            -SafeModeAdministratorPassword $DsrmPassword `
            -NoRebootOnCompletion:$true `
            -Force:$true
    } finally {
        Remove-Variable DsrmPassword -ErrorAction SilentlyContinue
    }

    Remove-Item -LiteralPath $ApprovalMarker -Force
    $PromotionReadyToRestart = $true
} finally {
    Remove-Variable DsrmPassword -ErrorAction SilentlyContinue
    try { Stop-Transcript } catch { Write-Warning 'transcript は開始されていません。' }
}

if (-not $PromotionReadyToRestart) {
    throw 'promotion 完了を確認できないため再起動しません。'
}
Restart-Computer -Force
```

失敗時は `FAIL / BLOCKED` と partial raw transcript を非公開で保持し、同じ VM へ手作業で
継ぎ足さず、promotion 前 checkpoint へ戻して原因を修正してから再実行します。成功時は
再起動後の次節で domain / role / service を確認するまで、promotion を `PASS` にしません。

| 項目 | 記録 |
| --- | --- |
| promotion 前 checkpoint / VM ID | `NOT RUN` |
| isolation / static IPv4 / gateway なし | `NOT RUN` |
| standalone / hostname / role 未導入 | `NOT RUN` |
| 固定値 / marker / 二重確認 | `NOT RUN` |
| AD DS / DNS role install | `NOT RUN` |
| DSRM secure prompt / forest promotion | `NOT RUN` |
| raw transcript の正常終了 | `NOT RUN` |
| 明示的な再起動 | `NOT RUN` |

## 5. Promotion 後の変数と fail-closed 事前確認

次の値は**架空ラボ専用値**へ置換します。`REPLACE_` が残る場合、現在の domain が期待値と
違う場合、または OU / test object が専用範囲外の場合は停止します。

```powershell
$ErrorActionPreference = 'Stop'

$ExpectedDomain = 'ad.example.test'
$ExpectedNetBIOS = 'ADLAB'
$ExpectedHostname = 'ADLAB-DC1'
$LabOuName = 'PortfolioLab'
$TestPrefix = 'pf-'

if (
    $ExpectedDomain -ne 'ad.example.test' -or
    $ExpectedNetBIOS -ne 'ADLAB' -or
    $ExpectedHostname -ne 'ADLAB-DC1'
) {
    throw '公開用に承認した架空 domain 以外では実行しません。'
}

$DcState = Get-CimInstance Win32_ComputerSystem
if (
    $env:COMPUTERNAME -cne $ExpectedHostname -or
    -not $DcState.PartOfDomain -or
    $DcState.DomainRole -notin 4, 5
) {
    throw 'promotion 後の承認済み domain controller 状態ではありません。'
}

$Domain = Get-ADDomain -ErrorAction Stop
if ($Domain.DNSRoot -ne $ExpectedDomain -or $Domain.NetBIOSName -ne $ExpectedNetBIOS) {
    throw "Expected $ExpectedDomain / $ExpectedNetBIOS; actual domain is not approved."
}

$LabOuDn = "OU=$LabOuName,$($Domain.DistinguishedName)"
if ($LabOuDn -notlike "OU=$LabOuName,*" -or $TestPrefix -ne 'pf-') {
    throw 'ラボ専用 OU または test 接頭辞が不正です。'
}

$ApprovedContext = [pscustomobject]@{
    ExpectedDomain = $ExpectedDomain
    ExpectedNetBIOS = $ExpectedNetBIOS
    ExpectedHostname = $ExpectedHostname
    DomainRoleAfter = $DcState.DomainRole
    LabOuDn = $LabOuDn
    TestPrefix = $TestPrefix
}
$ApprovedContext
```

この事前確認は DC 上の管理用 PowerShell で行います。`Get-ADDomain` のオブジェクト全体は
公開せず、上記の承認済み項目だけを出力します。

## 6. raw transcript と公開用コピー

raw transcript はリポジトリ外に保存します。DC promotion、promotion 後の DC 操作、client
再起動前、client 再起動後を別ファイルにします。`Read-Host -AsSecureString` または
`Get-Credential` を使い、平文 password を変数・引数・スクリプトへ書きません。

```powershell
$PrivateEvidenceRoot = Join-Path $env:USERPROFILE 'Documents\portfolio-evidence-private'
New-Item -ItemType Directory -Path $PrivateEvidenceRoot -Force | Out-Null
$RawTranscript = Join-Path $PrivateEvidenceRoot 'windows-ad-dc.raw.txt'
Start-Transcript -LiteralPath $RawTranscript -NoClobber -IncludeInvocationHeader
$ApprovedContext
```

各採録 phase の終了時に transcript を閉じます。全確認の終了後、raw を複製してから公開用
コピーだけをマスクし、終了条件に従って SHA-256 を記録します。promotion transcript も
同じ公開境界で扱います。

| 項目 | 記録 |
| --- | --- |
| raw の Git 管理外確認 | `NOT RUN` |
| 公開用コピー群の相対 path | `NOT RUN` |
| 公開用コピー群の SHA-256 | `NOT RUN` |
| マスク実施者 / 実施時刻 | `NOT RUN` |
| 再確認者または独立した再確認時刻 | `NOT RUN` |
| 公開可否 | `NOT RUN` |

## 7. AD DS / DNS とラボ専用 object の確認

### 7.1 Role と service

```powershell
Get-WindowsFeature AD-Domain-Services, DNS |
    Select-Object Name, InstallState
Get-Service NTDS, DNS |
    Select-Object Name, Status, StartType
Get-ADForest |
    Select-Object Name, RootDomain, ForestMode
```

期待値は両 role の `InstallState=Installed`、両 service の `Status=Running`、forest / root
domain が `ad.example.test` です。

### 7.2 OU / group / test user の安全な作成

次の例は fail-closed 事前確認後、ラボ専用 OU 内だけで実行します。password は transcript に
平文で残らない secure prompt から受け取ります。

> ここで作る単一 OU・単一グループ・単一ユーザーを、目的別の OU 階層・AGDLP グループ戦略・GPO・
> パスワードポリシー（既定 + 細分化）・FSMO 確認・システム状態バックアップ／権威復元まで発展させる
> 設計は [08 AD構築演習設計](../../learning-plan/08-ad-exercise-design.md) にまとめています。
> 本テンプレートの §7〜§9 が作った状態を、そのまま同書の前提条件として使います。

```powershell
$ExistingOu = Get-ADOrganizationalUnit -Identity $LabOuDn -ErrorAction SilentlyContinue
if (-not $ExistingOu) {
    New-ADOrganizationalUnit -Name $LabOuName `
        -Path $Domain.DistinguishedName `
        -ProtectedFromAccidentalDeletion $true
}

$GroupName = "${TestPrefix}ops-readers"
$UserId = "${TestPrefix}user01"

$Group = Get-ADGroup -Filter "SamAccountName -eq '$GroupName'" `
    -SearchBase $LabOuDn -ErrorAction SilentlyContinue
if (-not $Group) {
    New-ADGroup -Name $GroupName -SamAccountName $GroupName `
        -GroupScope Global -GroupCategory Security -Path $LabOuDn
    $Group = Get-ADGroup -Filter "SamAccountName -eq '$GroupName'" `
        -SearchBase $LabOuDn
}

$User = Get-ADUser -Filter "SamAccountName -eq '$UserId'" `
    -SearchBase $LabOuDn -ErrorAction SilentlyContinue
if (-not $User) {
    $InitialPassword = Read-Host '一時 password を入力' -AsSecureString
    try {
        New-ADUser -Name $UserId -SamAccountName $UserId `
            -UserPrincipalName "$UserId@$ExpectedDomain" `
            -Path $LabOuDn -AccountPassword $InitialPassword `
            -Enabled $true -ChangePasswordAtLogon $true
    } finally {
        Remove-Variable InitialPassword -ErrorAction SilentlyContinue
    }
    $User = Get-ADUser -Filter "SamAccountName -eq '$UserId'" `
        -SearchBase $LabOuDn
}

$AlreadyMember = Get-ADGroupMember -Identity $Group.DistinguishedName |
    Where-Object { $_.DistinguishedName -eq $User.DistinguishedName }
if (-not $AlreadyMember) {
    Add-ADGroupMember -Identity $Group.DistinguishedName `
        -Members $User.DistinguishedName
}
```

作成後はラボ OU と接頭辞の両方で範囲を限定して確認します。

```powershell
Get-ADOrganizationalUnit -Identity $LabOuDn |
    Select-Object Name, DistinguishedName
Get-ADGroup -SearchBase $LabOuDn -Filter "SamAccountName -like '$TestPrefix*'" |
    Select-Object Name, SamAccountName, GroupScope
Get-ADUser -SearchBase $LabOuDn -Filter "SamAccountName -like '$TestPrefix*'" `
    -Properties Enabled, LastLogonDate, whenCreated |
    Select-Object SamAccountName, Enabled, LastLogonDate, whenCreated
Get-ADGroupMember -Identity $GroupName |
    Select-Object SamAccountName, ObjectClass
```

## 8. 90 日未ログイン棚卸し

本番想定の 90 日条件と、短縮時間を使うラボ内機能試験を分けます。`lastLogonTimestamp` 等の
system 管理属性を改変して「90 日経過」を捏造しません。

### 8.1 本番想定条件の実行

```powershell
$ReferenceTime = Get-Date
$Cutoff90Days = $ReferenceTime.AddDays(-90)

$Inventory90Days = Get-ADUser -SearchBase $LabOuDn `
    -Filter "SamAccountName -like '$TestPrefix*'" `
    -Properties Enabled, LastLogonDate, whenCreated |
    Where-Object {
        $_.Enabled -and (
            ($_.LastLogonDate -and $_.LastLogonDate -lt $Cutoff90Days) -or
            (-not $_.LastLogonDate -and $_.whenCreated -lt $Cutoff90Days)
        )
    } |
    Select-Object SamAccountName, Enabled, LastLogonDate, whenCreated

[pscustomobject]@{
    ReferenceTime = $ReferenceTime
    Cutoff = $Cutoff90Days
    SearchBase = $LabOuDn
    ExpectedCount = 'RECORD_BEFORE_RUN'
    ActualCount = @($Inventory90Days).Count
}
$Inventory90Days
```

0 件でも、条件・基準日時・検索範囲・期待件数を説明できれば「90 日 query 実行」は判定
できます。ただし、自然に 90 日経過した対象を検出していない場合は「90 日経過 user の
positive detection」を `NOT RUN` のまま残します。

`LastLogonDate` はリアルタイムの監査ログではないため、これは無効化候補の抽出にだけ使い、
自動無効化には直結させません。境界付近の対象は利用者・管理者への確認や別ログで再確認します。

### 8.2 ラボ内の短縮時間による機能試験

新規 test user の作成時刻と、検査対象・対象外の control user を記録し、例えば 5 分の
短縮基準で抽出ロジックだけを確認します。この結果を「90 日経過実績」へ読み替えません。

| 項目 | 記録 |
| --- | --- |
| 基準日時 / 90 日 cutoff | `NOT RUN` |
| 検索 OU / 接頭辞 | `NOT RUN` |
| test dataset（有効・無効・未ログイン） | `NOT RUN` |
| 期待対象 / 期待件数 | `NOT RUN` |
| 実対象 / 実件数 | `NOT RUN` |
| 90 日 query 実行 | `NOT RUN` |
| 短縮時間による機能試験 | `NOT RUN` |
| 自然に 90 日経過した user の positive detection | `NOT RUN` |

DC 上で必要な確認が終わったら、client の作業へ移る前に transcript を閉じます。

```powershell
Stop-Transcript
```

## 9. DNS 障害注入から domain 参加復旧まで

この手順は隔離した client VM だけで実行します。開始時は workgroup 状態で、client の DNS が
ラボ DC を向き、SRV 解決と DC 探索に成功する正常状態であることを確認します。

### 9.1 正常値と checkpoint

```powershell
$ExpectedDomain = 'ad.example.test'
$LabDcIp = 'REPLACE_WITH_LAB_DC_PRIVATE_IP'
$ClientInterface = 'REPLACE_WITH_CLIENT_INTERFACE_ALIAS'
$BadDnsIp = 'REPLACE_WITH_UNUSED_ISOLATED_IP'

if (
    $ExpectedDomain -ne 'ad.example.test' -or
    $LabDcIp -like 'REPLACE_*' -or
    $ClientInterface -like 'REPLACE_*' -or
    $BadDnsIp -like 'REPLACE_*' -or
    $BadDnsIp -eq $LabDcIp
) {
    throw 'ラボ専用値が未設定です。'
}

$ClientState = Get-CimInstance Win32_ComputerSystem
if ($ClientState.PartOfDomain) {
    throw 'この手順は domain 参加前の使い捨て client だけで実行します。'
}

$OriginalDns = @(
    (
        Get-DnsClientServerAddress -InterfaceAlias $ClientInterface `
            -AddressFamily IPv4
    ).ServerAddresses
)
if ($OriginalDns.Count -ne 1 -or $OriginalDns[0] -ne $LabDcIp) {
    throw '開始時 DNS がラボ DC だけを向いていないため停止します。'
}

$OriginalDns
Resolve-DnsName -Type SRV "_ldap._tcp.dc._msdcs.$ExpectedDomain"
nltest /dsgetdc:$ExpectedDomain /force
if ($LASTEXITCODE -ne 0) { throw '正常時の DC 探索に失敗しました。' }

$PrivateEvidenceRoot = Join-Path $env:USERPROFILE 'Documents\portfolio-evidence-private'
New-Item -ItemType Directory -Path $PrivateEvidenceRoot -Force | Out-Null
$ClientTranscript = Join-Path $PrivateEvidenceRoot 'windows-ad-client-pre-reboot.raw.txt'
Start-Transcript -LiteralPath $ClientTranscript -NoClobber -IncludeInvocationHeader

[pscustomobject]@{
    ExpectedDomain = $ExpectedDomain
    ClientInterface = $ClientInterface
    OriginalDns = ($OriginalDns -join ',')
    PartOfDomainBefore = $ClientState.PartOfDomain
}
Resolve-DnsName -Type SRV "_ldap._tcp.dc._msdcs.$ExpectedDomain"
nltest /dsgetdc:$ExpectedDomain /force
```

この出力と client checkpoint 名を保存してから障害を注入します。

### 9.2 誤 DNS の症状採録から正常 DNS への復元

`REPLACE_WITH_UNUSED_ISOLATED_IP` には、隔離 network 内で未使用と確認した IP だけを設定します。

`finally` で、途中の検証や domain 参加に失敗した場合も DNS と transcript を必ず終了時の
安全な状態へ戻します。

```powershell
try {
    Set-DnsClientServerAddress -InterfaceAlias $ClientInterface `
        -ServerAddresses $BadDnsIp
    Clear-DnsClientCache

    Resolve-DnsName -Type SRV "_ldap._tcp.dc._msdcs.$ExpectedDomain" `
        -ErrorAction Continue
    nltest /dsgetdc:$ExpectedDomain /force
    $FaultNltestExitCode = $LASTEXITCODE
    $FaultNltestExitCode
    if ($FaultNltestExitCode -eq 0) {
        throw '障害注入後も DC 探索が成功したため、想定外として停止します。'
    }

    Set-DnsClientServerAddress -InterfaceAlias $ClientInterface `
        -ServerAddresses $OriginalDns
    Clear-DnsClientCache

    Resolve-DnsName -Type SRV "_ldap._tcp.dc._msdcs.$ExpectedDomain"
    nltest /dsgetdc:$ExpectedDomain /force
    if ($LASTEXITCODE -ne 0) { throw 'DNS 復元後の DC 探索に失敗しました。' }

    $JoinCredential = Get-Credential -Message 'ラボ専用の domain join credential'
    try {
        Add-Computer -DomainName $ExpectedDomain -Credential $JoinCredential `
            -ErrorAction Stop
    } finally {
        Remove-Variable JoinCredential -ErrorAction SilentlyContinue
    }
} finally {
    try {
        Set-DnsClientServerAddress -InterfaceAlias $ClientInterface `
            -ServerAddresses $OriginalDns
        Clear-DnsClientCache
        Get-DnsClientServerAddress -InterfaceAlias $ClientInterface `
            -AddressFamily IPv4
    } finally {
        try { Stop-Transcript } catch { Write-Warning 'transcript は開始されていません。' }
    }
}

Restart-Computer
```

### 9.3 再起動後の確認

ラボ専用 domain test user でサインインし、次を採録します。

```powershell
$PrivateEvidenceRoot = Join-Path $env:USERPROFILE 'Documents\portfolio-evidence-private'
$PostRebootTranscript = Join-Path $PrivateEvidenceRoot 'windows-ad-lab-post-reboot.raw.txt'
Start-Transcript -LiteralPath $PostRebootTranscript -NoClobber -IncludeInvocationHeader
try {
    Get-CimInstance Win32_ComputerSystem |
        Select-Object Domain, PartOfDomain
    Test-ComputerSecureChannel -Verbose
    whoami
    whoami /upn
    nltest /dsgetdc:ad.example.test /force
    w32tm /query /status
} finally {
    Stop-Transcript
}
```

| 項目 | 記録 |
| --- | --- |
| client checkpoint / 正常時 DNS | `NOT RUN` |
| 正常時 SRV 解決 / DC 探索 | `NOT RUN` |
| 誤 DNS 設定時刻 / 使用した隔離 IP | `NOT RUN` |
| 発生した症状 / error / exit code | `NOT RUN` |
| 正常 DNS への復元時刻 | `NOT RUN` |
| 復元後 SRV 解決 / DC 探索 | `NOT RUN` |
| domain 参加 / 再起動 | `NOT RUN` |
| secure channel / domain user サインイン | `NOT RUN` |
| 時刻同期 | `NOT RUN` |
| 学び / 再発防止 | `NOT RUN` |

## 10. 構築・操作結果

| ID | 確認内容 | 期待値 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| AD-00 | Greenfield forest promotion | 固定domain、role導入、明示再起動、promotion後確認 | `NOT RUN` | — |
| AD-01 | AD DS / DNS role と service | role=Installed、service=Running | `NOT RUN` | — |
| AD-02 | 専用 OU / group 作成 | 承認済み階層・名前と一致 | `NOT RUN` | — |
| AD-03 | test user 作成・group 追加 | scoped query / membership が一致 | `NOT RUN` | — |
| AD-04 | 90 日棚卸し query | 基準日時・範囲・期待値・実値を説明可能 | `NOT RUN` | — |
| AD-05 | client DNS 正常値 | DNS server がラボ DC のみを向く | `NOT RUN` | — |
| AD-06 | DNS 障害注入 | SRV 解決 / DC 探索が想定どおり失敗 | `NOT RUN` | — |
| AD-07 | DNS 復元 | SRV 解決 / DC 探索が復旧 | `NOT RUN` | — |
| AD-08 | domain 参加 / 再起動 | `PartOfDomain=True` | `NOT RUN` | — |
| AD-09 | secure channel / user sign-in | secure channel と UPN を確認 | `NOT RUN` | — |
| AD-10 | 公開用証跡 | マスク、SHA-256、再確認を完了 | `NOT RUN` | — |

## 11. 終了・cleanup 条件

DC promotion / promotion 後の DC 操作 / client pre-reboot / client post-reboot の raw から
公開用コピーを作成し、マスクと再確認を完了した後に、公開する全ファイルの SHA-256 を
採録します。

```powershell
Get-FileHash -Algorithm SHA256 `
    'REPLACE_WITH_PUBLIC_PROMOTION_COPY_PATH', `
    'REPLACE_WITH_PUBLIC_DC_COPY_PATH', `
    'REPLACE_WITH_PUBLIC_CLIENT_PRE_REBOOT_COPY_PATH', `
    'REPLACE_WITH_PUBLIC_CLIENT_POST_REBOOT_COPY_PATH'
```

- [ ] AD-00〜10を実出力で判定した
- [ ] OU、group、test user の作成と棚卸しを同じラボで再現した
- [ ] 誤 DNS の症状、原因、正常値への復元、domain 参加、再起動後確認を説明できる
- [ ] client DNS が開始時の正常値へ戻っている
- [ ] 外部 port forwarding / bridge が無効である
- [ ] raw transcript、credential、個人・研修先情報を公開物から除いた
- [ ] 公開用コピーの SHA-256 と再確認結果を記録した
- [ ] `FAIL / BLOCKED / NOT RUN` を隠していない
- [ ] ラボを残す場合は停止状態と保管期限、破棄する場合は破棄時刻を記録した

一つでも未確認なら全体状態を `PASS` にしません。90 日棚卸し query が実行済みでも、自然に
90 日経過した user を検出していなければ、その positive detection は `NOT RUN` と明記します。
