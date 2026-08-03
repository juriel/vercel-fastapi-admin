from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List

from dto.privilege_dto import PrivilegeResponse


class LoginRequest(BaseModel):
    login: str
    password: str


class TokenResponse(BaseModel):
    token: str
    expires_at: datetime
    identity: str
    privileges: List[PrivilegeResponse] = []

    model_config = ConfigDict(from_attributes=True)
