from fastapi import HTTPException, Depends
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from typing import List

from models.entities.user import User
from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserCreate, UserUpdate, UserResponse
from routers.deps import get_current_user

router = InferringRouter()


@cbv(router)
class UserEndpoint:
    @router.get("/users", response_model=List[UserResponse])
    def get_users(self, current_user: str = Depends(get_current_user)):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            return user_service.find_all()

    @router.get("/users/{login}", response_model=UserResponse)
    def get_user(self, login: str, current_user: str = Depends(get_current_user)):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user

    @router.post("/users", response_model=UserResponse)
    def create_user(self, user_in: UserCreate):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            if user_service.find_by(login=user_in.login):
                raise HTTPException(status_code=400, detail="User already exists")

            user = User(
                login=user_in.login,
                password=user_in.password,
                name=user_in.name,
                email=user_in.email,
                active=user_in.active,
            )
            return user_service.create(user)

    @router.put("/users/{login}", response_model=UserResponse)
    def update_user(
        self, login: str, user_in: UserUpdate, current_user: str = Depends(get_current_user)
    ):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            for field, value in user_in.dict(exclude_unset=True).items():
                setattr(user, field, value)

            return user_service.update(user)

    @router.delete("/users/{login}")
    def delete_user(self, login: str, current_user: str = Depends(get_current_user)):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            user_service.delete(user)
            return {"message": "User deleted successfully"}
