from fastapi import APIRouter, Depends

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.quests import (
    ChoiceSelectionResponse,
    CompletedQuestHistoryResponse,
    QuestCreate,
    QuestResponse,
)
from backend.app.services import quests
from backend.app.services.auth import get_current_user

router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("/active", response_model=QuestResponse | None)
def read_active_quest(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict | None:
    return quests.get_active_quest(current_user)


@router.post("", response_model=QuestResponse)
def create_quest(
    payload: QuestCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return quests.create_quest(payload, current_user)


@router.post("/{quest_id}/choices/{choice_id}/select", response_model=ChoiceSelectionResponse)
def select_quest_choice(
    quest_id: str,
    choice_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return quests.select_choice(quest_id, choice_id, current_user)


@router.post("/active/abandon", response_model=QuestResponse)
def abandon_active_quest(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return quests.abandon_active_quest(current_user)


@router.get("/history", response_model=list[CompletedQuestHistoryResponse])
def read_completed_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[dict]:
    return quests.list_completed_history(current_user)
