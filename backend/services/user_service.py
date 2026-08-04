import hashlib
import secrets
from typing import List, Optional, Tuple

from sqlalchemy import inspect

from models.entities.user import User
from services.sqlalchemy_service import SQLAlchemyService
from repositories.user_repository import UserRepository

_PBKDF2_ITERATIONS = 260_000


class UserService(SQLAlchemyService[User]):
    def __init__(self, session):
        super().__init__(
            session=session,
            model=User,
            repository_class=UserRepository,
        )

    def _hash_password(self, salt: str, password: str) -> str:
        return hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt), _PBKDF2_ITERATIONS
        ).hex()

    def create(self, user: User) -> User:
        if user.password:
            user.salt = secrets.token_hex(16)
            user.password = self._hash_password(user.salt, user.password)
        return super().create(user)

    def update(self, user: User) -> User:
        inspector = inspect(user)
        if inspector.attrs.password.history.has_changes():
            user.salt = secrets.token_hex(16)
            user.password = self._hash_password(user.salt, user.password)
        return super().update(user)

    def verify_password(self, user: User, password: str) -> bool:
        return self._hash_password(user.salt, password) == user.password

    def find_page(
        self, page: int, page_size: int, search: Optional[str] = None
    ) -> Tuple[List[User], int]:
        return self._repo().find_page(page, page_size, search)
