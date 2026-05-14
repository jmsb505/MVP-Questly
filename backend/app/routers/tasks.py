from fastapi import APIRouter, Depends

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.productivity import (
    CompletionRewardResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from backend.app.services.auth import get_current_user
from backend.app.services import productivity

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
def read_tasks(current_user: AuthenticatedUser = Depends(get_current_user)) -> list[dict]:
    return productivity.list_tasks(current_user)


@router.post("", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.create_task(payload, current_user)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.update_task(task_id, payload, current_user)


@router.post("/{task_id}/complete", response_model=CompletionRewardResponse)
def complete_task(
    task_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    return productivity.complete_task(task_id, current_user)
