from copy import deepcopy

import pytest
from fastapi import HTTPException

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.services.ai import ProductivityEvaluationResult
from backend.app.services.productivity import complete_habit, complete_task


class FakeExecuteResponse:
    def __init__(self, data: list[dict]) -> None:
        self.data = data


class FakeQuery:
    def __init__(self, client: "FakeClient", table_name: str) -> None:
        self.client = client
        self.table_name = table_name
        self.operation = "select"
        self.payload: dict | None = None
        self.filters: list[tuple[str, object, bool]] = []

    def select(self, _columns: str) -> "FakeQuery":
        self.operation = "select"
        return self

    def insert(self, payload: dict) -> "FakeQuery":
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload: dict) -> "FakeQuery":
        self.operation = "update"
        self.payload = payload
        return self

    def eq(self, column: str, value: object) -> "FakeQuery":
        self.filters.append((column, value, True))
        return self

    def neq(self, column: str, value: object) -> "FakeQuery":
        self.filters.append((column, value, False))
        return self

    def order(self, _column: str, desc: bool = False) -> "FakeQuery":
        return self

    def limit(self, _count: int) -> "FakeQuery":
        return self

    def execute(self) -> FakeExecuteResponse:
        rows = self.client.tables.setdefault(self.table_name, [])
        if self.operation == "insert":
            next_row = dict(self.payload or {})
            next_row.setdefault("id", f"{self.table_name}_{len(rows) + 1}")
            rows.append(next_row)
            return FakeExecuteResponse([deepcopy(next_row)])

        matching_rows = [row for row in rows if self._matches(row)]
        if self.operation == "update":
            for row in matching_rows:
                row.update(self.payload or {})
            return FakeExecuteResponse(deepcopy(matching_rows))

        return FakeExecuteResponse(deepcopy(matching_rows))

    def _matches(self, row: dict) -> bool:
        for column, value, should_equal in self.filters:
            matches = row.get(column) == value
            if should_equal and not matches:
                return False
            if not should_equal and matches:
                return False
        return True


class FakeClient:
    def __init__(self, tables: dict[str, list[dict]]) -> None:
        self.tables = tables

    def table(self, table_name: str) -> FakeQuery:
        return FakeQuery(self, table_name)


def test_complete_task_awards_turn_and_writes_audit_records() -> None:
    client = FakeClient(
        {
            "tasks": [
                {
                    "id": "task_1",
                    "user_id": "user_1",
                    "title": "Review notes",
                    "description": "Study for 30 minutes",
                    "status": "pending",
                    "completed_at": None,
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 2, "max_turns": 10}
            ],
            "productivity_events": [],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
        }
    )

    reward = complete_task("task_1", AuthenticatedUser(id="user_1"), client=client)  # type: ignore[arg-type]

    assert reward["turns_awarded"] == 1
    assert reward["turns_added_to_balance"] == 1
    assert reward["balance_after"] == 3
    assert client.tables["tasks"][0]["status"] == "completed"
    assert len(client.tables["productivity_events"]) == 1
    assert len(client.tables["story_turn_transactions"]) == 1
    assert len(client.tables["ai_generation_logs"]) == 1
    assert client.tables["story_turn_balances"][0]["available_turns"] == 3


def test_complete_task_respects_turn_cap() -> None:
    client = FakeClient(
        {
            "tasks": [
                {
                    "id": "task_1",
                    "user_id": "user_1",
                    "title": "Review notes",
                    "description": None,
                    "status": "pending",
                    "completed_at": None,
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 10, "max_turns": 10}
            ],
            "productivity_events": [],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
        }
    )

    reward = complete_task("task_1", AuthenticatedUser(id="user_1"), client=client)  # type: ignore[arg-type]

    assert reward["turns_awarded"] == 1
    assert reward["turns_added_to_balance"] == 0
    assert reward["balance_after"] == 10
    assert client.tables["story_turn_transactions"][0]["amount"] == 0


def test_complete_task_rejects_duplicate_completion() -> None:
    client = FakeClient(
        {
            "tasks": [
                {
                    "id": "task_1",
                    "user_id": "user_1",
                    "title": "Review notes",
                    "description": None,
                    "status": "completed",
                    "completed_at": "2026-05-14T10:00:00Z",
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 0, "max_turns": 10}
            ],
            "productivity_events": [],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
        }
    )

    with pytest.raises(HTTPException) as exc_info:
        complete_task("task_1", AuthenticatedUser(id="user_1"), client=client)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 409
    assert client.tables["productivity_events"] == []


def test_complete_habit_rejects_duplicate_same_day_completion(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeToday:
        def isoformat(self) -> str:
            return "2026-05-14"

    class FakeDate:
        @classmethod
        def today(cls) -> FakeToday:
            return FakeToday()

    client = FakeClient(
        {
            "habits": [
                {
                    "id": "habit_1",
                    "user_id": "user_1",
                    "title": "Practice Italian",
                    "description": None,
                    "status": "active",
                    "last_completed_on": "2026-05-14",
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 0, "max_turns": 10}
            ],
            "productivity_events": [],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
        }
    )

    monkeypatch.setattr("backend.app.services.productivity.date", FakeDate)

    with pytest.raises(HTTPException) as exc_info:
        complete_habit("habit_1", AuthenticatedUser(id="user_1"), client=client)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 409


def test_complete_task_uses_ai_evaluation_result() -> None:
    client = FakeClient(
        {
            "user_profiles": [{"id": "user_1", "user_type": "student"}],
            "tasks": [
                {
                    "id": "task_1",
                    "user_id": "user_1",
                    "title": "Finish assignment introduction",
                    "description": "Draft and revise the opening section",
                    "status": "pending",
                    "completed_at": None,
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 2, "max_turns": 10}
            ],
            "productivity_events": [],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
        }
    )

    def evaluator(_payload: object) -> ProductivityEvaluationResult:
        return ProductivityEvaluationResult(
            classification="school_task",
            complexity="medium",
            meaningfulness="high",
            turns_awarded=2,
            reason="This was specific work toward an academic deliverable.",
        )

    reward = complete_task(
        "task_1",
        AuthenticatedUser(id="user_1"),
        client=client,  # type: ignore[arg-type]
        evaluator=evaluator,
    )

    event = client.tables["productivity_events"][0]
    log = client.tables["ai_generation_logs"][0]
    transaction = client.tables["story_turn_transactions"][0]

    assert reward["turns_awarded"] == 2
    assert reward["turns_added_to_balance"] == 2
    assert reward["balance_after"] == 4
    assert event["classification"] == "school_task"
    assert event["complexity"] == "medium"
    assert event["meaningfulness"] == "high"
    assert event["reward_reason"] == "This was specific work toward an academic deliverable."
    assert transaction["amount"] == 2
    assert log["validation_status"] == "approved"
    assert log["request_payload"]["user_type"] == "student"


def test_complete_task_logs_fallback_evaluation() -> None:
    client = FakeClient(
        {
            "tasks": [
                {
                    "id": "task_1",
                    "user_id": "user_1",
                    "title": "Review notes",
                    "description": None,
                    "status": "pending",
                    "completed_at": None,
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 0, "max_turns": 10}
            ],
            "productivity_events": [],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
        }
    )

    def evaluator(_payload: object) -> ProductivityEvaluationResult:
        return ProductivityEvaluationResult(
            classification="task",
            complexity="low",
            meaningfulness="low",
            turns_awarded=1,
            reason="Nice work completing a real task.",
            used_fallback=True,
            error_message="OPENAI_API_KEY is not configured.",
        )

    complete_task(
        "task_1",
        AuthenticatedUser(id="user_1"),
        client=client,  # type: ignore[arg-type]
        evaluator=evaluator,
    )

    log = client.tables["ai_generation_logs"][0]
    assert log["validation_status"] == "fallback_used"
    assert log["error_message"] == "OPENAI_API_KEY is not configured."
