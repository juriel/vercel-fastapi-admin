from sqlalchemy import Column, String, ForeignKey

from models.sqlalchemy.common.base import SQLAlchemyBase


class ProfilePrivilege(SQLAlchemyBase):
    __tablename__ = "profile_x_privilege"

    profile_code = Column(String(32), ForeignKey("profile.code"), primary_key=True)
    privilege_code = Column(String(32), ForeignKey("privilege.code"), primary_key=True)
