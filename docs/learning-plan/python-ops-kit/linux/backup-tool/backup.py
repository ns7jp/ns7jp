#!/usr/bin/env python3
"""backup.py -- backup_common.py の run_backup/run_restore を呼び出す CLI エントリポイント。

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.4 章の
「ファイル/関数構成」表のとおり。Linux では backup_linux.py、Windows では backup_windows.py の
create_archive() を platform.system() で選び、backup_common.run_backup() へ渡す。このファイル自体は
Linux 版・Windows 版で同一内容であり、両方の kit ディレクトリに同じものを配置している。
"""
from __future__ import annotations

import argparse
import platform
import sys
from pathlib import Path

import backup_common

if platform.system() == "Windows":
    from backup_windows import create_archive
else:
    from backup_linux import create_archive


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="設定ファイル・データディレクトリの世代管理バックアップ")
    parser.add_argument("--config", type=Path, required=True)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("backup")

    restore_parser = sub.add_parser("restore")
    restore_parser.add_argument("--archive", type=Path, required=True)
    restore_parser.add_argument("--restore-dir", type=Path, required=True)

    args = parser.parse_args(argv)

    if args.command == "backup":
        return backup_common.run_backup(args.config, create_archive)
    return backup_common.run_restore(args.config, args.archive, args.restore_dir)


if __name__ == "__main__":
    sys.exit(main())
