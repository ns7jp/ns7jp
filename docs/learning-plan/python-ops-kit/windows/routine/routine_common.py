"""routine_common.py -- routine_windows.py と共通の OS 非依存コア。

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.3 章の中核コード例を、
同章の「ファイル/関数構成（案）」のとおり routine_common.py（load_config, check_disk_usage）と
routine_windows.py（本体）に分割したもの。この分割はキット作成時に行ったもので、実行はまだ
していない（この AI 支援セッションには Windows 実行環境が無いため）。
"""
from __future__ import annotations

from pathlib import Path

import psutil
import yaml


def load_config(config_path: str) -> dict:
    path = Path(config_path)
    if not path.is_file():
        raise FileNotFoundError(f"config file not found: {config_path}")
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def check_disk_usage(paths: list[str], warn_percent: int, crit_percent: int) -> list[dict]:
    # Linux版と共通のpsutil.disk_usage()をそのまま使う（OS差分なし）
    results = []
    for target in paths:
        usage = psutil.disk_usage(target)
        if usage.percent >= crit_percent:
            level = "critical"
        elif usage.percent >= warn_percent:
            level = "warning"
        else:
            level = "ok"
        results.append({"path": target, "percent": usage.percent, "level": level})
    return results
