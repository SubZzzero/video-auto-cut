"""Dependency providers for the API package."""

from api.services.job_store import JobStore

job_store = JobStore()


# Return the shared in-memory job store.
def get_job_store() -> JobStore:
    return job_store
