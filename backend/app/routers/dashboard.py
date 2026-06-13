from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Audit, AuditStatus

from sqlalchemy import select, func, Float

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Get dashboard overview statistics."""
    # Total audits
    total_result = await db.execute(select(func.count(Audit.id)))
    total_audits = total_result.scalar() or 0

    # Average score (only completed audits)
    avg_result = await db.execute(
        select(func.avg(Audit.score)).where(Audit.status == AuditStatus.COMPLETED)
    )
    avg_score = round(avg_result.scalar() or 0, 1)

    # Issue totals across all audits
    critical_result = await db.execute(select(func.sum(Audit.critical_count)))
    critical = critical_result.scalar() or 0

    warnings_result = await db.execute(
        select(func.sum(Audit.serious_count + Audit.moderate_count))
    )
    warnings = warnings_result.scalar() or 0

    passes_result = await db.execute(select(func.sum(Audit.passes_count)))
    passes = passes_result.scalar() or 0

    # Average duration
    duration_result = await db.execute(
        select(func.avg(Audit.duration_seconds)).where(Audit.status == AuditStatus.COMPLETED)
    )
    avg_duration = round(duration_result.scalar() or 0, 1)

    return {
        "totalAudits": total_audits,
        "avgScore": avg_score,
        "criticalIssues": critical,
        "warnings": warnings,
        "passedChecks": passes,
        "avgDuration": avg_duration,
        "improvement": 12.0,
    }


@router.get("/recent")
async def get_recent_audits(limit: int = 5, db: AsyncSession = Depends(get_db)):
    """Get recent audit entries for dashboard."""
    result = await db.execute(
        select(Audit)
        .where(Audit.status == AuditStatus.COMPLETED)
        .order_by(Audit.created_at.desc())
        .limit(limit)
    )
    audits = result.scalars().all()
    return {"audits": [a.to_dict() for a in audits]}
