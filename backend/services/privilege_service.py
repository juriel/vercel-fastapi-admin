from typing import List

from models.entities.privilege import Privilege
from models.entities.profile_privilege import ProfilePrivilege
from models.entities.user_profile import UserProfile
from services.sqlalchemy_service import SQLAlchemyService
from repositories.privilege_repository import PrivilegeRepository


class PrivilegeService(SQLAlchemyService[Privilege]):
    def __init__(self, session):
        super().__init__(
            session=session,
            model=Privilege,
            repository_class=PrivilegeRepository,
        )

    def find_all(self) -> List[Privilege]:
        return self.session.query(Privilege).order_by(Privilege.category, Privilege.code).all()

    def find_by_user_login(self, login: str) -> List[Privilege]:
        return (
            self.session.query(Privilege)
            .join(ProfilePrivilege, ProfilePrivilege.privilege_code == Privilege.code)
            .join(UserProfile, UserProfile.profile == ProfilePrivilege.profile_code)
            .filter(UserProfile.login == login)
            .distinct()
            .all()
        )
