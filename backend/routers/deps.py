from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.entities.auth_token import AuthToken
from services.auth_token_service import AuthTokenService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager

security = HTTPBearer()


def _validate_token(credentials: HTTPAuthorizationCredentials) -> AuthToken:
    with SqlAlchemyDatabaseManager.session("primary") as session:
        auth_service = AuthTokenService(session)
        token = auth_service.validate_token(credentials.credentials)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    return _validate_token(credentials).user_login


def get_current_token_code(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    return _validate_token(credentials).code
