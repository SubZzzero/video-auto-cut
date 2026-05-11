"""In-memory job state storage."""

from copy import deepcopy
from threading import Lock

from app.schemas import CropMode, JobState


class JobStore:
    """Store and update job metadata for polling."""

    # Initialize the in-memory store.
    def __init__(self) -> None:
        self._jobs: dict[str, dict] = {}
        self._lock = Lock()

    # Create a new queued job entry.
    def create_job(
        self,
        job_id: str,
        file_name: str,
        crop: str,
        crop_x: int | None,
        crop_y: int | None,
        duration: int,
        start_time: float,
        end_time: float,
    ) -> dict:
        job = {
            "jobId": job_id,
            "fileName": file_name,
            "crop": CropMode(crop),
            "cropX": crop_x,
            "cropY": crop_y,
            "duration": duration,
            "startTime": start_time,
            "endTime": end_time,
            "status": JobState.QUEUED,
            "progress": 0,
            "message": "Job queued.",
            "outputs": [],
            "error": None,
            "cancelRequested": False,
        }
        with self._lock:
            self._jobs[job_id] = job
        return deepcopy(job)

    # Return a copy of one stored job.
    def get_job(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
        return deepcopy(job) if job else None

    # Update one job with partial data.
    def update_job(self, job_id: str, **fields: object) -> dict:
        with self._lock:
            if job_id not in self._jobs:
                raise KeyError(job_id)
            self._jobs[job_id].update(fields)
            return deepcopy(self._jobs[job_id])

    # Mark one job for cancellation and update its visible state when possible.
    def request_cancel(self, job_id: str) -> dict:
        with self._lock:
            if job_id not in self._jobs:
                raise KeyError(job_id)

            job = self._jobs[job_id]
            if job["status"] in {JobState.SUCCESS, JobState.ERROR, JobState.CANCELLED}:
                return deepcopy(job)

            job["cancelRequested"] = True
            if job["status"] == JobState.QUEUED:
                job.update(
                    status=JobState.CANCELLED,
                    message="Processing cancelled.",
                    error=None,
                )
            else:
                job.update(message="Cancelling processing.")
            return deepcopy(job)

    # Return whether one job has a pending cancellation request.
    def is_cancel_requested(self, job_id: str) -> bool:
        with self._lock:
            if job_id not in self._jobs:
                raise KeyError(job_id)
            return bool(self._jobs[job_id].get("cancelRequested", False))
