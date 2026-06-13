from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, Enum, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base
import enum
import uuid


class AuditStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class IssueSeverity(str, enum.Enum):
    CRITICAL = "critical"
    SERIOUS = "serious"
    MODERATE = "moderate"
    MINOR = "minor"


def _safe_isoformat(dt):
    if not dt:
        return None
    iso = dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
    if not iso.endswith("Z") and "+" not in iso:
        iso += "Z"
    return iso


class Audit(Base):
    __tablename__ = "audits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    url = Column(String, nullable=False, index=True)
    status = Column(String, default=AuditStatus.PENDING, nullable=False)
    score = Column(Float, nullable=True)
    pages_crawled = Column(Integer, default=0)
    duration_seconds = Column(Float, nullable=True)

    # Scan Settings
    scan_depth = Column(String, default="Standard Scan")
    max_pages = Column(Integer, default=50)

    # Issue counts
    critical_count = Column(Integer, default=0)
    serious_count = Column(Integer, default=0)
    moderate_count = Column(Integer, default=0)
    minor_count = Column(Integer, default=0)
    passes_count = Column(Integer, default=0)

    # Metadata
    wcag_level = Column(String, default="AA")
    error_message = Column(Text, nullable=True)
    raw_results = Column(JSON, nullable=True)
    ai_intelligence = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "status": self.status,
            "score": self.score,
            "pages": self.pages_crawled,
            "maxPages": self.max_pages,
            "scanDepth": self.scan_depth,
            "duration": self.duration_seconds,
            "issues": {
                "critical": self.critical_count,
                "serious": self.serious_count,
                "moderate": self.moderate_count,
                "minor": self.minor_count,
            },
            "passes": self.passes_count,
            "wcagLevel": self.wcag_level,
            "aiIntelligence": self.ai_intelligence,
            "createdAt": _safe_isoformat(self.created_at),
            "completedAt": _safe_isoformat(self.completed_at),
        }


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    wcag = Column(String, nullable=True)
    category = Column(String, nullable=True)
    element = Column(Text, nullable=True)
    help_url = Column(String, nullable=True)

    # AI-generated content
    ai_explanation = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    code_example = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "auditId": self.audit_id,
            "description": self.description,
            "severity": self.severity,
            "wcag": self.wcag,
            "category": self.category,
            "element": self.element,
            "helpUrl": self.help_url,
            "aiExplanation": self.ai_explanation,
            "recommendation": self.recommendation,
            "codeExample": self.code_example,
        }


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String, nullable=False, index=True)
    report_type = Column(String, nullable=False)  # pdf, csv, executive, scorecard
    file_path = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "auditId": self.audit_id,
            "type": self.report_type,
            "fileSize": self.file_size,
            "createdAt": _safe_isoformat(self.created_at),
        }
