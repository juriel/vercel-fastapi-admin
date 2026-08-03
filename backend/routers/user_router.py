from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from typing import List

from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserUpdate, UserResponse

# Auth is enforced when this router is mounted (see api/index.py), not per-endpoint,
# so any endpoint added here later is protected without having to remember to do so.
router = InferringRouter()


@cbv(router)
class UserEndpoint:
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

    @router.put("/users/{login}", response_model=UserResponse)
    def update_user(self, login: str, user_in: UserUpdate):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            for field, value in user_in.dict(exclude_unset=True).items():
                setattr(user, field, value)

            return user_service.update(user)

    @router.delete("/users/{login}")
    def delete_user(self, login: str):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            user_service.delete(user)
            return {"message": "User deleted successfully"}
