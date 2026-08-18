from typing import Dict, List

from models.entities.privilege import Privilege
from models.entities.profile import Profile
from models.entities.profile_privilege import ProfilePrivilege
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

    def find_all(self) -> List[Profile]:
        return self.session.query(Profile).order_by(Profile.code).all()

    def find_by_user_logins(self, logins: List[str]) -> Dict[str, List[Profile]]:
        if not logins:
            return {}
        rows = (
            self.session.query(UserProfile.login, Profile)
            .join(Profile, UserProfile.profile == Profile.code)
            .filter(UserProfile.login.in_(logins))
            .all()
        )
        result: Dict[str, List[Profile]] = {login: [] for login in logins}
        for login, profile in rows:
            result[login].append(profile)
        return result

    def set_user_profiles(self, login: str, profile_codes: List[str]) -> None:
        self.session.query(UserProfile).filter(UserProfile.login == login).delete()
        for code in dict.fromkeys(profile_codes):
            self.session.add(UserProfile(login=login, profile=code))
        self.session.flush()

    def privileges_for(self, profile_code: str) -> List[Privilege]:
        return (
            self.session.query(Privilege)
            .join(ProfilePrivilege, ProfilePrivilege.privilege_code == Privilege.code)
            .filter(ProfilePrivilege.profile_code == profile_code)
            .order_by(Privilege.category, Privilege.code)
            .all()
        )

    def set_privileges(self, profile_code: str, privilege_codes: List[str]) -> None:
        self.session.query(ProfilePrivilege).filter(
            ProfilePrivilege.profile_code == profile_code
        ).delete()
        for code in dict.fromkeys(privilege_codes):
            self.session.add(ProfilePrivilege(profile_code=profile_code, privilege_code=code))
        self.session.flush()

    def delete_profile(self, profile: Profile) -> None:
        self.session.query(ProfilePrivilege).filter(
            ProfilePrivilege.profile_code == profile.code
        ).delete()
        self.session.flush()
        self.delete(profile)
