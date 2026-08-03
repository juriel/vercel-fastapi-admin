from models.entities.user import User
from repositories.base.sqlalchemy_repository import SQLAlchemyRepository


class UserRepository(SQLAlchemyRepository[User]):
    def __init__(self, session, model=User):
        super().__init__(session, model)
