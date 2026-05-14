from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


QuestStatus = Literal["pending", "active", "completed", "archived", "abandoned"]
ChoiceType = Literal["branching", "progression", "investigation", "tone"]


class QuestCreate(BaseModel):
    genre: str | None = Field(default=None, max_length=80)
    tone: str | None = Field(default=None, max_length=160)


class QuestChoiceResponse(BaseModel):
    id: str
    quest_turn_id: str
    quest_id: str
    choice_text: str
    choice_type: ChoiceType
    result_text: str | None = None
    selected: bool
    selected_at: datetime | None = None
    created_at: datetime


class QuestTurnResponse(BaseModel):
    id: str
    quest_id: str
    turn_index: int
    scene_text: str
    choices: list[QuestChoiceResponse]
    created_at: datetime


class QuestStateResponse(BaseModel):
    quest_id: str
    current_location: str | None = None
    known_facts: list[str]
    open_questions: list[str]
    previous_choices_summary: str | None = None
    progress_status: str
    turns_spent: int


class QuestResponse(BaseModel):
    id: str
    title: str
    genre: str | None = None
    tone: str | None = None
    premise: str | None = None
    main_objective: str | None = None
    planned_length_in_turns: int
    status: QuestStatus
    final_summary: str | None = None
    outcome_summary: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
    current_turn: QuestTurnResponse | None = None
    state: QuestStateResponse | None = None


class ChoiceSelectionResponse(BaseModel):
    quest: QuestResponse
    selected_choice: QuestChoiceResponse
    consequence: str
    turns_spent: int
    balance_after: int
    quest_completed: bool


class CompletedQuestHistoryResponse(BaseModel):
    id: str
    quest_id: str
    title: str
    genre: str | None = None
    final_summary: str | None = None
    outcome_summary: str | None = None
    completed_at: datetime
    created_at: datetime
