"""Background processing service."""

import logging
from pathlib import Path

from api.services.job_store import JobStore
from app.schemas import JobState
from app.utils.files import remove_path
from app.video.processor import ProcessOptions, VideoProcessor

logger = logging.getLogger(__name__)


# Process one job and persist progress into the job store.
def process_job(
    job_store: JobStore,
    job_id: str,
    upload_path: Path,
    crop: str,
    duration: int,
    start_time: float,
    end_time: float,
) -> None:
    processor = VideoProcessor()
    logger.info("Started background processing for job %s.", job_id)

    # Push progress messages into the shared store.
    def update_progress(progress: int, message: str) -> None:
        job_store.update_job(
            job_id,
            status=JobState.PROCESSING,
            progress=progress,
            message=message,
        )

    try:
        outputs = processor.process(
            ProcessOptions(
                job_id=job_id,
                source_path=upload_path,
                crop_mode=crop,
                duration=duration,
                start_time=start_time,
                end_time=end_time,
            ),
            update_progress,
        )
        job_store.update_job(
            job_id,
            status=JobState.SUCCESS,
            progress=100,
            message="Processing completed.",
            outputs=outputs,
            error=None,
        )
        logger.info("Completed background processing for job %s.", job_id)
    except Exception as error:  # pragma: no cover - broad by design for background jobs.
        logger.exception("Background processing failed for job %s.", job_id)
        job_store.update_job(
            job_id,
            status=JobState.ERROR,
            message="Processing failed.",
            error=str(error),
        )
    finally:
        remove_path(upload_path.parent)
        logger.info("Removed temporary upload directory for job %s.", job_id)
