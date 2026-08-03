from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import DATABASE_URL
from models.sqlalchemy.common.base import SQLAlchemyBase
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from routers.hello_router import router as hello_router
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
app.include_router(user_router, prefix="/api")
app.include_router(session_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8081)
