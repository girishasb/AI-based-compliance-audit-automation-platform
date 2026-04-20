from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth as auth_module

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.TokenResponse)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create or find organization
    org = None
    if data.org_name:
        org = db.query(models.Organization).filter(models.Organization.name == data.org_name).first()
        if not org:
            org = models.Organization(name=data.org_name)
            db.add(org)
            db.flush()

    user = models.User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=auth_module.hash_password(data.password),
        role=data.role or "analyst",
        org_id=org.id if org else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_module.create_access_token({"sub": str(user.id)})
    return schemas.TokenResponse(
        access_token=token, token_type="bearer",
        user_id=user.id, full_name=user.full_name,
        email=user.email, role=user.role
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth_module.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth_module.create_access_token({"sub": str(user.id)})
    return schemas.TokenResponse(
        access_token=token, token_type="bearer",
        user_id=user.id, full_name=user.full_name,
        email=user.email, role=user.role
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth_module.get_current_user)):
    return current_user
