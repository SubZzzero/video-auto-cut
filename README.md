# Video Auto Cutter

Video Auto Cutter is a local-only web app for splitting videos by fixed duration or scene changes, with optional centered crop presets for vertical, portrait, square, and horizontal output.

## Features

- Fixed-duration chunk splitting
- Scene-based splitting with PySceneDetect
- Centered crop presets for `vertical`, `portrait_4_5`, `square_1_1`, `portrait_3_4`, and `horizontal`
- Batch queue processing in the UI
- Polling-based progress updates
- Local HTML5 preview before upload
- UI language switcher with `EN`, `RU`, and `UA`
- One-command local start after dependency setup

## Stack

- Python
- FastAPI
- FFmpeg
- OpenCV
- PySceneDetect
- React
- Vite
- Axios

## Project Structure

```text
app/      reusable video processing logic
api/      FastAPI entrypoints and job orchestration
ui/       React + Vite frontend
tests/    backend tests
scripts/  local automation helpers
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- FFmpeg available on `PATH`

## Install Python Dependencies

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
```

## Install Frontend Dependencies

```bash
cd ui
npm install
```

## Run With One Command

```bash
python3 scripts/run_local.py
```

This launcher starts:

- FastAPI on `http://localhost:8000`
- Vite on `http://localhost:5173`

It does not open a browser window automatically.

## Manual Run Commands

Backend:

```bash
.venv/bin/uvicorn api.main:app --reload
```

Frontend:

```bash
cd ui
npm run dev
```

## API

### `POST /process`

Multipart fields:

- `file`
- `mode`: `chunk` or `scenes`
- `duration`: positive integer seconds
- `crop`: `none`, `vertical`, `portrait_4_5`, `square_1_1`, `portrait_3_4`, or `horizontal`

Duration behavior:

- `chunk`: target clip length
- `scenes`: keeps detected scene boundaries and ignores the duration input

Scene fallback behavior:

- if no scene boundaries are detected, the full clip is still processed as one output

Response:

- `jobId`
- `status`
- `progress`
- `message`

### `GET /jobs/{job_id}`

Returns current job status, progress, outputs, and any error message.

## Lint

Python:

```bash
ruff check .
```

Frontend:

```bash
cd ui
npm run lint
```

## Tests

Backend:

```bash
pytest --cov=app --cov=api
```

Frontend:

```bash
cd ui
npm run test
```

## Notes

- The app is local-only and does not use cloud services.
- Progress updates use polling instead of websockets to keep the MVP stable.
- Crop presets are deterministic and stay centered on the frame.
