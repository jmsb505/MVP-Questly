from copy import deepcopy

import pytest
from fastapi import HTTPException

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.quests import QuestCreate
from backend.app.services import quests
from backend.app.services.ai import (
    ChoiceResolutionResult,
    NarrativeChoice,
    NarrativeTurnResult,
    QuestPlanResult,
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
        self.filters: list[tuple[str, object, bool]] = []
        self.desc = False
        self.limit_count: int | None = None
        self.order_column: str | None = None

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

    def order(self, column: str, desc: bool = False) -> "FakeQuery":
        self.order_column = column
        self.desc = desc
        return self

    def limit(self, count: int) -> "FakeQuery":
        self.limit_count = count
        return self

    def execute(self) -> FakeExecuteResponse:
        rows = self.client.tables.setdefault(self.table_name, [])
        if self.operation == "insert":
            next_row = dict(self.payload or {})
            next_row.setdefault("id", f"{self.table_name}_{len(rows) + 1}")
            next_row.setdefault("created_at", "2026-05-14T10:00:00Z")
            next_row.setdefault("started_at", "2026-05-14T10:00:00Z")
            rows.append(next_row)
            return FakeExecuteResponse([deepcopy(next_row)])

        matching_rows = [row for row in rows if self._matches(row)]
        if self.order_column:
            matching_rows.sort(key=lambda row: row.get(self.order_column), reverse=self.desc)
        if self.limit_count is not None:
            matching_rows = matching_rows[: self.limit_count]

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


def fake_plan(_payload) -> QuestPlanResult:
    return QuestPlanResult(
        quest_title="Test Quest",
        genre="mystery",
        tone="focused",
        premise="Find the signal.",
        main_objective="Resolve the signal.",
        starting_situation="A signal starts pulsing.",
        planned_length_in_turns=15,
        current_location="Control room",
        known_facts=["Signal detected"],
        open_questions=["Who sent it?"],
    )


def fake_turn(_payload) -> NarrativeTurnResult:
    return NarrativeTurnResult(
        scene_text="The signal grows clearer.",
        choices=[
            NarrativeChoice(choice_text="Inspect the console.", choice_type="investigation"),
            NarrativeChoice(choice_text="Open the side door.", choice_type="progression"),
        ],
    )


def test_create_quest_builds_initial_state_turn_and_choices(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(quests, "plan_quest", fake_plan)
    monkeypatch.setattr(quests, "generate_narrative_turn", fake_turn)
    client = FakeClient(
        {
            "quests": [],
            "quest_state": [],
            "quest_turns": [],
            "quest_choices": [],
            "ai_generation_logs": [],
            "user_memory": [
                {
                    "user_id": "user_1",
                    "preferred_genres": ["mystery"],
                    "tone_style_preferences": "focused",
                }
            ],
        }
    )

    result = quests.create_quest(
        QuestCreate(),
        AuthenticatedUser(id="user_1"),
        client=client,  # type: ignore[arg-type]
    )

    assert result["title"] == "Test Quest"
    assert result["current_turn"]["scene_text"] == "The signal grows clearer."
    assert len(result["current_turn"]["choices"]) == 2
    assert client.tables["quest_state"][0]["turns_spent"] == 0
    assert len(client.tables["ai_generation_logs"]) == 2
    assert client.tables["user_memory"][0]["active_quest_summary"].startswith("Test Quest")


def test_select_choice_spends_one_turn_and_creates_next_turn(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(quests, "generate_narrative_turn", fake_turn)

    def fake_resolution(_payload) -> ChoiceResolutionResult:
        return ChoiceResolutionResult(
            consequence="The console reveals a route.",
            new_story_facts=["A route was revealed"],
            open_questions=["Where does it lead?"],
            current_location="Control room",
            previous_choices_summary="The user inspected the console.",
            is_quest_complete=False,
        )

    monkeypatch.setattr(quests, "resolve_choice", fake_resolution)
    client = FakeClient(
        {
            "quests": [
                {
                    "id": "quest_1",
                    "user_id": "user_1",
                    "title": "Test Quest",
                    "genre": "mystery",
                    "tone": "focused",
                    "premise": "Find the signal.",
                    "main_objective": "Resolve it.",
                    "planned_length_in_turns": 15,
                    "status": "active",
                    "started_at": "2026-05-14T10:00:00Z",
                }
            ],
            "quest_state": [
                {
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "current_location": "Control room",
                    "known_facts": ["Signal detected"],
                    "open_questions": ["Who sent it?"],
                    "previous_choices_summary": None,
                    "progress_status": "started",
                    "turns_spent": 0,
                }
            ],
            "quest_turns": [
                {
                    "id": "turn_1",
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "turn_index": 0,
                    "scene_text": "First scene.",
                    "created_at": "2026-05-14T10:00:00Z",
                }
            ],
            "quest_choices": [
                {
                    "id": "choice_1",
                    "quest_turn_id": "turn_1",
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "choice_text": "Inspect the console.",
                    "choice_type": "investigation",
                    "selected": False,
                    "result_text": None,
                    "created_at": "2026-05-14T10:00:00Z",
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 2, "max_turns": 10}
            ],
            "story_turn_transactions": [],
            "ai_generation_logs": [],
            "completed_quest_history": [],
            "user_memory": [{"user_id": "user_1"}],
        }
    )

    result = quests.select_choice(
        "quest_1",
        "choice_1",
        AuthenticatedUser(id="user_1"),
        client=client,  # type: ignore[arg-type]
    )

    assert result["balance_after"] == 1
    assert result["quest_completed"] is False
    assert client.tables["story_turn_transactions"][0]["amount"] == -1
    assert client.tables["quest_choices"][0]["selected"] is True
    assert client.tables["quest_state"][0]["turns_spent"] == 1
    assert len(client.tables["quest_turns"]) == 2
    assert client.tables["user_memory"][0]["previous_story_choices_summary"] == "The user inspected the console."


def test_select_choice_rejects_when_no_turns_available() -> None:
    client = FakeClient(
        {
            "quests": [
                {
                    "id": "quest_1",
                    "user_id": "user_1",
                    "title": "Test Quest",
                    "planned_length_in_turns": 15,
                    "status": "active",
                    "started_at": "2026-05-14T10:00:00Z",
                }
            ],
            "quest_choices": [
                {
                    "id": "choice_1",
                    "quest_turn_id": "turn_1",
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "choice_text": "Inspect.",
                    "choice_type": "investigation",
                    "selected": False,
                }
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 0, "max_turns": 10}
            ],
        }
    )

    with pytest.raises(HTTPException) as exc_info:
        quests.select_choice(
            "quest_1",
            "choice_1",
            AuthenticatedUser(id="user_1"),
            client=client,  # type: ignore[arg-type]
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "No story turns available."
    assert client.tables["story_turn_balances"][0]["available_turns"] == 0


def test_select_choice_rejects_second_choice_for_same_turn() -> None:
    client = FakeClient(
        {
            "quests": [
                {
                    "id": "quest_1",
                    "user_id": "user_1",
                    "title": "Test Quest",
                    "planned_length_in_turns": 15,
                    "status": "active",
                    "started_at": "2026-05-14T10:00:00Z",
                }
            ],
            "quest_choices": [
                {
                    "id": "choice_1",
                    "quest_turn_id": "turn_1",
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "choice_text": "Inspect.",
                    "choice_type": "investigation",
                    "selected": True,
                },
                {
                    "id": "choice_2",
                    "quest_turn_id": "turn_1",
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "choice_text": "Leave.",
                    "choice_type": "progression",
                    "selected": False,
                },
            ],
            "story_turn_balances": [
                {"user_id": "user_1", "available_turns": 2, "max_turns": 10}
            ],
        }
    )

    with pytest.raises(HTTPException) as exc_info:
        quests.select_choice(
            "quest_1",
            "choice_2",
            AuthenticatedUser(id="user_1"),
            client=client,  # type: ignore[arg-type]
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "A choice has already been selected for this story turn."


def test_create_quest_replaces_excluded_mechanics_with_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    def bad_plan(_payload) -> QuestPlanResult:
        return QuestPlanResult(
            quest_title="XP Dungeon",
            genre="fantasy",
            tone="gamey",
            premise="Earn XP and collect coins.",
            main_objective="Level up.",
            starting_situation="You check your stats.",
            planned_length_in_turns=15,
            current_location="Menu",
            known_facts=["XP exists"],
            open_questions=["How many coins?"],
        )

    monkeypatch.setattr(quests, "plan_quest", bad_plan)
    monkeypatch.setattr(quests, "generate_narrative_turn", fake_turn)
    client = FakeClient(
        {
            "quests": [],
            "quest_state": [],
            "quest_turns": [],
            "quest_choices": [],
            "ai_generation_logs": [],
            "user_memory": [{"user_id": "user_1"}],
        }
    )

    result = quests.create_quest(
        QuestCreate(),
        AuthenticatedUser(id="user_1"),
        client=client,  # type: ignore[arg-type]
    )

    assert result["title"] == "The Shattered Observatory"
    assert result["planned_length_in_turns"] == 15
    assert client.tables["ai_generation_logs"][0]["validation_status"] == "rejected"


def test_abandon_active_quest_clears_memory() -> None:
    client = FakeClient(
        {
            "quests": [
                {
                    "id": "quest_1",
                    "user_id": "user_1",
                    "title": "Test Quest",
                    "planned_length_in_turns": 15,
                    "status": "active",
                    "started_at": "2026-05-14T10:00:00Z",
                }
            ],
            "quest_state": [
                {
                    "quest_id": "quest_1",
                    "user_id": "user_1",
                    "current_location": "Control room",
                    "known_facts": [],
                    "open_questions": [],
                    "previous_choices_summary": None,
                    "progress_status": "started",
                    "turns_spent": 0,
                }
            ],
            "quest_turns": [],
            "quest_choices": [],
            "user_memory": [
                {
                    "user_id": "user_1",
                    "active_quest_summary": "Test Quest",
                    "previous_story_choices_summary": "Started",
                }
            ],
        }
    )

    result = quests.abandon_active_quest(
        AuthenticatedUser(id="user_1"),
        client=client,  # type: ignore[arg-type]
    )

    assert result["status"] == "abandoned"
    assert client.tables["quest_state"][0]["progress_status"] == "abandoned"
    assert client.tables["user_memory"][0]["active_quest_summary"] is None
