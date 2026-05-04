"""Project-wide runtime configuration."""

from datetime import datetime
from pathlib import Path

from app.utils.files import clear_directory, sanitize_stem

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = ROOT_DIR / "outputs"
TEMP_DIR = ROOT_DIR / "temp"

DEFAULT_CHUNK_DURATION = 30
DEFAULT_SCENE_MIN_DURATION = 8
DEFAULT_CROP_MODE = "none"
DEFAULT_PROCESS_MODE = "chunk"
DEFAULT_POLL_INTERVAL_MS = 1500
JOB_ID_TIMESTAMP_FORMAT = "%Y-%m-%d_%H-%M-%S_%f"
MAX_BATCH_SIZE = 10

SUPPORTED_PROCESS_MODES = ("chunk", "scenes")
SUPPORTED_CROP_MODES = (
    "none",
    "vertical",
    "portrait_4_5",
    "square_1_1",
    "portrait_3_4",
    "horizontal",
)

VERTICAL_RATIO = 9 / 16
PORTRAIT_4_5_RATIO = 4 / 5
SQUARE_1_1_RATIO = 1
PORTRAIT_3_4_RATIO = 3 / 4
HORIZONTAL_RATIO = 16 / 9


# Create runtime directories used by the backend.
def ensure_runtime_directories() -> None:
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


# Remove stale temporary uploads from previous runs.
def cleanup_temp_directory() -> None:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    clear_directory(TEMP_DIR)


# Build a readable job id from the local date and time.
def build_job_id(now: datetime | None = None) -> str:
    current_time = now or datetime.now()
    return current_time.strftime(JOB_ID_TIMESTAMP_FORMAT)


# Resolve the output directory for one job.
def resolve_output_directory(job_id: str) -> Path:
    directory = OUTPUTS_DIR / job_id
    directory.mkdir(parents=True, exist_ok=True)
    return directory


# Resolve the temporary upload path for one job.
def resolve_upload_path(job_id: str, filename: str) -> Path:
    upload_directory = TEMP_DIR / job_id
    upload_directory.mkdir(parents=True, exist_ok=True)
    safe_name = f"{sanitize_stem(filename)}{Path(filename).suffix}"
    return upload_directory / safe_name
