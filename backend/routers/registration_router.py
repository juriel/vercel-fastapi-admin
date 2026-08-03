from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from models.entities.user import User
from services.user_service import UserService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.user_dto import UserCreate, UserResponse

router = InferringRouter()


@cbv(router)
class RegistrationEndpoint:
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
