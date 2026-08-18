from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

from dto.profile_dto import ProfileBase


class UserBase(BaseModel):
    login: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    active: Optional[int] = 1


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=255)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    active: Optional[int] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=255)
    profile_codes: Optional[List[str]] = None


class UserResponse(UserBase):
    profiles: List[ProfileBase] = []

    class Config:
        from_attributes = True


class UserPage(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=255)
