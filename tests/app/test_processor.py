from pathlib import Path

from app.schemas import OutputFileResponse
from app.video.processor import ProcessOptions, VideoProcessor


# Verify that chunk processing forwards the selected range into the splitter.
def test_processor_passes_selected_range_to_splitter(monkeypatch, tmp_path) -> None:
    captured_ranges: list[tuple[float, float]] = []
    captured_filters: list[str | None] = []

    # Capture the crop filters produced for each chunk range.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        start_time,
        end_time,
        crop_filter_resolver,
    ) -> None:
        captured_ranges.append((start_time, end_time))
        captured_filters.append(crop_filter_resolver(0.0, 10.0))
        captured_filters.append(crop_filter_resolver(10.0, 20.0))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
    monkeypatch.setattr("app.video.processor.get_video_duration", lambda video_path: 320.0)
    monkeypatch.setattr("app.video.processor.read_frame_size", lambda video_path: (1920, 1080))
    monkeypatch.setattr("app.video.processor.split_by_duration", fake_split_by_duration)
    monkeypatch.setattr(
        "app.video.processor.list_output_files",
        lambda output_directory: [
            OutputFileResponse(
                name="chunk_001.mp4",
                relative_path="job-1/chunk_001.mp4",
                url="/outputs/job-1/chunk_001.mp4",
            )
        ],
    )

    VideoProcessor().process(
        ProcessOptions(
            job_id="job-1",
            source_path=Path("demo.mp4"),
            crop_mode="vertical",
            crop_x=300,
            crop_y=0,
            duration=30,
            start_time=120.0,
            end_time=185.0,
        ),
        lambda progress, message: None,
    )

    assert captured_ranges == [(120.0, 185.0)]
    assert captured_filters == ["crop=608:1080:300:0", "crop=608:1080:300:0"]


# Verify that centered crop uses the frame midpoint when crop is enabled.
def test_processor_uses_centered_crop_window(monkeypatch, tmp_path) -> None:
    captured_filters: list[str | None] = []

    # Capture the generated crop filter from chunk mode.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        start_time,
        end_time,
        crop_filter_resolver,
    ) -> None:
        captured_filters.append(crop_filter_resolver(0.0, 30.0))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
    monkeypatch.setattr("app.video.processor.get_video_duration", lambda video_path: 180.0)
    monkeypatch.setattr("app.video.processor.read_frame_size", lambda video_path: (1920, 1080))
    monkeypatch.setattr("app.video.processor.split_by_duration", fake_split_by_duration)
    monkeypatch.setattr(
        "app.video.processor.list_output_files",
        lambda output_directory: [
            OutputFileResponse(
                name="chunk_001.mp4",
                relative_path="job-1/chunk_001.mp4",
                url="/outputs/job-1/chunk_001.mp4",
            )
        ],
    )

    VideoProcessor().process(
        ProcessOptions(
            job_id="job-1",
            source_path=Path("demo.mp4"),
            crop_mode="vertical",
            duration=30,
            start_time=0.0,
            end_time=30.0,
        ),
        lambda progress, message: None,
    )

    assert captured_filters == ["crop=608:1080:656:0"]


# Verify that requested crop positions are clamped to the valid source bounds.
def test_processor_clamps_requested_crop_position(monkeypatch, tmp_path) -> None:
    captured_filters: list[str | None] = []

    # Capture the generated crop filter after position clamping.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        start_time,
        end_time,
        crop_filter_resolver,
    ) -> None:
        captured_filters.append(crop_filter_resolver(0.0, 30.0))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
    monkeypatch.setattr("app.video.processor.get_video_duration", lambda video_path: 180.0)
    monkeypatch.setattr("app.video.processor.read_frame_size", lambda video_path: (1920, 1080))
    monkeypatch.setattr("app.video.processor.split_by_duration", fake_split_by_duration)
    monkeypatch.setattr(
        "app.video.processor.list_output_files",
        lambda output_directory: [
            OutputFileResponse(
                name="chunk_001.mp4",
                relative_path="job-1/chunk_001.mp4",
                url="/outputs/job-1/chunk_001.mp4",
            )
        ],
    )

    VideoProcessor().process(
        ProcessOptions(
            job_id="job-1",
            source_path=Path("demo.mp4"),
            crop_mode="vertical",
            crop_x=1800,
            crop_y=500,
            duration=30,
            start_time=0.0,
            end_time=30.0,
        ),
        lambda progress, message: None,
    )

    assert captured_filters == ["crop=608:1080:1312:0"]


# Verify that additional crop presets resolve to stable ffmpeg crop filters.
def test_processor_uses_additional_crop_preset(monkeypatch, tmp_path) -> None:
    captured_filters: list[str | None] = []

    # Capture the generated crop filter from chunk mode.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        start_time,
        end_time,
        crop_filter_resolver,
    ) -> None:
        captured_filters.append(crop_filter_resolver(0.0, 30.0))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
    monkeypatch.setattr("app.video.processor.get_video_duration", lambda video_path: 300.0)
    monkeypatch.setattr("app.video.processor.read_frame_size", lambda video_path: (1920, 1080))
    monkeypatch.setattr("app.video.processor.split_by_duration", fake_split_by_duration)
    monkeypatch.setattr(
        "app.video.processor.list_output_files",
        lambda output_directory: [
            OutputFileResponse(
                name="chunk_001.mp4",
                relative_path="job-1/chunk_001.mp4",
                url="/outputs/job-1/chunk_001.mp4",
            )
        ],
    )

    VideoProcessor().process(
        ProcessOptions(
            job_id="job-1",
            source_path=Path("demo.mp4"),
            crop_mode="square_1_1",
            duration=30,
            start_time=30.0,
            end_time=60.0,
        ),
        lambda progress, message: None,
    )

    assert captured_filters == ["crop=1080:1080:420:0"]


# Verify that ranges clamped to the source duration still remain valid.
def test_processor_clamps_requested_end_to_source_duration(monkeypatch, tmp_path) -> None:
    captured_ranges: list[tuple[float, float]] = []

    # Record the range passed into chunk splitting after duration clamping.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        start_time,
        end_time,
        crop_filter_resolver,
    ) -> None:
        captured_ranges.append((start_time, end_time))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
    monkeypatch.setattr("app.video.processor.get_video_duration", lambda video_path: 140.0)
    monkeypatch.setattr("app.video.processor.split_by_duration", fake_split_by_duration)
    monkeypatch.setattr(
        "app.video.processor.list_output_files",
        lambda output_directory: [
            OutputFileResponse(
                name="chunk_001.mp4",
                relative_path="job-1/chunk_001.mp4",
                url="/outputs/job-1/chunk_001.mp4",
            )
        ],
    )

    VideoProcessor().process(
        ProcessOptions(
            job_id="job-1",
            source_path=Path("demo.mp4"),
            crop_mode="none",
            duration=25,
            start_time=100.0,
            end_time=200.0,
        ),
        lambda progress, message: None,
    )

    assert captured_ranges == [(100.0, 140.0)]
