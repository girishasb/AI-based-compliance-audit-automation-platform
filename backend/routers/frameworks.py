from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/frameworks", tags=["Frameworks"])


@router.get("", response_model=list[schemas.FrameworkOut])
def list_frameworks(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    return db.query(models.Framework).all()


@router.get("/{framework_id}", response_model=schemas.FrameworkOut)
def get_framework(
    framework_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    fw = db.query(models.Framework).filter(models.Framework.id == framework_id).first()
    if not fw:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Framework not found")
    return fw
