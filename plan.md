# Video Auto Cutter Plan

## Purpose

This repository already contains the intended local MVP.
The plan is no longer a build-from-zero roadmap.
It is the source of truth for the current product scope, architecture, and safe follow-up work.

## Current Product State

- Local-only video processing web app.
- Backend: FastAPI API with background jobs and static output serving.
- Frontend: React + Vite UI with batch queue, local preview, crop preset editing, and polling progress.
- Processing flow: upload file -> create job -> process selected range into clips -> poll job status -> open generated outputs.

## Delivered Scope

### Backend

- `POST /process` accepts multipart uploads and processing settings.
- `GET /jobs/{job_id}` returns queue status, progress, selected range, crop settings, outputs, and errors.
- `GET /health` returns a lightweight health payload.
- Background processing runs through `api/services/processing_service.py`.
- Outputs are served from `/outputs`.

### Video Processing

- Selected range trimming with `startTime` and `endTime`.
- Fixed-duration chunk splitting inside the selected range.
- Deterministic crop presets: `none`, `vertical`, `portrait_4_5`, `square_1_1`, `portrait_3_4`, `horizontal`.
- Manual crop repositioning from the frontend preview.
- FFmpeg-based rendering and OpenCV-based metadata/frame-size reads.

### Frontend

- Multi-file local upload queue.
- Per-file local preview before upload.
- Start/end time editing with text inputs and sliders.
- Crop overlay preview with draggable placement for crop presets.
- Sequential queue processing so one failed file does not stop the rest.
- Polling-based progress updates.
- Output links for generated clips.
- UI translations for `EN`, `RU`, and `UA`.

### Tooling

- One-command local start with `python3 scripts/run_local.py`.
- Python linting with Ruff.
- Frontend linting with ESLint.
- Backend tests with Pytest.
- Frontend tests with Vitest.

## Explicit Non-Scope

The current codebase does not implement these older roadmap ideas and the plan should not claim them:

- face detection
- subject tracking
- scene detection
- silence detection
- cloud processing
- heavy ML inference

## Architecture Rules

- Keep the app local-only.
- Preserve the existing flow: UI -> API -> background job -> `app/video` -> polling -> `/outputs`.
- Prefer backend-first changes when a feature touches both API and UI.
- Keep UI components small and focused.
- Put editable values in dedicated config/constants files.
- Keep project text and code in English.
- Add a short useful comment above every function.

## Repository Structure

```text
app/      reusable video processing logic
api/      FastAPI entrypoints and job orchestration
ui/       React + Vite frontend
tests/    backend tests
scripts/  local automation helpers
```

## Safe Follow-Up Work

### Maintenance

- Remove dead code only after confirming it has no runtime or test references.
- Remove generated artifacts and placeholder directories only when they are not part of the documented workflow.
- Keep README aligned with the actual shipped feature set.

### Functional Extensions

- Improve queue ergonomics without changing the local-only model.
- Add stronger validation and error reporting around uploads and processing failures.
- Expand automated test coverage around real edited paths.
- Improve packaging only after there is a concrete delivery target for it.

## Validation Expectations

- Do not run manual runtime verification unless explicitly requested.
- After backend changes, run targeted backend tests and Ruff.
- After frontend changes, run targeted frontend tests and ESLint.
- Prefer the smallest correct change over speculative refactors.
