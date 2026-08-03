import datetime

from sqlalchemy import Column, String, DateTime, text
from sqlalchemy.dialects.postgresql import UUID

from models.sqlalchemy.common.base import SQLAlchemyBase


class AuthToken(SQLAlchemyBase):
    __tablename__ = "auth_token"

    code = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user = Column(String, nullable=True)
    expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
