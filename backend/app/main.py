from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
import logging
from .routers import tenants, users, auth
from .routers import tenants, users, auth, databases, query

from .database import init_db, engine, AsyncSessionLocal
from .routers import tenants, users


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DB and creating tables if they do not exist...")
    await init_db()
    try:
        async with AsyncSessionLocal() as session:
            await session.exec(text("SELECT 1"))
        logger.info("Database connectivity check OK")
    except Exception as e:
        logger.exception("Database connectivity check failed: %s", e)
    yield
    await engine.dispose()


app = FastAPI(title="intellisql backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://intellisql-platform.vercel.app", "https://frontend-five-omega-wr7l5amv0f.vercel.app"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tenants.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(databases.router)
app.include_router(query.router)

@app.get("/health", tags=["health"])
async def health():
    try:
        async with AsyncSessionLocal() as session:
            await session.exec(text("SELECT 1"))
        return JSONResponse({"status": "ok", "db": "connected"})
    except Exception as exc:
        return JSONResponse(
            {"status": "error", "db": "not connected", "detail": str(exc)},
            status_code=503,
        )