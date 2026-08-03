from typing import List

from models.entities.profile import Profile
from models.entities.user_profile import UserProfile
from services.sqlalchemy_service import SQLAlchemyService
from repositories.profile_repository import ProfileRepository


class ProfileService(SQLAlchemyService[Profile]):
    def __init__(self, session):
        super().__init__(
            session=session,
            model=Profile,
            repository_class=ProfileRepository,
        )

    def find_by_user_login(self, login: str) -> List[Profile]:
        return (
            self.session.query(Profile)
            .join(UserProfile, UserProfile.profile == Profile.code)
            .filter(UserProfile.login == login)
            .all()
        )
