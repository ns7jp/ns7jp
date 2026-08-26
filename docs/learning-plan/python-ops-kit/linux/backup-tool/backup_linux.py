"""backup_linux.py -- lab-base01 (Linux) 向けのアーカイブ生成。tarfile + gzip。

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.4 章の
create_archive_linux() を、同章の「ファイル/関数構成」表のとおり独立ファイルに切り出したもの。
"""
from __future__ import annotations

import tarfile
from pathlib import Path


def create_archive(src_dirs: list[Path], dest_dir: Path, timestamp: str) -> Path:
    archive_path = dest_dir / f"backup_{timestamp}.tar.gz"
    with tarfile.open(archive_path, "w:gz") as tar:
        for src in src_dirs:
            tar.add(src, arcname=src.name)
    return archive_path
