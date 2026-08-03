from sqlalchemy import Column, String, Integer

from models.sqlalchemy.common.base import SQLAlchemyBase


class Profile(SQLAlchemyBase):
    __tablename__ = "profile"

    code = Column(String(32), primary_key=True)
    name = Column(String(64), nullable=False)
    editable = Column(Integer, nullable=False, default=1)
