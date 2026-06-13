import asyncio
from app.database import AsyncSessionLocal
from app.models import Audit, Issue
from sqlalchemy import select

async def check_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Audit))
        audits = result.scalars().all()
        for a in audits:
            print(f"[{a.id}] {a.url} | Status: {a.status} | Score: {a.score}")

asyncio.run(check_db())
