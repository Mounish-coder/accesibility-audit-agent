import asyncio
from app.database import AsyncSessionLocal
from app.models import Audit, Issue
from sqlalchemy import select

async def main():
    try:
        async with AsyncSessionLocal() as db:
            print("Connected to DB")
            result = await db.execute(select(Audit).where(Audit.id == "audit-demo-001"))
            audit = result.scalar_one_or_none()
            print(f"Audit: {audit}")
            if audit:
                print(f"Status: {audit.status}")
                print(f"Created: {audit.created_at}, type: {type(audit.created_at)}")
                print(f"AI: {audit.ai_intelligence}, type: {type(audit.ai_intelligence)}")
                
                issues_result = await db.execute(select(Issue).where(Issue.audit_id == "audit-demo-001"))
                issues = issues_result.scalars().all()
                print(f"Issues count: {len(issues)}")
                if len(issues) > 0:
                    print(f"Issue 0 category: {issues[0].category}")
                    print(f"Issue 0 to_dict: {issues[0].to_dict()}")
    except Exception as e:
        print(f"DB Error: {e}")

asyncio.run(main())
