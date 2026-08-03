from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


class SqlAlchemyDatabaseManager:
    _engines = {}
    _sessionmakers = {}

    @classmethod
    def register(cls, name: str, url: str):
        if name not in cls._engines:
            engine = create_engine(url, pool_pre_ping=True, pool_recycle=1800)
            cls._engines[name] = engine
            cls._sessionmakers[name] = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=engine,
                expire_on_commit=False,
            )

    @classmethod
    def get_engine(cls, name: str):
        return cls._engines[name]

    @classmethod
    @contextmanager
    def session(cls, name: str):
        if name not in cls._sessionmakers:
            raise ValueError(f"Database '{name}' not registered")

        session = cls._sessionmakers[name]()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
