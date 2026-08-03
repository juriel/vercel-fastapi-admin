from sqlalchemy import Column, String

from models.sqlalchemy.common.base import SQLAlchemyBase


class Privilege(SQLAlchemyBase):
    __tablename__ = "privilege"

    code = Column(String(32), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
