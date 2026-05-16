"""Start the backend and frontend with one command."""

import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
UI_DIR = ROOT_DIR / "ui"
VENV_PYTHON_CANDIDATES = (
    ROOT_DIR / ".venv" / "bin" / "python",
    ROOT_DIR / ".venv" / "Scripts" / "python.exe",
)
DEFAULT_LOCAL_HOST = '127.0.0.1'
DEFAULT_BACKEND_PORT = 8000
DEFAULT_FRONTEND_PORT = 5173
MAX_AUTO_PORT_SEARCH = 20
DEFAULT_DEV_API_BASE_URL = f'http://{DEFAULT_LOCAL_HOST}:{DEFAULT_BACKEND_PORT}'
DEFAULT_BROWSER_URL = f'http://localhost:{DEFAULT_FRONTEND_PORT}'
BACKEND_HEALTH_PATH = '/health'
FRONTEND_TITLE_MARKER = '<title>Video Auto Cutter</title>'


# Resolve the preferred Python executable for local development.
def resolve_python_executable() -> str:
    for candidate in VENV_PYTHON_CANDIDATES:
        if candidate.exists():
            return str(candidate)

    return str(Path(sys.executable))


# Start a subprocess in one working directory.
def start_process(
    command: list[str],
    workdir: Path,
    env: dict[str, str] | None = None,
) -> subprocess.Popen:
    return subprocess.Popen(
    command,
    cwd=workdir,
    env=env,
    shell=sys.platform == "win32",
)


# Keep the frontend pointed at the local backend unless overridden explicitly.
def build_frontend_environment(api_base_url: str) -> dict[str, str]:
    frontend_environment = os.environ.copy()
    frontend_environment.setdefault('VITE_API_BASE_URL', api_base_url)
    return frontend_environment


# Return whether one TCP port already has a listener.
def is_port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
        client_socket.settimeout(0.2)
        return client_socket.connect_ex((host, port)) == 0


# Read one local HTTP endpoint when it is already available.
def read_url(url: str) -> str | None:
    try:
        with urllib.request.urlopen(url, timeout=1) as response:
            return response.read().decode('utf-8', errors='ignore')
    except (OSError, TimeoutError, urllib.error.URLError):
        return None


# Return whether the backend on one port is already this app.
def is_backend_running(port: int) -> bool:
    payload = read_url(f'http://{DEFAULT_LOCAL_HOST}:{port}{BACKEND_HEALTH_PATH}')
    return payload == '{"status":"ok"}'


# Return whether the default frontend port already serves this app.
def is_frontend_running() -> bool:
    payload = read_url(f'http://{DEFAULT_LOCAL_HOST}:{DEFAULT_FRONTEND_PORT}')
    return payload is not None and FRONTEND_TITLE_MARKER in payload


# Find the first free localhost port, starting from the preferred value.
def find_available_port(host: str, preferred_port: int) -> int:
    for port in range(preferred_port, preferred_port + MAX_AUTO_PORT_SEARCH + 1):
        if not is_port_in_use(host, port):
            return port

    raise RuntimeError(f'No free port found starting at {preferred_port}.')


# Resolve whether to reuse the default backend or start a new one.
def resolve_backend_url() -> tuple[str, bool]:
    if is_backend_running(DEFAULT_BACKEND_PORT):
        return DEFAULT_DEV_API_BASE_URL, False

    backend_port = find_available_port(DEFAULT_LOCAL_HOST, DEFAULT_BACKEND_PORT)
    return f'http://{DEFAULT_LOCAL_HOST}:{backend_port}', True


# Open the browser without failing the launcher when desktop integration is unavailable.
def open_browser(url: str) -> None:
    try:
        webbrowser.open(url)
    except webbrowser.Error:
        return


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
    backend_url, should_start_backend = resolve_backend_url()
    backend_port = int(backend_url.rsplit(':', 1)[1])
    backend_command = [
        python_executable,
        '-m',
        'uvicorn',
        'api.main:app',
        '--reload',
        '--host',
        DEFAULT_LOCAL_HOST,
        '--port',
        str(backend_port),
    ]
    frontend_command = ['npm', 'run', 'dev', '--', '--open']

    if is_frontend_running() and not should_start_backend:
        print(f'Video Auto Cutter is already running at {DEFAULT_BROWSER_URL}.')
        open_browser(DEFAULT_BROWSER_URL)
        return 0

    if should_start_backend and backend_url != DEFAULT_DEV_API_BASE_URL:
        print(f'Default backend port 8000 is busy, using {backend_url} instead.')
    elif not should_start_backend:
        print(f'Reusing running backend at {backend_url}.')

    processes: list[subprocess.Popen] = []
    if should_start_backend:
        processes.append(start_process(backend_command, ROOT_DIR))
    processes.append(start_process(frontend_command, UI_DIR, env=build_frontend_environment(backend_url)))

    try:
        return monitor_processes(processes)
    finally:
        stop_processes(processes)


if __name__ == '__main__':
    raise SystemExit(main())
