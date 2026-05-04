from fastapi.testclient import TestClient

from api.deps import job_store
from api.main import app
from app.schemas import JobState

client = TestClient(app)


# Verify that invalid crop values are rejected.
def test_create_process_job_rejects_invalid_crop() -> None:
    response = client.post(
        "/process",
        data={"duration": 30, "crop": "invalid", "startTime": 0, "endTime": 30},
        files={"file": ("clip.mp4", b"data", "video/mp4")},
    )

    assert response.status_code == 422


# Verify that invalid time ranges are rejected.
def test_create_process_job_rejects_reversed_range() -> None:
    response = client.post(
        "/process",
        data={"duration": 30, "crop": "none", "startTime": 50, "endTime": 30},
        files={"file": ("clip.mp4", b"data", "video/mp4")},
    )

    assert response.status_code == 422


# Verify that a job can be created and then polled.
def test_create_process_job_and_poll_status(monkeypatch) -> None:
    monkeypatch.setattr(
        "api.routes.process.build_job_id",
        lambda: "2026-05-02_14-46-43_123456",
    )

    # Complete the background job immediately for deterministic polling.
    def fake_process_job(store, job_id, upload_path, crop, duration, start_time, end_time):
        store.update_job(
            job_id,
            status=JobState.SUCCESS,
            progress=100,
            message="Processing completed.",
            outputs=[
                {
                    "name": "chunk_001.mp4",
                    "relative_path": f"{job_id}/chunk_001.mp4",
                    "url": f"/outputs/{job_id}/chunk_001.mp4",
                }
            ],
            error=None,
        )

    monkeypatch.setattr("api.routes.process.process_job", fake_process_job)

    create_response = client.post(
        "/process",
        data={"duration": 30, "crop": "none", "startTime": 120, "endTime": 180},
        files={"file": ("clip.mp4", b"data", "video/mp4")},
    )

    assert create_response.status_code == 202
    payload = create_response.json()
    assert payload["jobId"] == "2026-05-02_14-46-43_123456"
    assert payload["status"] == JobState.QUEUED

    status_response = client.get(f"/jobs/{payload['jobId']}")

    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["status"] == JobState.SUCCESS
    assert status_payload["startTime"] == 120
    assert status_payload["endTime"] == 180
    assert status_payload["outputs"][0]["name"] == "chunk_001.mp4"
    job_store.update_job(payload["jobId"], outputs=[])
