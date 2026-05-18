from copy import deepcopy

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.services.memory import (
    clear_active_quest_memory,
    merge_important_story_facts,
    record_completed_quest_summary,
    update_active_quest_memory,
    update_productivity_summary,
)


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
        self.order_column: str | None = None
        self.desc = False

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

    def order(self, column: str, desc: bool = False) -> "FakeQuery":
        self.order_column = column
        self.desc = desc
        return self

    def limit(self, count: int) -> "FakeQuery":
        self.limit_count = count
        return self

    def execute(self) -> FakeExecuteResponse:
        rows = self.client.tables.setdefault(self.table_name, [])
        matching_rows = [row for row in rows if all(row.get(column) == value for column, value in self.filters)]
        if self.order_column:
            matching_rows.sort(key=lambda row: row.get(self.order_column), reverse=self.desc)
        if self.limit_count is not None:
            matching_rows = matching_rows[: self.limit_count]
        if self.operation == "update":
            if self.client.fail_updates:
                raise RuntimeError("memory unavailable")
            for row in matching_rows:
                row.update(self.payload or {})
        return FakeExecuteResponse(deepcopy(matching_rows))


class FakeClient:
    def __init__(self, tables: dict[str, list[dict]], fail_updates: bool = False) -> None:
        self.tables = tables
        self.fail_updates = fail_updates

    def table(self, table_name: str) -> FakeQuery:
        return FakeQuery(self, table_name)


def test_update_productivity_summary_uses_recent_events() -> None:
    client = FakeClient(
        {
            "user_memory": [{"user_id": "user_1"}],
            "productivity_events": [
                {
                    "user_id": "user_1",
                    "source_type": "task",
                    "title_snapshot": "Finish report",
                    "completed_at": "2026-05-18T10:00:00Z",
                },
                {
                    "user_id": "user_1",
                    "source_type": "habit",
                    "title_snapshot": "Practice Italian",
                    "completed_at": "2026-05-18T09:00:00Z",
                },
            ],
        }
    )

    assert update_productivity_summary(
        client,
        AuthenticatedUser(id="user_1"),
        source_type="task",
        title="Finish report",
    )
    assert "1 tasks and 1 habits" in client.tables["user_memory"][0]["productivity_history_summary"]
    assert "Finish report" in client.tables["user_memory"][0]["productivity_history_summary"]


def test_memory_update_failure_is_non_blocking() -> None:
    client = FakeClient(
        {
            "user_memory": [{"user_id": "user_1"}],
            "productivity_events": [],
        },
        fail_updates=True,
    )

    assert (
        update_productivity_summary(
            client,
            AuthenticatedUser(id="user_1"),
            source_type="habit",
            title="Practice Italian",
        )
        is False
    )


def test_active_quest_memory_merges_deduped_story_facts() -> None:
    client = FakeClient(
        {
            "user_memory": [
                {
                    "user_id": "user_1",
                    "important_story_facts": ["Signal detected"],
                }
            ]
        }
    )

    update_active_quest_memory(
        client,
        AuthenticatedUser(id="user_1"),
        active_quest_summary="Test Quest",
        previous_story_choices_summary="Inspected the console.",
        new_story_facts=["signal detected", "A route was revealed"],
    )

    memory = client.tables["user_memory"][0]
    assert memory["active_quest_summary"] == "Test Quest"
    assert memory["important_story_facts"] == ["Signal detected", "A route was revealed"]


def test_completed_quest_summary_is_capped_and_clears_active_fields() -> None:
    client = FakeClient(
        {
            "user_memory": [
                {
                    "user_id": "user_1",
                    "active_quest_summary": "Active",
                    "previous_story_choices_summary": "Started",
                    "completed_quest_summaries": [{"quest_id": f"quest_{index}"} for index in range(10)],
                }
            ]
        }
    )

    record_completed_quest_summary(
        client,
        AuthenticatedUser(id="user_1"),
        quest_id="quest_10",
        title="Final Quest",
        final_summary="Finished.",
        outcome_summary="Won.",
        completed_at="2026-05-18T10:00:00Z",
    )

    memory = client.tables["user_memory"][0]
    assert memory["active_quest_summary"] is None
    assert memory["previous_story_choices_summary"] is None
    assert len(memory["completed_quest_summaries"]) == 10
    assert memory["completed_quest_summaries"][-1]["quest_id"] == "quest_10"


def test_clear_active_quest_memory() -> None:
    client = FakeClient(
        {
            "user_memory": [
                {
                    "user_id": "user_1",
                    "active_quest_summary": "Active",
                    "previous_story_choices_summary": "Started",
                }
            ]
        }
    )

    clear_active_quest_memory(client, AuthenticatedUser(id="user_1"))

    assert client.tables["user_memory"][0]["active_quest_summary"] is None
    assert client.tables["user_memory"][0]["previous_story_choices_summary"] is None


def test_merge_important_story_facts_deduplicates_case_insensitively() -> None:
    assert merge_important_story_facts(["Signal detected"], ["signal detected", "Route revealed"]) == [
        "Signal detected",
        "Route revealed",
    ]
