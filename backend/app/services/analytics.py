from typing import Any

from backend.app.schemas.auth import AuthenticatedUser


def _execute_data(query: Any) -> Any:
    response = query.execute()
    return response.data


def record_event(
    supabase: Any,
    current_user: AuthenticatedUser | None,
    *,
    event_name: str,
    properties: dict[str, Any] | None = None,
) -> bool:
    try:
        _execute_data(
            supabase.table("internal_analytics_events")
            .insert(
                {
                    "user_id": current_user.id if current_user else None,
                    "event_name": event_name,
                    "properties": properties or {},
                }
            )
        )
        return True
    except Exception:
        return False
