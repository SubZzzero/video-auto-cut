from api.services.job_store import JobStore
from app.schemas import JobState


# Verify that job creation stores the expected defaults.
def test_create_job() -> None:
    store = JobStore()

    job = store.create_job("job-1", "clip.mp4", "vertical", 240, 120, 30, 5.0, 35.0)

    assert job["jobId"] == "job-1"
    assert job["crop"] == "vertical"
    assert job["cropX"] == 240
    assert job["cropY"] == 120
    assert job["startTime"] == 5.0
    assert job["endTime"] == 35.0
    assert job["status"] == JobState.QUEUED
    assert job["outputs"] == []


# Verify that job updates are persisted.
def test_update_job() -> None:
    store = JobStore()
    store.create_job("job-1", "clip.mp4", "none", None, None, 30, 0.0, 30.0)

    updated = store.update_job("job-1", progress=50, message="Halfway there.")

    assert updated["progress"] == 50
    assert updated["message"] == "Halfway there."
