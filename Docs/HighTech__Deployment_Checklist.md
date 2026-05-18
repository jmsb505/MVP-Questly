# HighTech MVP Deployment Checklist

## Vercel Project Settings

- Build command: `pnpm run build`
- Output directory: `dist`
- Framework preset: `Other`
- Confirm the `api/index.py` function is detected after deployment.

## Required Environment Variables

### Frontend

- `VITE_APP_NAME`
- `VITE_APP_ENV`
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Backend

- `APP_ENV`
- `API_SERVICE_NAME`
- `API_CORS_ORIGINS`
- `API_CORS_ORIGIN_REGEX`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`
- `OPENAI_REWARD_MODEL`

### Optional Monitoring

- `VITE_SENTRY_DSN`
- `VITE_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`

## Pre-Deploy Checks

- `.\.venv\Scripts\python.exe -m pytest`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm run typecheck`
- `pnpm lint`
- `pnpm run build`

## Post-Deploy Checks

- Open `/api/health` and confirm the API responds.
- Sign in with a real account.
- Create and complete a task.
- Confirm turns are awarded.
- Start a quest and confirm the first scene loads.
- Select a quest choice and confirm one turn is spent.
- Confirm production CORS allows the deployed frontend origin only.
- Confirm Sentry receives a test event if monitoring is enabled.
