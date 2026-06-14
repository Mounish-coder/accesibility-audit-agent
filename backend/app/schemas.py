from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class WCAGLevel(str, Enum):
    A = "A"
    AA = "AA"
    AAA = "AAA"


class AuditRequest(BaseModel):
    url: str = Field(..., description="URL of the website to audit")
    wcag_level: WCAGLevel = WCAGLevel.AA
    max_pages: int = Field(default=50, ge=1, le=500)
    scan_depth: str = Field(default="Standard Scan")
    include_passes: bool = True


class IssueResponse(BaseModel):
    id: str
    description: str
    severity: str
    wcag: Optional[str]
    category: Optional[str]
    element: Optional[str]
    helpUrl: Optional[str]
    aiExplanation: Optional[str]
    recommendation: Optional[str]
    codeExample: Optional[str]


class AuditSummary(BaseModel):
    critical: int
    serious: int
    moderate: int
    minor: int
    passes: int
    total: int


class AuditResponse(BaseModel):
    id: str
    url: str
    status: str
    score: Optional[float]
    pages: int
    duration: Optional[float]
    issues: Dict[str, int]
    createdAt: Optional[str]
    completedAt: Optional[str]


class StartAuditResponse(BaseModel):
    auditId: str
    status: str


class AuditResultsResponse(BaseModel):
    id: str
    url: str
    status: str
    score: Optional[float]
    pages: int
    duration: Optional[float]
    summary: AuditSummary
    categories: Dict[str, Any]
    issues: List[IssueResponse]
    aiIntelligence: Optional[Dict[str, Any]] = None
    createdAt: Optional[str]
    completedAt: Optional[str]


class DashboardStats(BaseModel):
    totalAudits: int
    avgScore: float
    criticalIssues: int
    warnings: int
    passedChecks: int
    improvement: float


class ReportRequest(BaseModel):
    format: str = Field(..., description="Report format: pdf, csv, executive, scorecard")


class SettingsUpdate(BaseModel):
    groqApiKey: Optional[str]
    groqModel: Optional[str]
    wcagLevel: Optional[str]
    maxPages: Optional[int]
    timeout: Optional[int]
    emailNotifications: Optional[bool]
    webhookUrl: Optional[str]
    autoReport: Optional[bool]
