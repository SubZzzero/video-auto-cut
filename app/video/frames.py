"""OpenCV frame metadata helpers."""

from pathlib import Path


# Import cv2 lazily so the app can fail with a readable error.
def import_cv2():
    try:
        import cv2  # type: ignore
    except ImportError as error:  # pragma: no cover - import path depends on environment.
        raise RuntimeError("OpenCV is not installed.") from error

    return cv2


# Read stable frame size metadata from one open capture.
def read_capture_size(capture, cv2) -> tuple[int, int]:
    frame_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if frame_width <= 0 or frame_height <= 0:
        raise RuntimeError("Unable to read the first frame from the uploaded video.")

    return frame_width, frame_height


# Read frame dimensions from the first decodable video frame.
def read_frame_size(video_path: Path) -> tuple[int, int]:
    cv2 = import_cv2()
    capture = cv2.VideoCapture(str(video_path))
    success, frame = capture.read()
    frame_width, frame_height = read_capture_size(capture, cv2)
    capture.release()

    if not success or frame is None:
        raise RuntimeError("Unable to read the first frame from the uploaded video.")

    return frame_width, frame_height
