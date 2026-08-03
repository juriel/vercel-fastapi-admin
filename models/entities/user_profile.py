from sqlalchemy import Column, String, ForeignKey

from models.sqlalchemy.common.base import SQLAlchemyBase


class UserProfile(SQLAlchemyBase):
    __tablename__ = "user_x_profile"

    login = Column(String, ForeignKey("users.login"), primary_key=True)
    profile = Column(String, ForeignKey("profile.code"), primary_key=True)
