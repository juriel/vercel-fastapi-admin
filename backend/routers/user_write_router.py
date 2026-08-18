from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from sqlalchemy.exc import IntegrityError

from models.entities.user import User
from models.entities.profile import Profile
from services.user_service import UserService
from services.profile_service import ProfileService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserUpdate, UserResponse
from typing import List

# The "users.write" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint, so any write endpoint added here later
# is protected without having to remember to do so.
router = InferringRouter()


def _to_response(user: User, profiles: List[Profile]) -> dict:
    return {
        "login": user.login,
        "name": user.name,
        "email": user.email,
        "active": user.active,
        "profiles": [{"code": p.code, "name": p.name} for p in profiles],
    }


@cbv(router)
class UserWriteEndpoint:
    @router.put("/users/{login}", response_model=UserResponse)
    def update_user(self, login: str, user_in: UserUpdate):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            fields = user_in.dict(exclude_unset=True, exclude={"profile_codes"})
            for field, value in fields.items():
                setattr(user, field, value)
            user = user_service.update(user)

            profile_service = ProfileService(session)
            if user_in.profile_codes is not None:
                try:
                    profile_service.set_user_profiles(login, user_in.profile_codes)
                except IntegrityError:
                    session.rollback()
                    raise HTTPException(
                        status_code=400, detail="Uno o más perfiles no existen"
                    )

            return _to_response(user, profile_service.find_by_user_login(login))

    @router.delete("/users/{login}")
    def delete_user(self, login: str):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            user_service.delete(user)
            return {"message": "User deleted successfully"}
