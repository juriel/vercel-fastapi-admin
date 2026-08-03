from pydantic import BaseModel


class PrivilegeResponse(BaseModel):
    code: str
    name: str
    category: str

    class Config:
        from_attributes = True
