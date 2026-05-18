from typing import Any

from backend.app.services.ai import (
    ChoiceResolutionInput,
    ChoiceResolutionResult,
    NarrativeTurnInput,
    NarrativeTurnResult,
    QuestPlanInput,
    QuestPlanResult,
    fallback_choice_resolution,
    fallback_narrative_turn,
    fallback_quest_plan,
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
    "combat",
]


def contains_excluded_terms(*values: Any) -> bool:
    text = " ".join(str(value or "") for value in values).lower()
    return any(term in text for term in EXCLUDED_NARRATIVE_TERMS)


def validate_quest_plan(plan: QuestPlanResult, payload: QuestPlanInput) -> QuestPlanResult:
    if contains_excluded_terms(
        plan.quest_title,
        plan.genre,
        plan.tone,
        plan.premise,
        plan.main_objective,
        plan.starting_situation,
        " ".join(plan.known_facts),
        " ".join(plan.open_questions),
    ):
        return fallback_quest_plan(
            payload,
            "Quest plan included excluded mechanics.",
            validation_status="rejected",
        )
    return plan


def validate_narrative_turn(
    narrative: NarrativeTurnResult,
    payload: NarrativeTurnInput,
) -> NarrativeTurnResult:
    choice_texts = [choice.choice_text.strip() for choice in narrative.choices]
    normalized_choices = [choice.casefold() for choice in choice_texts]
    if len(set(normalized_choices)) != len(normalized_choices):
        return fallback_narrative_turn(
            payload,
            "Narrative turn included duplicate choices.",
            validation_status="rejected",
        )
    if contains_excluded_terms(narrative.scene_text, " ".join(choice_texts)):
        return fallback_narrative_turn(
            payload,
            "Narrative turn included excluded mechanics.",
            validation_status="rejected",
        )
    return narrative


def validate_choice_resolution(
    resolution: ChoiceResolutionResult,
    payload: ChoiceResolutionInput,
) -> ChoiceResolutionResult:
    if contains_excluded_terms(
        resolution.consequence,
        resolution.current_location,
        resolution.previous_choices_summary,
        resolution.final_summary,
        resolution.outcome_summary,
        " ".join(resolution.new_story_facts),
        " ".join(resolution.open_questions),
    ):
        return fallback_choice_resolution(
            payload,
            "Choice resolution included excluded mechanics.",
            validation_status="rejected",
        )
    return resolution
