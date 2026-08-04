from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from typing import List

from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserResponse

# The "users.read" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint, so any read endpoint added here later
# is protected without having to remember to do so.
router = InferringRouter()


@cbv(router)
class UserReadEndpoint:
    @router.get("/users", response_model=List[UserResponse])
    def get_users(self):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            return UserService(session).find_all()

    @router.get("/users/{login}", response_model=UserResponse)
    def get_user(self, login: str):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user = UserService(session).find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user
