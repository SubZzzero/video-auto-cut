"""Scene detection helpers."""

from pathlib import Path

from app.config import DEFAULT_SCENE_MIN_DURATION
from app.video.frames import import_cv2


# Import scenedetect lazily so missing packages become readable runtime errors.
def import_scenedetect():
    try:
        from scenedetect import SceneManager, open_video  # type: ignore
        from scenedetect.detectors import ContentDetector  # type: ignore
    except ImportError as error:  # pragma: no cover - import path depends on environment.
        raise RuntimeError("PySceneDetect is not installed.") from error

    return SceneManager, ContentDetector, open_video


# Merge short scene ranges into longer clips.
def merge_short_scene_ranges(
    ranges: list[tuple[float, float]],
    minimum_duration: int,
) -> list[tuple[float, float]]:
    if minimum_duration <= 1 or len(ranges) <= 1:
        return list(ranges)

    merged_ranges: list[tuple[float, float]] = []
    current_start, current_end = ranges[0]

    for next_start, next_end in ranges[1:]:
        if current_end - current_start >= minimum_duration:
            merged_ranges.append((current_start, current_end))
            current_start, current_end = next_start, next_end
            continue

        current_end = max(current_end, next_end)

    remaining_range = (current_start, current_end)
    if merged_ranges and remaining_range[1] - remaining_range[0] < minimum_duration:
        previous_start, _ = merged_ranges[-1]
        merged_ranges[-1] = (previous_start, remaining_range[1])
    else:
        merged_ranges.append(remaining_range)

    return merged_ranges


# Read the total video duration for fallback scene ranges.
def get_video_duration(video_path: Path) -> float:
    cv2 = import_cv2()
    capture = cv2.VideoCapture(str(video_path))
    frame_count = float(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    frames_per_second = float(capture.get(cv2.CAP_PROP_FPS))
    capture.release()

    if frame_count <= 0 or frames_per_second <= 0:
        raise RuntimeError("Unable to determine the video duration.")

    return frame_count / frames_per_second


# Convert detected scenes into second-based trim ranges.
def detect_scene_ranges(video_path: Path, minimum_duration: int) -> list[tuple[float, float]]:
    effective_minimum_duration = max(DEFAULT_SCENE_MIN_DURATION, minimum_duration)
    SceneManager, ContentDetector, open_video = import_scenedetect()
    video = open_video(str(video_path))
    manager = SceneManager()
    manager.add_detector(ContentDetector())
    manager.detect_scenes(video)

    ranges: list[tuple[float, float]] = []
    for start_time, end_time in manager.get_scene_list():
        ranges.append((start_time.get_seconds(), end_time.get_seconds()))

    if not ranges:
        return [(0.0, get_video_duration(video_path))]

    return merge_short_scene_ranges(ranges, effective_minimum_duration)
