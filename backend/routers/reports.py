from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from datetime import datetime
from database import get_db
import models, schemas
from auth import get_current_user
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _get_gap_data(framework_id, user_id, db):
    controls = db.query(models.Control).filter(models.Control.framework_id == framework_id).all()
    gaps = []
    for ctrl in controls:
        cs = db.query(models.ControlStatus).filter(
            models.ControlStatus.control_id == ctrl.id,
            models.ControlStatus.user_id == user_id
        ).first()
        status = cs.status if cs else "Not Implemented"
        if status != "Implemented":
            gaps.append((ctrl, status))
    return gaps


@router.get("/{framework_id}")
def get_report_json(
    framework_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    fw = db.query(models.Framework).filter(models.Framework.id == framework_id).first()
    if not fw:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Framework not found")

    controls = db.query(models.Control).filter(models.Control.framework_id == framework_id).all()
    total = len(controls)
    implemented = partial = not_impl = 0
    for ctrl in controls:
        cs = db.query(models.ControlStatus).filter(
            models.ControlStatus.control_id == ctrl.id,
            models.ControlStatus.user_id == current_user.id
        ).first()
        status = cs.status if cs else "Not Implemented"
        if status == "Implemented":
            implemented += 1
        elif status == "Partial":
            partial += 1
        else:
            not_impl += 1

    score = round((implemented / total * 100) if total > 0 else 0, 2)
    gaps = _get_gap_data(framework_id, current_user.id, db)
    high_risk = sum(1 for c, s in gaps if c.is_critical or s == "Not Implemented")

    return {
        "report": {
            "framework": fw.name,
            "generated_at": datetime.utcnow().isoformat(),
            "compliance_score": score,
            "total_controls": total,
            "implemented": implemented,
            "partial": partial,
            "not_implemented": not_impl,
            "high_risk_gaps": high_risk,
            "audit_readiness": "Audit Ready" if score >= 80 else "Needs Improvement" if score >= 50 else "Critical"
        }
    }


@router.get("/{framework_id}/pdf")
def download_report_pdf(
    framework_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    fw = db.query(models.Framework).filter(models.Framework.id == framework_id).first()
    if not fw:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Framework not found")

    controls = db.query(models.Control).filter(models.Control.framework_id == framework_id).all()
    total = len(controls)
    implemented = partial = not_impl = 0
    for ctrl in controls:
        cs = db.query(models.ControlStatus).filter(
            models.ControlStatus.control_id == ctrl.id,
            models.ControlStatus.user_id == current_user.id
        ).first()
        status = cs.status if cs else "Not Implemented"
        if status == "Implemented":
            implemented += 1
        elif status == "Partial":
            partial += 1
        else:
            not_impl += 1

    score = round((implemented / total * 100) if total > 0 else 0, 2)
    gaps = _get_gap_data(framework_id, current_user.id, db)
    high_risk = sum(1 for c, s in gaps if c.is_critical and s == "Not Implemented")

    # Build PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle("Title", fontSize=20, textColor=colors.HexColor("#1e3a5f"),
                                  alignment=TA_CENTER, spaceAfter=6, fontName="Helvetica-Bold")
    sub_style = ParagraphStyle("Sub", fontSize=11, textColor=colors.HexColor("#555"),
                                alignment=TA_CENTER, spaceAfter=20)
    story.append(Paragraph("AI-Based Compliance Audit Report", title_style))
    story.append(Paragraph(f"Framework: {fw.name}  |  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1e3a5f")))
    story.append(Spacer(1, 0.5*cm))

    # Executive Summary
    h2 = ParagraphStyle("H2", fontSize=14, textColor=colors.HexColor("#1e3a5f"),
                          spaceAfter=6, fontName="Helvetica-Bold")
    body = ParagraphStyle("Body", fontSize=10, spaceAfter=4)
    story.append(Paragraph("1. Executive Summary", h2))
    readiness = "Audit Ready" if score >= 80 else "Needs Improvement" if score >= 50 else "Critical – Not Ready"
    story.append(Paragraph(
        f"This audit report presents the compliance posture of the organization against the <b>{fw.name}</b> framework. "
        f"The overall compliance score is <b>{score}%</b>, indicating <b>{readiness}</b> status. "
        f"Out of {total} controls assessed, {implemented} are fully implemented, {partial} are partially implemented, "
        f"and {not_impl} have not been implemented.", body))
    story.append(Spacer(1, 0.4*cm))

    # Score Table
    story.append(Paragraph("2. Compliance Score Summary", h2))
    score_data = [
        ["Metric", "Value"],
        ["Compliance Score", f"{score}%"],
        ["Total Controls", str(total)],
        ["Implemented", str(implemented)],
        ["Partially Implemented", str(partial)],
        ["Not Implemented", str(not_impl)],
        ["High-Risk Gaps", str(high_risk)],
        ["Audit Readiness", readiness],
    ]
    score_table = Table(score_data, colWidths=[10*cm, 6*cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f0f4f8"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 0.5*cm))

    # Gap Analysis
    story.append(Paragraph("3. Gap Analysis", h2))
    if gaps:
        gap_data = [["Control ID", "Name", "Category", "Status", "Severity"]]
        for ctrl, status in gaps[:30]:
            from routers.gap_analysis import calculate_severity
            sev = calculate_severity(ctrl, status)
            gap_data.append([ctrl.control_id, ctrl.name[:35], ctrl.category, status, sev])
        gap_table = Table(gap_data, colWidths=[2*cm, 6*cm, 3*cm, 3.5*cm, 2.5*cm])
        gap_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#fff5f5"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(gap_table)
    else:
        story.append(Paragraph("✅ No gaps identified. All controls are implemented.", body))

    story.append(Spacer(1, 0.5*cm))

    # Remediation Plan
    story.append(Paragraph("4. Remediation Plan", h2))
    story.append(Paragraph(
        "The following remediation steps are recommended based on identified gaps and risk severity:", body))

    from routers.gap_analysis import REMEDIATION_MAP, calculate_severity
    for ctrl, status in gaps[:15]:
        sev = calculate_severity(ctrl, status)
        category = ctrl.category or "Technical"
        rem = REMEDIATION_MAP.get(category, {}).get(sev, "Review and implement this control.")
        story.append(Paragraph(f"<b>• {ctrl.control_id} – {ctrl.name}</b> [{sev} Risk]: {rem}", body))

    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1")))
    story.append(Paragraph("Generated by AI-Based Compliance & Audit Automation Platform", sub_style))

    doc.build(story)
    buffer.seek(0)

    filename = f"audit_report_{fw.name.replace(' ', '_')}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
