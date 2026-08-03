import json
import secrets
import time
from typing import Iterable, Mapping, Optional

from models.entities.auth_token import AuthToken
from services.sqlalchemy_service import SQLAlchemyService
from repositories.auth_token_repository import AuthTokenRepository


class AuthTokenService(SQLAlchemyService[AuthToken]):
    def __init__(self, session):
        super().__init__(
            session=session,
            model=AuthToken,
            repository_class=AuthTokenRepository,
        )

    def create_token(
        self,
        user_login: str,
        profiles: Iterable[str] = (),
        privileges: Iterable[Mapping] = (),
        expires_in_minutes: int = 30,
    ) -> AuthToken:
        now = int(time.time())
        token = AuthToken(
            code=secrets.token_urlsafe(64),
            user_login=user_login,
            created_at=now,
            expires_at=now + expires_in_minutes * 60,
            profiles=json.dumps(list(profiles)),
            privileges=json.dumps(list(privileges)),
        )
        return self.create(token)

    def validate_token(self, code: str) -> Optional[AuthToken]:
        token = self.find_by_id(code)
        if token and token.expires_at is not None and token.expires_at > int(time.time()):
            return token
        return None
