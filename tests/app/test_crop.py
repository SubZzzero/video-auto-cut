from app.video.crop import (
    build_crop_filter,
    calculate_crop_window,
    calculate_crop_window_for_subject_bounds,
    calculate_positioned_crop_window,
)


# Verify that vertical crop windows stay inside the frame.
def test_calculate_vertical_crop_window() -> None:
    crop_window = calculate_crop_window(1920, 1080, 960, "vertical")

    assert crop_window == (656, 0, 608, 1080)


# Verify that horizontal crop can stay unchanged on matching source ratio.
def test_calculate_horizontal_crop_window() -> None:
    crop_window = calculate_crop_window(1920, 1080, 960, "horizontal")

    assert crop_window == (0, 0, 1920, 1080)


# Verify that new portrait and square crop presets stay centered and in frame.
def test_calculate_additional_crop_windows() -> None:
    assert calculate_crop_window(1920, 1080, 960, "portrait_4_5") == (528, 0, 864, 1080)
    assert calculate_crop_window(1920, 1080, 960, "square_1_1") == (420, 0, 1080, 1080)
    assert calculate_crop_window(1920, 1080, 960, "portrait_3_4") == (555, 0, 810, 1080)


# Verify that span-aware crop shifts to keep the detected face range inside frame.
def test_calculate_crop_window_for_subject_bounds() -> None:
    crop_window = calculate_crop_window_for_subject_bounds(1920, 1080, 650, 600, 1100, "vertical")

    assert crop_window == (492, 0, 608, 1080)


# Verify that positioned crop windows use the requested origin when valid.
def test_calculate_positioned_crop_window() -> None:
    crop_window = calculate_positioned_crop_window(1920, 1080, 300, 0, "vertical")

    assert crop_window == (300, 0, 608, 1080)


# Verify that positioned crop windows are clamped inside the frame.
def test_calculate_positioned_crop_window_clamps_to_bounds() -> None:
    crop_window = calculate_positioned_crop_window(1920, 1200, 1200, 400, "square_1_1")

    assert crop_window == (720, 0, 1200, 1200)


# Verify that crop filter strings are generated correctly.
def test_build_crop_filter() -> None:
    assert build_crop_filter((10, 12, 608, 1080)) == "crop=608:1080:10:12"
