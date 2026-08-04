"""One-off, idempotent script to seed the privilege catalog and keep the
admin profile in sync so it retains full access after new privileges appear.

Usage: python -m scripts.seed_privileges
"""
from database import DATABASE_URL
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager

SqlAlchemyDatabaseManager.register("primary", DATABASE_URL)

from models.entities.privilege import Privilege
from models.entities.profile import Profile  # noqa: F401 (registers FK target table)
from models.entities.profile_privilege import ProfilePrivilege

PRIVILEGES = [
    ("users.add", "Add users", "users"),
    ("users.edit", "Edit users", "users"),
    ("users.view", "View users", "users"),
    ("users.delete", "Delete users", "users"),
    ("users.list", "List users", "users"),
    ("profiles.read", "Read profiles", "profiles"),
    ("profiles.write", "Write profiles", "profiles"),
]

ADMIN_PROFILE = "admin"


def seed() -> None:
    with SqlAlchemyDatabaseManager.session("primary") as session:
        existing = {p.code for p in session.query(Privilege).all()}
        created = 0
        for code, name, category in PRIVILEGES:
            if code in existing:
                continue
            session.add(Privilege(code=code, name=name, category=category))
            created += 1
        session.flush()

        assigned = {
            pp.privilege_code
            for pp in session.query(ProfilePrivilege).filter(
                ProfilePrivilege.profile_code == ADMIN_PROFILE
            )
        }
        linked = 0
        for code, _, _ in PRIVILEGES:
            if code in assigned:
                continue
            session.add(ProfilePrivilege(profile_code=ADMIN_PROFILE, privilege_code=code))
            linked += 1

        print(f"Created {created} privileges, linked {linked} to '{ADMIN_PROFILE}'.")


if __name__ == "__main__":
    seed()
