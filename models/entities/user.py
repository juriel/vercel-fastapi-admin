from sqlalchemy import Column, String, Integer, Text

from models.sqlalchemy.common.base import SQLAlchemyBase


class User(SQLAlchemyBase):
    __tablename__ = "users"

    login = Column(String(64), primary_key=True)
    password = Column(String(255), nullable=True)
    category = Column(String(32), nullable=True)
    name = Column(String(32), nullable=True)
    email = Column(String(32), nullable=True)
    phone = Column(String(16), nullable=True)
    salt = Column(String(128), nullable=True)
    active = Column(Integer, nullable=True, default=1)
    profile_picture = Column(Text, nullable=True)
