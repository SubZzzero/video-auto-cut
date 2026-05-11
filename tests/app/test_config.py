from datetime import datetime

from app import config


# Verify that job ids use a readable date-and-time format.
def test_build_job_id_uses_readable_timestamp() -> None:
    job_id = config.build_job_id(datetime(2026, 5, 2, 14, 46, 43, 123456))

    assert job_id == "2026-05-02_14-46-43_123456"


# Verify that startup cleanup removes stale temporary upload folders.
def test_cleanup_temp_directory_clears_stale_uploads(monkeypatch, tmp_path) -> None:
    temp_directory = tmp_path / "temp"
    stale_upload_directory = temp_directory / "job-1"
    stale_upload_directory.mkdir(parents=True)
    (stale_upload_directory / "clip.mp4").write_bytes(b"data")

    monkeypatch.setattr(config, "TEMP_DIR", temp_directory)

    config.cleanup_temp_directory()

    assert temp_directory.exists()
    assert list(temp_directory.iterdir()) == []


# Verify that packaged Windows builds use a writable local app data directory.
def test_get_runtime_base_directory_uses_local_app_data_for_packaged_windows(
    monkeypatch,
    tmp_path,
) -> None:
    monkeypatch.setenv("LOCALAPPDATA", str(tmp_path / "LocalAppData"))
    monkeypatch.delenv(config.DATA_DIR_ENV_VAR, raising=False)
    monkeypatch.setattr(config.sys, "frozen", True, raising=False)
    monkeypatch.setattr(config.sys, "platform", "win32")

    runtime_directory = config.get_runtime_base_directory()

    assert runtime_directory == tmp_path / "LocalAppData" / config.APP_NAME


# Verify that an explicit data directory override wins over packaged defaults.
def test_get_runtime_base_directory_uses_configured_override(monkeypatch, tmp_path) -> None:
    configured_directory = tmp_path / "custom-data"
    monkeypatch.setenv(config.DATA_DIR_ENV_VAR, str(configured_directory))

    runtime_directory = config.get_runtime_base_directory()

    assert runtime_directory == configured_directory.resolve()


# Verify that packaged mode serves the built frontend by default.
def test_should_serve_frontend_defaults_to_packaged_mode(monkeypatch) -> None:
    monkeypatch.delenv(config.SERVE_UI_ENV_VAR, raising=False)
    monkeypatch.setattr(config.sys, "frozen", True, raising=False)

    assert config.should_serve_frontend() is True
