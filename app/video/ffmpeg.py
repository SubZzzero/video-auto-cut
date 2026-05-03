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


# Build the fixed-duration ffmpeg segment command.
def build_segment_command(
    source_path: Path,
    output_pattern: Path,
    segment_duration: int,
    crop_filter: str | None,
) -> list[str]:
    command = ["ffmpeg", "-y", "-i", str(source_path)]

    if crop_filter:
        command.extend(["-vf", crop_filter])

    # Force boundary keyframes so the segment muxer can cut close to the requested duration.
    force_key_frames_expression = f"expr:gte(t,n_forced*{segment_duration})"

    command.extend(
        [
            "-map",
            "0",
            "-force_key_frames",
            force_key_frames_expression,
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "-f",
            "segment",
            "-segment_time",
            str(segment_duration),
            "-reset_timestamps",
            "1",
            str(output_pattern),
        ]
    )
    return command
