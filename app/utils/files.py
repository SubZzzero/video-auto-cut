"""Filesystem helpers for uploads and outputs."""

import re
import shutil
from pathlib import Path

from app.schemas import OutputFileResponse


# Sanitize a file stem for safe output paths.
def sanitize_stem(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", Path(name).stem).strip("-") or "video"


# Build output metadata from a produced file path.
def build_output_response(output_path: Path) -> OutputFileResponse:
    relative_path = output_path.relative_to(output_path.parents[1]).as_posix()
    return OutputFileResponse(
        name=output_path.name,
        relative_path=relative_path,
        url=f"/outputs/{relative_path}",
    )


# List processed output files in stable order.
def list_output_files(output_directory: Path) -> list[OutputFileResponse]:
    return [build_output_response(path) for path in sorted(output_directory.glob("*.mp4"))]


# Remove one file or directory tree if it exists.
def remove_path(path: Path) -> None:
    if not path.exists():
        return

    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
        return

    path.unlink()


# Remove every child entry from one directory.
def clear_directory(directory: Path) -> None:
    if not directory.exists():
        return

    for path in directory.iterdir():
        remove_path(path)
