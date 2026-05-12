# Video Auto Cutter

Local web app for cutting videos: choose an exact range, split it into clips of a fixed length, and optionally apply a crop preset.

![Video Auto Cutter](img/main.png)

## What It Does

- Trim only the part of the video you need
- Split the selected range into fixed-length clips
- Apply crop presets and move the crop area in the preview
- Process multiple files in a queue
- Show progress directly in the browser

## Requirements

- Python 3.11 or newer
- Node.js 20 or newer
- npm
- FFmpeg available from the terminal

## Quick Check Before You Start

If the commands below print version numbers, the required tools are already installed.

### Windows

Open PowerShell and run:

```powershell
py --version
node --version
npm --version
ffmpeg -version
```

### macOS / Linux

Open a terminal and run:

```bash
python3 --version
node --version
npm --version
ffmpeg -version
```

If any command is not found, install that tool first and then reopen the terminal.

## Easiest Way to Run on Windows

1. Download the project as a ZIP file or clone the repository.
2. Extract it and open the project folder.
3. Open PowerShell in that folder.
4. Run these commands one by one:

```powershell
py -m venv .venv
.venv\Scripts\pip install -r requirements.txt
cd ui
npm install
cd ..
.venv\Scripts\python scripts\run_local.py
```

5. Your browser should open automatically.
6. If it does not, open the `Local` URL shown in the terminal.
7. Keep the PowerShell window open while the app is running.
8. To stop the app, go back to PowerShell and press `Ctrl+C`.

Notes:

- `npm install` may take a few minutes the first time.
- Finished clips will appear in the `outputs` folder in the project root.
- `scripts/run_local.py` automatically connects the frontend to the backend it starts locally.
- Most users do not need to type the URL manually.
- If port `8000` or `5173` is already busy, `scripts/run_local.py` uses the next available local port automatically.

## Easiest Way to Run on macOS / Linux

1. Download the project as a ZIP file or clone the repository.
2. Open a terminal in the project folder.
3. Run these commands one by one:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ui
npm install
cd ..
.venv/bin/python scripts/run_local.py
```

4. Your browser should open automatically.
5. If it does not, open the `Local` URL shown in the terminal.
6. To stop the app, press `Ctrl+C` in the terminal.

Notes:

- `scripts/run_local.py` automatically connects the frontend to the backend it starts locally.
- Finished clips will appear in the `outputs` folder in the project root.
- If port `8000` or `5173` is already busy, `scripts/run_local.py` uses the next available local port automatically.

## If the One-Command Start Does Not Work

Sometimes it is easier to start the backend and frontend separately in two terminal windows.

### Windows

Window 1:

```powershell
.venv\Scripts\python -m uvicorn api.main:app --reload
```

Window 2:

```powershell
cd ui
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
npm run dev
```

### macOS / Linux

Window 1:

```bash
.venv/bin/python -m uvicorn api.main:app --reload
```

Window 2:

```bash
cd ui
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Then open `http://localhost:5173`.

## Common Problems

### `ffmpeg` is not found

FFmpeg is not installed or is not available in `PATH`. Install it and reopen the terminal.

### `py` is not found on Windows

Try using `python` instead of `py`. If that does not help, reinstall Python and enable the option to add it to `PATH`.

### `node` or `npm` are not found

Install Node.js and then reopen the terminal.

### The browser does not open automatically

Check the terminal output for the `Local` URL and open it manually. If one of the commands failed, the error message will also be printed there. If port `5173` or `8000` is already being used, `scripts/run_local.py` should fall back to another free local port automatically.

### The page opens, but the app cannot reach the backend

If you started the frontend manually with `npm run dev`, make sure `VITE_API_BASE_URL` points to `http://127.0.0.1:8000` before starting Vite.

## Ready-Made Windows Build

A ready-made Windows installer is not published yet. For now, the app runs from source using the steps above.

Technical steps for building a Windows installer are available in `windows-installer-steps.txt`.
