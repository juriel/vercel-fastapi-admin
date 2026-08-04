"""One-off script to seed demo users for pagination testing.

Usage: python -m scripts.seed_users [count]
"""
import sys
import unicodedata

from database import DATABASE_URL
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager

SqlAlchemyDatabaseManager.register("primary", DATABASE_URL)

from models.entities.user import User
from services.user_service import UserService

FIRST_NAMES = [
    "Maria", "Jose", "Ana", "Luis", "Carmen", "Juan", "Laura", "Carlos",
    "Sofia", "Diego", "Elena", "Pedro", "Lucia", "Miguel", "Paula",
    "Javier", "Marta", "Andres", "Isabel", "Ricardo",
]

LAST_NAMES = [
    "Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez",
    "Sanchez", "Perez", "Gomez", "Martin", "Jimenez", "Ruiz", "Hernandez",
    "Diaz", "Moreno", "Alvarez", "Romero", "Alonso", "Gutierrez", "Torres",
]


def strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def seed(count: int) -> None:
    with SqlAlchemyDatabaseManager.session("primary") as session:
        user_service = UserService(session)
        existing = {u.login for u in session.query(User).all()}

        created = 0
        i = 0
        while created < count:
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            last = LAST_NAMES[(i // len(FIRST_NAMES)) % len(LAST_NAMES)]
            suffix = i // (len(FIRST_NAMES) * len(LAST_NAMES))
            login = strip_accents(f"{first}.{last}{suffix or ''}").lower()
            i += 1

            if login in existing:
                continue
            existing.add(login)

            name = f"{first} {last}"[:32]
            email = f"{login}@example.com"[:32]

            user = User(
                login=login,
                password="Demo1234!",
                name=name,
                email=email,
                active=1 if created % 5 != 0 else 0,
            )
            user_service.create(user)
            created += 1

        print(f"Created {created} users.")


if __name__ == "__main__":
    seed(int(sys.argv[1]) if len(sys.argv) > 1 else 120)
