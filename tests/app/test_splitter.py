from pathlib import Path

import pytest

from app.video import splitter


# Verify that exact multiples keep every chunk at the requested duration.
def test_build_chunk_ranges_for_exact_multiple() -> None:
    ranges = splitter.build_chunk_ranges(0.0, 90.0, 30)

    assert ranges == [(0.0, 30.0), (30.0, 60.0), (60.0, 90.0)]


# Verify that any trailing remainder becomes a separate final chunk.
def test_build_chunk_ranges_keeps_remainder_as_final_chunk() -> None:
    ranges = splitter.build_chunk_ranges(0.0, 98.0, 30)

    assert ranges == [(0.0, 30.0), (30.0, 60.0), (60.0, 90.0), (90.0, 98.0)]


# Verify that partial selections preserve absolute source offsets.
def test_build_chunk_ranges_inside_selected_window() -> None:
    ranges = splitter.build_chunk_ranges(120.0, 180.0, 25)

    assert ranges == [(120.0, 145.0), (145.0, 170.0), (170.0, 180.0)]


# Verify that short selected ranges still produce one chunk.
def test_build_chunk_ranges_for_short_selection() -> None:
    ranges = splitter.build_chunk_ranges(12.0, 18.5, 30)

    assert ranges == [(12.0, 18.5)]


# Verify that reversed or empty ranges are rejected.
def test_build_chunk_ranges_rejects_reversed_range() -> None:
    with pytest.raises(ValueError, match="End time must be greater than start time."):
        splitter.build_chunk_ranges(18.0, 18.0, 30)


# Verify that chunk splitting trims the computed ranges into chunk output files.
def test_split_by_duration_uses_selected_range(monkeypatch, tmp_path) -> None:
    commands: list[list[str]] = []

    # Capture each generated trim command instead of invoking ffmpeg.
    def fake_build_trim_command(
        source_path,
        output_path,
        start_time,
        end_time,
        crop_filter,
    ) -> list[str]:
        return [
            str(output_path),
            f"{start_time:.3f}",
            f"{end_time:.3f}",
            crop_filter or "none",
        ]

    # Record every chunk command in order.
    def fake_run_ffmpeg_command(command: list[str]) -> None:
        commands.append(command)

    monkeypatch.setattr(splitter, "build_trim_command", fake_build_trim_command)
    monkeypatch.setattr(splitter, "run_ffmpeg_command", fake_run_ffmpeg_command)

    outputs = splitter.split_by_duration(
        Path("input.mp4"),
        tmp_path,
        30,
        120.0,
        188.0,
        lambda start_time, end_time: f"crop:{start_time:.0f}-{end_time:.0f}",
    )

    assert outputs == [
        tmp_path / "chunk_001.mp4",
        tmp_path / "chunk_002.mp4",
        tmp_path / "chunk_003.mp4",
    ]
    assert commands == [
        [str(tmp_path / "chunk_001.mp4"), "120.000", "150.000", "crop:120-150"],
        [str(tmp_path / "chunk_002.mp4"), "150.000", "180.000", "crop:150-180"],
        [str(tmp_path / "chunk_003.mp4"), "180.000", "188.000", "crop:180-188"],
    ]
