from typing import TypeVar, Generic, Type, List, Optional

from repositories.base.sqlalchemy_repository import SQLAlchemyRepository

T = TypeVar("T")


class SQLAlchemyService(Generic[T]):
    def __init__(self, session, model: Type[T], repository_class=SQLAlchemyRepository):
        self.session = session
        self._model = model
        self._repository_class = repository_class

    def _repo(self):
        return self._repository_class(self.session, self._model)

    def create(self, entity: T) -> T:
        return self._repo().create(entity)

    def find_all(self) -> List[T]:
        return self._repo().find_all()

    def update(self, entity: T) -> T:
        return self._repo().update(entity)

    def upsert(self, entity: T) -> T:
        return self._repo().upsert(entity)

    def delete(self, entity: T) -> None:
        self._repo().delete(entity)

    def find_by_id(self, id_value) -> Optional[T]:
        return self._repo().find_by_id(id_value)

    def find_by(self, **filters) -> Optional[T]:
        return self._repo().find_by(**filters)
