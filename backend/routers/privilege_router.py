from typing import List

from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from services.privilege_service import PrivilegeService
from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from dto.privilege_dto import PrivilegeResponse

# The "profiles.read" privilege is enforced when this router is mounted
# (see main.py): the catalog is only needed to build the profile editor.
router = InferringRouter()


@cbv(router)
class PrivilegeReadEndpoint:
    @router.get("/privileges", response_model=List[PrivilegeResponse])
    def get_privileges(self):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            return PrivilegeService(session).find_all()
