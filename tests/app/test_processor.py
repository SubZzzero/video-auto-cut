from pathlib import Path

from app.config import DEFAULT_SCENE_MIN_DURATION
from app.schemas import OutputFileResponse
from app.video.processor import ProcessOptions, VideoProcessor


# Verify that scene mode preserves raw boundaries by default.
def test_processor_uses_safe_scene_minimum_by_default(monkeypatch, tmp_path) -> None:
    captured_duration: dict[str, int] = {}

    # Capture the minimum duration passed into scene detection.
    def fake_detect_scene_ranges(
        video_path: Path,
        minimum_duration: int,
    ) -> list[tuple[float, float]]:
        captured_duration["value"] = minimum_duration
        return [(0.0, 12.0)]

    # Ignore split output creation in the processor test.
    def fake_split_by_ranges(source_path, output_directory, ranges, crop_filter_resolver) -> None:
        return None

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
    monkeypatch.setattr("app.video.processor.detect_scene_ranges", fake_detect_scene_ranges)
    monkeypatch.setattr("app.video.processor.split_by_ranges", fake_split_by_ranges)
    monkeypatch.setattr(
        "app.video.processor.list_output_files",
        lambda output_directory: [
            OutputFileResponse(
                name="scene_001.mp4",
                relative_path="job-1/scene_001.mp4",
                url="/outputs/job-1/scene_001.mp4",
            )
        ],
    )

    outputs = VideoProcessor().process(
        ProcessOptions(
            job_id="job-1",
            source_path=Path("demo.mp4"),
            mode="scenes",
            crop_mode="none",
            duration=30,
        ),
        lambda progress, message: None,
    )

    assert captured_duration["value"] == DEFAULT_SCENE_MIN_DURATION
    assert outputs[0]["name"] == "scene_001.mp4"


# Verify that chunk mode resolves a separate crop for each output range.
def test_processor_builds_per_range_crop_filters(monkeypatch, tmp_path) -> None:
    captured_filters: list[str | None] = []

    # Capture the crop filters produced for each chunk range.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        crop_filter_resolver,
    ) -> None:
        captured_filters.append(crop_filter_resolver(0.0, 10.0))
        captured_filters.append(crop_filter_resolver(10.0, 20.0))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
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
            mode="chunk",
            crop_mode="vertical",
            duration=30,
        ),
        lambda progress, message: None,
    )

    assert captured_filters == ["crop=608:1080:656:0", "crop=608:1080:656:0"]


# Verify that centered crop uses the frame midpoint when crop is enabled.
def test_processor_uses_centered_crop_window(monkeypatch, tmp_path) -> None:
    captured_filters: list[str | None] = []

    # Capture the generated crop filter from chunk mode.
    def fake_split_by_duration(
        source_path,
        output_directory,
        duration,
        crop_filter_resolver,
    ) -> None:
        captured_filters.append(crop_filter_resolver(0.0, 30.0))

    monkeypatch.setattr("app.video.processor.resolve_output_directory", lambda job_id: tmp_path)
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
            mode="chunk",
            crop_mode="vertical",
            duration=30,
        ),
        lambda progress, message: None,
    )

    assert captured_filters == ["crop=608:1080:656:0"]
