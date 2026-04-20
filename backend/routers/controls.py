from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/controls", tags=["Controls"])


@router.get("/{framework_id}", response_model=List[schemas.ControlWithStatus])
def get_controls(
    framework_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    controls = db.query(models.Control).filter(models.Control.framework_id == framework_id).all()
    result = []
    for ctrl in controls:
        cs = db.query(models.ControlStatus).filter(
            models.ControlStatus.control_id == ctrl.id,
            models.ControlStatus.user_id == current_user.id
        ).first()
        ev_count = db.query(models.EvidenceDocument).filter(
            models.EvidenceDocument.control_id == ctrl.id
        ).count()
        result.append(schemas.ControlWithStatus(
            id=ctrl.id,
            control_id=ctrl.control_id,
            name=ctrl.name,
            description=ctrl.description,
            category=ctrl.category,
            is_critical=ctrl.is_critical,
            weight=ctrl.weight,
            status=cs.status if cs else "Not Implemented",
            owner=cs.owner if cs else None,
            due_date=cs.due_date if cs else None,
            notes=cs.notes if cs else None,
            evidence_count=ev_count
        ))
    return result


@router.put("/{control_id}/status")
def update_control_status(
    control_id: int,
    data: schemas.ControlStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ctrl = db.query(models.Control).filter(models.Control.id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")

    cs = db.query(models.ControlStatus).filter(
        models.ControlStatus.control_id == control_id,
        models.ControlStatus.user_id == current_user.id
    ).first()

    if cs:
        cs.status = data.status
        cs.owner = data.owner
        cs.due_date = data.due_date
        cs.notes = data.notes
        cs.updated_at = datetime.utcnow()
    else:
        cs = models.ControlStatus(
            control_id=control_id,
            user_id=current_user.id,
            status=data.status,
            owner=data.owner,
            due_date=data.due_date,
            notes=data.notes
        )
        db.add(cs)

    db.commit()
    return {"message": "Status updated", "status": data.status}


@router.post("/{control_id}/evidence")
def upload_evidence(
    control_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ctrl = db.query(models.Control).filter(models.Control.id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")

    ev = models.EvidenceDocument(
        control_id=control_id,
        filename=file.filename,
        file_type=file.content_type,
        uploaded_by=current_user.id
    )
    db.add(ev)
    db.commit()
    return {"message": "Evidence uploaded", "filename": file.filename}
