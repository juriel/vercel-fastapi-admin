from models.entities.privilege import Privilege
from repositories.base.sqlalchemy_repository import SQLAlchemyRepository


class PrivilegeRepository(SQLAlchemyRepository[Privilege]):
    def __init__(self, session, model=Privilege):
        super().__init__(session, model)
