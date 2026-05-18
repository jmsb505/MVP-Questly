from backend.app.services.ai import (
    ChoiceResolutionInput,
    ChoiceResolutionResult,
    NarrativeChoice,
    NarrativeTurnInput,
    NarrativeTurnResult,
)
from backend.app.services.ai_validation import validate_choice_resolution, validate_narrative_turn


def test_duplicate_narrative_choices_are_rejected() -> None:
    payload = NarrativeTurnInput(quest_title="Quest", turn_index=1)
    narrative = NarrativeTurnResult(
        scene_text="A door opens.",
        choices=[
            NarrativeChoice(choice_text="Inspect the door.", choice_type="investigation"),
            NarrativeChoice(choice_text="Inspect the door.", choice_type="investigation"),
        ],
    )

    result = validate_narrative_turn(narrative, payload)

    assert result.used_fallback is True
    assert result.validation_status == "rejected"


def test_choice_resolution_with_excluded_mechanics_is_rejected() -> None:
    payload = ChoiceResolutionInput(
        quest_title="Quest",
        selected_choice_text="Open the door.",
        turns_spent_after=1,
        planned_length_in_turns=15,
    )
    resolution = ChoiceResolutionResult(
        consequence="You gain XP.",
        new_story_facts=[],
        open_questions=[],
        current_location="Hall",
        previous_choices_summary="Opened the door.",
        is_quest_complete=False,
    )

    result = validate_choice_resolution(resolution, payload)

    assert result.used_fallback is True
    assert result.validation_status == "rejected"
