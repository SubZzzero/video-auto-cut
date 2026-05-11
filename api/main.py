"""FastAPI application entrypoint."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.routes.process import router as process_router
from app.config import (
    DEV_FRONTEND_ORIGINS,
    OUTPUTS_DIR,
    UI_DIST_DIR,
    cleanup_temp_directory,
    ensure_runtime_directories,
    should_serve_frontend,
)

ensure_runtime_directories()
cleanup_temp_directory()


# Return whether the built frontend is available for same-origin serving.
def has_frontend_build(ui_dist_directory: Path) -> bool:
    return (ui_dist_directory / "index.html").exists()


# Apply development CORS only when the Vite dev server is expected.
def configure_cors(application: FastAPI, serve_frontend: bool) -> None:
    if serve_frontend:
        return

    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(DEV_FRONTEND_ORIGINS),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Resolve one safe frontend file path inside the built UI directory.
def resolve_frontend_path(ui_dist_directory: Path, frontend_path: str) -> Path:
    requested_path = (ui_dist_directory / frontend_path).resolve()
    ui_dist_root = ui_dist_directory.resolve()
    if requested_path.is_file() and requested_path.is_relative_to(ui_dist_root):
        return requested_path

    return ui_dist_directory / "index.html"


# Register frontend routes for the built React bundle.
def configure_frontend_routes(application: FastAPI, ui_dist_directory: Path) -> None:
    assets_directory = ui_dist_directory / "assets"
    if assets_directory.exists():
        application.mount(
            "/assets",
            StaticFiles(directory=assets_directory),
            name="frontend-assets",
        )

    # Serve the built frontend file or fall back to index.html for SPA routes.
    @application.get("/{frontend_path:path}", include_in_schema=False)
    async def serve_frontend(frontend_path: str = "") -> FileResponse:
        return FileResponse(resolve_frontend_path(ui_dist_directory, frontend_path))


# Register the shared health endpoint on one FastAPI application.
def configure_health_route(application: FastAPI) -> None:
    # Return a lightweight health payload.
    @application.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}


# Build the FastAPI application with optional built-frontend serving.
def create_application(
    serve_frontend: bool | None = None,
    ui_dist_directory: Path = UI_DIST_DIR,
) -> FastAPI:
    application = FastAPI(title="Video Auto Cutter", version="0.1.0")
    frontend_serving_enabled = should_serve_frontend() if serve_frontend is None else serve_frontend
    configure_cors(application, frontend_serving_enabled)
    application.include_router(process_router)
    configure_health_route(application)
    application.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

    if frontend_serving_enabled and has_frontend_build(ui_dist_directory):
        configure_frontend_routes(application, ui_dist_directory)

    return application


app = create_application()
