from sqlalchemy import Column, String, ForeignKey

from models.sqlalchemy.common.base import SQLAlchemyBase


class ProfilePrivilege(SQLAlchemyBase):
    __tablename__ = "evoforma_profile_x_privilege"

    profile_code = Column(String(32), ForeignKey("evoforma_profile.code"), primary_key=True)
    privilege_code = Column(String(32), ForeignKey("evoforma_privilege.code"), primary_key=True)
