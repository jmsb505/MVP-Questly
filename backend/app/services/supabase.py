from functools import lru_cache
from typing import Any

import httpx
from fastapi import HTTPException, status

from backend.app.core.config import get_settings
from backend.app.schemas.auth import AuthenticatedUser


class SupabaseRestResponse:
    def __init__(self, data: Any) -> None:
        self.data = data


class SupabaseRestQuery:
    def __init__(self, client: "SupabaseRestClient", table_name: str) -> None:
        self.client = client
        self.table_name = table_name
        self.method = "GET"
        self.params: list[tuple[str, str]] = []
        self.payload: dict[str, Any] | None = None
        self.headers: dict[str, str] = {}

    def select(self, columns: str) -> "SupabaseRestQuery":
        self.method = "GET"
        self.params.append(("select", columns))
        return self

    def insert(self, payload: dict[str, Any]) -> "SupabaseRestQuery":
        self.method = "POST"
        self.payload = payload
        self.headers["Prefer"] = "return=representation"
        return self

    def update(self, payload: dict[str, Any]) -> "SupabaseRestQuery":
        self.method = "PATCH"
        self.payload = payload
        self.headers["Prefer"] = "return=representation"
        return self

    def eq(self, column: str, value: Any) -> "SupabaseRestQuery":
        self.params.append((column, f"eq.{_format_filter_value(value)}"))
        return self

    def neq(self, column: str, value: Any) -> "SupabaseRestQuery":
        self.params.append((column, f"neq.{_format_filter_value(value)}"))
        return self

    def order(self, column: str, desc: bool = False) -> "SupabaseRestQuery":
        direction = "desc" if desc else "asc"
        self.params.append(("order", f"{column}.{direction}"))
        return self

    def limit(self, count: int) -> "SupabaseRestQuery":
        self.params.append(("limit", str(count)))
        return self

    def execute(self) -> SupabaseRestResponse:
        return SupabaseRestResponse(
            self.client.request(
                self.method,
                self.table_name,
                params=self.params,
                payload=self.payload,
                headers=self.headers,
            )
        )


class SupabaseRestClient:
    def __init__(self, supabase_url: str, api_key: str) -> None:
        self.rest_url = f"{supabase_url.rstrip('/')}/rest/v1"
        self.api_key = api_key

    def table(self, table_name: str) -> SupabaseRestQuery:
        return SupabaseRestQuery(self, table_name)

    def request(
        self,
        method: str,
        table_name: str,
        *,
        params: list[tuple[str, str]],
        payload: dict[str, Any] | None,
        headers: dict[str, str],
    ) -> Any:
        request_headers = {
            "Accept": "application/json",
            "apikey": self.api_key,
            **headers,
        }
        if method in {"POST", "PATCH"}:
            request_headers["Content-Type"] = "application/json"

        response = httpx.request(
            method,
            f"{self.rest_url}/{table_name}",
            params=params,
            json=payload,
            headers=request_headers,
            timeout=10,
        )

        if response.status_code >= 400:
            detail = _extract_error_detail(response)
            if response.status_code in {
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_404_NOT_FOUND,
                status.HTTP_409_CONFLICT,
            }:
                raise HTTPException(status_code=response.status_code, detail=detail)

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Supabase table request failed: {detail}",
            )

        if not response.content:
            return []

        return response.json()


def _format_filter_value(value: Any) -> str:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or response.reason_phrase

    if isinstance(payload, dict):
        return (
            payload.get("message")
            or payload.get("msg")
            or payload.get("hint")
            or payload.get("details")
            or response.reason_phrase
        )

    return response.reason_phrase


@lru_cache
def get_supabase_admin_client() -> SupabaseRestClient:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY are required.")

    return SupabaseRestClient(settings.supabase_url, settings.supabase_secret_key)


def ensure_owned_row(
    table_name: str,
    row_id: str,
    current_user: AuthenticatedUser,
    *,
    id_column: str = "id",
    user_column: str = "user_id",
    client: Any | None = None,
) -> dict[str, Any]:
    supabase_client = client or get_supabase_admin_client()
    response = (
        supabase_client.table(table_name)
        .select(f"{id_column},{user_column}")
        .eq(id_column, row_id)
        .eq(user_column, current_user.id)
        .limit(1)
        .execute()
    )

    rows = response.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{table_name} row was not found for the current user.",
        )

    return rows[0]
