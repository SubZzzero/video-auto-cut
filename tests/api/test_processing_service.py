from api.services import processing_service
from api.services.job_store import JobStore
from app.schemas import JobState
from app.video.cancellation import ProcessingCancelledError


# Verify that successful jobs remove their temporary upload directory.
def test_process_job_cleans_temp_directory_on_success(monkeypatch, tmp_path) -> None:
    job_store = JobStore()
    upload_directory = tmp_path / "job-1"
    upload_directory.mkdir()
    upload_path = upload_directory / "clip.mp4"
    upload_path.write_bytes(b"data")
    job_store.create_job("job-1", "clip.mp4", "vertical", 320, 160, 30, 0.0, 30.0)

    # Return one deterministic output payload for the completed job.
    def fake_process(self, options, update_progress, should_cancel):
        assert options.source_path == upload_path
        assert options.crop_x == 320
        assert options.crop_y == 160
        assert options.start_time == 0.0
        assert options.end_time == 30.0
        assert should_cancel() is False
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
    def fake_process(self, options, update_progress, should_cancel):
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


# Verify that cancelled jobs clear their outputs and finish in a cancelled state.
def test_process_job_cleans_outputs_on_cancellation(monkeypatch, tmp_path) -> None:
    job_store = JobStore()
    upload_directory = tmp_path / "job-3"
    upload_directory.mkdir()
    upload_path = upload_directory / "clip.mp4"
    upload_path.write_bytes(b"data")
    output_directory = tmp_path / "outputs" / "job-3"
    output_directory.mkdir(parents=True)
    (output_directory / "chunk_001.mp4").write_bytes(b"clip")
    job_store.create_job("job-3", "clip.mp4", "none", None, None, 30, 0.0, 30.0)
    job_store.request_cancel("job-3")

    # Surface one deterministic cooperative cancellation from the processor.
    def fake_process(self, options, update_progress, should_cancel):
        assert should_cancel() is True
        raise ProcessingCancelledError("Processing cancelled.")

    monkeypatch.setattr(processing_service, "OUTPUTS_DIR", tmp_path / "outputs")
    monkeypatch.setattr(processing_service.VideoProcessor, "process", fake_process)

    processing_service.process_job(
        job_store,
        "job-3",
        upload_path,
        "none",
        None,
        None,
        30,
        0.0,
        30.0,
    )

    job = job_store.get_job("job-3")

    assert job is not None
    assert job["status"] == JobState.CANCELLED
    assert job["outputs"] == []
    assert not output_directory.exists()
    assert not upload_directory.exists()
