from datetime import datetime

from pydantic import BaseModel, Field


class UserMemoryResponse(BaseModel):
    user_id: str
    preferred_genres: list[str]
    tone_style_preferences: str | None = None
    productivity_history_summary: str | None = None
    active_quest_summary: str | None = None
    previous_story_choices_summary: str | None = None
    completed_quest_summaries: list[dict]
    important_story_facts: list[str]
    created_at: datetime
    updated_at: datetime


class UserMemoryUpdate(BaseModel):
    preferred_genres: list[str] | None = Field(default=None, max_length=8)
    tone_style_preferences: str | None = Field(default=None, max_length=500)
