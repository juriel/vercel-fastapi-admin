from fastapi import Depends, HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import PasswordChangeRequest, UserResponse
from routers.deps import get_current_user

# Unlike /users, these endpoints only require a valid session (no
# users.read/users.write privilege) since every authenticated user must be
# able to see and manage their own account.
router = InferringRouter()


@cbv(router)
class MeEndpoint:
    @router.get("/me", response_model=UserResponse)
    def get_me(self, login: str = Depends(get_current_user)):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user = UserService(session).find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return user

    @router.put("/me/password")
    def change_password(
        self, body: PasswordChangeRequest, login: str = Depends(get_current_user)
    ):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            user = user_service.find_by(login=login)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            if not user_service.verify_password(user, body.current_password):
                raise HTTPException(
                    status_code=400, detail="La contraseña actual no es correcta"
                )
            if body.current_password == body.new_password:
                raise HTTPException(
                    status_code=400,
                    detail="La nueva contraseña debe ser distinta a la actual",
                )

            user.password = body.new_password
            user_service.update(user)
            return {"message": "Password updated successfully"}
