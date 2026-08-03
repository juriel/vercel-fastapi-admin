import datetime

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

    def create_token(self, user_login: str, expires_in_minutes: int = 30) -> AuthToken:
        expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=expires_in_minutes
        )
        token = AuthToken(user=user_login, expires=expiry)
        return self.create(token)

    def validate_token(self, code: str) -> AuthToken | None:
        token = self.find_by_id(code)
        if token and token.expires > datetime.datetime.now(datetime.timezone.utc):
            return token
        return None
