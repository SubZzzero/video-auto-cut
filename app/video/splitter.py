"""Video splitting helpers."""

from collections.abc import Callable
from pathlib import Path

from app.video.cancellation import CancelCallback, ensure_not_cancelled
from app.video.ffmpeg import build_trim_command, run_ffmpeg_command
from app.video.metadata import get_video_duration

CropFilterResolver = Callable[[float, float], str | None] | None


# Build fixed-duration chunk ranges inside one selected source window.
def build_chunk_ranges(
    range_start: float,
    range_end: float,
    segment_duration: int,
) -> list[tuple[float, float]]:
    if range_end <= range_start:
        raise ValueError("End time must be greater than start time.")

    ranges: list[tuple[float, float]] = []
    current_start = range_start

    while current_start < range_end - 0.001:
        current_end = min(current_start + segment_duration, range_end)
        ranges.append((current_start, current_end))
        current_start = current_end

    return ranges


# Split a video by fixed-duration chunks.
def split_by_duration(
    source_path: Path,
    output_directory: Path,
    segment_duration: int,
    range_start: float,
    range_end: float | None,
    crop_filter_resolver: CropFilterResolver,
    should_cancel: CancelCallback = None,
) -> list[Path]:
    selected_end = range_end if range_end is not None else get_video_duration(source_path)
    ranges = build_chunk_ranges(range_start, selected_end, segment_duration)
    outputs: list[Path] = []

    for index, (start_time, end_time) in enumerate(ranges, start=1):
        ensure_not_cancelled(should_cancel)
        output_path = output_directory / f"chunk_{index:03d}.mp4"
        crop_filter = crop_filter_resolver(start_time, end_time) if crop_filter_resolver else None
        command = build_trim_command(source_path, output_path, start_time, end_time, crop_filter)
        run_ffmpeg_command(command)
        outputs.append(output_path)

    return outputs
