from copy import deepcopy

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routers import user_memory
from backend.app.schemas.auth import AuthenticatedUser
from backend.app.services.auth import get_current_user


class FakeExecuteResponse:
    def __init__(self, data: list[dict]) -> None:
        self.data = data


class FakeQuery:
    def __init__(self, client: "FakeClient", table_name: str) -> None:
        self.client = client
        self.table_name = table_name
        self.operation = "select"
        self.payload: dict | None = None
        self.filters: list[tuple[str, object]] = []
        self.limit_count: int | None = None

    def select(self, _columns: str) -> "FakeQuery":
        self.operation = "select"
        return self

    def update(self, payload: dict) -> "FakeQuery":
        self.operation = "update"
        self.payload = payload
        return self

    def eq(self, column: str, value: object) -> "FakeQuery":
        self.filters.append((column, value))
        return self

    def limit(self, count: int) -> "FakeQuery":
        self.limit_count = count
        return self

    def execute(self) -> FakeExecuteResponse:
        rows = self.client.tables.setdefault(self.table_name, [])
        matching_rows = [row for row in rows if all(row.get(column) == value for column, value in self.filters)]
        if self.limit_count is not None:
            matching_rows = matching_rows[: self.limit_count]
        if self.operation == "update":
            for row in matching_rows:
                row.update(self.payload or {})
        return FakeExecuteResponse(deepcopy(matching_rows))


class FakeClient:
    def __init__(self) -> None:
        self.tables = {
            "user_memory": [
                {
                    "user_id": "user_1",
                    "preferred_genres": ["mystery"],
                    "tone_style_preferences": "focused",
                    "productivity_history_summary": "Recent work.",
                    "active_quest_summary": "Quest",
                    "previous_story_choices_summary": "Started",
                    "completed_quest_summaries": [],
                    "important_story_facts": ["Signal detected"],
                    "created_at": "2026-05-18T10:00:00Z",
                    "updated_at": "2026-05-18T10:00:00Z",
                }
            ]
        }

    def table(self, table_name: str) -> FakeQuery:
        return FakeQuery(self, table_name)


def test_user_memory_api_reads_and_updates_only_editable_fields(monkeypatch) -> None:
    client = FakeClient()

    async def fake_current_user() -> AuthenticatedUser:
        return AuthenticatedUser(id="user_1", email="tester@example.com")

    monkeypatch.setattr(user_memory, "get_supabase_admin_client", lambda: client)
    app.dependency_overrides[get_current_user] = fake_current_user
    try:
        api = TestClient(app)
        response = api.get("/api/user-memory")
        patch_response = api.patch(
            "/api/user-memory",
            json={
                "preferred_genres": ["sci-fi", "mystery"],
                "tone_style_preferences": "cinematic",
                "active_quest_summary": "tampered",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert patch_response.status_code == 200
    payload = patch_response.json()
    assert payload["preferred_genres"] == ["sci-fi", "mystery"]
    assert payload["tone_style_preferences"] == "cinematic"
    assert payload["active_quest_summary"] == "Quest"
