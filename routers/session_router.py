from fastapi import Depends, HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from services.user_service import UserService
from services.auth_token_service import AuthTokenService
from services.privilege_service import PrivilegeService
from services.profile_service import ProfileService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.session_dto import LoginRequest, TokenResponse
from routers.deps import get_current_token_code

router = InferringRouter()


def _issue_token(session, auth_service: AuthTokenService, user_login: str):
    profiles = ProfileService(session).find_by_user_login(user_login)
    privileges = PrivilegeService(session).find_by_user_login(user_login)
    token = auth_service.create_token(
        user_login=user_login,
        profiles=[p.code for p in profiles],
        privileges=[
            {"code": p.code, "name": p.name, "category": p.category} for p in privileges
        ],
    )
    return token, privileges


@cbv(router)
class SessionEndpoint:
    @router.post("/login", response_model=TokenResponse)
    def login(self, login_req: LoginRequest):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            user_service = UserService(session)
            auth_service = AuthTokenService(session)

            user = user_service.find_by(login=login_req.login)
            if not user or not user_service.verify_password(user, login_req.password):
                raise HTTPException(status_code=401, detail="Invalid credentials")

            token, privileges = _issue_token(session, auth_service, user.login)
            return TokenResponse(
                token=token.code,
                expires_at=token.expires_at,
                identity=user.login,
                privileges=privileges,
            )

    # logout/refresh require an existing valid session, so the token comes
    # from the Authorization header (like every other protected endpoint)
    # instead of being passed in the request body.
    @router.post("/logout")
    def logout(self, token_code: str = Depends(get_current_token_code)):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            auth_service = AuthTokenService(session)
            token = auth_service.find_by_id(token_code)
            if token:
                auth_service.delete(token)
            return {"message": "Logged out successfully"}

    @router.post("/session_refresh", response_model=TokenResponse)
    def refresh(self, token_code: str = Depends(get_current_token_code)):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            auth_service = AuthTokenService(session)
            old_token = auth_service.find_by_id(token_code)
            user_login = old_token.user_login
            auth_service.delete(old_token)
            token, privileges = _issue_token(session, auth_service, user_login)

            return TokenResponse(
                token=token.code,
                expires_at=token.expires_at,
                identity=user_login,
                privileges=privileges,
            )
