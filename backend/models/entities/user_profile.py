from sqlalchemy import Column, String, ForeignKey

from models.sqlalchemy.common.base import SQLAlchemyBase


class UserProfile(SQLAlchemyBase):
    __tablename__ = "evoforma_user_x_profile"

    login = Column(String, ForeignKey("evoforma_users.login"), primary_key=True)
    profile = Column(String, ForeignKey("evoforma_profile.code"), primary_key=True)
