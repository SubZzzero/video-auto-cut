"""Background processing service."""

import logging
from pathlib import Path

from api.services.job_store import JobStore
from app.config import OUTPUTS_DIR
from app.schemas import JobState
from app.utils.files import remove_path
from app.video.cancellation import ProcessingCancelledError
from app.video.processor import ProcessOptions, VideoProcessor

logger = logging.getLogger(__name__)


# Process one job and persist progress into the job store.
def process_job(
    job_store: JobStore,
    job_id: str,
    upload_path: Path,
    crop: str,
    crop_x: int | None,
    crop_y: int | None,
    duration: int,
    start_time: float,
    end_time: float,
) -> None:
    processor = VideoProcessor()
    logger.info("Started background processing for job %s.", job_id)

    # Return whether the current job has a pending cancellation request.
    def should_cancel() -> bool:
        return job_store.is_cancel_requested(job_id)

    # Push progress messages into the shared store.
    def update_progress(progress: int, message: str) -> None:
        if should_cancel():
            raise ProcessingCancelledError("Processing cancelled.")
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
                crop_x=crop_x,
                crop_y=crop_y,
                duration=duration,
                start_time=start_time,
                end_time=end_time,
            ),
            update_progress,
            should_cancel,
        )
        if should_cancel():
            raise ProcessingCancelledError("Processing cancelled.")
        job_store.update_job(
            job_id,
            status=JobState.SUCCESS,
            progress=100,
            message="Processing completed.",
            outputs=outputs,
            error=None,
        )
        logger.info("Completed background processing for job %s.", job_id)
    except ProcessingCancelledError:
        logger.info("Background processing cancelled for job %s.", job_id)
        remove_path(OUTPUTS_DIR / job_id)
        job_store.update_job(
            job_id,
            status=JobState.CANCELLED,
            message="Processing cancelled.",
            outputs=[],
            error=None,
        )
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
