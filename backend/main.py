from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import DATABASE_URL
from models.sqlalchemy.common.base import SQLAlchemyBase
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from routers.deps import get_current_user
from routers.hello_router import router as hello_router
from routers.registration_router import router as registration_router
from routers.user_router import router as user_router
from routers.session_router import router as session_router

SqlAlchemyDatabaseManager.register("primary", DATABASE_URL)

# No migration tooling yet for this demo: create tables if they don't exist.
SQLAlchemyBase.metadata.create_all(SqlAlchemyDatabaseManager.get_engine("primary"))

app = FastAPI(title="Hello World API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hello_router, prefix="/api")
app.include_router(registration_router, prefix="/api")
app.include_router(user_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(session_router, prefix="/api")

# The frontend is a static Vite+Lit build. Locally it lives at ../frontend/dist
# (built via `npm run build`); on Vercel the installCommand copies it into
# ./static instead, alongside this file.
backend_dir = Path(__file__).parent
local_static_dir = backend_dir.parent / "frontend" / "dist"
vercel_static_dir = backend_dir / "static"
static_dir = local_static_dir if local_static_dir.exists() else vercel_static_dir

if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            return {"detail": "Not Found"}

        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        # index.html for "/", <name>.html for known pages, otherwise fall back to index.html
        pages = {"login", "register", "forgot-password", "users"}
        if full_path == "" or full_path in pages:
            page = f"{full_path}.html" if full_path else "index.html"
            return FileResponse(static_dir / page)

        return FileResponse(static_dir / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8081)
