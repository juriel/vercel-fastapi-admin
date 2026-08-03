# Hello World (Next.js + Lit + FastAPI)

Single Vercel project: Next.js serves the frontend, and `api/index.py`
(FastAPI) is deployed as a Python Serverless Function at `/api/*`.

## Getting Started

Run the backend (FastAPI) in one terminal:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn api.index:app --reload --port 8081
```

Run the frontend (Next.js) in another terminal:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The page rewrites
`/api/*` requests to `http://localhost:8081/api/*` (see `next.config.ts`),
so both processes need to be running for the "Say Hello" button to work.

Alternatively, use `vercel dev` (Vercel CLI) to run both frontend and
backend together exactly as they run in production.

## Deploying to Vercel

This repo is a single Vercel project (no need to split frontend/backend
into separate projects):

1. Import this repo in Vercel. Leave **Root Directory** as the repo root.
2. Vercel auto-detects the Next.js frontend and the Python function in
   `api/index.py` (via `requirements.txt` at the repo root).
3. No environment variables are required — since frontend and backend
   share the same domain in production, the frontend calls `/api/hello`
   as a relative path.
