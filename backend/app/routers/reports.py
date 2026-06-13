import logging
import os
import uuid
import csv
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Audit, Issue, Report
from app.schemas import ReportRequest
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/{audit_id}/generate")
async def generate_report(
    audit_id: str,
    request: ReportRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a report for a completed audit."""
    result = await db.execute(select(Audit).where(Audit.id == audit_id))
    audit = result.scalar_one_or_none()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    issues_result = await db.execute(select(Issue).where(Issue.audit_id == audit_id))
    issues = issues_result.scalars().all()

    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    report_id = str(uuid.uuid4())
    file_size = 0

    if request.format == "csv":
        file_path = os.path.join(settings.REPORTS_DIR, f"{report_id}.csv")
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            # Audit Metadata
            writer.writerow(["--- AUDIT METADATA ---"])
            writer.writerow(["Target URL", audit.url])
            writer.writerow(["Date", audit.created_at.isoformat() if hasattr(audit.created_at, 'isoformat') else "N/A"])
            writer.writerow(["Overall Score", audit.score])
            writer.writerow(["Pages Crawled", audit.pages_crawled])
            writer.writerow(["Successful Passes", audit.passes_count])
            writer.writerow([])
            
            # Issue Details
            writer.writerow(["--- ISSUE DETAILS ---"])
            if not issues:
                writer.writerow(["Outstanding Compliance! No accessibility violations found."])
            else:
                writer.writerow(["ID", "Description", "Severity", "WCAG", "Category", "Element", "AI Explanation", "Recommendation"])
                for issue in issues:
                    writer.writerow([
                        issue.id, issue.description, issue.severity,
                        issue.wcag or "", issue.category or "",
                        issue.element or "", issue.ai_explanation or "",
                        issue.recommendation or "",
                    ])
        file_size = os.path.getsize(file_path)
    
    elif request.format in ("pdf", "executive", "scorecard"):
        # Generate PDF using reportlab
        file_path = _generate_pdf(audit, issues, report_id, request.format)
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    # Save report record
    report = Report(
        id=report_id,
        audit_id=audit_id,
        report_type=request.format,
        file_path=file_path,
        file_size=file_size,
    )
    db.add(report)
    await db.commit()

    return {"reportId": report_id, "format": request.format, "downloadUrl": f"/reports/{report_id}/download"}


def _get_category_scores(issues, passes_count):
    categories = {}
    if not issues and passes_count > 0:
        default_cats = ["Images & Media", "Forms & Inputs", "Color & Contrast", "Keyboard & Focus", "Page Structure", "Navigation & Links", "ARIA & Semantics"]
        for cat in default_cats:
            categories[cat] = 100
    else:
        for issue in issues:
            cat = issue.category or "Other"
            if cat not in categories:
                categories[cat] = {"issues": 0}
            categories[cat]["issues"] += 1
        for cat in categories:
            categories[cat] = max(0, 100 - categories[cat]["issues"] * 15)
    return categories

def _generate_pdf(audit, issues, report_id: str, report_type: str) -> str:
    """Generate professional PDF reports using reportlab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        import json

        file_path = os.path.join(settings.REPORTS_DIR, f"{report_id}.pdf")
        
        # Determine Title
        if report_type == "executive":
            title_text = "Executive Summary Report"
        elif report_type == "scorecard":
            title_text = "Accessibility Scorecard"
        else:
            title_text = "Full Accessibility Audit Report"

        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(HexColor('#94a3b8'))
            footer_text = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | AccessAI Report v1.0 | ID: {audit.id[:8]}"
            canvas.drawString(inch, 0.5 * inch, footer_text)
            canvas.restoreState()

        doc = SimpleDocTemplate(
            file_path, pagesize=A4,
            rightMargin=inch, leftMargin=inch,
            topMargin=inch, bottomMargin=inch
        )
        styles = getSampleStyleSheet()
        story = []

        # Custom Styles
        title_style = ParagraphStyle('Title', parent=styles['Title'], textColor=HexColor('#0f172a'), fontSize=24, spaceAfter=20, alignment=TA_CENTER)
        h1_style = ParagraphStyle('H1', parent=styles['Heading1'], textColor=HexColor('#334155'), fontSize=16, spaceAfter=12, spaceBefore=20)
        h2_style = ParagraphStyle('H2', parent=styles['Heading2'], textColor=HexColor('#475569'), fontSize=14, spaceAfter=10, spaceBefore=15)
        normal_style = ParagraphStyle('Normal', parent=styles['Normal'], textColor=HexColor('#334155'), fontSize=10, spaceAfter=8, leading=14)
        meta_style = ParagraphStyle('Meta', parent=styles['Normal'], textColor=HexColor('#64748b'), fontSize=9)
        score_style = ParagraphStyle('Score', parent=styles['Heading1'], textColor=HexColor('#6366f1'), fontSize=36, alignment=TA_CENTER, spaceAfter=20)

        # Parse AI Intelligence safely
        ai_data = {}
        if isinstance(audit.ai_intelligence, str):
            try:
                ai_data = json.loads(audit.ai_intelligence)
            except:
                pass
        elif isinstance(audit.ai_intelligence, dict):
            ai_data = audit.ai_intelligence
            
        exec_summary = ai_data.get("executiveSummary", {})
        if not exec_summary or not exec_summary.get("headline"):
            if audit.score >= 90:
                headline = "Outstanding Accessibility Compliance"
                summary_text = f"The automated scan found {len(issues)} accessibility violations and {audit.passes_count} successful passes across {audit.pages_crawled} pages. This site demonstrates a high standard of WCAG adherence."
                risk = "Low Risk. No immediate critical barriers detected."
            elif audit.score >= 70:
                headline = "Good Accessibility with Room for Improvement"
                summary_text = f"The automated scan found {len(issues)} accessibility violations and {audit.passes_count} successful passes. Core functionality is accessible, but specific barriers exist."
                risk = "Moderate Risk. Some user groups may experience friction."
            else:
                headline = "Critical Accessibility Barriers Detected"
                summary_text = f"The automated scan found {len(issues)} accessibility violations, indicating significant barriers to access across {audit.pages_crawled} pages."
                risk = "High Risk. Immediate remediation required to prevent user exclusion and potential compliance violations."

            exec_summary = {
                "headline": headline,
                "summary": summary_text,
                "riskStatement": risk,
                "keyFindings": [
                    f"{audit.critical_count} critical and {audit.serious_count} serious violations.",
                    f"{audit.passes_count} checks successfully passed."
                ]
            }

        # --- 1. COVER SECTION ---
        story.append(Paragraph(title_text, title_style))
        story.append(Paragraph(f"<b>Target URL:</b> <a href='{audit.url}' color='blue'>{audit.url}</a>", normal_style))
        story.append(Paragraph(f"<b>Audit ID:</b> {audit.id}", normal_style))
        story.append(Paragraph(f"<b>Execution Time:</b> {audit.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if audit.created_at else 'N/A'}", normal_style))
        story.append(Paragraph(f"<b>Duration:</b> {audit.duration_seconds:.1f}s", normal_style))
        story.append(Paragraph(f"<b>Scan Depth:</b> {audit.scan_depth} (Max {audit.max_pages} pages)", normal_style))
        story.append(Paragraph(f"<b>Pages Crawled:</b> {audit.pages_crawled}", normal_style))
        story.append(Paragraph(f"<b>WCAG Target:</b> {audit.wcag_level}", normal_style))
        story.append(Spacer(1, 0.3 * inch))

        if audit.status.value == "failed" if hasattr(audit.status, "value") else audit.status == "failed":
            story.append(Paragraph("AUDIT FAILED", ParagraphStyle('Fail', textColor=HexColor('#ef4444'), fontSize=20, alignment=TA_CENTER)))
            story.append(Spacer(1, 0.2 * inch))
            story.append(Paragraph(f"<b>Error Reason:</b> {audit.error_message}", normal_style))
            doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
            return file_path

        # --- 2. EXECUTIVE OVERVIEW (SCORE) ---
        story.append(Paragraph("Accessibility Score", h1_style))
        story.append(Paragraph(f"{audit.score}/100", score_style))
        
        compliance_rating = "Excellent" if audit.score >= 90 else "Good" if audit.score >= 80 else "Needs Improvement" if audit.score >= 50 else "Poor"
        story.append(Paragraph(f"<b>Compliance Rating:</b> {compliance_rating}", normal_style))
        story.append(Spacer(1, 0.2 * inch))

        # --- 3. SEVERITY BREAKDOWN TABLE ---
        story.append(Paragraph("Issue Severity Breakdown", h2_style))
        data = [
            ["Severity", "Issue Count", "Impact"],
            ["Critical", str(audit.critical_count), "Blocks users completely"],
            ["Serious", str(audit.serious_count), "Severe barrier to access"],
            ["Moderate", str(audit.moderate_count), "Significant frustration"],
            ["Minor", str(audit.minor_count), "Annoyance / Technical failure"],
            ["Passed Checks", str(audit.passes_count), "Successfully verified elements"],
        ]
        table = Table(data, colWidths=[2 * inch, 1.5 * inch, 3 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#f8fafc'), HexColor('#ffffff')]),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e2e8f0')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.3 * inch))

        # --- 4. CATEGORY SCORES (Scorecard Only) ---
        if report_type in ("scorecard", "pdf"):
            story.append(Paragraph("Category Performance", h1_style))
            cat_scores = _get_category_scores(issues, audit.passes_count)
            cat_data = [["Category", "Score / 100"]]
            for c, s in cat_scores.items():
                cat_data.append([c, str(s)])
            if len(cat_data) > 1:
                cat_table = Table(cat_data, colWidths=[4 * inch, 2 * inch])
                cat_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#3b82f6')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#f0f9ff'), HexColor('#ffffff')]),
                    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#bae6fd')),
                    ('PADDING', (0, 0), (-1, -1), 8),
                ]))
                story.append(cat_table)
            else:
                story.append(Paragraph("No category data available.", normal_style))
            story.append(Spacer(1, 0.3 * inch))

        # --- 5. AI EXECUTIVE SUMMARY ---
        if report_type in ("executive", "pdf"):
            story.append(Paragraph("AI Executive Summary", h1_style))
            if exec_summary:
                story.append(Paragraph(f"<b>Headline:</b> {exec_summary.get('headline', '')}", normal_style))
                story.append(Paragraph(f"<b>Summary:</b> {exec_summary.get('summary', '')}", normal_style))
                if exec_summary.get('riskStatement'):
                    story.append(Paragraph(f"<b>Risk Statement:</b> {exec_summary.get('riskStatement', '')}", normal_style))
                
                findings = exec_summary.get("keyFindings", [])
                if findings:
                    story.append(Spacer(1, 0.1 * inch))
                    story.append(Paragraph("<b>Key Findings:</b>", normal_style))
                    for f in findings:
                        story.append(Paragraph(f"• {f}", normal_style))
            else:
                story.append(Paragraph("AI Summary not generated for this audit.", normal_style))
            story.append(Spacer(1, 0.3 * inch))

        # --- 6. DETAILED FINDINGS (Full PDF Only) ---
        if report_type == "pdf" and issues:
            story.append(PageBreak())
            story.append(Paragraph("Detailed Accessibility Findings", h1_style))
            
            # Sort issues by severity
            sev_order = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}
            sorted_issues = sorted(issues, key=lambda i: sev_order.get(i.severity, 4))
            
            for issue in sorted_issues[:50]:  # Cap at 50 to avoid massive PDFs
                story.append(Paragraph(f"[{issue.severity.upper()}] {issue.category or 'General'}", h2_style))
                story.append(Paragraph(f"<b>Description:</b> {issue.description}", normal_style))
                if issue.wcag:
                    story.append(Paragraph(f"<b>WCAG:</b> {issue.wcag}", normal_style))
                if issue.element:
                    story.append(Paragraph(f"<b>Failing Element:</b> <code>{issue.element[:100]}</code>", normal_style))
                if issue.recommendation:
                    story.append(Paragraph(f"<b>Recommendation:</b> {issue.recommendation}", normal_style))
                story.append(Spacer(1, 0.2 * inch))

        doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
        return file_path
    except ImportError as e:
        logger.error(f"ReportLab import error: {e}")
        return ""
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        return ""


@router.get("/{report_id}/download")
async def download_report(report_id: str, db: AsyncSession = Depends(get_db)):
    """Download a generated report file."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    media_type = "text/csv" if report.report_type == "csv" else "application/pdf"
    filename = f"accessai-{report.report_type}-{datetime.now().strftime('%Y%m%d')}.{report.report_type}"
    
    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename if report.report_type != "pdf" else filename.replace(report.report_type, "pdf"),
    )


@router.get("")
async def get_reports(db: AsyncSession = Depends(get_db)):
    """Get all generated reports."""
    result = await db.execute(select(Report).order_by(Report.created_at.desc()).limit(50))
    reports = result.scalars().all()
    return {"reports": [r.to_dict() for r in reports]}
