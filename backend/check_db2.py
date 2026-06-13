import asyncio
from app.database import AsyncSessionLocal
from app.models import Audit, Issue
from sqlalchemy import select, delete

async def check_db():
    async with AsyncSessionLocal() as db:
        # Delete old amazon.com records (the ones that faked 100 score)
        await db.execute(delete(Audit).where(Audit.url.like('%amazon.com%')))
        # Delete the wikipedia record that failed due to uvicorn reload
        await db.execute(delete(Audit).where(Audit.id == 'c11a26f4-f58d-4f03-9287-bf14242bfe9a'))
        # Delete the very first wikipedia record which might be corrupt
        await db.execute(delete(Audit).where(Audit.id == '8760927d-daa9-4876-933d-09fc689d9f80'))
        await db.commit()
        print("Deleted old amazon/wikipedia records.")

asyncio.run(check_db())
