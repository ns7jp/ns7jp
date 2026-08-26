"""backup_windows.py -- LAB-WINOPS1 (Windows) 向けのアーカイブ生成。zipfile。

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.4 章の
create_archive_windows() を、同章の「ファイル/関数構成」表のとおり独立ファイルに切り出したもの。
robocopy 案を不採用とした理由は 4.4 章「固有の注意点」を参照。
"""
from __future__ import annotations

import zipfile
from pathlib import Path


def create_archive(src_dirs: list[Path], dest_dir: Path, timestamp: str) -> Path:
    archive_path = dest_dir / f"backup_{timestamp}.zip"
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for src in src_dirs:
            for file_path in src.rglob("*"):
                if file_path.is_file():
                    zf.write(file_path, arcname=file_path.relative_to(src.parent))
    return archive_path
