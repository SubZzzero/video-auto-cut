"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes.process import router as process_router
from app.config import OUTPUTS_DIR, cleanup_temp_directory, ensure_runtime_directories

ensure_runtime_directories()
cleanup_temp_directory()

app = FastAPI(title="Video Auto Cutter", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(process_router)
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")


# Return a lightweight health payload.
@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
