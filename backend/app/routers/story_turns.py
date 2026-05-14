from fastapi import APIRouter, Depends

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.productivity import StoryTurnBalanceResponse
from backend.app.services.auth import get_current_user
from backend.app.services import productivity

router = APIRouter(prefix="/story-turns", tags=["story-turns"])


@router.get("/balance", response_model=StoryTurnBalanceResponse)
def read_story_turn_balance(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.get_story_turn_balance(current_user)
