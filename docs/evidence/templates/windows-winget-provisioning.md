# Windows / winget 端末セットアップ 記録テンプレート

このファイルを `docs/evidence/YYYY-MM-DD-windows-winget-provisioning.md` へコピーし、
使い捨て Windows test VM で実行します。AD / DNS ラボとは別の補助証跡です。計画や
コマンド例を実績として扱わず、全結果の初期値は `NOT RUN` とします。

## 1. 実施情報

| 項目 | 記録 |
| --- | --- |
| 全体状態 | `NOT RUN` |
| 実施日時・終了日時（JST） | `NOT RUN` |
| 対象リポジトリ commit SHA | `NOT RUN` |
| Windows edition / build | `NOT RUN` |
| PowerShell / winget version | `NOT RUN` |
| 仮想化製品 / version | `NOT RUN` |
| network 構成 | `NOT RUN` |
| 実行前 checkpoint | `NOT RUN` |
| package manifest / script | `NOT RUN` |
| raw transcript の非公開保存先 | `NOT RUN` |
| 公開用 transcript / screenshot | `NOT RUN` |

## 2. 安全条件

- [ ] 所有または明示的に検証許可された使い捨て test VM だけを対象にした
- [ ] 業務端末、研修端末、日常利用中の端末を対象にしていない
- [ ] checkpoint と実行前 package 一覧を保存した
- [ ] package ID、配布元、license、再起動要否を事前確認した
- [ ] test 用の無償 package だけを選び、購入・subscription 契約を発生させない
- [ ] `--exact` と明示した source を使い、同名 package の取り違えを防いだ
- [ ] `--no-upgrade` を使い、実行前から存在する package を変更対象にしない
- [ ] credential、Windows license key、ユーザー名、machine GUID、MAC address、ホスト側の
  path を公開版から除いた
- [ ] raw transcript、未加工画像、VM export を Git 管理外へ置いた

## 3. 事前確認と package 選定

実際に使う ID を記録してから `$PackageIds` を置換します。`REPLACE_` が残る場合は停止します。

```powershell
$ErrorActionPreference = 'Stop'
$PackageIds = @(
    'REPLACE_WITH_APPROVED_PACKAGE_ID'
)

if (-not $PackageIds -or @($PackageIds | Where-Object { $_ -like 'REPLACE_*' }).Count) {
    throw '承認済み package ID が未設定です。'
}

winget --version
winget source list
foreach ($PackageId in $PackageIds) {
    winget show --id $PackageId --exact --source winget
    if ($LASTEXITCODE -ne 0) {
        throw "package 確認失敗: $PackageId / exit=$LASTEXITCODE"
    }
}
```

| package ID | version / source | license 確認 | 再起動要否 | 承認 |
| --- | --- | --- | --- | --- |
| `NOT RUN` | `NOT RUN` | `NOT RUN` | `NOT RUN` | `NOT RUN` |

## 4. transcript と実行前 baseline

raw transcript はリポジトリ外へ保存します。

```powershell
$PrivateEvidenceRoot = Join-Path $env:USERPROFILE 'Documents\portfolio-evidence-private'
New-Item -ItemType Directory -Path $PrivateEvidenceRoot -Force | Out-Null
$RawTranscript = Join-Path $PrivateEvidenceRoot 'windows-winget.raw.txt'
Start-Transcript -LiteralPath $RawTranscript -NoClobber -IncludeInvocationHeader

$NoApplicationsFoundExitCode = -1978335212 # 0x8A150014
$BaselineResults = foreach ($PackageId in $PackageIds) {
    winget list --id $PackageId --exact --source winget
    $BaselineExitCode = $LASTEXITCODE
    [pscustomobject]@{
        Phase = 'before'
        PackageId = $PackageId
        ExitCode = $BaselineExitCode
        WasInstalled = ($BaselineExitCode -eq 0)
        IsConfirmedAbsent = ($BaselineExitCode -eq $NoApplicationsFoundExitCode)
    }
}
$BaselineResults | Format-Table -AutoSize
if (
    @(
        $BaselineResults |
            Where-Object { -not $_.WasInstalled -and -not $_.IsConfirmedAbsent }
    ).Count
) {
    Stop-Transcript
    throw '未導入と判定できない baseline error があるため、変更前に停止しました。'
}
```

`winget list` の「未導入」を、コマンド失敗や検証失敗と混同しません。実行前状態と exit code を
package ごとに記録します。未導入として扱うのは `0x8A150014`（該当 package なし）だけで、
それ以外の非 0 は transcript を閉じて変更前に停止します。

## 5. Install と検証

```powershell
$InstallResults = foreach ($PackageId in $PackageIds) {
    $Baseline = $BaselineResults |
        Where-Object { $_.PackageId -eq $PackageId }
    if ($Baseline.WasInstalled) {
        [pscustomobject]@{
            PackageId = $PackageId
            Action = 'skipped-preexisting'
            ExitCode = $null
            CheckedAt = Get-Date -Format o
        }
        continue
    }

    winget install --id $PackageId --exact --source winget --silent `
        --accept-source-agreements --accept-package-agreements `
        --disable-interactivity --no-upgrade
    $InstallExitCode = $LASTEXITCODE

    [pscustomobject]@{
        PackageId = $PackageId
        Action = 'attempted-install'
        ExitCode = $InstallExitCode
        CheckedAt = Get-Date -Format o
    }
}

$InstallResults | Format-Table -AutoSize
if (
    @(
        $InstallResults |
            Where-Object { $_.Action -eq 'attempted-install' -and $_.ExitCode -ne 0 }
    ).Count
) {
    Write-Warning '一つ以上の package install が非 0 で終了しました。FAIL 候補として記録します。'
}

$PostInstallResults = foreach ($PackageId in $PackageIds) {
    winget list --id $PackageId --exact --source winget
    $VerifyExitCode = $LASTEXITCODE
    [pscustomobject]@{
        Phase = 'after-first-install'
        PackageId = $PackageId
        ExitCode = $VerifyExitCode
        IsInstalled = ($VerifyExitCode -eq 0)
        CheckedAt = Get-Date -Format o
    }
}
$PostInstallResults | Format-Table -AutoSize
if (@($PostInstallResults | Where-Object { -not $_.IsInstalled }).Count) {
    Write-Warning '導入後に確認できない package があります。FAIL 候補として記録します。'
}
```

## 6. 再実行と rollback

同じ install を 2 回目に実行し、既に導入済みとして安全に終了するかを確認します。2 回目の
出力、install exit code、直後の `winget list` exit code を package ごとに記録します。winget
version や package により「既に導入済み」の終了内容が異なり得るため、install exit code だけで
自動的に `PASS` とせず、出力、version、重複がないことを合わせて判定します。

```powershell
$SecondRunPackageIds = @(
    $PostInstallResults |
        Where-Object IsInstalled |
        ForEach-Object PackageId
)

$SecondRunResults = foreach ($PackageId in $SecondRunPackageIds) {
    winget install --id $PackageId --exact --source winget --silent `
        --accept-source-agreements --accept-package-agreements `
        --disable-interactivity --no-upgrade
    $SecondInstallExitCode = $LASTEXITCODE

    winget list --id $PackageId --exact --source winget
    $SecondVerifyExitCode = $LASTEXITCODE

    [pscustomobject]@{
        Phase = 'second-install'
        PackageId = $PackageId
        InstallExitCode = $SecondInstallExitCode
        VerifyExitCode = $SecondVerifyExitCode
        StillInstalled = ($SecondVerifyExitCode -eq 0)
        CheckedAt = Get-Date -Format o
    }
}

$SecondRunResults | Format-Table -AutoSize
if ($SecondRunPackageIds.Count -ne $PackageIds.Count) {
    Write-Warning '初回導入後に確認できなかった package は2回目実行の対象外です。'
}
if (@($SecondRunResults | Where-Object { -not $_.StillInstalled }).Count) {
    Write-Warning '2回目実行後に確認できない package があります。FAIL 候補として記録します。'
}
```

rollback は使い捨て VM だけで実施します。実行前から存在した package は uninstall せず、
今回新規導入した ID だけを対象にします。uninstall 後も依存 package や設定が残る可能性が
あるため、公開用証跡を VM 外へ退避した後、checkpoint 復元を最終的な rollback とします。

```powershell
$NewlyInstalledIds = @(
    foreach ($PostInstall in $PostInstallResults) {
        $Baseline = $BaselineResults |
            Where-Object { $_.PackageId -eq $PostInstall.PackageId }
        if ($PostInstall.IsInstalled -and $Baseline.IsConfirmedAbsent) {
            $PostInstall.PackageId
        }
    }
)

foreach ($PackageId in $NewlyInstalledIds) {
    winget uninstall --id $PackageId --exact --source winget --silent `
        --disable-interactivity
    [pscustomobject]@{
        Phase = 'rollback'
        PackageId = $PackageId
        ExitCode = $LASTEXITCODE
        CheckedAt = Get-Date -Format o
    }
}
```

uninstall の出力を保存した後に transcript と公開用コピーを VM 外へ退避し、checkpoint を
復元します。復元後に実行前 package 一覧と一致するか再確認します。

## 7. 結果

| ID | 確認内容 | 期待値 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| WIN-01 | OS / winget / source | version と source を特定 | `NOT RUN` | — |
| WIN-02 | 実行前 baseline | package ごとの導入前状態を記録 | `NOT RUN` | — |
| WIN-03 | 一括 install | 未導入 ID の出力・exit code、既存 ID のskipを記録 | `NOT RUN` | — |
| WIN-04 | 導入後確認 | package ID / version が一致 | `NOT RUN` | — |
| WIN-05 | 2 回目実行 | 出力・2種のexit code・version・重複なしを説明可能 | `NOT RUN` | — |
| WIN-06 | rollback | 新規分だけ uninstall 後、checkpoint 復元を確認 | `NOT RUN` | — |
| WIN-07 | 公開用証跡 | マスク、SHA-256、再確認を完了 | `NOT RUN` | — |

## 8. 公開用コピーと終了条件

```powershell
Stop-Transcript
Get-FileHash -Algorithm SHA256 'REPLACE_WITH_PUBLIC_COPY_PATH'
```

| 項目 | 記録 |
| --- | --- |
| 公開用コピーの相対 path | `NOT RUN` |
| 公開用コピー SHA-256 | `NOT RUN` |
| マスク実施者 / 実施時刻 | `NOT RUN` |
| 再確認者または独立した再確認時刻 | `NOT RUN` |
| VM rollback / 破棄時刻 | `NOT RUN` |

- [ ] WIN-01〜07を実出力で判定した
- [ ] package ごとの source、version、exit code、失敗を記録した
- [ ] 2 回目実行と rollback を確認した
- [ ] raw transcript と秘密・個人情報を公開物から除いた
- [ ] `FAIL / BLOCKED / NOT RUN` を隠していない

一つでも未確認なら全体状態を `PASS` にしません。
