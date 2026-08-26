<#
.SYNOPSIS
    routine_windows.py をタスクスケジューラに登録する（NS7JP_RoutineCheck、毎日 06:00）。

.DESCRIPTION
    [07 Python 運用自動化演習設計 4.3 章 構築手順書スタイルの表 W-8] のコマンドそのもの。
    https://github.com/ns7jp/ns7jp/blob/main/docs/learning-plan/07-python-ops-automation-exercise-design.md#43-routinepywindows-lab-winops1

    実行前に W-1〜W-7（配置ディレクトリ作成・venv 作成・依存導入・スクリプト配置・
    config.yml 作成・単体実行確認）を終えていること。管理者権限の PowerShell で実行する。

    これは "実施キット"（未実行の雛形）であり、このスクリプト自体を実行した時点では
    まだ演習の実施記録にはならない。実行した結果・日時・実行者は自分で記録すること。
#>

schtasks /Create /TN "NS7JP_RoutineCheck" `
    /TR "C:\ops\routine\venv\Scripts\python.exe C:\ops\routine\routine_windows.py --config C:\ops\routine\config.yml --log-file C:\ops\routine\logs\routine.log" `
    /SC DAILY /ST 06:00 /RU SYSTEM /RL HIGHEST /F

Write-Host ''
Write-Host '確認 (W-9): schtasks /Query /TN "NS7JP_RoutineCheck" /V /FO LIST'
Write-Host '即時実行試験 (W-10): schtasks /Run /TN "NS7JP_RoutineCheck"'
