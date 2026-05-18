from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.core.observability import init_sentry
from backend.app.routers import auth, habits, health, placeholders, quests, story_turns, tasks, user_memory


def create_app() -> FastAPI:
    settings = get_settings()
    init_sentry(settings)

    app = FastAPI(
        title="HighTech API",
        version="0.1.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(tasks.router, prefix="/api")
    app.include_router(habits.router, prefix="/api")
    app.include_router(story_turns.router, prefix="/api")
    app.include_router(quests.router, prefix="/api")
    app.include_router(user_memory.router, prefix="/api")
    app.include_router(placeholders.router, prefix="/api")

    return app


app = create_app()
