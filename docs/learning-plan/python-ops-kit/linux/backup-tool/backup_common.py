"""backup_common.py -- backup.py の OS 非依存な共通コア。

出典: docs/learning-plan/07-python-ops-automation-exercise-design.md 4.4 章の中核コード例
（`backup.py の中核ロジック（要旨）`）を、同章の「ファイル/関数構成」表のとおり
backup_common.py / backup_linux.py（または backup_windows.py）/ backup.py の3ファイルに
分割したもの。この分割そのものはキット作成時に行ったもので、この形のまま動かした実績は
まだ無い（分割前の単一ファイル版のロジックはこの AI 支援セッションの作業環境で実行済み。
07 章の付録参照）。

ロック・容量確認・SHA-256 manifest・世代管理・リストア検証を担う。アーカイブの生成
（tarfile / zipfile）だけは backup_linux.py / backup_windows.py 側の create_archive() に
分離し、run_backup() が引数として受け取って呼び出す。

Python 3.12 以降を前提とする（tarfile.extractall の filter 引数は 3.12 で追加された）。
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path

import yaml

MANIFEST_SUFFIX = ".manifest.json"
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("backup")


def load_config(config_path: Path) -> dict:
    with config_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def acquire_lock(lock_path: Path) -> int:
    # O_CREAT|O_EXCL は既にファイルがあれば FileExistsError を送出する（多重実行防止）
    return os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)


def release_lock(fd: int, lock_path: Path) -> None:
    os.close(fd)
    lock_path.unlink(missing_ok=True)


def check_free_space(dest_dir: Path, required_bytes: int) -> None:
    usage = shutil.disk_usage(dest_dir)
    if usage.free < required_bytes:
        raise OSError(f"空き容量不足: 必要 {required_bytes} bytes, 空き {usage.free} bytes")


def compute_sha256(file_path: Path) -> str:
    digest = hashlib.sha256()
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_manifest(archive_path: Path) -> Path:
    manifest_path = archive_path.with_suffix(archive_path.suffix + MANIFEST_SUFFIX)
    manifest = {
        "archive": archive_path.name,
        "sha256": compute_sha256(archive_path),
        "size_bytes": archive_path.stat().st_size,
        "created_at": datetime.now().astimezone().isoformat(),
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest_path


def verify_manifest(archive_path: Path, manifest_path: Path) -> bool:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return compute_sha256(archive_path) == manifest["sha256"]


def list_generations(backup_dir: Path, prefix: str) -> list[Path]:
    return sorted(backup_dir.glob(f"{prefix}_*.tar.gz")) + sorted(backup_dir.glob(f"{prefix}_*.zip"))


def prune_old_generations(backup_dir: Path, prefix: str, keep: int) -> list[Path]:
    generations = list_generations(backup_dir, prefix)
    if len(generations) <= keep:
        return []
    to_delete = generations[: len(generations) - keep]
    logger.info("削除対象（世代数超過分・%d 件）:", len(to_delete))
    for path in to_delete:
        logger.info("  - %s", path)
    for path in to_delete:
        path.unlink()
        path.with_suffix(path.suffix + MANIFEST_SUFFIX).unlink(missing_ok=True)
    return to_delete


def restore_archive(archive_path: Path, restore_dir: Path) -> None:
    if restore_dir.exists() and any(restore_dir.iterdir()):
        raise FileExistsError(f"リストア先が空ではありません: {restore_dir}")
    restore_dir.mkdir(parents=True, exist_ok=True)
    if archive_path.name.endswith(".tar.gz"):
        import tarfile
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(restore_dir, filter="data")
    else:
        import zipfile
        with zipfile.ZipFile(archive_path, "r") as zf:
            zf.extractall(restore_dir)


def verify_restore(original_dirs: list[Path], restore_dir: Path) -> bool:
    all_match = True
    for src in original_dirs:
        restored = restore_dir / src.name
        for src_file in src.rglob("*"):
            if not src_file.is_file():
                continue
            rel = src_file.relative_to(src)
            restored_file = restored / rel
            if not restored_file.exists() or compute_sha256(src_file) != compute_sha256(restored_file):
                logger.error("NG: %s が元データと一致しません", rel)
                all_match = False
    return all_match


def run_backup(config_path: Path, create_archive) -> int:
    try:
        config = load_config(config_path)
    except OSError as e:
        logger.error("設定ファイルを読み込めません: %s (%s)", config_path, e)
        return 1
    src_dirs = [Path(p) for p in config["source_dirs"]]
    dest_dir = Path(config["backup_dir"])
    lock_path = dest_dir / "backup.lock"
    fd = None
    try:
        dest_dir.mkdir(parents=True, exist_ok=True)
        try:
            fd = acquire_lock(lock_path)
        except FileExistsError:
            logger.error("多重実行を検知しました: %s", lock_path)
            return 1
        check_free_space(dest_dir, required_bytes=int(config.get("min_free_bytes", 0)))
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_path = create_archive(src_dirs, dest_dir, timestamp)
        manifest_path = write_manifest(archive_path)
        if not verify_manifest(archive_path, manifest_path):
            raise ValueError("manifest 検証に失敗しました")
        prune_old_generations(dest_dir, "backup", int(config["keep_generations"]))
        logger.info("バックアップ完了: %s", archive_path)
        return 0
    except Exception as e:
        logger.error("バックアップに失敗しました: %s", e)
        return 1
    finally:
        if fd is not None:
            release_lock(fd, lock_path)


def run_restore(config_path: Path, archive_path: Path, restore_dir: Path) -> int:
    config = load_config(config_path)
    src_dirs = [Path(p) for p in config["source_dirs"]]
    if any(restore_dir.resolve() == s.resolve() for s in src_dirs):
        logger.error("リストア先が元データと同じディレクトリです: %s", restore_dir)
        return 1
    manifest_path = archive_path.with_suffix(archive_path.suffix + MANIFEST_SUFFIX)
    if not manifest_path.exists() or not verify_manifest(archive_path, manifest_path):
        logger.error("manifest 検証に失敗しました（破損または改ざんの可能性）: %s", archive_path)
        return 1
    restore_archive(archive_path, restore_dir)
    return 0 if verify_restore(src_dirs, restore_dir) else 1
