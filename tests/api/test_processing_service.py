from api.services import processing_service
from api.services.job_store import JobStore
from app.schemas import JobState


# Verify that successful jobs remove their temporary upload directory.
def test_process_job_cleans_temp_directory_on_success(monkeypatch, tmp_path) -> None:
    job_store = JobStore()
    upload_directory = tmp_path / "job-1"
    upload_directory.mkdir()
    upload_path = upload_directory / "clip.mp4"
    upload_path.write_bytes(b"data")
    job_store.create_job("job-1", "clip.mp4", "vertical", 320, 160, 30, 0.0, 30.0)

    # Return one deterministic output payload for the completed job.
    def fake_process(self, options, update_progress):
        assert options.source_path == upload_path
        assert options.crop_x == 320
        assert options.crop_y == 160
        assert options.start_time == 0.0
        assert options.end_time == 30.0
        update_progress(50, "Halfway there.")
        return [
            {
                "name": "chunk_001.mp4",
                "relative_path": "job-1/chunk_001.mp4",
                "url": "/outputs/job-1/chunk_001.mp4",
            }
        ]

    monkeypatch.setattr(processing_service.VideoProcessor, "process", fake_process)

    processing_service.process_job(
        job_store,
        "job-1",
        upload_path,
        "vertical",
        320,
        160,
        30,
        0.0,
        30.0,
    )

    job = job_store.get_job("job-1")

    assert job is not None
    assert job["status"] == JobState.SUCCESS
    assert not upload_directory.exists()


# Verify that failed jobs still remove their temporary upload directory.
def test_process_job_cleans_temp_directory_on_failure(monkeypatch, tmp_path) -> None:
    job_store = JobStore()
    upload_directory = tmp_path / "job-2"
    upload_directory.mkdir()
    upload_path = upload_directory / "clip.mp4"
    upload_path.write_bytes(b"data")
    job_store.create_job("job-2", "clip.mp4", "none", None, None, 30, 10.0, 40.0)

    # Raise one deterministic processing error for the failed job.
    def fake_process(self, options, update_progress):
        raise RuntimeError("boom")

    monkeypatch.setattr(processing_service.VideoProcessor, "process", fake_process)

    processing_service.process_job(
        job_store,
        "job-2",
        upload_path,
        "none",
        None,
        None,
        30,
        10.0,
        40.0,
    )

    job = job_store.get_job("job-2")

    assert job is not None
    assert job["status"] == JobState.ERROR
    assert job["error"] == "boom"
    assert not upload_directory.exists()
