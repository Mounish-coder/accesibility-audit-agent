from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Audit, AuditStatus

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard overview statistics."""
    # Use the string value for comparison — the column stores strings not enums
    completed_status = AuditStatus.COMPLETED.value

    total_result = await db.execute(select(func.count(Audit.id)))
    total_audits = total_result.scalar() or 0

    avg_result = await db.execute(
        select(func.avg(Audit.score)).where(Audit.status == completed_status)
    )
    avg_score = round(float(avg_result.scalar() or 0), 1)

    critical_result = await db.execute(select(func.sum(Audit.critical_count)))
    critical = int(critical_result.scalar() or 0)

    warnings_result = await db.execute(
        select(func.sum(Audit.serious_count + Audit.moderate_count))
    )
    warnings = int(warnings_result.scalar() or 0)

    passes_result = await db.execute(select(func.sum(Audit.passes_count)))
    passes = int(passes_result.scalar() or 0)

    duration_result = await db.execute(
        select(func.avg(Audit.duration_seconds)).where(Audit.status == completed_status)
    )
    avg_duration = round(float(duration_result.scalar() or 0), 1)

    return JSONResponse(content={
        "totalAudits": total_audits,
        "avgScore": avg_score,
        "criticalIssues": critical,
        "warnings": warnings,
        "passedChecks": passes,
        "avgDuration": avg_duration,
        "improvement": 12.0,
    })


@router.get("/recent")
async def get_recent_audits(limit: int = 5, db: AsyncSession = Depends(get_db)):
    """Get recent completed audits for dashboard."""
    completed_status = AuditStatus.COMPLETED.value
    result = await db.execute(
        select(Audit)
        .where(Audit.status == completed_status)
        .order_by(Audit.created_at.desc())
        .limit(limit)
    )
    audits = result.scalars().all()
    return JSONResponse(content={"audits": [a.to_dict() for a in audits]})
