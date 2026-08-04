from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserUpdate, UserResponse

# The "users.write" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint, so any write endpoint added here later
# is protected without having to remember to do so.
router = InferringRouter()


@cbv(router)
class UserWriteEndpoint:
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
