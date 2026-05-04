"""Crop window calculations."""

from app.config import (
    HORIZONTAL_RATIO,
    PORTRAIT_3_4_RATIO,
    PORTRAIT_4_5_RATIO,
    SQUARE_1_1_RATIO,
    VERTICAL_RATIO,
)

CROP_MODE_RATIOS = {
    "vertical": VERTICAL_RATIO,
    "portrait_4_5": PORTRAIT_4_5_RATIO,
    "square_1_1": SQUARE_1_1_RATIO,
    "portrait_3_4": PORTRAIT_3_4_RATIO,
    "horizontal": HORIZONTAL_RATIO,
}


# Resolve the target aspect ratio for one crop mode.
def get_target_ratio(crop_mode: str) -> float | None:
    return CROP_MODE_RATIOS.get(crop_mode)


# Clamp a value to an integer range.
def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))


# Calculate a stable crop window around a subject center.
def calculate_crop_window(
    frame_width: int,
    frame_height: int,
    subject_center_x: int,
    crop_mode: str,
) -> tuple[int, int, int, int] | None:
    target_ratio = get_target_ratio(crop_mode)
    if target_ratio is None:
        return None

    source_ratio = frame_width / frame_height
    if source_ratio > target_ratio:
        crop_height = frame_height
        crop_width = round(crop_height * target_ratio)
    else:
        crop_width = frame_width
        crop_height = round(crop_width / target_ratio)

    crop_width = max(2, crop_width - (crop_width % 2))
    crop_height = max(2, crop_height - (crop_height % 2))

    x = clamp(subject_center_x - crop_width // 2, 0, frame_width - crop_width)
    y = clamp((frame_height - crop_height) // 2, 0, frame_height - crop_height)
    return x, y, crop_width, crop_height


# Shift one crop window so it covers the detected subject bounds when possible.
def calculate_crop_window_for_subject_bounds(
    frame_width: int,
    frame_height: int,
    subject_center_x: int,
    subject_left_x: int,
    subject_right_x: int,
    crop_mode: str,
) -> tuple[int, int, int, int] | None:
    crop_window = calculate_crop_window(frame_width, frame_height, subject_center_x, crop_mode)
    if crop_window is None:
        return None

    x, y, crop_width, crop_height = crop_window
    minimum_x = clamp(subject_right_x - crop_width, 0, frame_width - crop_width)
    maximum_x = clamp(subject_left_x, 0, frame_width - crop_width)

    if minimum_x <= maximum_x:
        safe_x = clamp(x, minimum_x, maximum_x)
    else:
        subject_span_center_x = (subject_left_x + subject_right_x) // 2
        safe_x = clamp(subject_span_center_x - crop_width // 2, 0, frame_width - crop_width)

    return safe_x, y, crop_width, crop_height


# Build an ffmpeg crop filter expression from one crop window.
def build_crop_filter(crop_window: tuple[int, int, int, int] | None) -> str | None:
    if crop_window is None:
        return None

    x, y, width, height = crop_window
    return f"crop={width}:{height}:{x}:{y}"
