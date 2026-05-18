from types import SimpleNamespace

from backend.app.core.config import get_settings
from backend.app.services import ai
from backend.app.services.ai import (
    ProductivityEvaluationInput,
    evaluate_productivity_action,
    fallback_productivity_evaluation,
)


def test_missing_openai_key_uses_fallback(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    get_settings.cache_clear()

    result = evaluate_productivity_action(
        ProductivityEvaluationInput(source_type="habit", title="Practice Italian")
    )

    assert result.turns_awarded == 1
    assert result.classification == "habit"
    assert result.used_fallback is True


def test_openai_exception_uses_fallback(monkeypatch) -> None:
    class FakeResponses:
        def create(self, **_kwargs):
            raise RuntimeError("network failed")

    class FakeOpenAI:
        def __init__(self, **_kwargs) -> None:
            self.responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(ai, "OpenAI", FakeOpenAI)
    get_settings.cache_clear()

    result = evaluate_productivity_action(
        ProductivityEvaluationInput(source_type="task", title="Review lecture notes")
    )

    assert result.turns_awarded == 1
    assert result.used_fallback is True
    assert "OpenAI evaluation failed" in (result.error_message or "")
    assert result.validation_status == "failed"


def test_invalid_openai_output_uses_fallback(monkeypatch) -> None:
    class FakeResponses:
        def create(self, **_kwargs):
            return SimpleNamespace(output_text='{"turns_awarded": 4}')

    class FakeOpenAI:
        def __init__(self, **_kwargs) -> None:
            self.responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(ai, "OpenAI", FakeOpenAI)
    get_settings.cache_clear()

    result = evaluate_productivity_action(
        ProductivityEvaluationInput(source_type="task", title="Work on stuff")
    )

    assert result.turns_awarded == 1
    assert result.used_fallback is True
    assert "validation failed" in (result.error_message or "")
    assert result.validation_status == "rejected"


def test_valid_openai_output_is_used(monkeypatch) -> None:
    class FakeResponses:
        def create(self, **_kwargs):
            return SimpleNamespace(
                output_text=(
                    '{"classification":"school_task","complexity":"medium",'
                    '"meaningfulness":"high","turns_awarded":2,'
                    '"reason":"This was focused work toward a real assignment."}'
                )
            )

    class FakeOpenAI:
        def __init__(self, **_kwargs) -> None:
            self.responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setattr(ai, "OpenAI", FakeOpenAI)
    get_settings.cache_clear()

    result = evaluate_productivity_action(
        ProductivityEvaluationInput(source_type="task", title="Finish assignment intro")
    )

    assert result.turns_awarded == 2
    assert result.classification == "school_task"
    assert result.used_fallback is False


def test_fallback_reason_is_supportive() -> None:
    result = fallback_productivity_evaluation(
        ProductivityEvaluationInput(source_type="task", title="Email professor")
    )

    assert result.reason == "Nice work completing a real task."
