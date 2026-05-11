"""Cancellation helpers for cooperative processing."""

from collections.abc import Callable

CancelCallback = Callable[[], bool] | None


class ProcessingCancelledError(RuntimeError):
    """Raised when one processing job is cancelled cooperatively."""


# Stop processing when one cancel callback reports a pending request.
def ensure_not_cancelled(should_cancel: CancelCallback) -> None:
    if should_cancel and should_cancel():
        raise ProcessingCancelledError("Processing cancelled.")
