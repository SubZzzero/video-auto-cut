"""In-memory job state storage."""

from copy import deepcopy
from threading import Lock

from app.schemas import CropMode, JobState, ProcessMode


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
        mode: str,
        crop: str,
        duration: int,
    ) -> dict:
        job = {
            "jobId": job_id,
            "fileName": file_name,
            "mode": ProcessMode(mode),
            "crop": CropMode(crop),
            "duration": duration,
            "status": JobState.QUEUED,
            "progress": 0,
            "message": "Job queued.",
            "outputs": [],
            "error": None,
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
