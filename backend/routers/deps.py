import json
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.entities.auth_token import AuthToken
from services.auth_token_service import AuthTokenService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager

# auto_error=False so a missing Authorization header reaches _validate_token
# and is reported as 401 (not authenticated), keeping 403 exclusively for
# "authenticated but missing the required privilege".
security = HTTPBearer(auto_error=False)


def _validate_token(credentials: Optional[HTTPAuthorizationCredentials]) -> AuthToken:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
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


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    return _validate_token(credentials).user_login


def get_current_token_code(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    return _validate_token(credentials).code


def require_privilege(code: str):
    """Dependency factory: 401 if not authenticated, 403 if authenticated
    but missing `code` (or "ALL") among the privileges cached on the token
    at login time."""

    def dependency(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    ) -> str:
        token = _validate_token(credentials)
        try:
            privileges = json.loads(token.privileges or "[]")
        except (TypeError, ValueError):
            privileges = []
        codes = {p.get("code") for p in privileges if isinstance(p, dict)}
        if code not in codes and "ALL" not in codes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required privilege: {code}",
            )
        return token.user_login

    return dependency
