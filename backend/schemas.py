from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth Schemas ──────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: str
    full_name: str
    password: str
    role: Optional[str] = "analyst"
    org_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    full_name: str
    email: str
    role: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


# ── Framework Schemas ─────────────────────────────────────────────────────────
class FrameworkOut(BaseModel):
    id: int
    name: str
    description: str
    version: str
    total_controls: int

    class Config:
        from_attributes = True


# ── Control Schemas ───────────────────────────────────────────────────────────
class ControlOut(BaseModel):
    id: int
    control_id: str
    name: str
    description: str
    category: str
    is_critical: bool
    weight: float
    framework_id: int

    class Config:
        from_attributes = True


class ControlStatusUpdate(BaseModel):
    status: str  # Implemented / Partial / Not Implemented
    owner: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None


class ControlWithStatus(BaseModel):
    id: int
    control_id: str
    name: str
    description: str
    category: str
    is_critical: bool
    weight: float
    status: str
    owner: Optional[str]
    due_date: Optional[str]
    notes: Optional[str]
    evidence_count: int

    class Config:
        from_attributes = True


# ── Compliance Schemas ────────────────────────────────────────────────────────
class ComplianceScore(BaseModel):
    framework_id: int
    framework_name: str
    compliance_score: float
    total_controls: int
    implemented: int
    partial: int
    not_implemented: int
    audit_readiness: str  # Ready / Needs Improvement / Critical


# ── Gap Analysis Schemas ──────────────────────────────────────────────────────
class GapItem(BaseModel):
    control_id: str
    control_name: str
    category: str
    severity: str  # High / Medium / Low
    status: str
    remediation: str
    is_critical: bool


class GapAnalysisResult(BaseModel):
    framework_id: int
    framework_name: str
    total_gaps: int
    high_risk: int
    medium_risk: int
    low_risk: int
    gaps: List[GapItem]


# ── Report Schemas ────────────────────────────────────────────────────────────
class AuditReportOut(BaseModel):
    id: int
    framework_name: str
    compliance_score: float
    total_controls: int
    implemented_controls: int
    partial_controls: int
    not_implemented_controls: int
    high_risk_gaps: int
    summary: str
    generated_at: datetime

    class Config:
        from_attributes = True


# ── Evidence Schema ───────────────────────────────────────────────────────────
class EvidenceOut(BaseModel):
    id: int
    control_id: int
    filename: str
    upload_date: datetime

    class Config:
        from_attributes = True
