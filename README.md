# Hello World (Lit + FastAPI)

Single server: FastAPI (`backend/main.py`) serves both the API (`/api/*`)
and the built frontend (a static Lit + Vite app with two pages, `/` and
`/login`). No React, no Next.js — just Lit web components and vanilla
TypeScript.

## Getting Started

Build the frontend once (FastAPI serves its `dist/` output directly):

```bash
cd frontend
pnpm install
pnpm run build
```

Run the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8081
```

Open [http://localhost:8081](http://localhost:8081) — you'll be redirected
to `/login` if you don't have a session yet. Register a user via
`POST /api/users` (open endpoint), then log in.

For frontend-only iteration with hot reload instead of rebuilding on every
change, run `pnpm dev` in `frontend/` (proxies `/api/*` to
`http://localhost:8081`) while the backend runs separately.

## Deploying to Vercel

This is a single Vercel project rooted at the repo root (no Root Directory
override needed):

1. Import this repo in Vercel.
2. `vercel.json`'s `installCommand` builds the frontend (`frontend/`) and
   copies its `dist/` output into `backend/static`, which `backend/main.py`
   serves when `../frontend/dist` isn't present (i.e. on Vercel). Every
   request is rewritten to `api/index.py`, a thin shim that re-exports the
   FastAPI `app` from `backend/main.py`; the app's own catch-all route
   decides whether to serve a static file or an API response.
3. Set `DATABASE_URL` as an environment variable (see `backend/.env.example`).
   No other environment variables are required — frontend and backend
   share the same origin in production.
