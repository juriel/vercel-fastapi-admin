# Hello World (Lit + FastAPI)

Single server: FastAPI (`backend/main.py`) serves both the API (`/api/*`)
and the built frontend (a static Lit + Vite app with two pages, `/` and
`/login`). No React, no Next.js — just Lit web components and vanilla
TypeScript.

## Running locally

Both the backend and frontend need to run at the same time — the backend
serves the API, and the Vite dev server serves the frontend with hot reload
and proxies `/api/*` to the backend.

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env and set DATABASE_URL to a real Postgres connection string

uvicorn main:app --reload --port 8081
```

`database.py` reads `DATABASE_URL` from `.env` via `python-dotenv`; the
backend won't start without it. Tables are created automatically on first
run (`SQLAlchemyBase.metadata.create_all(...)` in `main.py`) — there's no
separate migration step.

> If your machine already has a newer FastAPI installed globally, creating
> the virtualenv above is what keeps this project on the versions pinned in
> `requirements.txt` (a newer FastAPI breaks `fastapi-utils`'s
> `InferringRouter`). Always run `uvicorn` from inside the activated `.venv`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You'll be redirected to
`/login` if you don't have a session yet — register a user via
`POST /api/users` (open endpoint, e.g. with `curl` or the register page),
then log in.

### Building for a single-server run

FastAPI can also serve the frontend directly from `backend/main.py` (no Vite
dev server) once it's built:

```bash
cd frontend
npm install
npm run build
```

This outputs `frontend/dist`, which `backend/main.py` serves automatically
when present. With the frontend built this way, you only need to run the
backend (`uvicorn main:app --port 8081`) and open
[http://localhost:8081](http://localhost:8081) directly — useful for
checking what a production-like build looks like without deploying.

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
3. Set `DATABASE_URL` as an environment variable in the Vercel project
   settings (see `backend/.env.example` for the expected format). No other
   environment variables are required — frontend and backend share the same
   origin in production, so there's no CORS/API-base-URL configuration to do.
4. Push/deploy — Vercel runs the `installCommand`, then routes every
   request through `api/index.py`.
