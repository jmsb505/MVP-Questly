import json
from typing import Any, Literal

from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError

from backend.app.core.config import get_settings


Complexity = Literal["low", "medium", "high"]
Meaningfulness = Literal["low", "medium", "high"]
SourceType = Literal["task", "habit"]
ChoiceType = Literal["branching", "progression", "investigation", "tone"]


class ProductivityEvaluationInput(BaseModel):
    source_type: SourceType
    title: str
    description: str | None = None
    user_type: str | None = None


class ProductivityEvaluationResult(BaseModel):
    classification: str = Field(min_length=1, max_length=80)
    complexity: Complexity
    meaningfulness: Meaningfulness
    turns_awarded: Literal[1, 2, 3]
    reason: str = Field(min_length=1, max_length=240)
    used_fallback: bool = False
    error_message: str | None = None


EVALUATION_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "classification": {
            "type": "string",
            "description": "Short classification such as task, school_task, work_task, habit, wellness_habit.",
        },
        "complexity": {"type": "string", "enum": ["low", "medium", "high"]},
        "meaningfulness": {"type": "string", "enum": ["low", "medium", "high"]},
        "turns_awarded": {"type": "integer", "enum": [1, 2, 3]},
        "reason": {
            "type": "string",
            "description": "One short supportive user-facing sentence explaining the reward.",
        },
    },
    "required": ["classification", "complexity", "meaningfulness", "turns_awarded", "reason"],
}


class QuestPlanInput(BaseModel):
    preferred_genres: list[str] = Field(default_factory=list)
    tone_style_preferences: str | None = None


class QuestPlanResult(BaseModel):
    quest_title: str = Field(min_length=1, max_length=120)
    genre: str = Field(min_length=1, max_length=80)
    tone: str = Field(min_length=1, max_length=160)
    premise: str = Field(min_length=1, max_length=700)
    main_objective: str = Field(min_length=1, max_length=320)
    starting_situation: str = Field(min_length=1, max_length=1000)
    planned_length_in_turns: int = Field(ge=15, le=20)
    current_location: str = Field(min_length=1, max_length=220)
    known_facts: list[str] = Field(min_length=1, max_length=12)
    open_questions: list[str] = Field(min_length=1, max_length=6)
    used_fallback: bool = False
    error_message: str | None = None


class NarrativeChoice(BaseModel):
    choice_text: str = Field(min_length=1, max_length=220)
    choice_type: ChoiceType


class NarrativeTurnInput(BaseModel):
    quest_title: str
    genre: str | None = None
    tone: str | None = None
    premise: str | None = None
    main_objective: str | None = None
    current_location: str | None = None
    known_facts: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    previous_choices_summary: str | None = None
    turn_index: int


class NarrativeTurnResult(BaseModel):
    scene_text: str = Field(min_length=1, max_length=1400)
    choices: list[NarrativeChoice] = Field(min_length=2, max_length=3)
    used_fallback: bool = False
    error_message: str | None = None


class ChoiceResolutionInput(BaseModel):
    quest_title: str
    selected_choice_text: str
    current_location: str | None = None
    known_facts: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    turns_spent_after: int
    planned_length_in_turns: int


class ChoiceResolutionResult(BaseModel):
    consequence: str = Field(min_length=1, max_length=1000)
    new_story_facts: list[str] = Field(default_factory=list, max_length=6)
    open_questions: list[str] = Field(default_factory=list, max_length=6)
    current_location: str = Field(min_length=1, max_length=160)
    previous_choices_summary: str = Field(min_length=1, max_length=900)
    is_quest_complete: bool
    final_summary: str | None = Field(default=None, max_length=1000)
    outcome_summary: str | None = Field(default=None, max_length=700)
    used_fallback: bool = False
    error_message: str | None = None


QUEST_PLAN_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "quest_title": {"type": "string"},
        "genre": {"type": "string"},
        "tone": {"type": "string"},
        "premise": {"type": "string"},
        "main_objective": {"type": "string"},
        "starting_situation": {"type": "string"},
        "planned_length_in_turns": {"type": "integer", "minimum": 15, "maximum": 20},
        "current_location": {"type": "string"},
        "known_facts": {"type": "array", "items": {"type": "string"}},
        "open_questions": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "quest_title",
        "genre",
        "tone",
        "premise",
        "main_objective",
        "starting_situation",
        "planned_length_in_turns",
        "current_location",
        "known_facts",
        "open_questions",
    ],
}

NARRATIVE_TURN_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "scene_text": {"type": "string"},
        "choices": {
            "type": "array",
            "minItems": 2,
            "maxItems": 3,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "choice_text": {"type": "string"},
                    "choice_type": {
                        "type": "string",
                        "enum": ["branching", "progression", "investigation", "tone"],
                    },
                },
                "required": ["choice_text", "choice_type"],
            },
        },
    },
    "required": ["scene_text", "choices"],
}

CHOICE_RESOLUTION_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "consequence": {"type": "string"},
        "new_story_facts": {"type": "array", "items": {"type": "string"}},
        "open_questions": {"type": "array", "items": {"type": "string"}},
        "current_location": {"type": "string"},
        "previous_choices_summary": {"type": "string"},
        "is_quest_complete": {"type": "boolean"},
        "final_summary": {"type": ["string", "null"]},
        "outcome_summary": {"type": ["string", "null"]},
    },
    "required": [
        "consequence",
        "new_story_facts",
        "open_questions",
        "current_location",
        "previous_choices_summary",
        "is_quest_complete",
        "final_summary",
        "outcome_summary",
    ],
}


def fallback_productivity_evaluation(
    payload: ProductivityEvaluationInput,
    error_message: str | None = None,
) -> ProductivityEvaluationResult:
    reason = (
        "Nice work completing a real task."
        if payload.source_type == "task"
        else "Nice work keeping up with this habit."
    )
    return ProductivityEvaluationResult(
        classification=payload.source_type,
        complexity="low",
        meaningfulness="low",
        turns_awarded=1,
        reason=reason,
        used_fallback=True,
        error_message=error_message,
    )


def evaluate_productivity_action(payload: ProductivityEvaluationInput) -> ProductivityEvaluationResult:
    settings = get_settings()
    if not settings.openai_api_key:
        return fallback_productivity_evaluation(payload, "OPENAI_API_KEY is not configured.")

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        responses = getattr(client, "responses", None)
        if responses is None:
            return fallback_productivity_evaluation(
                payload,
                "Installed OpenAI SDK does not expose the Responses API.",
            )

        response = responses.create(
            model=settings.openai_reward_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You evaluate completed productivity actions for a lightweight MVP. "
                        "Return only the requested structured output. Be conservative: most "
                        "valid habits and small tasks earn 1 turn, clearly meaningful tasks "
                        "can earn 2 turns, and 3 turns is rare. Feedback must be supportive. "
                        "Do not mention XP, levels, stats, coins, inventory, combat, badges, "
                        "or multiplayer."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "action_type": payload.source_type,
                            "title": payload.title,
                            "description": payload.description,
                            "user_type": payload.user_type,
                        }
                    ),
                },
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "productivity_evaluation",
                    "strict": True,
                    "schema": EVALUATION_JSON_SCHEMA,
                }
            },
        )

        output_text = getattr(response, "output_text", None)
        if not output_text:
            return fallback_productivity_evaluation(payload, "OpenAI response did not include output text.")

        result = ProductivityEvaluationResult.model_validate_json(output_text)
        return result.model_copy(update={"used_fallback": False, "error_message": None})
    except (ValidationError, json.JSONDecodeError) as exc:
        return fallback_productivity_evaluation(payload, f"OpenAI response validation failed: {exc}")
    except Exception as exc:
        return fallback_productivity_evaluation(payload, f"OpenAI evaluation failed: {exc}")


def _create_structured_response(
    *,
    model: str,
    system_prompt: str,
    payload: dict[str, Any],
    schema_name: str,
    schema: dict[str, Any],
) -> str:
    client = OpenAI(api_key=get_settings().openai_api_key)
    responses = getattr(client, "responses", None)
    if responses is None:
        raise RuntimeError("Installed OpenAI SDK does not expose the Responses API.")

    response = responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(payload)},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "strict": True,
                "schema": schema,
            }
        },
    )
    output_text = getattr(response, "output_text", None)
    if not output_text:
        raise RuntimeError("OpenAI response did not include output text.")
    return output_text


def fallback_quest_plan(payload: QuestPlanInput, error_message: str | None = None) -> QuestPlanResult:
    genre = payload.preferred_genres[0] if payload.preferred_genres else "adventure mystery"
    tone = payload.tone_style_preferences or "cinematic, mysterious, and adventurous"
    return QuestPlanResult(
        quest_title="The Shattered Observatory",
        genre=genre,
        tone=tone,
        premise=(
            "A mountaintop observatory has split open above an ancient city of lenses, bridges, "
            "and buried machines. A missing cartographer left behind a trail of impossible star maps."
        ),
        main_objective=(
            "Follow the cartographer's route through changing districts, uncover what woke beneath "
            "the observatory, and decide whether the city should be sealed or restored."
        ),
        starting_situation=(
            "Rain hisses against the broken dome as you step into the observatory's star chamber. "
            "A brass orrery turns by itself, projecting a blue path across rooftops far below. "
            "Someone has carved a fresh warning into the telescope mount: Do not let the city look back."
        ),
        planned_length_in_turns=15,
        current_location="Broken star chamber of the mountaintop observatory",
        known_facts=[
            "The observatory has opened a path into the lens-city below",
            "A missing cartographer left impossible star maps behind",
            "The city may be able to observe people in return",
        ],
        open_questions=[
            "What woke beneath the observatory?",
            "Why did the cartographer disappear?",
            "Should the city be sealed or restored?",
        ],
        used_fallback=True,
        error_message=error_message,
    )


def plan_quest(payload: QuestPlanInput) -> QuestPlanResult:
    settings = get_settings()
    if not settings.openai_api_key:
        return fallback_quest_plan(payload, "OPENAI_API_KEY is not configured.")

    try:
        output_text = _create_structured_response(
            model=settings.openai_reward_model,
            system_prompt=(
                "Create an engaging videogame-style narrative quest, not a productivity story. "
                "It should feel like an actual adventure game with a strong premise, changing scenery, "
                "NPCs or factions when useful, mysteries, traversal, environmental puzzles, discoveries, "
                "rising stakes, and meaningful choices. Plan for 15 to 20 story choices. "
                "Do not mention tasks, habits, productivity, story turns, or the app. "
                "Avoid XP, levels, stats, coins, inventory systems, combat mechanics, and multiplayer."
            ),
            payload=payload.model_dump(),
            schema_name="quest_plan",
            schema=QUEST_PLAN_JSON_SCHEMA,
        )
        return QuestPlanResult.model_validate_json(output_text)
    except Exception as exc:
        return fallback_quest_plan(payload, f"Quest planning failed: {exc}")


def fallback_narrative_turn(
    payload: NarrativeTurnInput,
    error_message: str | None = None,
) -> NarrativeTurnResult:
    fallback_setpieces = [
        (
            "Rainwater pours through cracked glass above the observatory floor. The blue projection "
            "slides from the orrery onto a balcony, revealing a stairway that was not there a moment ago."
        ),
        (
            "The path descends into a market of silent awnings and hanging lanterns. A masked courier "
            "watches from a bridge, then drops a folded star map before vanishing into the crowd."
        ),
        (
            "A canal of black water blocks the route. Beneath the surface, rows of submerged windows "
            "glow like open eyes, each showing a different version of the street ahead."
        ),
        (
            "The district shifts as bells ring underground. Stone walkways rotate into new positions, "
            "turning the city into a moving maze around a tower of mirrored brass."
        ),
    ]
    scene = fallback_setpieces[payload.turn_index % len(fallback_setpieces)]
    return NarrativeTurnResult(
        scene_text=scene,
        choices=[
            NarrativeChoice(choice_text="Push deeper toward the projected route.", choice_type="progression"),
            NarrativeChoice(choice_text="Investigate the strange mechanism before moving on.", choice_type="investigation"),
            NarrativeChoice(choice_text="Seek out whoever is watching from nearby.", choice_type="branching"),
        ],
        used_fallback=True,
        error_message=error_message,
    )


def generate_narrative_turn(payload: NarrativeTurnInput) -> NarrativeTurnResult:
    settings = get_settings()
    if not settings.openai_api_key:
        return fallback_narrative_turn(payload, "OPENAI_API_KEY is not configured.")

    try:
        output_text = _create_structured_response(
            model=settings.openai_reward_model,
            system_prompt=(
                "Generate the next scene for an engaging videogame-style narrative quest. "
                "Make each turn feel like forward movement: change scenery, reveal a clue, introduce "
                "a character or faction, present an environmental obstacle, or create a meaningful dilemma. "
                "Vary the interaction type across turns: exploration, puzzle, dialogue, risk, moral choice, "
                "stealthy approach, traversal, or discovery. Do not keep the user in the same room unless "
                "there is a strong story reason. Do not mention tasks, habits, productivity, story turns, or the app. "
                "No XP, levels, stats, inventory systems, combat mechanics, or multiplayer. "
                "Scene length can be cinematic but concise, under 1400 characters. Choices should be distinct."
            ),
            payload=payload.model_dump(),
            schema_name="narrative_turn",
            schema=NARRATIVE_TURN_JSON_SCHEMA,
        )
        return NarrativeTurnResult.model_validate_json(output_text)
    except Exception as exc:
        return fallback_narrative_turn(payload, f"Narrative generation failed: {exc}")


def fallback_choice_resolution(
    payload: ChoiceResolutionInput,
    error_message: str | None = None,
) -> ChoiceResolutionResult:
    is_complete = payload.turns_spent_after >= payload.planned_length_in_turns
    next_locations = [
        "The rain-slick balcony outside the observatory dome",
        "The lantern market below the lens-city aqueduct",
        "The rotating bridge district",
        "The archive of mirrored brass",
        "The buried engine room under the old plaza",
    ]
    consequence = (
        f"You choose to {payload.selected_choice_text.lower()} The route shifts in response. "
        "A hidden mechanism answers with a low metallic chord, opening a way into another part of the city."
    )
    final_summary = None
    outcome_summary = None
    if is_complete:
        final_summary = (
            f"{payload.quest_title} ends as the city's central lens turns toward the dawn. "
            "The missing cartographer's route is complete, and the truth behind the observatory is finally clear."
        )
        outcome_summary = "You reached the end of the quest and chose the city's future."

    return ChoiceResolutionResult(
        consequence=consequence,
        new_story_facts=["The latest choice opened a new route through the city"],
        open_questions=[] if is_complete else payload.open_questions[:4],
        current_location=next_locations[payload.turns_spent_after % len(next_locations)],
        previous_choices_summary=(
            f"The user chose: {payload.selected_choice_text}. "
            "The quest moved to a new scene with changed circumstances."
        ),
        is_quest_complete=is_complete,
        final_summary=final_summary,
        outcome_summary=outcome_summary,
        used_fallback=True,
        error_message=error_message,
    )


def resolve_choice(payload: ChoiceResolutionInput) -> ChoiceResolutionResult:
    settings = get_settings()
    if not settings.openai_api_key:
        return fallback_choice_resolution(payload, "OPENAI_API_KEY is not configured.")

    try:
        output_text = _create_structured_response(
            model=settings.openai_reward_model,
            system_prompt=(
                "Resolve the selected videogame-style narrative choice and update quest state. "
                "Make the consequence concrete: something should change in the location, mystery, "
                "NPC relationship, route, clue state, or stakes. Move the scene forward when appropriate. "
                "Do not mention tasks, habits, productivity, story turns, or the app. "
                "No XP, levels, stats, inventory systems, combat mechanics, or multiplayer. "
                "If the planned turn count is reached, complete the quest with a satisfying final summary."
            ),
            payload=payload.model_dump(),
            schema_name="choice_resolution",
            schema=CHOICE_RESOLUTION_JSON_SCHEMA,
        )
        return ChoiceResolutionResult.model_validate_json(output_text)
    except Exception as exc:
        return fallback_choice_resolution(payload, f"Choice resolution failed: {exc}")
