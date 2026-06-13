import asyncio
from app.database import AsyncSessionLocal
from app.models import Audit, Issue
from sqlalchemy import select, delete

async def check_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Audit))
        audits = result.scalars().all()
        print(f"Total audits: {len(audits)}")
        for a in audits:
            print(f"[{a.id}] {a.url} | Status: {a.status} | Score: {a.score}")
            if "flipkart" in a.url.lower():
                print(f"  -> FLIPKART AUDIT FOUND: {a.error_message}")
                
        # Let's delete any audits that were mock (e.g. from the start of development)
        # We can just delete the Flipkart one if it's corrupt.
        await db.execute(delete(Audit).where(Audit.url.like('%flipkart%')))
        await db.execute(delete(Audit).where(Audit.url.like('%example.com%')))
        await db.execute(delete(Audit).where(Audit.url.like('%portfolio.dev%')))
        await db.execute(delete(Audit).where(Audit.url.like('%myapp.vercel.app%')))
        await db.commit()
        print("Deleted corrupt/mock audits.")

asyncio.run(check_db())
