from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter

router = InferringRouter()


@cbv(router)
class HelloEndpoint:
    @router.get("/hello")
    def hello(self, name: str = "World"):
        return {"message": f"Hello, {name}!"}
