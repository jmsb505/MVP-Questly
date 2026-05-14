from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class PlaceholderResponse(BaseModel):
    message: str
    phase: str
