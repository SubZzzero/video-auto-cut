"""Processing endpoints."""

import logging
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from api.deps import get_job_store
from api.services.job_store import JobStore
from api.services.processing_service import process_job
from app.config import (
    DEFAULT_CHUNK_DURATION,
    DEFAULT_CROP_MODE,
    DEFAULT_PROCESS_MODE,
    SUPPORTED_CROP_MODES,
    SUPPORTED_PROCESS_MODES,
    build_job_id,
    ensure_runtime_directories,
    resolve_upload_path,
)
from app.schemas import JobResponse, JobStatusResponse

router = APIRouter(tags=["process"])
logger = logging.getLogger(__name__)


# Validate one processing mode string.
def validate_mode(mode: str) -> str:
    if mode not in SUPPORTED_PROCESS_MODES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Unsupported mode.",
        )
    return mode


# Validate one crop mode string.
def validate_crop(crop: str) -> str:
    if crop not in SUPPORTED_CROP_MODES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Unsupported crop mode.",
        )
    return crop


# Persist one uploaded file to the temp directory.
async def persist_upload_file(job_id: str, upload: UploadFile) -> Path:
    if upload.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    upload_path = resolve_upload_path(job_id, upload.filename)
    content = await upload.read()
    upload_path.write_bytes(content)
    logger.info("Saved upload for job %s to %s.", job_id, upload_path)
    return upload_path


# Create one background processing job from a multipart upload.
@router.post("/process", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_process_job(
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File()],
    job_store: Annotated[JobStore, Depends(get_job_store)],
    mode: Annotated[str, Form()] = DEFAULT_PROCESS_MODE,
    duration: Annotated[int, Form()] = DEFAULT_CHUNK_DURATION,
    crop: Annotated[str, Form()] = DEFAULT_CROP_MODE,
) -> JobResponse:
    """Create one video processing job."""

    ensure_runtime_directories()
    validated_mode = validate_mode(mode)
    validated_crop = validate_crop(crop)
    if duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Duration must be positive.",
        )

    job_id = build_job_id()
    upload_path = await persist_upload_file(job_id, file)
    job = job_store.create_job(
        job_id,
        file.filename or upload_path.name,
        validated_mode,
        validated_crop,
        duration,
    )
    logger.info("Created processing job %s for %s.", job_id, job["fileName"])
    background_tasks.add_task(
        process_job,
        job_store,
        job_id,
        upload_path,
        validated_mode,
        validated_crop,
        duration,
    )
    return JobResponse.model_validate(job)


# Return one polled job payload for the frontend queue.
@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    job_store: Annotated[JobStore, Depends(get_job_store)],
) -> JobStatusResponse:
    """Return the current status of one job."""

    job = job_store.get_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    logger.info("Returned status %s for job %s.", job["status"], job_id)
    return JobStatusResponse.model_validate(job)
