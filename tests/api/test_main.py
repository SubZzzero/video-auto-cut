from fastapi.testclient import TestClient

from api.main import create_application


# Verify that production mode serves the built frontend entrypoint.
def test_create_application_serves_built_frontend(tmp_path) -> None:
    ui_dist_directory = tmp_path / "ui" / "dist"
    assets_directory = ui_dist_directory / "assets"
    assets_directory.mkdir(parents=True)
    index_path = ui_dist_directory / "index.html"
    index_path.write_text("<html><body>frontend</body></html>", encoding="utf-8")
    asset_path = assets_directory / "app.js"
    asset_path.write_text("console.log('frontend')", encoding="utf-8")

    application = create_application(
        serve_frontend=True,
        ui_dist_directory=ui_dist_directory,
    )
    client = TestClient(application)

    index_response = client.get("/")
    route_response = client.get("/queue")
    asset_response = client.get("/assets/app.js")

    assert index_response.status_code == 200
    assert "frontend" in index_response.text
    assert route_response.status_code == 200
    assert "frontend" in route_response.text
    assert asset_response.status_code == 200
    assert "console.log" in asset_response.text


# Verify that API routes still work when built frontend serving is enabled.
def test_create_application_keeps_api_routes_with_frontend_enabled(tmp_path) -> None:
    ui_dist_directory = tmp_path / "ui" / "dist"
    ui_dist_directory.mkdir(parents=True)
    index_path = ui_dist_directory / "index.html"
    index_path.write_text("<html><body>frontend</body></html>", encoding="utf-8")

    application = create_application(
        serve_frontend=True,
        ui_dist_directory=ui_dist_directory,
    )
    client = TestClient(application)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
