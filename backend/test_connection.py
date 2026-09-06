import asyncio
from app.database import engine
from sqlalchemy import text

async def test():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT current_database(), current_user;"))
        print(result.fetchone())

asyncio.run(test())