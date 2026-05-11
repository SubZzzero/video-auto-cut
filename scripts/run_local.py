"""Start the backend and frontend with one command."""

import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
UI_DIR = ROOT_DIR / "ui"
VENV_PYTHON_CANDIDATES = (
    ROOT_DIR / ".venv" / "bin" / "python",
    ROOT_DIR / ".venv" / "Scripts" / "python.exe",
)


# Resolve the preferred Python executable for local development.
def resolve_python_executable() -> str:
    for candidate in VENV_PYTHON_CANDIDATES:
        if candidate.exists():
            return str(candidate)

    return str(Path(sys.executable))


# Start a subprocess in one working directory.
def start_process(command: list[str], workdir: Path) -> subprocess.Popen:
    return subprocess.Popen(command, cwd=workdir)


# Stop child processes when the launcher exits.
def stop_processes(processes: list[subprocess.Popen]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    for process in processes:
        if process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


# Keep the launcher alive until one child exits or the user interrupts it.
def monitor_processes(processes: list[subprocess.Popen]) -> int:
    try:
        while True:
            for process in processes:
                if process.poll() is not None:
                    return process.returncode or 0
            time.sleep(0.5)
    except KeyboardInterrupt:
        return 0


# Start both development servers with one command.
def main() -> int:
    python_executable = resolve_python_executable()
    backend_command = [python_executable, '-m', 'uvicorn', 'api.main:app', '--reload']
    frontend_command = ['npm', 'run', 'dev']

    processes = [
        start_process(backend_command, ROOT_DIR),
        start_process(frontend_command, UI_DIR),
    ]

    try:
        return monitor_processes(processes)
    finally:
        stop_processes(processes)


if __name__ == '__main__':
    raise SystemExit(main())
