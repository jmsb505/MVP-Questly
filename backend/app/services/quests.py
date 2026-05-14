from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from backend.app.schemas.auth import AuthenticatedUser
from backend.app.schemas.quests import QuestCreate
from backend.app.services.ai import (
    ChoiceResolutionInput,
    ChoiceResolutionResult,
    NarrativeTurnInput,
    NarrativeTurnResult,
    QuestPlanInput,
    generate_narrative_turn,
    fallback_choice_resolution,
    fallback_narrative_turn,
    fallback_quest_plan,
    plan_quest,
    resolve_choice,
)
from backend.app.services.productivity import get_story_turn_balance
from backend.app.services.supabase import get_supabase_admin_client


def _now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


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


def _log_ai(
    supabase: Any,
    current_user: AuthenticatedUser,
    *,
    feature: str,
    request_payload: dict[str, Any],
    response_payload: dict[str, Any],
    used_fallback: bool,
    error_message: str | None,
) -> None:
    _execute_data(
        supabase.table("ai_generation_logs")
        .insert(
            {
                "user_id": current_user.id,
                "feature": feature,
                "validation_status": "fallback_used" if used_fallback else "approved",
                "request_payload": request_payload,
                "response_payload": response_payload,
                "error_message": error_message,
            }
        )
    )


EXCLUDED_NARRATIVE_TERMS = [
    " xp",
    "experience points",
    "level up",
    "level-up",
    "stats",
    "stat points",
    "skill tree",
    "inventory",
    "coins",
    "badges",
    "multiplayer",
]


def _contains_excluded_terms(*values: Any) -> bool:
    text = " ".join(str(value or "") for value in values).lower()
    return any(term in text for term in EXCLUDED_NARRATIVE_TERMS)


def _validated_plan(plan: Any, payload: QuestPlanInput) -> Any:
    if _contains_excluded_terms(
        plan.quest_title,
        plan.genre,
        plan.tone,
        plan.premise,
        plan.main_objective,
        plan.starting_situation,
        " ".join(plan.known_facts),
        " ".join(plan.open_questions),
    ):
        return fallback_quest_plan(payload, "Quest plan included excluded mechanics.")
    return plan


def _validated_narrative(narrative: NarrativeTurnResult, payload: NarrativeTurnInput) -> NarrativeTurnResult:
    choice_text = " ".join(choice.choice_text for choice in narrative.choices)
    if _contains_excluded_terms(narrative.scene_text, choice_text):
        return fallback_narrative_turn(payload, "Narrative turn included excluded mechanics.")
    return narrative


def _validated_resolution(
    resolution: ChoiceResolutionResult,
    payload: ChoiceResolutionInput,
) -> ChoiceResolutionResult:
    if _contains_excluded_terms(
        resolution.consequence,
        resolution.current_location,
        resolution.previous_choices_summary,
        resolution.final_summary,
        resolution.outcome_summary,
        " ".join(resolution.new_story_facts),
        " ".join(resolution.open_questions),
    ):
        return fallback_choice_resolution(payload, "Choice resolution included excluded mechanics.")
    return resolution


def _get_memory(supabase: Any, current_user: AuthenticatedUser) -> dict[str, Any]:
    rows = _execute_data(
        supabase.table("user_memory")
        .select("*")
        .eq("user_id", current_user.id)
        .limit(1)
    )
    return rows[0] if rows else {}


def _update_memory(
    supabase: Any,
    current_user: AuthenticatedUser,
    updates: dict[str, Any],
) -> None:
    _execute_data(
        supabase.table("user_memory")
        .update(updates)
        .eq("user_id", current_user.id)
    )


def _quest_summary(quest: dict[str, Any], state: dict[str, Any] | None = None) -> str:
    pieces = [quest["title"]]
    if quest.get("genre"):
        pieces.append(f"Genre: {quest['genre']}")
    if quest.get("main_objective"):
        pieces.append(f"Objective: {quest['main_objective']}")
    if state and state.get("current_location"):
        pieces.append(f"Current location: {state['current_location']}")
    return ". ".join(pieces)


def _active_quest_row(supabase: Any, current_user: AuthenticatedUser) -> dict[str, Any] | None:
    rows = _execute_data(
        supabase.table("quests")
        .select("*")
        .eq("user_id", current_user.id)
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(1)
    )
    return rows[0] if rows else None


def _quest_state(supabase: Any, quest_id: str, current_user: AuthenticatedUser) -> dict[str, Any] | None:
    rows = _execute_data(
        supabase.table("quest_state")
        .select("*")
        .eq("quest_id", quest_id)
        .eq("user_id", current_user.id)
        .limit(1)
    )
    return rows[0] if rows else None


def _latest_turn(supabase: Any, quest_id: str, current_user: AuthenticatedUser) -> dict[str, Any] | None:
    rows = _execute_data(
        supabase.table("quest_turns")
        .select("*")
        .eq("quest_id", quest_id)
        .eq("user_id", current_user.id)
        .order("turn_index", desc=True)
        .limit(1)
    )
    return rows[0] if rows else None


def _choices_for_turn(supabase: Any, turn_id: str, current_user: AuthenticatedUser) -> list[dict[str, Any]]:
    return _execute_data(
        supabase.table("quest_choices")
        .select("*")
        .eq("quest_turn_id", turn_id)
        .eq("user_id", current_user.id)
        .order("created_at")
    )


def _serialize_state(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    return {
        "quest_id": row["quest_id"],
        "current_location": row.get("current_location"),
        "known_facts": row.get("known_facts") or [],
        "open_questions": row.get("open_questions") or [],
        "previous_choices_summary": row.get("previous_choices_summary"),
        "progress_status": row["progress_status"],
        "turns_spent": row["turns_spent"],
    }


def _serialize_turn(
    turn: dict[str, Any] | None,
    choices: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not turn:
        return None
    return {
        "id": turn["id"],
        "quest_id": turn["quest_id"],
        "turn_index": turn["turn_index"],
        "scene_text": turn["scene_text"],
        "choices": choices,
        "created_at": turn["created_at"],
    }


def _serialize_quest(
    supabase: Any,
    quest: dict[str, Any],
    current_user: AuthenticatedUser,
) -> dict[str, Any]:
    state = _quest_state(supabase, quest["id"], current_user)
    turn = _latest_turn(supabase, quest["id"], current_user)
    choices = _choices_for_turn(supabase, turn["id"], current_user) if turn else []
    return {
        "id": quest["id"],
        "title": quest["title"],
        "genre": quest.get("genre"),
        "tone": quest.get("tone"),
        "premise": quest.get("premise"),
        "main_objective": quest.get("main_objective"),
        "planned_length_in_turns": quest["planned_length_in_turns"],
        "status": quest["status"],
        "final_summary": quest.get("final_summary"),
        "outcome_summary": quest.get("outcome_summary"),
        "started_at": quest["started_at"],
        "completed_at": quest.get("completed_at"),
        "current_turn": _serialize_turn(turn, choices),
        "state": _serialize_state(state),
    }


def _create_turn(
    supabase: Any,
    current_user: AuthenticatedUser,
    quest: dict[str, Any],
    state: dict[str, Any],
    turn_index: int,
) -> dict[str, Any]:
    payload = NarrativeTurnInput(
        quest_title=quest["title"],
        genre=quest.get("genre"),
        tone=quest.get("tone"),
        premise=quest.get("premise"),
        main_objective=quest.get("main_objective"),
        current_location=state.get("current_location"),
        known_facts=state.get("known_facts") or [],
        open_questions=state.get("open_questions") or [],
        previous_choices_summary=state.get("previous_choices_summary"),
        turn_index=turn_index,
    )
    narrative = _validated_narrative(generate_narrative_turn(payload), payload)
    _log_ai(
        supabase,
        current_user,
        feature="narrative_turn_generation",
        request_payload=payload.model_dump(),
        response_payload=narrative.model_dump(exclude={"used_fallback", "error_message"}),
        used_fallback=narrative.used_fallback,
        error_message=narrative.error_message,
    )

    turn = _first_or_404(
        _execute_data(
            supabase.table("quest_turns")
            .insert(
                {
                    "quest_id": quest["id"],
                    "user_id": current_user.id,
                    "turn_index": turn_index,
                    "scene_text": narrative.scene_text,
                }
            )
        ),
        "Quest turn",
    )
    for choice in narrative.choices:
        _execute_data(
            supabase.table("quest_choices")
            .insert(
                {
                    "quest_turn_id": turn["id"],
                    "quest_id": quest["id"],
                    "user_id": current_user.id,
                    "choice_text": choice.choice_text,
                    "choice_type": choice.choice_type,
                }
            )
        )
    return turn


def get_active_quest(current_user: AuthenticatedUser, client: Any | None = None) -> dict[str, Any] | None:
    supabase = client or get_supabase_admin_client()
    quest = _active_quest_row(supabase, current_user)
    if not quest:
        return None
    return _serialize_quest(supabase, quest, current_user)


def create_quest(
    payload: QuestCreate,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    existing = _active_quest_row(supabase, current_user)
    if existing:
        return _serialize_quest(supabase, existing, current_user)

    memory = _get_memory(supabase, current_user)
    preferred_genres = [payload.genre] if payload.genre else memory.get("preferred_genres") or []
    tone = payload.tone or memory.get("tone_style_preferences")
    plan_payload = QuestPlanInput(preferred_genres=preferred_genres, tone_style_preferences=tone)
    plan = _validated_plan(plan_quest(plan_payload), plan_payload)
    _log_ai(
        supabase,
        current_user,
        feature="quest_planning",
        request_payload=plan_payload.model_dump(),
        response_payload=plan.model_dump(exclude={"used_fallback", "error_message"}),
        used_fallback=plan.used_fallback,
        error_message=plan.error_message,
    )

    quest = _first_or_404(
        _execute_data(
            supabase.table("quests")
            .insert(
                {
                    "user_id": current_user.id,
                    "title": plan.quest_title,
                    "genre": plan.genre,
                    "tone": plan.tone,
                    "premise": plan.premise,
                    "main_objective": plan.main_objective,
                    "planned_length_in_turns": plan.planned_length_in_turns,
                    "status": "active",
                }
            )
        ),
        "Quest",
    )
    state = _first_or_404(
        _execute_data(
            supabase.table("quest_state")
            .insert(
                {
                    "quest_id": quest["id"],
                    "user_id": current_user.id,
                    "current_location": plan.current_location,
                    "known_facts": plan.known_facts,
                    "open_questions": plan.open_questions,
                    "previous_choices_summary": plan.starting_situation,
                    "progress_status": "started",
                    "turns_spent": 0,
                }
            )
        ),
        "Quest state",
    )
    _create_turn(supabase, current_user, quest, state, 0)
    _update_memory(
        supabase,
        current_user,
        {
            "active_quest_summary": _quest_summary(quest, state),
            "previous_story_choices_summary": plan.starting_situation,
        },
    )
    return _serialize_quest(supabase, quest, current_user)


def abandon_active_quest(
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    quest = _active_quest_row(supabase, current_user)
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active quest to abandon.")

    rows = _execute_data(
        supabase.table("quests")
        .update(
            {
                "status": "abandoned",
                "completed_at": _now(),
                "final_summary": f"{quest['title']} was abandoned before reaching an ending.",
                "outcome_summary": "The quest was set aside so a new adventure can begin.",
            }
        )
        .eq("id", quest["id"])
        .eq("user_id", current_user.id)
    )
    abandoned = _first_or_404(rows, "Quest")
    _execute_data(
        supabase.table("quest_state")
        .update({"progress_status": "abandoned"})
        .eq("quest_id", quest["id"])
        .eq("user_id", current_user.id)
    )
    _update_memory(
        supabase,
        current_user,
        {
            "active_quest_summary": None,
            "previous_story_choices_summary": None,
        },
    )
    return _serialize_quest(supabase, abandoned, current_user)


def select_choice(
    quest_id: str,
    choice_id: str,
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> dict[str, Any]:
    supabase = client or get_supabase_admin_client()
    quest = _first_or_404(
        _execute_data(
            supabase.table("quests")
            .select("*")
            .eq("id", quest_id)
            .eq("user_id", current_user.id)
            .limit(1)
        ),
        "Quest",
    )
    if quest["status"] != "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Quest is not active.")

    choice = _first_or_404(
        _execute_data(
            supabase.table("quest_choices")
            .select("*")
            .eq("id", choice_id)
            .eq("quest_id", quest_id)
            .eq("user_id", current_user.id)
            .limit(1)
        ),
        "Quest choice",
    )
    if choice.get("selected"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Choice was already selected.")

    selected_for_turn = _execute_data(
        supabase.table("quest_choices")
        .select("id")
        .eq("quest_turn_id", choice["quest_turn_id"])
        .eq("user_id", current_user.id)
        .eq("selected", True)
        .limit(1)
    )
    if selected_for_turn:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A choice has already been selected for this story turn.",
        )

    balance = get_story_turn_balance(current_user, supabase)
    available_turns = int(balance["available_turns"])
    if available_turns < 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No story turns available.")

    state = _first_or_404(
        _execute_data(
            supabase.table("quest_state")
            .select("*")
            .eq("quest_id", quest_id)
            .eq("user_id", current_user.id)
            .limit(1)
        ),
        "Quest state",
    )
    turns_spent_after = int(state["turns_spent"]) + 1
    resolution_payload = ChoiceResolutionInput(
        quest_title=quest["title"],
        selected_choice_text=choice["choice_text"],
        current_location=state.get("current_location"),
        known_facts=state.get("known_facts") or [],
        open_questions=state.get("open_questions") or [],
        turns_spent_after=turns_spent_after,
        planned_length_in_turns=quest["planned_length_in_turns"],
    )
    resolution = _validated_resolution(resolve_choice(resolution_payload), resolution_payload)
    quest_completed = resolution.is_quest_complete or turns_spent_after >= int(quest["planned_length_in_turns"])
    _log_ai(
        supabase,
        current_user,
        feature="choice_resolution",
        request_payload=resolution_payload.model_dump(),
        response_payload=resolution.model_dump(exclude={"used_fallback", "error_message"}),
        used_fallback=resolution.used_fallback,
        error_message=resolution.error_message,
    )

    balance_after = available_turns - 1
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
                "transaction_type": "spent",
                "amount": -1,
                "balance_after": balance_after,
                "quest_choice_id": choice_id,
                "reason": "Spent 1 story turn on a quest choice.",
            }
        )
    )

    selected_choice = _first_or_404(
        _execute_data(
            supabase.table("quest_choices")
            .update(
                {
                    "selected": True,
                    "selected_at": _now(),
                    "result_text": resolution.consequence,
                }
            )
            .eq("id", choice_id)
            .eq("user_id", current_user.id)
        ),
        "Quest choice",
    )
    known_facts = list(dict.fromkeys((state.get("known_facts") or []) + resolution.new_story_facts))
    state_updates = {
        "current_location": resolution.current_location,
        "known_facts": known_facts[:12],
        "open_questions": resolution.open_questions,
        "previous_choices_summary": resolution.previous_choices_summary,
        "turns_spent": turns_spent_after,
        "progress_status": "completed" if quest_completed else "in_progress",
    }
    _execute_data(
        supabase.table("quest_state")
        .update(state_updates)
        .eq("quest_id", quest_id)
        .eq("user_id", current_user.id)
    )

    if quest_completed:
        final_summary = resolution.final_summary or f"{quest['title']} reached its ending."
        outcome_summary = resolution.outcome_summary or "The quest was completed."
        quest = _first_or_404(
            _execute_data(
                supabase.table("quests")
                .update(
                    {
                        "status": "completed",
                        "completed_at": _now(),
                        "final_summary": final_summary,
                        "outcome_summary": outcome_summary,
                    }
                )
                .eq("id", quest_id)
                .eq("user_id", current_user.id)
            ),
            "Quest",
        )
        _execute_data(
            supabase.table("completed_quest_history")
            .insert(
                {
                    "user_id": current_user.id,
                    "quest_id": quest_id,
                    "title": quest["title"],
                    "genre": quest.get("genre"),
                    "final_summary": final_summary,
                    "outcome_summary": outcome_summary,
                }
            )
        )
        memory = _get_memory(supabase, current_user)
        completed_summaries = list(memory.get("completed_quest_summaries") or [])
        completed_summaries.append(
            {
                "quest_id": quest_id,
                "title": quest["title"],
                "final_summary": final_summary,
                "outcome_summary": outcome_summary,
                "completed_at": _now(),
            }
        )
        _update_memory(
            supabase,
            current_user,
            {
                "active_quest_summary": None,
                "previous_story_choices_summary": None,
                "completed_quest_summaries": completed_summaries[-10:],
            },
        )
    else:
        next_state = _quest_state(supabase, quest_id, current_user) or state_updates
        _create_turn(supabase, current_user, quest, next_state, turns_spent_after)
        _update_memory(
            supabase,
            current_user,
            {
                "active_quest_summary": _quest_summary(quest, next_state),
                "previous_story_choices_summary": resolution.previous_choices_summary,
            },
        )

    serialized = _serialize_quest(supabase, quest, current_user)
    return {
        "quest": serialized,
        "selected_choice": selected_choice,
        "consequence": resolution.consequence,
        "turns_spent": turns_spent_after,
        "balance_after": balance_after,
        "quest_completed": quest_completed,
    }


def list_completed_history(
    current_user: AuthenticatedUser,
    client: Any | None = None,
) -> list[dict[str, Any]]:
    supabase = client or get_supabase_admin_client()
    return _execute_data(
        supabase.table("completed_quest_history")
        .select("*")
        .eq("user_id", current_user.id)
        .order("completed_at", desc=True)
    )
