"""Shared API and processing schemas."""

from enum import Enum

from pydantic import BaseModel, Field


class CropMode(str, Enum):
    """Supported crop modes."""

    NONE = "none"
    VERTICAL = "vertical"
    PORTRAIT_4_5 = "portrait_4_5"
    SQUARE_1_1 = "square_1_1"
    PORTRAIT_3_4 = "portrait_3_4"
    HORIZONTAL = "horizontal"


class JobState(str, Enum):
    """Supported job states."""

    QUEUED = "queued"
    PROCESSING = "processing"
    SUCCESS = "success"
    ERROR = "error"


class OutputFileResponse(BaseModel):
    """Describe one processed output file."""

    name: str
    relative_path: str
    url: str


class JobResponse(BaseModel):
    """Describe the initial job creation response."""

    job_id: str = Field(alias="jobId")
    status: JobState
    progress: int
    message: str


class JobStatusResponse(BaseModel):
    """Describe the full job polling response."""

    job_id: str = Field(alias="jobId")
    file_name: str = Field(alias="fileName")
    crop: CropMode
    duration: int
    start_time: float = Field(alias="startTime")
    end_time: float = Field(alias="endTime")
    status: JobState
    progress: int
    message: str
    outputs: list[OutputFileResponse] = Field(default_factory=list)
    error: str | None = None
