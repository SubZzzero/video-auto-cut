"""Launch the packaged local app and open it in the browser."""

import os
import socket
import threading
import time
import urllib.request
import webbrowser

import uvicorn

from app.config import DEFAULT_LOCAL_HOST, DEFAULT_LOCAL_PORT, SERVE_UI_ENV_VAR

os.environ.setdefault(SERVE_UI_ENV_VAR, "1")

from api.main import app


# Return whether one localhost port can be bound right now.
def is_port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as candidate_socket:
        candidate_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return candidate_socket.connect_ex((host, port)) != 0


# Resolve a free localhost port starting from the preferred default.
def resolve_local_port(host: str, preferred_port: int) -> int:
    configured_port = os.environ.get("VIDEO_AUTO_CUTTER_PORT")
    if configured_port:
        requested_port = int(configured_port)
        if is_port_available(host, requested_port):
            return requested_port

        raise RuntimeError(f"Configured port is already in use: {requested_port}")

    for port in range(preferred_port, preferred_port + 100):
        if is_port_available(host, port):
            return port

    raise RuntimeError("Unable to find a free localhost port for the packaged app.")


# Wait for the backend health endpoint and then open the browser once.
def open_browser_when_ready(application_url: str) -> None:
    healthcheck_url = f"{application_url}/health"
    deadline = time.time() + 30

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(healthcheck_url, timeout=1):
                webbrowser.open(application_url)
                return
        except Exception:
            time.sleep(0.25)


# Start the packaged local server and browser entrypoint.
def main() -> int:
    host = os.environ.get("VIDEO_AUTO_CUTTER_HOST", DEFAULT_LOCAL_HOST)
    port = resolve_local_port(host, DEFAULT_LOCAL_PORT)
    application_url = f"http://{host}:{port}"

    browser_thread = threading.Thread(
        target=open_browser_when_ready,
        args=(application_url,),
        daemon=True,
    )
    browser_thread.start()

    uvicorn.run(app, host=host, port=port, log_level="info")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
