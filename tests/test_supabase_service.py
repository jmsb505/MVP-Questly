import pytest
from fastapi import HTTPException

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.services.supabase import ensure_owned_row


class FakeExecuteResponse:
    def __init__(self, data: list[dict[str, str]]) -> None:
        self.data = data


class FakeQuery:
    def __init__(self, rows: list[dict[str, str]]) -> None:
        self.rows = rows
        self.filters: list[tuple[str, str]] = []

    def select(self, _columns: str) -> "FakeQuery":
        return self

    def eq(self, column: str, value: str) -> "FakeQuery":
        self.filters.append((column, value))
        return self

    def limit(self, _count: int) -> "FakeQuery":
        return self

    def execute(self) -> FakeExecuteResponse:
        return FakeExecuteResponse(self.rows)


class FakeClient:
    def __init__(self, rows: list[dict[str, str]]) -> None:
        self.query = FakeQuery(rows)

    def table(self, _table_name: str) -> FakeQuery:
        return self.query


def test_ensure_owned_row_returns_matching_row() -> None:
    row = {"id": "task_1", "user_id": "user_1"}
    client = FakeClient([row])

    result = ensure_owned_row(
      "tasks",
      "task_1",
      AuthenticatedUser(id="user_1"),
      client=client,  # type: ignore[arg-type]
    )

    assert result == row
    assert ("id", "task_1") in client.query.filters
    assert ("user_id", "user_1") in client.query.filters


def test_ensure_owned_row_raises_for_missing_row() -> None:
    client = FakeClient([])

    with pytest.raises(HTTPException) as exc_info:
        ensure_owned_row(
          "tasks",
          "task_1",
          AuthenticatedUser(id="user_1"),
          client=client,  # type: ignore[arg-type]
        )

    assert exc_info.value.status_code == 404
