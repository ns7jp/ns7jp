<#
.SYNOPSIS
    check.py をタスクスケジューラに登録する（MonitoringCheckPy、5 分毎）。

.DESCRIPTION
    [07 Python 運用自動化演習設計 4.5 章 構築手順書 W-6] のコマンドそのもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#45-checkpylinux--windows-共通

    実行前に W-1〜W-5（配置ディレクトリ作成・venv 作成・依存導入・ファイル配置・単体実行確認）を
    終えていること。管理者権限の PowerShell で実行する。

    /tr の引用符の扱いに注意（同章 W-6 直後の補足）: Windows のコマンドライン解析が区切りとして
    認識するのは二重引用符のみのため、この行は外側を PowerShell のリテラル文字列（単一引用符）にし、
    内側に二重引用符をエスケープなしでそのまま埋め込んでいる。

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。
#>

schtasks /create /tn "MonitoringCheckPy" /tr '"C:\ProgramData\monitoring\check\venv\Scripts\python.exe" "C:\ProgramData\monitoring\check\check.py" --config "C:\ProgramData\monitoring\check\check.yaml" --status-file "C:\ProgramData\monitoring\check-status.json"' /sc minute /mo 5 /ru SYSTEM /rl LIMITED /f

Write-Host ''
Write-Host '確認 (W-7): schtasks /query /tn "MonitoringCheckPy" /v /fo LIST'
Write-Host '手動実行確認 (W-8): schtasks /run /tn "MonitoringCheckPy"'
