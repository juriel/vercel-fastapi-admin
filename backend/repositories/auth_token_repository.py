from models.entities.auth_token import AuthToken
from repositories.base.sqlalchemy_repository import SQLAlchemyRepository


class AuthTokenRepository(SQLAlchemyRepository[AuthToken]):
    def __init__(self, session, model=AuthToken):
        super().__init__(session, model)
