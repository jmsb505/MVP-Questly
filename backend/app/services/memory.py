from typing import Any

from backend.app.schemas.auth import AuthenticatedUser


MAX_COMPLETED_QUEST_SUMMARIES = 10
MAX_IMPORTANT_STORY_FACTS = 20
MAX_RECENT_PRODUCTIVITY_ITEMS = 5


def _execute_data(query: Any) -> Any:
    response = query.execute()
    return response.data


def get_user_memory(supabase: Any, current_user: AuthenticatedUser) -> dict[str, Any]:
    rows = _execute_data(
        supabase.table("user_memory")
        .select("*")
        .eq("user_id", current_user.id)
        .limit(1)
    )
    return rows[0] if rows else {}


def _safe_update_memory(
    supabase: Any,
    current_user: AuthenticatedUser,
    updates: dict[str, Any],
) -> bool:
    try:
        _execute_data(
            supabase.table("user_memory")
            .update(updates)
            .eq("user_id", current_user.id)
        )
        return True
    except Exception:
        return False


def update_editable_preferences(
    supabase: Any,
    current_user: AuthenticatedUser,
    *,
    preferred_genres: list[str] | None = None,
    tone_style_preferences: str | None = None,
) -> dict[str, Any]:
    updates: dict[str, Any] = {}
    if preferred_genres is not None:
        updates["preferred_genres"] = preferred_genres
    if tone_style_preferences is not None:
        updates["tone_style_preferences"] = tone_style_preferences
    if updates:
        _execute_data(
            supabase.table("user_memory")
            .update(updates)
            .eq("user_id", current_user.id)
        )
    return get_user_memory(supabase, current_user)


def update_productivity_summary(
    supabase: Any,
    current_user: AuthenticatedUser,
    *,
    source_type: str,
    title: str,
) -> bool:
    try:
        events = _execute_data(
            supabase.table("productivity_events")
            .select("source_type,title_snapshot,completed_at")
            .eq("user_id", current_user.id)
            .order("completed_at", desc=True)
            .limit(MAX_RECENT_PRODUCTIVITY_ITEMS)
        )
        if not events:
            events = [{"source_type": source_type, "title_snapshot": title}]

        task_count = sum(1 for event in events if event.get("source_type") == "task")
        habit_count = sum(1 for event in events if event.get("source_type") == "habit")
        titles = [str(event.get("title_snapshot") or "").strip() for event in events]
        titles = [item for item in titles if item][:MAX_RECENT_PRODUCTIVITY_ITEMS]
        summary = (
            f"Recent productivity: {task_count} tasks and {habit_count} habits completed. "
            f"Latest actions: {', '.join(titles)}."
        )
        return _safe_update_memory(
            supabase,
            current_user,
            {"productivity_history_summary": summary},
        )
    except Exception:
        return False


def update_active_quest_memory(
    supabase: Any,
    current_user: AuthenticatedUser,
    *,
    active_quest_summary: str,
    previous_story_choices_summary: str | None,
    new_story_facts: list[str] | None = None,
) -> bool:
    memory = get_user_memory(supabase, current_user)
    important_facts = merge_important_story_facts(
        list(memory.get("important_story_facts") or []),
        new_story_facts or [],
    )
    return _safe_update_memory(
        supabase,
        current_user,
        {
            "active_quest_summary": active_quest_summary,
            "previous_story_choices_summary": previous_story_choices_summary,
            "important_story_facts": important_facts,
        },
    )


def clear_active_quest_memory(supabase: Any, current_user: AuthenticatedUser) -> bool:
    return _safe_update_memory(
        supabase,
        current_user,
        {
            "active_quest_summary": None,
            "previous_story_choices_summary": None,
        },
    )


def merge_important_story_facts(existing_facts: list[Any], new_facts: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for raw_fact in [*existing_facts, *new_facts]:
        fact = str(raw_fact).strip()
        key = fact.casefold()
        if not fact or key in seen:
            continue
        normalized.append(fact)
        seen.add(key)
    return normalized[-MAX_IMPORTANT_STORY_FACTS:]


def record_completed_quest_summary(
    supabase: Any,
    current_user: AuthenticatedUser,
    *,
    quest_id: str,
    title: str,
    final_summary: str,
    outcome_summary: str,
    completed_at: str,
) -> bool:
    memory = get_user_memory(supabase, current_user)
    completed_summaries = list(memory.get("completed_quest_summaries") or [])
    completed_summaries.append(
        {
            "quest_id": quest_id,
            "title": title,
            "final_summary": final_summary,
            "outcome_summary": outcome_summary,
            "completed_at": completed_at,
        }
    )
    return _safe_update_memory(
        supabase,
        current_user,
        {
            "active_quest_summary": None,
            "previous_story_choices_summary": None,
            "completed_quest_summaries": completed_summaries[-MAX_COMPLETED_QUEST_SUMMARIES:],
        },
    )
