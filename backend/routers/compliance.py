from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user
import random

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


@router.post("/seed-demo")
def seed_demo_data(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Seed realistic demo control statuses for all 4 frameworks.
    Skips any framework that already has data for this user."""

    # Per-framework target percentages for realistic variety
    fw_targets = {
        1: (0.65, 0.80),   # ISO 27001: ~65% Implemented, 15% Partial
        2: (0.72, 0.85),   # SOC 2:     ~72% Implemented, 13% Partial
        3: (0.58, 0.74),   # HIPAA:     ~58% Implemented, 16% Partial
        4: (0.80, 0.90),   # DPDP:      ~80% Implemented, 10% Partial
    }

    seeded = 0
    skipped = 0
    for fw_id, (impl_pct, partial_pct) in fw_targets.items():
        # Get controls for this framework
        controls = db.query(models.Control).filter(models.Control.framework_id == fw_id).all()
        if not controls:
            continue

        # Check if user already has statuses for any control in this framework
        ctrl_ids = [c.id for c in controls]
        already = db.query(models.ControlStatus).filter(
            models.ControlStatus.user_id == current_user.id,
            models.ControlStatus.control_id.in_(ctrl_ids)
        ).count()
        if already > 0:
            skipped += 1
            continue

        total = len(controls)
        for i, ctrl in enumerate(controls):
            if i < int(total * impl_pct):
                status = "Implemented"
            elif i < int(total * partial_pct):
                status = "Partial"
            else:
                status = "Not Implemented"

            cs = models.ControlStatus(
                control_id=ctrl.id,
                user_id=current_user.id,
                status=status,
                owner="Demo Team",
                notes="Auto-seeded for demonstration"
            )
            db.add(cs)
            seeded += 1

    db.commit()
    return {"message": f"Seeded {seeded} statuses across frameworks (skipped {skipped} already-populated)", "seeded": seeded > 0}


@router.get("/score/{framework_id}", response_model=schemas.ComplianceScore)
def get_compliance_score(
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
    weighted_score = 0.0
    total_weight = 0.0

    for ctrl in controls:
        cs = db.query(models.ControlStatus).filter(
            models.ControlStatus.control_id == ctrl.id,
            models.ControlStatus.user_id == current_user.id
        ).first()
        status = cs.status if cs else "Not Implemented"
        w = ctrl.weight

        total_weight += w
        if status == "Implemented":
            implemented += 1
            weighted_score += w
        elif status == "Partial":
            partial += 1
            weighted_score += w * 0.5
        else:
            not_impl += 1

    score = round((weighted_score / total_weight * 100) if total_weight > 0 else 0, 2)

    if score >= 80:
        readiness = "Audit Ready"
    elif score >= 50:
        readiness = "Needs Improvement"
    else:
        readiness = "Critical – Not Ready"

    return schemas.ComplianceScore(
        framework_id=framework_id,
        framework_name=fw.name,
        compliance_score=score,
        total_controls=total,
        implemented=implemented,
        partial=partial,
        not_implemented=not_impl,
        audit_readiness=readiness
    )


@router.get("/dashboard")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Returns summary stats across all frameworks for the dashboard"""
    frameworks = db.query(models.Framework).all()
    results = []
    for fw in frameworks:
        controls = db.query(models.Control).filter(models.Control.framework_id == fw.id).all()
        total = len(controls)
        implemented = 0
        for ctrl in controls:
            cs = db.query(models.ControlStatus).filter(
                models.ControlStatus.control_id == ctrl.id,
                models.ControlStatus.user_id == current_user.id
            ).first()
            if cs and cs.status == "Implemented":
                implemented += 1
        score = round((implemented / total * 100) if total > 0 else 0, 1)
        results.append({
            "framework_id": fw.id,
            "framework_name": fw.name,
            "total_controls": total,
            "implemented": implemented,
            "compliance_score": score
        })
    return {"frameworks": results}
