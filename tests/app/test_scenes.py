from pathlib import Path

from app.video import scenes


# Verify that short scene clips are merged to respect the requested minimum duration.
def test_merge_short_scene_ranges() -> None:
    merged_ranges = scenes.merge_short_scene_ranges(
        [(0.0, 2.0), (2.0, 4.0), (4.0, 7.0), (7.0, 9.0)],
        5,
    )

    assert merged_ranges == [(0.0, 9.0)]


# Verify that the detector enforces the safe minimum duration floor.
def test_detect_scene_ranges_enforces_safe_minimum_duration(monkeypatch) -> None:
    class FakeTimecode:
        """Expose the timecode API used by the detector."""

        # Return the configured second value.
        def __init__(self, seconds: float) -> None:
            self._seconds = seconds

        # Return the raw second count.
        def get_seconds(self) -> float:
            return self._seconds

    class FakeSceneManager:
        """Expose the scene manager API used by the helper."""

        # Ignore the added detector in the test stub.
        def add_detector(self, detector) -> None:
            self._detector = detector

        # Ignore the detect call in the test stub.
        def detect_scenes(self, video) -> None:
            self._video = video

        # Return a predictable set of short scene ranges.
        def get_scene_list(self) -> list[tuple[FakeTimecode, FakeTimecode]]:
            return [
                (FakeTimecode(0.0), FakeTimecode(2.0)),
                (FakeTimecode(2.0), FakeTimecode(4.0)),
                (FakeTimecode(4.0), FakeTimecode(7.0)),
                (FakeTimecode(7.0), FakeTimecode(9.0)),
            ]

    # Return fake scene detection primitives.
    def fake_import_scenedetect():
        return FakeSceneManager, object, lambda path: path

    monkeypatch.setattr(scenes, "import_scenedetect", fake_import_scenedetect)

    ranges = scenes.detect_scene_ranges(Path("demo.mp4"), 1)

    assert ranges == [(0.0, 9.0)]


# Verify that scene mode falls back to the full video when no scenes are detected.
def test_detect_scene_ranges_falls_back_to_full_video(monkeypatch) -> None:
    class FakeSceneManager:
        """Expose an empty scene list for fallback testing."""

        # Ignore the added detector in the test stub.
        def add_detector(self, detector) -> None:
            self._detector = detector

        # Ignore the detect call in the test stub.
        def detect_scenes(self, video) -> None:
            self._video = video

        # Return no detected scene boundaries.
        def get_scene_list(self) -> list[tuple[object, object]]:
            return []

    # Return fake scene detection primitives.
    def fake_import_scenedetect():
        return FakeSceneManager, object, lambda path: path

    monkeypatch.setattr(scenes, "import_scenedetect", fake_import_scenedetect)
    monkeypatch.setattr(scenes, "get_video_duration", lambda video_path: 3.5)

    ranges = scenes.detect_scene_ranges(Path("demo.mp4"), 30)

    assert ranges == [(0.0, 3.5)]
