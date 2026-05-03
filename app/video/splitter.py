"""Video splitting helpers."""

from collections.abc import Callable
from pathlib import Path

from app.video.ffmpeg import build_trim_command, run_ffmpeg_command
from app.video.scenes import get_video_duration

CropFilterResolver = Callable[[float, float], str | None] | None


# Build fixed-duration chunk ranges with a separate final remainder chunk when needed.
def build_chunk_ranges(total_duration: float, segment_duration: int) -> list[tuple[float, float]]:
    if total_duration <= segment_duration:
        return [(0.0, total_duration)]

    full_chunk_count = int(total_duration // segment_duration)
    ranges = [
        (float(index * segment_duration), float((index + 1) * segment_duration))
        for index in range(full_chunk_count)
    ]

    covered_duration = full_chunk_count * segment_duration
    remainder_duration = total_duration - covered_duration
    if remainder_duration > 0.001:
        ranges.append((float(covered_duration), total_duration))
    elif ranges:
        last_start, _ = ranges[-1]
        ranges[-1] = (last_start, total_duration)

    return ranges


# Split a video by fixed-duration chunks.
def split_by_duration(
    source_path: Path,
    output_directory: Path,
    segment_duration: int,
    crop_filter_resolver: CropFilterResolver,
) -> list[Path]:
    total_duration = get_video_duration(source_path)
    ranges = build_chunk_ranges(total_duration, segment_duration)
    outputs: list[Path] = []

    for index, (start_time, end_time) in enumerate(ranges, start=1):
        output_path = output_directory / f"chunk_{index:03d}.mp4"
        crop_filter = crop_filter_resolver(start_time, end_time) if crop_filter_resolver else None
        command = build_trim_command(source_path, output_path, start_time, end_time, crop_filter)
        run_ffmpeg_command(command)
        outputs.append(output_path)

    return outputs


# Split a video by explicit start/end ranges.
def split_by_ranges(
    source_path: Path,
    output_directory: Path,
    ranges: list[tuple[float, float]],
    crop_filter_resolver: CropFilterResolver,
) -> list[Path]:
    outputs: list[Path] = []
    for index, (start_time, end_time) in enumerate(ranges, start=1):
        output_path = output_directory / f"scene_{index:03d}.mp4"
        crop_filter = crop_filter_resolver(start_time, end_time) if crop_filter_resolver else None
        command = build_trim_command(source_path, output_path, start_time, end_time, crop_filter)
        run_ffmpeg_command(command)
        outputs.append(output_path)

    return outputs
