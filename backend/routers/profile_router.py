from typing import List

from fastapi import HTTPException
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from services.profile_service import ProfileService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.profile_dto import ProfileResponse

# The "profiles.read" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint, so any read endpoint added here later
# is protected without having to remember to do so.
router = InferringRouter()


def _to_response(service: ProfileService, profile) -> dict:
    return {
        "code": profile.code,
        "name": profile.name,
        "editable": profile.editable,
        "privileges": service.privileges_for(profile.code),
    }


@cbv(router)
class ProfileReadEndpoint:
    @router.get("/profiles", response_model=List[ProfileResponse])
    def get_profiles(self):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            service = ProfileService(session)
            return [_to_response(service, p) for p in service.find_all()]

    @router.get("/profiles/{code}", response_model=ProfileResponse)
    def get_profile(self, code: str):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            service = ProfileService(session)
            profile = service.find_by(code=code)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")
            return _to_response(service, profile)
