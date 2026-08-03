from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.orm import Session

T = TypeVar("T")


class SQLAlchemyRepository(Generic[T]):
    def __init__(self, session: Session, model: Type[T]):
        self.session = session
        self.model = model

    def create(self, entity: T) -> T:
        self.session.add(entity)
        self.session.flush()
        return entity

    def find_by_id(self, id_value) -> Optional[T]:
        return self.session.get(self.model, id_value)

    def find_by(self, **filters) -> Optional[T]:
        return self.session.query(self.model).filter_by(**filters).first()

    def find_all(self) -> List[T]:
        return self.session.query(self.model).all()

    def update(self, entity: T) -> T:
        merged_entity = self.session.merge(entity)
        self.session.flush()
        return merged_entity

    def upsert(self, entity: T) -> T:
        merged_entity = self.session.merge(entity)
        self.session.flush()
        return merged_entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()
