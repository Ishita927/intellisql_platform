# backend/app/database.py
import os
from dotenv import load_dotenv
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {"ssl": True}

engine = create_async_engine(DATABASE_URL, echo=True, connect_args=connect_args)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session():
    """FastAPI dependency — use with Depends(get_session) in routers."""
    async with AsyncSessionLocal() as session:
        yield session


# async def init_db():
#     async with engine.begin() as conn:
#         from . import models  # noqa: ensures models are registered on metadata
#         await conn.run_sync(SQLModel.metadata.create_all)

async def init_db():
    async with engine.begin() as conn:
        from . import models  # noqa
        await conn.run_sync(SQLModel.metadata.create_all)