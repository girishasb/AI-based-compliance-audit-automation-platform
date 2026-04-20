# AI-Based Compliance & Audit Automation Platform

An industry-level, AI-driven compliance management platform for ISO 27001, SOC 2, HIPAA, and DPDP frameworks.

## Quick Start

### 1. Backend (FastAPI)
```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API docs: http://localhost:8000/docs
- Database auto-created on first run with all 4 frameworks and 100+ controls seeded.

### 2. Frontend (React + Vite)
```powershell
cd frontend
npm install   # (first time only)
npm run dev
```
- App: http://localhost:5173

## Architecture
- **Frontend**: React 18 + Vite, Recharts, Axios, React Router
- **Backend**: Python FastAPI, SQLAlchemy, JWT Auth
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **AI Layer**: Rule-based gap detection + risk scoring engine
- **PDF Export**: ReportLab

## Features
- ✅ JWT-based authentication (register/login)
- ✅ 4 compliance frameworks: ISO 27001 (34), SOC 2 (31), HIPAA (31), DPDP (28)
- ✅ 100+ preloaded compliance controls
- ✅ Control status tracking (Implemented / Partial / Not Implemented)
- ✅ Weighted compliance scoring engine
- ✅ AI rule-based gap detection with High/Medium/Low severity tagging
- ✅ Automated remediation suggestions
- ✅ PDF audit report export
- ✅ Interactive dashboard with charts and KPIs
