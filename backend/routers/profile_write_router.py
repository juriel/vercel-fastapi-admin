from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from sqlalchemy.exc import IntegrityError

from models.entities.profile import Profile
from services.profile_service import ProfileService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.profile_dto import ProfileCreate, ProfileUpdate, ProfileResponse

# The "profiles.write" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint, so any write endpoint added here later
# is protected without having to remember to do so.
router = InferringRouter()


def _to_response(service: ProfileService, profile: Profile) -> dict:
    return {
        "code": profile.code,
        "name": profile.name,
        "editable": profile.editable,
        "privileges": service.privileges_for(profile.code),
    }


@cbv(router)
class ProfileWriteEndpoint:
    @router.post("/profiles", response_model=ProfileResponse)
    def create_profile(self, profile_in: ProfileCreate):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            service = ProfileService(session)
            if service.find_by(code=profile_in.code):
                raise HTTPException(status_code=400, detail="Profile already exists")

            profile = Profile(code=profile_in.code, name=profile_in.name, editable=1)
            service.create(profile)
            service.set_privileges(profile.code, profile_in.privilege_codes)
            return _to_response(service, profile)

    @router.put("/profiles/{code}", response_model=ProfileResponse)
    def update_profile(self, code: str, profile_in: ProfileUpdate):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            service = ProfileService(session)
            profile = service.find_by(code=code)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            if not profile.editable:
                raise HTTPException(status_code=400, detail="This profile cannot be modified")

            if profile_in.name is not None:
                profile.name = profile_in.name
                service.update(profile)

            if profile_in.privilege_codes is not None:
                service.set_privileges(code, profile_in.privilege_codes)

            return _to_response(service, profile)

    @router.delete("/profiles/{code}")
    def delete_profile(self, code: str):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            service = ProfileService(session)
            profile = service.find_by(code=code)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            if not profile.editable:
                raise HTTPException(status_code=400, detail="This profile cannot be deleted")

            try:
                service.delete_profile(profile)
            except IntegrityError:
                session.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="This profile is assigned to one or more users",
                )

            return {"message": "Profile deleted successfully"}
