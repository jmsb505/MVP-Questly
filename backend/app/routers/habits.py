from fastapi import APIRouter, Depends

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.productivity import (
    CompletionRewardResponse,
    HabitCreate,
    HabitResponse,
    HabitUpdate,
)
from backend.app.services.auth import get_current_user
from backend.app.services import productivity

router = APIRouter(prefix="/habits", tags=["habits"])


@router.get("", response_model=list[HabitResponse])
def read_habits(current_user: AuthenticatedUser = Depends(get_current_user)) -> list[dict]:
    return productivity.list_habits(current_user)


@router.post("", response_model=HabitResponse)
def create_habit(
    payload: HabitCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.create_habit(payload, current_user)


@router.patch("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.update_habit(habit_id, payload, current_user)


@router.post("/{habit_id}/complete", response_model=CompletionRewardResponse)
def complete_habit(
    habit_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.complete_habit(habit_id, current_user)
