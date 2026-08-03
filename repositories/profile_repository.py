from models.entities.profile import Profile
from repositories.base.sqlalchemy_repository import SQLAlchemyRepository


class ProfileRepository(SQLAlchemyRepository[Profile]):
    def __init__(self, session, model=Profile):
        super().__init__(session, model)
