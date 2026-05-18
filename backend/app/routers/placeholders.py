from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.common import PlaceholderResponse

router = APIRouter(tags=["phase-1-placeholders"])


def not_implemented(feature: str) -> PlaceholderResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "message": f"{feature} will be implemented in a later MVP phase.",
            "phase": "Future MVP phase",
        },
    )
