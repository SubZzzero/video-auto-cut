"""Video metadata helpers."""

from pathlib import Path

from app.video.frames import import_cv2


# Read the total duration from one video file.
def get_video_duration(video_path: Path) -> float:
    cv2 = import_cv2()
    capture = cv2.VideoCapture(str(video_path))
    frame_count = float(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    frames_per_second = float(capture.get(cv2.CAP_PROP_FPS))
    capture.release()

    if frame_count <= 0 or frames_per_second <= 0:
        raise RuntimeError("Unable to determine the video duration.")

    return frame_count / frames_per_second
