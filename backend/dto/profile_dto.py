from typing import List, Optional

from pydantic import BaseModel

from dto.privilege_dto import PrivilegeResponse


class ProfileBase(BaseModel):
    code: str
    name: str


class ProfileCreate(ProfileBase):
    privilege_codes: List[str] = []


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    privilege_codes: Optional[List[str]] = None


class ProfileResponse(ProfileBase):
    editable: int
    privileges: List[PrivilegeResponse] = []

    class Config:
        from_attributes = True
