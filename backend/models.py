from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst")  # admin, analyst, auditor
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    organization = relationship("Organization", back_populates="users")
    control_statuses = relationship("ControlStatus", back_populates="user")
    audit_reports = relationship("AuditReport", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, default="Technology")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")


class Framework(Base):
    __tablename__ = "frameworks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)
    version = Column(String)
    total_controls = Column(Integer, default=0)

    controls = relationship("Control", back_populates="framework")
    audit_reports = relationship("AuditReport", back_populates="framework")


class Control(Base):
    __tablename__ = "controls"
    id = Column(Integer, primary_key=True, index=True)
    framework_id = Column(Integer, ForeignKey("frameworks.id"), nullable=False)
    control_id = Column(String, nullable=False)   # e.g. "A.5.1"
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # Administrative, Technical, Physical
    is_critical = Column(Boolean, default=False)
    weight = Column(Float, default=1.0)

    framework = relationship("Framework", back_populates="controls")
    statuses = relationship("ControlStatus", back_populates="control")
    evidence_docs = relationship("EvidenceDocument", back_populates="control")
    risk_assessments = relationship("RiskAssessment", back_populates="control")


class ControlStatus(Base):
    __tablename__ = "control_statuses"
    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(Integer, ForeignKey("controls.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="Not Implemented")  # Implemented, Partial, Not Implemented
    owner = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    control = relationship("Control", back_populates="statuses")
    user = relationship("User", back_populates="control_statuses")


class EvidenceDocument(Base):
    __tablename__ = "evidence_documents"
    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(Integer, ForeignKey("controls.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"))

    control = relationship("Control", back_populates="evidence_docs")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(Integer, ForeignKey("controls.id"), nullable=False)
    severity = Column(String)  # High, Medium, Low
    likelihood = Column(String)
    impact = Column(String)
    remediation = Column(Text)
    assessed_at = Column(DateTime, default=datetime.utcnow)

    control = relationship("Control", back_populates="risk_assessments")


class AuditReport(Base):
    __tablename__ = "audit_reports"
    id = Column(Integer, primary_key=True, index=True)
    framework_id = Column(Integer, ForeignKey("frameworks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    compliance_score = Column(Float, default=0.0)
    total_controls = Column(Integer, default=0)
    implemented_controls = Column(Integer, default=0)
    partial_controls = Column(Integer, default=0)
    not_implemented_controls = Column(Integer, default=0)
    high_risk_gaps = Column(Integer, default=0)
    summary = Column(Text)
    generated_at = Column(DateTime, default=datetime.utcnow)

    framework = relationship("Framework", back_populates="audit_reports")
    user = relationship("User", back_populates="audit_reports")
