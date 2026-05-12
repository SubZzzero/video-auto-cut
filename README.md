# Video Auto Cutter

Local-only web app for trimming a selected video range, splitting it into clips, and exporting them with optional crop presets.

![Video Auto Cutter](img/main.png)

## What It Does

- Trim only the part of the video you need
- Split the selected range into fixed-length clips
- Use crop presets with manual positioning in the preview
- Process multiple files in a queue
- Track progress directly in the browser

## Requirements

- Python 3.11+
- Node.js 20+
- npm
- FFmpeg available on `PATH`

## Run From Repository

1. Download this repository or clone it.
2. Create a virtual environment and install backend dependencies:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
```

3. Install frontend dependencies:

```bash
cd ui
npm install
```

4. Start backend and frontend with one command:

```bash
python3 scripts/run_local.py
```

5. Open `http://localhost:5173` in your browser.

The API runs on `http://localhost:8000`.

## Windows Build

A ready-made Windows build is planned for the repository `Releases` section.
