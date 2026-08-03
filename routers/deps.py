from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from services.auth_token_service import AuthTokenService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_code = credentials.credentials
    with SqlAlchemyDatabaseManager.session("primary") as session:
        auth_service = AuthTokenService(session)
        token = auth_service.validate_token(token_code)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token.user
