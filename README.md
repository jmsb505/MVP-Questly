# HighTech MVP Quest App

HighTech is a gamified productivity MVP where completed tasks and habits earn story turns that unlock short AI-generated quest choices.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui-compatible local components
- Backend: Python, FastAPI, Pydantic
- Deployment target: Vercel frontend and Vercel Functions for API
- Data/Auth later phases: Supabase Auth, Supabase Postgres, RLS
- AI later phases: OpenAI API with Structured Outputs

## Supabase Keys

Use Supabase's current API key model:

- `VITE_SUPABASE_PUBLISHABLE_KEY` uses the browser-safe public `sb_publishable_...` key.
- `SUPABASE_PUBLISHABLE_KEY` can use the same `sb_publishable_...` key for backend Auth verification.
- `SUPABASE_SECRET_KEY` uses the backend-only `sb_secret_...` key.
- `OPENAI_REWARD_MODEL` controls the Phase 4 productivity evaluator model and defaults to `gpt-5.4-nano`.

Do not expose `SUPABASE_SECRET_KEY` in frontend code or browser-accessible environment variables.

## Setup

```powershell
pnpm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

## Frontend Commands

```powershell
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm typecheck
pnpm lint
pnpm test
pnpm run build
```

`pnpm dev` starts both the Vite frontend and FastAPI backend. The Vite app runs at `http://localhost:5280` by default.

If port `5280` is already in use, stop the older Vite process or close the terminal that started it, then rerun `pnpm dev`.

## Backend Commands

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pytest
```

The FastAPI app runs at `http://localhost:8000` by default. Health check:

```text
GET http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "hightech-api"
}
```

## Phase 1 Scope

Phase 1 creates project foundations only. It does not implement auth, Supabase tables, task CRUD, habit CRUD, reward logic, quests, or AI calls.

## Supabase Local Workflow

The Supabase CLI scaffold was initialized with:

```powershell
npx supabase init
```

Useful commands for later phases:

```powershell
npx supabase start
npx supabase migration new <migration_name>
npx supabase db reset
```

Phase 1 intentionally includes no schema migrations yet. Database tables and RLS policies start in Phase 2.
