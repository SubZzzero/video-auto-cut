from pathlib import Path

from app.video import splitter


# Verify that exact multiples keep every chunk at the requested duration.
def test_build_chunk_ranges_for_exact_multiple() -> None:
    ranges = splitter.build_chunk_ranges(90.0, 30)

    assert ranges == [(0.0, 30.0), (30.0, 60.0), (60.0, 90.0)]


# Verify that any trailing remainder becomes a separate final chunk.
def test_build_chunk_ranges_keeps_remainder_as_final_chunk() -> None:
    ranges = splitter.build_chunk_ranges(98.0, 30)

    assert ranges == [(0.0, 30.0), (30.0, 60.0), (60.0, 90.0), (90.0, 98.0)]


# Verify that short videos still produce one chunk.
def test_build_chunk_ranges_for_short_video() -> None:
    ranges = splitter.build_chunk_ranges(18.5, 30)

    assert ranges == [(0.0, 18.5)]


# Verify that chunk splitting trims the computed ranges into chunk output files.
def test_split_by_duration_uses_trim_ranges(monkeypatch, tmp_path) -> None:
    commands: list[list[str]] = []

    # Return a duration that leaves a short remainder for the final chunk.
    monkeypatch.setattr(splitter, "get_video_duration", lambda source_path: 68.0)

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
        lambda start_time, end_time: f"crop:{start_time:.0f}-{end_time:.0f}",
    )

    assert outputs == [
        tmp_path / "chunk_001.mp4",
        tmp_path / "chunk_002.mp4",
        tmp_path / "chunk_003.mp4",
    ]
    assert commands == [
        [str(tmp_path / "chunk_001.mp4"), "0.000", "30.000", "crop:0-30"],
        [str(tmp_path / "chunk_002.mp4"), "30.000", "60.000", "crop:30-60"],
        [str(tmp_path / "chunk_003.mp4"), "60.000", "68.000", "crop:60-68"],
    ]


# Verify that explicit scene ranges can resolve a different crop per output file.
def test_split_by_ranges_uses_per_range_crop_filters(monkeypatch, tmp_path) -> None:
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

    # Record every scene command in order.
    def fake_run_ffmpeg_command(command: list[str]) -> None:
        commands.append(command)

    monkeypatch.setattr(splitter, "build_trim_command", fake_build_trim_command)
    monkeypatch.setattr(splitter, "run_ffmpeg_command", fake_run_ffmpeg_command)

    outputs = splitter.split_by_ranges(
        Path("input.mp4"),
        tmp_path,
        [(0.0, 4.0), (4.0, 9.0)],
        lambda start_time, end_time: f"crop:{start_time:.0f}-{end_time:.0f}",
    )

    assert outputs == [tmp_path / "scene_001.mp4", tmp_path / "scene_002.mp4"]
    assert commands == [
        [str(tmp_path / "scene_001.mp4"), "0.000", "4.000", "crop:0-4"],
        [str(tmp_path / "scene_002.mp4"), "4.000", "9.000", "crop:4-9"],
    ]
