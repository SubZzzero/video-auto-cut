from pathlib import Path

import pytest

from app.config import FFMPEG_PATH_ENV_VAR
from app.video import ffmpeg


# Verify that an explicit FFmpeg path override is used first.
def test_resolve_ffmpeg_executable_uses_configured_override(monkeypatch, tmp_path) -> None:
    configured_binary = tmp_path / "ffmpeg.exe"
    configured_binary.write_bytes(b"binary")
    monkeypatch.setenv(FFMPEG_PATH_ENV_VAR, str(configured_binary))

    resolved_executable = ffmpeg.resolve_ffmpeg_executable()

    assert resolved_executable == str(configured_binary.resolve())


# Verify that a packaged FFmpeg binary is preferred over PATH.
def test_resolve_ffmpeg_executable_uses_bundled_binary(monkeypatch, tmp_path) -> None:
    bundled_binary = tmp_path / "ffmpeg.exe"
    bundled_binary.write_bytes(b"binary")
    monkeypatch.delenv(FFMPEG_PATH_ENV_VAR, raising=False)
    monkeypatch.setattr(ffmpeg, "get_bundled_ffmpeg_path", lambda: bundled_binary)
    monkeypatch.setattr(ffmpeg.shutil, "which", lambda name: "/usr/bin/ffmpeg")

    resolved_executable = ffmpeg.resolve_ffmpeg_executable()

    assert resolved_executable == str(bundled_binary)


# Verify that FFmpeg falls back to PATH in development.
def test_resolve_ffmpeg_executable_falls_back_to_path(monkeypatch) -> None:
    monkeypatch.delenv(FFMPEG_PATH_ENV_VAR, raising=False)
    monkeypatch.setattr(ffmpeg, "get_bundled_ffmpeg_path", lambda: Path("/missing/ffmpeg"))
    monkeypatch.setattr(ffmpeg.shutil, "which", lambda name: "/usr/bin/ffmpeg")

    resolved_executable = ffmpeg.resolve_ffmpeg_executable()

    assert resolved_executable == "/usr/bin/ffmpeg"


# Verify that a clear error is raised when FFmpeg cannot be resolved.
def test_resolve_ffmpeg_executable_raises_when_missing(monkeypatch) -> None:
    monkeypatch.delenv(FFMPEG_PATH_ENV_VAR, raising=False)
    monkeypatch.setattr(ffmpeg, "get_bundled_ffmpeg_path", lambda: Path("/missing/ffmpeg"))
    monkeypatch.setattr(ffmpeg.shutil, "which", lambda name: None)

    with pytest.raises(RuntimeError, match="FFmpeg is not available"):
        ffmpeg.resolve_ffmpeg_executable()
