"""Project-wide runtime configuration."""

import os
import sys
from datetime import datetime
from pathlib import Path

from app.utils.files import clear_directory, sanitize_stem

APP_NAME = "VideoAutoCutter"
SOURCE_ROOT_DIR = Path(__file__).resolve().parent.parent
SERVE_UI_ENV_VAR = "VIDEO_AUTO_CUTTER_SERVE_UI"
DATA_DIR_ENV_VAR = "VIDEO_AUTO_CUTTER_DATA_DIR"
FFMPEG_PATH_ENV_VAR = "VIDEO_AUTO_CUTTER_FFMPEG"
DEFAULT_LOCAL_HOST = "127.0.0.1"
DEFAULT_LOCAL_PORT = 8765
DEV_FRONTEND_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")

DEFAULT_CHUNK_DURATION = 30
DEFAULT_CROP_MODE = "none"
JOB_ID_TIMESTAMP_FORMAT = "%Y-%m-%d_%H-%M-%S_%f"

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


# Detect whether the app is running from a packaged executable.
def is_packaged_application() -> bool:
    return bool(getattr(sys, "frozen", False))


# Resolve the application root for source mode or packaged mode.
def get_application_root() -> Path:
    if is_packaged_application():
        return Path(sys.executable).resolve().parent

    return SOURCE_ROOT_DIR


# Resolve the frontend build directory used by production serving.
def get_ui_dist_directory() -> Path:
    return get_application_root() / "ui" / "dist"


# Resolve the Windows local app data directory with a safe fallback.
def get_windows_local_app_data_directory() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data)

    return Path.home() / "AppData" / "Local"


# Resolve the writable runtime base directory for the current mode.
def get_runtime_base_directory() -> Path:
    configured_directory = os.environ.get(DATA_DIR_ENV_VAR)
    if configured_directory:
        return Path(configured_directory).expanduser().resolve()

    if is_packaged_application() and sys.platform == "win32":
        return get_windows_local_app_data_directory() / APP_NAME

    if is_packaged_application():
        return Path.home() / f".{APP_NAME.lower()}"

    return SOURCE_ROOT_DIR


# Resolve whether FastAPI should serve the built frontend.
def should_serve_frontend() -> bool:
    configured_value = os.environ.get(SERVE_UI_ENV_VAR)
    if configured_value is not None:
        return configured_value == "1"

    return is_packaged_application()


# Resolve the bundled ffmpeg binary location beside the packaged app.
def get_bundled_ffmpeg_path() -> Path:
    executable_name = "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"
    return get_application_root() / "ffmpeg" / executable_name


OUTPUTS_DIR = get_runtime_base_directory() / "outputs"
TEMP_DIR = get_runtime_base_directory() / "temp"
UI_DIST_DIR = get_ui_dist_directory()


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
