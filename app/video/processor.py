"""High-level video processing orchestration."""

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from app.config import (
    DEFAULT_CHUNK_DURATION,
    resolve_output_directory,
)
from app.utils.files import list_output_files
from app.video.crop import build_crop_filter, calculate_crop_window
from app.video.frames import read_frame_size
from app.video.metadata import get_video_duration
from app.video.splitter import split_by_duration

ProgressCallback = Callable[[int, str], None]


@dataclass(slots=True)
class ProcessOptions:
    """Describe one processing request."""

    job_id: str
    source_path: Path
    crop_mode: str
    duration: int = DEFAULT_CHUNK_DURATION
    start_time: float = 0.0
    end_time: float | None = None


class VideoProcessor:
    """Coordinate crop, detection, and splitting work."""

    # Process one uploaded video into output files.
    def process(
        self,
        options: ProcessOptions,
        update_progress: ProgressCallback,
    ) -> list[dict[str, str]]:
        output_directory = resolve_output_directory(options.job_id)
        crop_filter_resolver = self._build_crop_filter_resolver(options)
        selected_start, selected_end = self._resolve_selected_range(options)

        update_progress(10, "Preparing video processing.")

        update_progress(45, "Splitting selected range into chunks.")
        split_by_duration(
            options.source_path,
            output_directory,
            options.duration,
            selected_start,
            selected_end,
            crop_filter_resolver,
        )

        update_progress(90, "Collecting generated output files.")
        outputs = [item.model_dump() for item in list_output_files(output_directory)]
        if not outputs:
            raise RuntimeError("No output files were generated.")

        update_progress(100, "Processing completed.")
        return outputs

    # Resolve one safe processing window inside the source duration.
    def _resolve_selected_range(self, options: ProcessOptions) -> tuple[float, float]:
        total_duration = get_video_duration(options.source_path)
        selected_start = min(max(options.start_time, 0.0), total_duration)
        requested_end = total_duration if options.end_time is None else options.end_time
        selected_end = min(requested_end, total_duration)

        if selected_end <= selected_start:
            raise RuntimeError("End time must be greater than start time.")

        return selected_start, selected_end


    # Build a per-range crop resolver for one processing request.
    def _build_crop_filter_resolver(
        self,
        options: ProcessOptions,
    ) -> Callable[[float, float], str | None] | None:
        if options.crop_mode == "none":
            return None

        crop_filter = self._resolve_crop_filter(options)
        return lambda _start_time, _end_time: crop_filter


    # Resolve one deterministic crop filter for one source file.
    def _resolve_crop_filter(
        self,
        options: ProcessOptions,
    ) -> str | None:
        frame_width, frame_height = read_frame_size(options.source_path)
        crop_window = calculate_crop_window(
            frame_width,
            frame_height,
            frame_width // 2,
            options.crop_mode,
        )
        return build_crop_filter(crop_window)
