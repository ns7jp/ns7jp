"""routine_windows.py -- Windows定型作業自動化の中核処理

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.3 章の中核コード例。
load_config() / check_disk_usage() は routine_common.py に切り出し、ここから import する
（同章の記述どおり）。この AI 支援セッションには Windows 実行環境が無いため、このファイルは
一度も実行していない。PowerShell 呼び出し部分（get_recent_error_events）は特に構文レベルの
確認のみ。
"""
from __future__ import annotations

import argparse
import datetime
import json
import logging
import os
import subprocess
import sys
import time
from pathlib import Path

import psutil

from routine_common import load_config, check_disk_usage

LOG = logging.getLogger("routine_windows")


def check_services(service_names: list[str]) -> list[dict]:
    # Windows専用: psutil.win_service_iter()はWindowsのみ提供される拡張API
    current = {svc.name(): svc.status() for svc in psutil.win_service_iter()}
    results = []
    for name in service_names:
        status = current.get(name, "not_found")
        results.append({"name": name, "status": status, "ok": status == "running"})
    return results


def get_recent_error_events(log_name: str, since_hours: int, max_events: int) -> list[dict]:
    # win32evtlogではなくGet-WinEventをsubprocess経由で呼ぶ（理由は4.3章2節参照）。
    # 「該当イベントなし」と「アクセス拒否」はどちらもGet-WinEvent内部では
    # 非終了エラーとして扱われるため、-ErrorAction SilentlyContinueで一律に
    # 握りつぶすとPython側から両者を区別できなくなる。そこでPowerShell側で
    # try/catchし、メッセージ内容で「該当なし」だけを空配列に変換し、
    # それ以外（アクセス拒否等）はexit 1で本物のエラーとして返す。
    start_time = (
        datetime.datetime.now() - datetime.timedelta(hours=since_hours)
    ).strftime("%Y-%m-%dT%H:%M:%S")
    filter_expr = f"@{{LogName='{log_name}'; Level=2; StartTime=[datetime]'{start_time}'}}"
    command = (
        "try { "
        f"Get-WinEvent -FilterHashtable {filter_expr} -MaxEvents {max_events} -ErrorAction Stop | "
        "Select-Object TimeCreated, Id, ProviderName, Message | ConvertTo-Json -Depth 3 "
        "} catch { "
        "if ($_.Exception.Message -like '*No events were found*') { Write-Output '[]' } "
        "else { [Console]::Error.WriteLine($_.Exception.Message); exit 1 } "
        "}"
    )
    proc = subprocess.run(
        ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"Get-WinEvent failed (exit={proc.returncode}): {proc.stderr.strip()}")
    raw = proc.stdout.strip()
    if not raw:
        return []
    parsed = json.loads(raw)
    records = parsed if isinstance(parsed, list) else [parsed]
    # Linux実装（journalctl由来）と共通の {"time", "message", ...} スキーマに正規化する
    return [
        {
            "time": rec.get("TimeCreated"),
            "id": rec.get("Id"),
            "provider": rec.get("ProviderName"),
            "message": rec.get("Message"),
        }
        for rec in records
    ]


def cleanup_temp_files(temp_dir: str, older_than_days: int) -> dict:
    cutoff = time.time() - older_than_days * 86400
    deleted, skipped = [], []
    # config.yml の temp_dir に "%TEMP%" のような環境変数表記を許容するため展開する
    # （pathlib.Path は環境変数を自動展開しないため、os.path.expandvars() を挟む）
    root = Path(os.path.expandvars(temp_dir))
    if not root.is_dir():
        raise FileNotFoundError(f"temp dir not found: {temp_dir}")
    for entry in root.iterdir():
        try:
            if not entry.is_file():
                continue
            if entry.stat().st_mtime >= cutoff:
                continue
            entry.unlink()
            deleted.append(str(entry))
        except PermissionError:
            skipped.append(str(entry))
        except OSError as exc:
            LOG.warning("failed to delete %s: %s", entry, exc)
            skipped.append(str(entry))
    return {"deleted": deleted, "skipped": skipped}


def run(config_path: str) -> int:
    config = load_config(config_path)
    disk = check_disk_usage(
        config["disk_paths"], config["disk_warn_percent"], config["disk_crit_percent"]
    )
    services = check_services(config["services"])
    try:
        events = get_recent_error_events(
            config["event_log_name"], config["event_since_hours"], config["event_max"]
        )
        events_ok = True
    except RuntimeError as exc:
        # イベントログ取得の失敗だけでルーチン全体を落とさない。
        # ディスク/サービス/一時ファイルの点検結果は継続して記録する。
        LOG.warning("event log check failed: %s", exc)
        events = []
        events_ok = False
    cleanup = cleanup_temp_files(config["temp_dir"], config["temp_older_than_days"])

    summary = {"disk": disk, "services": services, "events": events, "cleanup": cleanup}
    LOG.info(json.dumps(summary, ensure_ascii=False))

    has_critical = any(d["level"] == "critical" for d in disk)
    has_down_service = any(not s["ok"] for s in services)
    return 1 if (has_critical or has_down_service or not events_ok) else 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--log-file", help="ログの出力先ファイル（省略時は標準出力のみ）")
    args = parser.parse_args()
    # basicConfig()は既定でstream=sys.stderrになるため、明示的にstdoutへ出す。
    # タスクスケジューラはsystemd/journaldのようにプロセスの標準出力/標準エラーを
    # 自動保存しないため、スケジュール実行時はファイルにも書き出せるようにする。
    handlers = [logging.StreamHandler(sys.stdout)]
    if args.log_file:
        handlers.append(logging.FileHandler(args.log_file, encoding="utf-8"))
    logging.basicConfig(level=logging.INFO, format="%(message)s", handlers=handlers)
    sys.exit(run(args.config))


if __name__ == "__main__":
    main()
