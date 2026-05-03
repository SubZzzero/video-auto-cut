from datetime import datetime

from app import config


# Verify that job ids use a readable date-and-time format.
def test_build_job_id_uses_readable_timestamp() -> None:
    job_id = config.build_job_id(datetime(2026, 5, 2, 14, 46, 43, 123456))

    assert job_id == "2026-05-02_14-46-43_123456"


# Verify that startup cleanup removes stale temporary upload folders.
def test_cleanup_temp_directory_clears_stale_uploads(monkeypatch, tmp_path) -> None:
    temp_directory = tmp_path / "temp"
    stale_upload_directory = temp_directory / "job-1"
    stale_upload_directory.mkdir(parents=True)
    (stale_upload_directory / "clip.mp4").write_bytes(b"data")

    monkeypatch.setattr(config, "TEMP_DIR", temp_directory)

    config.cleanup_temp_directory()

    assert temp_directory.exists()
    assert list(temp_directory.iterdir()) == []
