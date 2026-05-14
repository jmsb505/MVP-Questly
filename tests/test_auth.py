import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.auth import AuthenticatedUser
from backend.app.services.auth import extract_bearer_token, get_current_user


def test_extract_bearer_token() -> None:
    assert extract_bearer_token("Bearer abc123") == "abc123"


def test_extract_bearer_token_rejects_missing_header() -> None:
    with pytest.raises(HTTPException) as exc_info:
        extract_bearer_token(None)

    assert exc_info.value.status_code == 401


def test_auth_me_requires_bearer_token() -> None:
    response = TestClient(app).get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing Authorization header."


def test_auth_me_returns_overridden_user() -> None:
    async def fake_current_user() -> AuthenticatedUser:
        return AuthenticatedUser(id="user_123", email="tester@example.com")

    app.dependency_overrides[get_current_user] = fake_current_user
    try:
        response = TestClient(app).get("/api/auth/me")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"id": "user_123", "email": "tester@example.com"}
