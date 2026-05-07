"""FFmpeg command helpers."""

import shutil
import subprocess
from pathlib import Path


# Raise a clear error when FFmpeg is not installed.
def ensure_ffmpeg_available() -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("FFmpeg is not available on PATH.")


# Run an FFmpeg command and convert failures into readable errors.
def run_ffmpeg_command(command: list[str]) -> None:
    ensure_ffmpeg_available()
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
    command = [
        "ffmpeg",
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

