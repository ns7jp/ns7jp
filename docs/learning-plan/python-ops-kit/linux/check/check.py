#!/usr/bin/env python3
"""check.py: Linux/Windows 共通の正常性チェック（Nagios/Icinga 互換の終了コード）

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.5 章の中核コード例
をそのまま配置用に切り出したもの。OS 非依存の単一ファイルであり、Linux/Windows どちらの
kit ディレクトリにも同じ内容を配置している。ロジック自体はこの AI 支援セッションの
作業環境で実行して確認済み（07 章の付録参照）。実配置は lab-base01 / LAB-WINOPS1 実機では
まだ未確認。
"""
import argparse
import json
import socket
import ssl
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import psutil
import yaml

OK, WARNING, CRITICAL, UNKNOWN = 0, 1, 2, 3
STATUS_NAME = {OK: "OK", WARNING: "WARNING", CRITICAL: "CRITICAL", UNKNOWN: "UNKNOWN"}
# 集約の優先順位。生の終了コードで max() を取ると UNKNOWN(3) が CRITICAL(2) より
# 「悪い」扱いになってしまうため、明示的な優先順位テーブルを用意する。
AGGREGATE_PRIORITY = {CRITICAL: 3, WARNING: 2, UNKNOWN: 1, OK: 0}


@dataclass
class CheckResult:
    name: str
    status: int
    message: str
    value: float | None = None


def check_cpu(warn_pct: float, crit_pct: float) -> CheckResult:
    pct = psutil.cpu_percent(interval=1.0)
    status = CRITICAL if pct >= crit_pct else WARNING if pct >= warn_pct else OK
    return CheckResult("cpu", status, f"CPU使用率 {pct:.1f}%", pct)


def check_memory(warn_pct: float, crit_pct: float) -> CheckResult:
    pct = psutil.virtual_memory().percent
    status = CRITICAL if pct >= crit_pct else WARNING if pct >= warn_pct else OK
    return CheckResult("memory", status, f"メモリ使用率 {pct:.1f}%", pct)


def check_disk(path: str, warn_pct: float, crit_pct: float) -> CheckResult:
    try:
        pct = psutil.disk_usage(path).percent
    except OSError as exc:
        return CheckResult("disk", UNKNOWN, f"{path} の使用率取得に失敗: {exc}")
    status = CRITICAL if pct >= crit_pct else WARNING if pct >= warn_pct else OK
    return CheckResult("disk", status, f"{path} 使用率 {pct:.1f}%", pct)


def check_http(url: str, timeout: float, expected_status: int = 200) -> CheckResult:
    try:
        start = time.monotonic()
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            elapsed = time.monotonic() - start
            code = resp.status
    except urllib.error.HTTPError as exc:
        return CheckResult("http", CRITICAL, f"{url} が HTTP {exc.code} を返した")
    except (urllib.error.URLError, socket.timeout) as exc:
        return CheckResult("http", CRITICAL, f"{url} に到達できない: {exc}")
    if code != expected_status:
        return CheckResult("http", CRITICAL, f"{url} が想定外のステータス {code}")
    return CheckResult("http", OK, f"{url} は {elapsed:.2f}s で HTTP {code}", elapsed)


def check_tls_cert(hostname: str, port: int, warn_days: int, crit_days: int, timeout: float = 5.0) -> CheckResult:
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
    except ssl.SSLCertVerificationError as exc:
        return CheckResult("tls_cert", CRITICAL, f"{hostname} の証明書検証に失敗: {exc.verify_message}")
    except OSError as exc:
        return CheckResult("tls_cert", CRITICAL, f"{hostname}:{port} へ接続できない: {exc}")
    not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
    remaining_days = (not_after - datetime.now(timezone.utc)).days
    status = CRITICAL if remaining_days < crit_days else WARNING if remaining_days < warn_days else OK
    return CheckResult("tls_cert", status, f"{hostname} の証明書残日数 {remaining_days}日", remaining_days)


def check_log_errors(log_path: str, window_minutes: int, pattern: str, warn_count: int, crit_count: int) -> CheckResult:
    path = Path(log_path)
    if not path.is_file():
        return CheckResult("log_errors", UNKNOWN, f"ログファイルが存在しない: {log_path}")
    if path.stat().st_mtime < time.time() - window_minutes * 60:
        return CheckResult("log_errors", OK, f"直近{window_minutes}分の更新なし", 0)
    with path.open(encoding="utf-8", errors="replace") as f:
        count = sum(1 for line in f if pattern in line)
    status = CRITICAL if count >= crit_count else WARNING if count >= warn_count else OK
    return CheckResult("log_errors", status, f"直近ログの一致件数 {count}", count)


def run_checks(cfg: dict) -> list[CheckResult]:
    th = cfg["thresholds"]
    return [
        check_cpu(th["cpu"]["warn"], th["cpu"]["crit"]),
        check_memory(th["memory"]["warn"], th["memory"]["crit"]),
        check_disk(cfg["disk_path"], th["disk"]["warn"], th["disk"]["crit"]),
        check_http(cfg["http_url"], cfg.get("http_timeout", 5)),
        check_tls_cert(cfg["tls_host"], cfg.get("tls_port", 443), th["tls_days"]["warn"], th["tls_days"]["crit"]),
        check_log_errors(cfg["log_path"], cfg.get("log_window_minutes", 15), cfg.get("log_pattern", "ERROR"),
                          th["log_errors"]["warn"], th["log_errors"]["crit"]),
    ]


def aggregate(results: list[CheckResult]) -> int:
    return max(results, key=lambda r: AGGREGATE_PRIORITY[r.status]).status


def write_status_json(path: str, results: list[CheckResult], overall: int) -> None:
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overall_status": STATUS_NAME[overall],
        "checks": [{"name": r.name, "status": STATUS_NAME[r.status], "message": r.message, "value": r.value} for r in results],
    }
    Path(path).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def post_webhook(url: str, results: list[CheckResult], overall: int, timeout: float = 5.0) -> None:
    # 実際の Slack 配信ではなく、ローカルの受信エンドポイントへ通知設計を練習するための POST
    body = json.dumps({
        "overall_status": STATUS_NAME[overall],
        "failed_checks": [r.name for r in results if r.status != OK],
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout):
            pass
    except (urllib.error.URLError, socket.timeout):
        pass  # 通知先の障害でチェック自体の終了コードは変えない


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Linux/Windows 共通の正常性チェック")
    parser.add_argument("--config", required=True)
    parser.add_argument("--status-file", required=True)
    return parser.parse_args()


def main() -> int:
    try:
        args = parse_args()
        with open(args.config, encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
        results = run_checks(cfg)
        overall = aggregate(results)
        write_status_json(args.status_file, results, overall)
        if cfg.get("webhook_url"):
            post_webhook(cfg["webhook_url"], results, overall)
    except Exception as exc:  # 想定外の内部エラーも fail-closed で UNKNOWN にする
        print(f"内部エラーのため UNKNOWN として終了: {exc}", file=sys.stderr)
        return UNKNOWN
    for r in results:
        print(f"{STATUS_NAME[r.status]} {r.name}: {r.message}")
    return overall


if __name__ == "__main__":
    sys.exit(main())
