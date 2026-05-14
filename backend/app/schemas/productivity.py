from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["pending", "active", "completed", "archived", "abandoned"]
HabitStatus = Literal["pending", "active", "completed", "archived", "abandoned"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: date | None = None
    status: TaskStatus | None = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None = None
    due_date: date | None = None
    status: TaskStatus
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class HabitCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    frequency: str | None = None


class HabitUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    frequency: str | None = None
    status: HabitStatus | None = None


class HabitResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None = None
    frequency: str | None = None
    status: HabitStatus
    last_completed_on: date | None = None
    created_at: datetime
    updated_at: datetime


class StoryTurnBalanceResponse(BaseModel):
    user_id: str
    available_turns: int
    max_turns: int
    created_at: datetime
    updated_at: datetime


class CompletionRewardResponse(BaseModel):
    source_type: Literal["task", "habit"]
    source_id: str
    turns_awarded: int
    turns_added_to_balance: int
    balance_after: int
    reward_reason: str
