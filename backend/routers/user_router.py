from fastapi import HTTPException, Query
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from typing import Optional

from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserPage, UserResponse

# The "users.read" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint, so any read endpoint added here later
# is protected without having to remember to do so.
router = InferringRouter()


@cbv(router)
class UserReadEndpoint:
    @router.get("/users", response_model=UserPage)
    def get_users(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        search: Optional[str] = Query(None),
    ):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            items, total = UserService(session).find_page(page, page_size, search)
            return {"items": items, "total": total, "page": page, "page_size": page_size}

    @router.get("/users/{login}", response_model=UserResponse)
    def get_user(self, login: str):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user = UserService(session).find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user
