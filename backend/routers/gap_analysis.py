from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/gaps", tags=["Gap Analysis"])

# AI Rule-Based Remediation Suggestions
REMEDIATION_MAP = {
    "Administrative": {
        "High": "Immediately assign a control owner, document the policy, and schedule a management review within 2 weeks.",
        "Medium": "Draft and approve the relevant policy within 30 days and assign responsible personnel.",
        "Low": "Review existing documentation and update policies during the next quarterly review."
    },
    "Technical": {
        "High": "Deploy technical controls immediately. Conduct vulnerability scans and apply patches within 7 days.",
        "Medium": "Schedule technical implementation within 30 days. Add to the sprint backlog with a P1 priority.",
        "Low": "Plan for implementation in the next development cycle. Document current risk acceptance."
    },
    "Physical": {
        "High": "Engage physical security team immediately. Restrict access until controls are in place.",
        "Medium": "Plan physical security improvements within 60 days with budget approval.",
        "Low": "Include physical control review in next facility audit cycle."
    }
}


def calculate_severity(control: models.Control, status: str) -> str:
    if control.is_critical:
        if status == "Not Implemented":
            return "High"
        elif status == "Partial":
            return "High"
    if status == "Not Implemented":
        return "Medium" if control.weight >= 1.5 else "Low"
    elif status == "Partial":
        return "Medium"
    return "Low"


@router.get("/{framework_id}", response_model=schemas.GapAnalysisResult)
def get_gap_analysis(
    framework_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    fw = db.query(models.Framework).filter(models.Framework.id == framework_id).first()
    if not fw:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Framework not found")

    controls = db.query(models.Control).filter(models.Control.framework_id == framework_id).all()
    gaps: List[schemas.GapItem] = []
    high = medium = low = 0

    for ctrl in controls:
        cs = db.query(models.ControlStatus).filter(
            models.ControlStatus.control_id == ctrl.id,
            models.ControlStatus.user_id == current_user.id
        ).first()
        status = cs.status if cs else "Not Implemented"

        if status == "Implemented":
            continue  # No gap

        severity = calculate_severity(ctrl, status)
        category = ctrl.category or "Technical"
        remediation = REMEDIATION_MAP.get(category, {}).get(severity, "Review and implement this control.")

        if severity == "High":
            high += 1
        elif severity == "Medium":
            medium += 1
        else:
            low += 1

        gaps.append(schemas.GapItem(
            control_id=ctrl.control_id,
            control_name=ctrl.name,
            category=category,
            severity=severity,
            status=status,
            remediation=remediation,
            is_critical=ctrl.is_critical
        ))

    # Sort: High → Medium → Low
    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    gaps.sort(key=lambda g: severity_order.get(g.severity, 3))

    return schemas.GapAnalysisResult(
        framework_id=framework_id,
        framework_name=fw.name,
        total_gaps=len(gaps),
        high_risk=high,
        medium_risk=medium,
        low_risk=low,
        gaps=gaps
    )
