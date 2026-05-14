from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    id: str
    email: str | None = None
    access_token: str | None = Field(default=None, exclude=True)
