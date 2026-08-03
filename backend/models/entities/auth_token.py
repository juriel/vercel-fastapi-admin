from sqlalchemy import Column, String, BigInteger, Text

from models.sqlalchemy.common.base import SQLAlchemyBase


class AuthToken(SQLAlchemyBase):
    __tablename__ = "auth_token"

    code = Column(String(1024), primary_key=True)
    user_login = Column("users", String(64), nullable=True)
    created_at = Column(BigInteger, nullable=True)
    expires_at = Column(BigInteger, nullable=True)
    profiles = Column(Text, nullable=True)
    privileges = Column(Text, nullable=True)
