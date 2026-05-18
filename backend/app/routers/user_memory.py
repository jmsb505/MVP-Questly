from fastapi import APIRouter, Depends

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.memory import UserMemoryResponse, UserMemoryUpdate
from backend.app.services.auth import get_current_user
from backend.app.services.memory import get_user_memory, update_editable_preferences
from backend.app.services.supabase import get_supabase_admin_client

router = APIRouter(prefix="/user-memory", tags=["user-memory"])


@router.get("", response_model=UserMemoryResponse)
def read_user_memory(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return get_user_memory(get_supabase_admin_client(), current_user)


@router.patch("", response_model=UserMemoryResponse)
def update_user_memory(
    payload: UserMemoryUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return update_editable_preferences(
        get_supabase_admin_client(),
        current_user,
        preferred_genres=payload.preferred_genres,
        tone_style_preferences=payload.tone_style_preferences,
    )
