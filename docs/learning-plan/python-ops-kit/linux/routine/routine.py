#!/usr/bin/env python3
"""routine.py -- lab-base01 (Ubuntu Server 24.04) 定型作業自動化。

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.2 章の
中核コード例をそのまま配置用に切り出したもの（journalctl --quiet の修正込み。
この修正はこの AI 支援セッションの作業環境での実行で発見・適用済み。同ドキュメントの
付録参照）。ロジック自体はその作業環境で実行して確認済みだが、このファイル配置と
lab-base01 実機での動作はまだ未確認。
"""
from __future__ import annotations

import argparse
import fcntl
import logging
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

LOG = logging.getLogger("routine")
LOCK_PATH = Path("/run/routine/routine.lock")


@dataclass(frozen=True)
class Config:
    disk_paths: list[str]
    disk_warn_percent: int
    services: list[str]
    cleanup_whitelist: list[str]
    cleanup_max_age_days: int


def load_config(path: Path) -> Config:
    # 欠落・構文エラーはここで例外を送出させ、そのまま異常終了させる（fail-closed）。
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return Config(
        disk_paths=data["disk_paths"],
        disk_warn_percent=int(data["disk_warn_percent"]),
        services=data["services"],
        cleanup_whitelist=data["cleanup_whitelist"],
        cleanup_max_age_days=int(data["cleanup_max_age_days"]),
    )


def check_disk_usage(paths: list[str], warn_percent: int) -> list[dict]:
    results = []
    for p in paths:
        usage = shutil.disk_usage(p)
        percent_used = round(usage.used / usage.total * 100, 1)
        warn = percent_used >= warn_percent
        if warn:
            LOG.warning("disk usage warning: %s at %.1f%%", p, percent_used)
        results.append({"path": p, "percent_used": percent_used, "warn": warn})
    return results


def check_services(names: list[str]) -> list[dict]:
    results = []
    for name in names:
        proc = subprocess.run(
            ["systemctl", "is-active", name],
            capture_output=True, text=True, timeout=10,
        )
        state = proc.stdout.strip()
        active = proc.returncode == 0 and state == "active"
        if not active:
            LOG.error("service not active: %s (state=%s)", name, state)
        results.append({"service": name, "state": state, "active": active})
    return results


def recent_errors(since: str = "-1h") -> list[str]:
    # --quiet を付けないと、該当なしのときに journalctl 自身が出す
    # "-- No entries --" という境界メッセージまで「エラー行」として拾ってしまう
    # （この作業環境での実行で発見。07 章の付録参照）。
    proc = subprocess.run(
        ["journalctl", "-p", "err", "--since", since, "--no-pager", "--quiet", "-o", "short-iso"],
        capture_output=True, text=True, timeout=30,
    )
    if proc.returncode != 0:
        LOG.error("journalctl failed: rc=%s stderr=%s", proc.returncode, proc.stderr.strip())
        return []
    return [line for line in proc.stdout.splitlines() if line.strip()]


def _is_whitelisted(target: Path, whitelist: list[str]) -> bool:
    resolved = target.resolve()
    for base in whitelist:
        try:
            resolved.relative_to(Path(base).resolve())
            return True
        except ValueError:
            continue
    return False


def find_stale_files(whitelist: list[str], max_age_days: int) -> list[Path]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    stale: list[Path] = []
    for base in whitelist:
        base_path = Path(base)
        if not base_path.is_dir():
            LOG.warning("cleanup target missing, skipped: %s", base_path)
            continue
        for entry in base_path.rglob("*"):
            if not entry.is_file():
                continue
            try:
                mtime = datetime.fromtimestamp(entry.stat().st_mtime, tz=timezone.utc)
            except OSError as exc:
                LOG.error("stat failed, skipped: %s (%s)", entry, exc)
                continue
            if mtime < cutoff:
                stale.append(entry)
    return stale


def cleanup(whitelist: list[str], max_age_days: int, apply: bool) -> list[Path]:
    """ドライラン（既定）と実削除（apply=True）の二段階。呼び出し側が明示的に切り替える。"""
    targets = find_stale_files(whitelist, max_age_days)
    for target in targets:
        if not _is_whitelisted(target, whitelist):
            LOG.error("refused to delete outside whitelist: %s", target)
            continue
        if not apply:
            LOG.info("[dry-run] would delete: %s", target)
            continue
        try:
            target.unlink()
            LOG.info("deleted: %s", target)
        except OSError as exc:
            LOG.error("delete failed, skipped: %s (%s)", target, exc)
    return targets


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="lab-base01 定型作業自動化")
    parser.add_argument("--config", type=Path, default=Path("/etc/routine/routine.yaml"))
    parser.add_argument("--apply", action="store_true", help="省略時はドライランのみ")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("/var/log/routine/routine.log"),
        ],
    )

    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    lock_file = open(LOCK_PATH, "w")
    try:
        fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        LOG.error("another instance is already running, exiting")
        return 1

    try:
        config = load_config(args.config)
        disk = check_disk_usage(config.disk_paths, config.disk_warn_percent)
        services = check_services(config.services)
        recent_errors()
        cleanup(config.cleanup_whitelist, config.cleanup_max_age_days, apply=args.apply)
    finally:
        fcntl.flock(lock_file, fcntl.LOCK_UN)
        lock_file.close()

    failed = any(not s["active"] for s in services) or any(d["warn"] for d in disk)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
