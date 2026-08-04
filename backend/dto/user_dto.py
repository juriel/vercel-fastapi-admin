from pydantic import BaseModel, EmailStr
from typing import List, Optional


class UserBase(BaseModel):
    login: str
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    active: Optional[int] = 1


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    active: Optional[int] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    class Config:
        from_attributes = True


class UserPage(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
