from typing import List, Optional, Tuple

from sqlalchemy import or_

from models.entities.user import User
from repositories.base.sqlalchemy_repository import SQLAlchemyRepository


class UserRepository(SQLAlchemyRepository[User]):
    def __init__(self, session, model=User):
        super().__init__(session, model)

    def find_page(
        self, page: int, page_size: int, search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        query = self.session.query(self.model)
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    self.model.login.ilike(like),
                    self.model.name.ilike(like),
                    self.model.email.ilike(like),
                )
            )

        total = query.count()
        items = (
            query.order_by(self.model.login)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total
