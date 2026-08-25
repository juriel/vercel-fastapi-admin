from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

from repositories.sqlalchemy_db_manager import SqlAlchemyDatabaseManager
from services.bi_report_service import BiReportService

# The "reports.view" privilege is enforced when this router is mounted
# (see main.py), not per-endpoint.
router = InferringRouter()


@cbv(router)
class ReportReadEndpoint:
    @router.get("/reports/comercial")
    def get_comercial_report(self):
        with SqlAlchemyDatabaseManager.session("primary") as session:
            service = BiReportService(session)
            return {
                "colombia": service.build_colombia_report(),
                "latam": service.build_latam_report(),
            }
