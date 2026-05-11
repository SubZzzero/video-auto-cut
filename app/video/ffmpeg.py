"""FFmpeg command helpers."""

import os
import shutil
import subprocess
from pathlib import Path

from app.config import FFMPEG_PATH_ENV_VAR, get_bundled_ffmpeg_path


# Resolve the ffmpeg executable from config, bundle, or PATH.
def resolve_ffmpeg_executable() -> str:
    configured_path = os.environ.get(FFMPEG_PATH_ENV_VAR)
    if configured_path:
        resolved_path = Path(configured_path).expanduser().resolve()
        if resolved_path.exists():
            return str(resolved_path)

        raise RuntimeError(f"Configured FFmpeg binary was not found: {resolved_path}")

    bundled_path = get_bundled_ffmpeg_path()
    if bundled_path.exists():
        return str(bundled_path)

    path_entry = shutil.which("ffmpeg")
    if path_entry is not None:
        return path_entry

    raise RuntimeError("FFmpeg is not available. Bundle ffmpeg or add it to PATH.")


# Run an FFmpeg command and convert failures into readable errors.
def run_ffmpeg_command(command: list[str]) -> None:
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        stderr = result.stderr.strip() or "Unknown FFmpeg error."
        raise RuntimeError(stderr)


# Build one ffmpeg segment command.
def build_trim_command(
    source_path: Path,
    output_path: Path,
    start_time: float,
    end_time: float,
    crop_filter: str | None,
) -> list[str]:
    ffmpeg_executable = resolve_ffmpeg_executable()
    command = [
        ffmpeg_executable,
        "-y",
        "-ss",
        f"{start_time:.3f}",
        "-to",
        f"{end_time:.3f}",
        "-i",
        str(source_path),
    ]

    if crop_filter:
        command.extend(["-vf", crop_filter])

    command.extend(["-c:v", "libx264", "-c:a", "aac", str(output_path)])
    return command
