import httpx
from fastapi import Header, HTTPException, status

from backend.app.core.config import get_settings
from backend.app.schemas.auth import AuthenticatedUser


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer token.",
        )

    return token


async def fetch_user_from_supabase(token: str) -> AuthenticatedUser:
    settings = get_settings()
    api_key = settings.supabase_publishable_key or settings.supabase_secret_key
    if not settings.supabase_url or not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase backend configuration is missing.",
        )

    auth_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": api_key,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(auth_url, headers=headers)

    if response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase session.",
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase auth verification failed.",
        )

    payload = response.json()
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase auth response did not include a user id.",
        )

    return AuthenticatedUser(id=user_id, email=payload.get("email"), access_token=token)


async def get_current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    token = extract_bearer_token(authorization)
    return await fetch_user_from_supabase(token)
