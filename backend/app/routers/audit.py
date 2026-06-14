"""
Audit API router - core scanning endpoints.
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
import uuid
import asyncio
import logging

from app.database import get_db, AsyncSessionLocal
from app.models import Audit, Issue, AuditStatus
from app.schemas import AuditRequest, AuditResponse, AuditResultsResponse, StartAuditResponse
from app.services.scanner import run_accessibility_scan
from app.services.ai_analyzer import analyze_issue_with_ai
from app.services.ai_intelligence import run_intelligence_analysis
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store for active audit progress (for SSE/polling)
_active_audits: dict = {}


async def perform_audit(audit_id: str, url: str, wcag_level: str, max_pages: int):
    """Background task that runs the full accessibility audit pipeline."""
    logger.info(f"Starting audit {audit_id} for {url}")
    _active_audits[audit_id] = {"status": "running", "step": "crawling", "progress": 0}

    try:
        # Step 1: Scanner
        _active_audits[audit_id]["step"] = "scanning"
        _active_audits[audit_id]["progress"] = 20
        scan_result = await run_accessibility_scan(url, max_pages)

        # Step 2: AI Analysis
        _active_audits[audit_id]["step"] = "analyzing"
        _active_audits[audit_id]["progress"] = 50

        enriched_issues = []
        for issue_data in scan_result["issues"]:
            ai_result = await analyze_issue_with_ai(
                issue_data,
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_MODEL,
            )
            enriched_issues.append({**issue_data, **ai_result})

        # Step 2.5: AI Intelligence
        _active_audits[audit_id]["step"] = "intelligence"
        _active_audits[audit_id]["progress"] = 70
        
        audit_data = {
            "url": url,
            "score": scan_result["score"],
            "critical": scan_result["counts"].get("critical", 0),
        }
        
        intelligence_data = await run_intelligence_analysis(
            enriched_issues,
            audit_data,
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
        )

        # Step 3: Persist to DB
        _active_audits[audit_id]["step"] = "saving"
        _active_audits[audit_id]["progress"] = 85

        counts = scan_result["counts"]
        
        async with AsyncSessionLocal() as db:
            # Update audit record
            result = await db.execute(select(Audit).where(Audit.id == audit_id))
            audit = result.scalar_one_or_none()
            
            if audit:
                audit.status = AuditStatus.COMPLETED.value
                audit.score = scan_result["score"]
                audit.pages_crawled = scan_result["pages"]
                audit.duration_seconds = scan_result["duration"]
                audit.critical_count = counts.get("critical", 0)
                audit.serious_count = counts.get("serious", 0)
                audit.moderate_count = counts.get("moderate", 0)
                audit.minor_count = counts.get("minor", 0)
                audit.passes_count = scan_result["passes"]
                audit.ai_intelligence = intelligence_data
                audit.completed_at = datetime.utcnow()

                # Save issues
                for issue_data in enriched_issues:
                    issue = Issue(
                        audit_id=audit_id,
                        description=issue_data.get("description", ""),
                        severity=issue_data.get("severity", "moderate"),
                        wcag=issue_data.get("wcag"),
                        category=issue_data.get("category"),
                        element=issue_data.get("element"),
                        help_url=issue_data.get("helpUrl"),
                        ai_explanation=issue_data.get("aiExplanation"),
                        recommendation=issue_data.get("recommendation"),
                        code_example=issue_data.get("codeExample"),
                    )
                    db.add(issue)
                
                await db.commit()
            else:
                logger.error(f"Audit {audit_id} not found in database during saving!")

        _active_audits[audit_id] = {"status": "completed", "step": "done", "progress": 100}
        logger.info(f"Audit {audit_id} completed. Score: {scan_result['score']}")

    except Exception as e:
        logger.error(f"Audit {audit_id} failed: {e}")
        _active_audits[audit_id] = {"status": "failed", "error": str(e)}
        
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Audit).where(Audit.id == audit_id))
                audit = result.scalar_one_or_none()
                if audit:
                    audit.status = AuditStatus.FAILED.value
                    audit.error_message = str(e)
                    await db.commit()
        except Exception as db_err:
            logger.error(f"Failed to update audit status: {db_err}")


@router.post("/start", response_model=StartAuditResponse)
async def start_audit(
    request: AuditRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Start a new accessibility audit."""
    try:
        # Normalize URL
        url = request.url.strip()
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        # Safe unwrapping of Enum
        wcag_val = request.wcag_level.value if hasattr(request.wcag_level, 'value') else request.wcag_level

        # Create audit record
        audit_id = str(uuid.uuid4())
        audit = Audit(
            id=audit_id,
            url=url,
            status=AuditStatus.RUNNING.value,
            wcag_level=wcag_val,
            max_pages=request.max_pages,
            scan_depth=request.scan_depth,
        )
        db.add(audit)
        await db.commit()

        # Queue background scan
        background_tasks.add_task(
            perform_audit, audit_id, url, wcag_val, request.max_pages
        )

        return JSONResponse(
            status_code=200,
            content={
                "auditId": audit_id, 
                "audit_id": audit_id,
                "id": audit_id,
                "status": "running", 
                "message": "Audit started"
            }
        )
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to start audit for {request.url}: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "failed", "message": f"Server Error: {str(e)}"}
        )


@router.get("/{audit_id}/status")
async def get_audit_status(audit_id: str):
    """Get real-time audit progress."""
    progress = _active_audits.get(audit_id, {"status": "unknown"})
    return {"auditId": audit_id, **progress}


@router.get("/{audit_id}/results")
async def get_audit_results(audit_id: str, db: AsyncSession = Depends(get_db)):
    """Get completed audit results."""
    try:
        # Get audit
        result = await db.execute(select(Audit).where(Audit.id == audit_id))
        audit = result.scalar_one_or_none()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        
        status_val = audit.status.value if hasattr(audit.status, 'value') else audit.status
        if status_val == AuditStatus.FAILED.value or status_val == "failed":
            return {"status": "failed", "message": audit.error_message or "Audit failed during execution."}
        elif status_val != AuditStatus.COMPLETED.value and status_val != "completed":
            return {"status": status_val, "message": "Audit not yet complete"}

        # Get issues
        issues_result = await db.execute(select(Issue).where(Issue.audit_id == audit_id))
        issues = issues_result.scalars().all()

        # Build categories
        STANDARD_CATEGORIES = [
            "Images & Media", "Forms & Inputs", "Color & Contrast",
            "Keyboard & Focus", "Page Structure", "Navigation & Links",
            "ARIA & Semantics"
        ]
        categories = {cat: {"score": 100, "issues": 0} for cat in STANDARD_CATEGORIES}

        for issue in issues:
            cat = issue.category or "Other"
            if cat not in categories:
                categories[cat] = {"score": 100, "issues": 0}
            categories[cat]["issues"] += 1

        # Calculate category scores
        for cat in categories:
            cat_issues = categories[cat]["issues"]
            categories[cat]["score"] = max(0, 100 - cat_issues * 15)

        # Handle SQLite JSON string issue
        import json
        ai_data = audit.ai_intelligence
        if isinstance(ai_data, str):
            try:
                ai_data = json.loads(ai_data)
            except Exception:
                ai_data = None
                


        def safe_isoformat(dt):
            if not dt:
                return None
            return dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)

        return {
            "id": audit.id,
            "url": audit.url,
            "status": status_val,
            "score": audit.score or 0,
            "pages": audit.pages_crawled or 0,
            "duration": audit.duration_seconds,
            "summary": {
                "critical": audit.critical_count or 0,
                "serious": audit.serious_count or 0,
                "moderate": audit.moderate_count or 0,
                "minor": audit.minor_count or 0,
                "passes": audit.passes_count or 0,
                "total": len(issues),
            },
            "categories": categories,
            "issues": [i.to_dict() for i in issues],
            "aiIntelligence": ai_data,
            "createdAt": safe_isoformat(audit.created_at),
            "completedAt": safe_isoformat(audit.completed_at),
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Detailed error in get_audit_results for {audit_id}: {e}")
        return JSONResponse(
            status_code=200,
            content={
                "status": "failed",
                "message": f"Backend Error: {str(e)}",
                "id": audit_id,
                "url": "Error",
            }
        )


@router.post("/{audit_id}/cancel")
async def cancel_audit(audit_id: str, db: AsyncSession = Depends(get_db)):
    """Cancel a running audit."""
    if audit_id in _active_audits:
        _active_audits[audit_id]["status"] = "cancelled"

    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    
    if audit and audit.status == AuditStatus.RUNNING:
        audit.status = AuditStatus.CANCELLED
        await db.commit()

    return {"auditId": audit_id, "status": "cancelled"}


@router.get("/history")
async def get_audit_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Get audit history with pagination."""
    result = await db.execute(
        select(Audit)
        .order_by(Audit.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    audits = result.scalars().all()
    
    total_result = await db.execute(select(func.count(Audit.id)))
    total = total_result.scalar()

    return {
        "audits": [a.to_dict() for a in audits],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
