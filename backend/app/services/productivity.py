from datetime import date, datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.productivity import HabitCreate, HabitUpdate, TaskCreate, TaskUpdate
from backend.app.services.supabase import get_supabase_admin_client


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _execute_data(query: Any) -> Any:
    response = query.execute()
    return response.data


def _first_or_404(rows: list[dict[str, Any]], resource_name: str) -> dict[str, Any]:
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} was not found for the current user.",
        )
    return rows[0]


def list_tasks(current_user: AuthenticatedUser, client: Any | None = None) -> list[dict[str, Any]]:
    supabase = client or get_supabase_admin_client()
    return _execute_data(
        supabase.table("tasks")
        .select("*")
        .eq("user_id", current_user.id)
        .neq("status", "archived")
        .order("created_at", desc=True)
    )


def create_task(
    payload: TaskCreate,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    rows = _execute_data(
        supabase.table("tasks")
        .insert(
            {
                "user_id": current_user.id,
                "title": payload.title.strip(),
                "description": payload.description,
                "due_date": payload.due_date.isoformat() if payload.due_date else None,
                "status": "pending",
            }
        )
    )
    return _first_or_404(rows, "Task")


def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    updates = payload.model_dump(exclude_unset=True)
    if "title" in updates and updates["title"] is not None:
        updates["title"] = updates["title"].strip()
    if "due_date" in updates and updates["due_date"] is not None:
        updates["due_date"] = updates["due_date"].isoformat()

    rows = _execute_data(
        supabase.table("tasks")
        .update(updates)
        .eq("id", task_id)
        .eq("user_id", current_user.id)
    )
    return _first_or_404(rows, "Task")


def list_habits(current_user: AuthenticatedUser, client: Any | None = None) -> list[dict[str, Any]]:
    supabase = client or get_supabase_admin_client()
    return _execute_data(
        supabase.table("habits")
        .select("*")
        .eq("user_id", current_user.id)
        .neq("status", "archived")
        .order("created_at", desc=True)
    )


def create_habit(
    payload: HabitCreate,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    rows = _execute_data(
        supabase.table("habits")
        .insert(
            {
                "user_id": current_user.id,
                "title": payload.title.strip(),
                "description": payload.description,
                "frequency": payload.frequency,
                "status": "active",
            }
        )
    )
    return _first_or_404(rows, "Habit")


def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    updates = payload.model_dump(exclude_unset=True)
    if "title" in updates and updates["title"] is not None:
        updates["title"] = updates["title"].strip()

    rows = _execute_data(
        supabase.table("habits")
        .update(updates)
        .eq("id", habit_id)
        .eq("user_id", current_user.id)
    )
    return _first_or_404(rows, "Habit")


def get_story_turn_balance(
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    rows = _execute_data(
        supabase.table("story_turn_balances")
        .select("*")
        .eq("user_id", current_user.id)
        .limit(1)
    )
    if rows:
        return rows[0]

    created_rows = _execute_data(
        supabase.table("story_turn_balances")
        .insert(
            {
                "user_id": current_user.id,
                "available_turns": 0,
                "max_turns": 10,
            }
        )
    )
    return _first_or_404(created_rows, "Story turn balance")


def _award_turn(
    supabase: Any,
    current_user: AuthenticatedUser,
    *,
    source_type: str,
    source_id: str,
    title_snapshot: str,
    description_snapshot: str | None,
    reward_reason: str,
    completed_on: date | None = None,
) -> dict[str, Any]:
    turns_awarded = 1
    completed_at = _now().isoformat()
    event_rows = _execute_data(
        supabase.table("productivity_events")
        .insert(
            {
                "user_id": current_user.id,
                "source_type": source_type,
                "source_id": source_id,
                "title_snapshot": title_snapshot,
                "description_snapshot": description_snapshot,
                "classification": source_type,
                "complexity": "low",
                "meaningfulness": "low",
                "turns_awarded": turns_awarded,
                "reward_reason": reward_reason,
                "completed_at": completed_at,
                "completed_on": completed_on.isoformat() if completed_on else None,
            }
        )
    )
    event = _first_or_404(event_rows, "Productivity event")

    balance = get_story_turn_balance(current_user, supabase)
    available_turns = int(balance["available_turns"])
    max_turns = int(balance["max_turns"])
    balance_after = min(max_turns, available_turns + turns_awarded)
    turns_added = balance_after - available_turns

    _execute_data(
        supabase.table("story_turn_balances")
        .update({"available_turns": balance_after})
        .eq("user_id", current_user.id)
    )

    _execute_data(
        supabase.table("story_turn_transactions")
        .insert(
            {
                "user_id": current_user.id,
                "transaction_type": "earned",
                "amount": turns_added,
                "balance_after": balance_after,
                "productivity_event_id": event["id"],
                "reason": reward_reason if turns_added else f"{reward_reason} Balance cap already reached.",
            }
        )
    )

    return {
        "source_type": source_type,
        "source_id": source_id,
        "turns_awarded": turns_awarded,
        "turns_added_to_balance": turns_added,
        "balance_after": balance_after,
        "reward_reason": reward_reason,
    }


def complete_task(
    task_id: str,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    task = _first_or_404(
        _execute_data(
            supabase.table("tasks")
            .select("*")
            .eq("id", task_id)
            .eq("user_id", current_user.id)
            .limit(1)
        ),
        "Task",
    )

    if task["status"] == "completed" or task.get("completed_at"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Task is already completed.",
        )

    reward = _award_turn(
        supabase,
        current_user,
        source_type="task",
        source_id=task_id,
        title_snapshot=task["title"],
        description_snapshot=task.get("description"),
        reward_reason="Nice work completing a real task.",
        completed_on=date.today(),
    )

    _execute_data(
        supabase.table("tasks")
        .update({"status": "completed", "completed_at": _now().isoformat()})
        .eq("id", task_id)
        .eq("user_id", current_user.id)
    )
    return reward


def complete_habit(
    habit_id: str,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    habit = _first_or_404(
        _execute_data(
            supabase.table("habits")
            .select("*")
            .eq("id", habit_id)
            .eq("user_id", current_user.id)
            .limit(1)
        ),
        "Habit",
    )

    today = date.today()
    if habit.get("last_completed_on") == today.isoformat():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Habit is already completed for today.",
        )

    reward = _award_turn(
        supabase,
        current_user,
        source_type="habit",
        source_id=habit_id,
        title_snapshot=habit["title"],
        description_snapshot=habit.get("description"),
        reward_reason="Nice work keeping up with this habit.",
        completed_on=today,
    )

    _execute_data(
        supabase.table("habits")
        .update({"last_completed_on": today.isoformat()})
        .eq("id", habit_id)
        .eq("user_id", current_user.id)
    )
    return reward
