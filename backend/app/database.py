from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    **({} if not _is_sqlite else {"connect_args": {"check_same_thread": False}}),
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all database tables."""
    try:
        async with engine.begin() as conn:
            from app import models  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.warning(f"Database init warning: {e}")


async def get_db() -> AsyncSession:
    """
    Dependency that provides a DB session.
    The route handler is responsible for commit/rollback.
    This dependency ONLY closes the session on exit — it does NOT auto-commit.
    Auto-committing here caused a double-commit error when background tasks
    were pending, causing Starlette to close the response stream before the
    body was flushed (HTTP 200 with empty body).
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
