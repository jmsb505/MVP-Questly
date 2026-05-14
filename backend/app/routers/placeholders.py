from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.common import PlaceholderResponse

router = APIRouter(tags=["phase-1-placeholders"])


def not_implemented(feature: str) -> PlaceholderResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "message": f"{feature} will be implemented in a later MVP phase.",
            "phase": "Future MVP phase",
        },
    )


@router.get("/quests/active", response_model=PlaceholderResponse)
def active_quest_placeholder() -> PlaceholderResponse:
    return not_implemented("Active quests")


@router.get("/quests/history", response_model=PlaceholderResponse)
def quest_history_placeholder() -> PlaceholderResponse:
    return not_implemented("Quest history")


@router.get("/user-memory", response_model=PlaceholderResponse)
def user_memory_placeholder() -> PlaceholderResponse:
    return not_implemented("User memory")
