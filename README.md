# AI Based Compliance & Audit Automation Platform

<div align="center">

![Platform Banner](https://img.shields.io/badge/Platform-Compliance%20%26%20Audit%20AI-blue?style=for-the-badge&logo=shield&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**An industry-grade, AI-driven compliance management and audit automation platform**  
supporting ISO 27001 · SOC 2 · HIPAA · DPDP

</div>

---

## 📌 Overview

Organizations must comply with multiple security and data privacy regulations, but tracking compliance manually in spreadsheets is error-prone, slow, and reactive. Audit failures are discovered only after expensive external reviews.

**This platform automates the entire compliance lifecycle:**

- 📋 Track 100+ controls across 4 major frameworks
- 🤖 AI-powered gap detection with severity scoring
- 📈 Real-time weighted compliance scoring engine
- 📄 One-click PDF audit report generation
- 🔐 Secure JWT-based multi-user authentication

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000  
- Swagger Docs: http://localhost:8000/docs  
- Database auto-created and seeded on first run (100+ controls)

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

---

## 🏗️ Architecture

```
┌──────────────────────┐     REST API (JWT Auth)     ┌──────────────────────────┐
│   React 18 Frontend  │ ◄─────────────────────────► │   FastAPI Backend         │
│   Vite · Recharts    │                              │   SQLAlchemy · Pydantic   │
│   Port: 5173         │                              │   Port: 8000              │
└──────────────────────┘                              └───────────┬──────────────┘
                                                                  │
                                                       ┌──────────▼──────────┐
                                                       │  SQLite (Dev)        │
                                                       │  PostgreSQL (Prod)   │
                                                       └─────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | SPA dashboard & interactive UI |
| Styling | Vanilla CSS | Custom dark-mode design system |
| Charts | Recharts | Bar chart, donut chart, score ring |
| Backend | Python FastAPI | REST API, business logic, scoring |
| ORM | SQLAlchemy | Database models & queries |
| Auth | JWT (python-jose) | Stateless secure authentication |
| AI Engine | Rule-based engine | Gap detection & risk scoring |
| PDF | ReportLab | Audit report generation |
| Database | SQLite → PostgreSQL | Dev-ready, production-scalable |

---

## ✨ Features

### 🔐 Authentication
- JWT-based login & registration
- Role-based access: **Admin / Analyst / Auditor**
- All API routes are protected

### 📊 Compliance Dashboard
- **Avg Compliance %** across all frameworks
- **Score ring** (color-coded: 🟢 ≥80% · 🟡 ≥50% · 🔴 <50%)
- **Framework progress bars** — ISO 27001, SOC 2, HIPAA, DPDP
- **Bar chart** comparing frameworks side-by-side
- **Donut chart** — Implemented vs Remaining controls

### 📋 Compliance Frameworks

| Framework | Controls | Domain |
|---|---|---|
| **ISO 27001** | 34 | Information Security Management |
| **SOC 2** | 31 | Trust Service Criteria |
| **HIPAA** | 31 | Healthcare Data Privacy |
| **DPDP** | 28 | India Digital Personal Data Protection |

### ✅ Controls Management
- View all controls per framework with current status
- Update status: **Implemented / Partial / Not Implemented**
- Set **owner**, **due date**, and **notes** per control
- Weighted controls — critical controls score higher

### 🤖 AI Gap Detection Engine
- Scans all controls and identifies implementation gaps
- Tags severity: **🔴 High / 🟡 Medium / 🟢 Low**
- Based on control criticality + implementation status
- Auto-generates **remediation suggestions** per gap

### 📈 Weighted Compliance Scoring
```
score = Σ(control_weight × status_value) / Σ(weights) × 100

Implemented  → 100% credit
Partial      → 50% credit  
Not Implemented → 0% credit
```

### 📄 PDF Audit Report Export
- Complete audit report per framework
- Includes: score, control breakdown, gap summary, remediation plan
- Generated on-demand via ReportLab

---

## 📁 Project Structure

```
ai-compliance-audit-platform/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── models.py             # SQLAlchemy database models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT authentication logic
│   ├── database.py           # DB session & engine setup
│   ├── seed_data.py          # 100+ controls seed data
│   ├── requirements.txt      # Python dependencies
│   └── routers/
│       ├── auth.py           # Login & register endpoints
│       ├── frameworks.py     # Framework listing
│       ├── controls.py       # Controls CRUD & status updates
│       ├── compliance.py     # Scoring & dashboard summary
│       ├── gap_analysis.py   # AI gap detection engine
│       └── reports.py        # Audit report & PDF export
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx           # Router & layout
        ├── main.jsx          # React entry point
        ├── index.css         # Global design system
        ├── api/client.js     # Axios instance with JWT interceptor
        └── pages/
            ├── Login.jsx     # Authentication
            ├── Register.jsx  # New user registration
            ├── Dashboard.jsx # Main compliance overview
            ├── Frameworks.jsx# Framework selection
            ├── Controls.jsx  # Control status management
            ├── GapAnalysis.jsx # AI gap detection view
            └── Reports.jsx   # Audit report & PDF export
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & get JWT token |
| `GET` | `/api/frameworks` | List all frameworks |
| `GET` | `/api/controls/{framework_id}` | Get controls with statuses |
| `PUT` | `/api/controls/{id}/status` | Update control status |
| `GET` | `/api/compliance/dashboard` | Dashboard summary (all frameworks) |
| `GET` | `/api/compliance/score/{fw_id}` | Weighted score for one framework |
| `POST` | `/api/compliance/seed-demo` | Seed demo data for new users |
| `GET` | `/api/gaps/{framework_id}` | AI gap analysis results |
| `POST` | `/api/reports/{framework_id}` | Generate audit report |
| `GET` | `/api/reports/{id}/pdf` | Export PDF |

Full interactive docs: **http://localhost:8000/docs**

---

## 🛢️ Database Models

| Table | Description |
|---|---|
| `users` | Accounts with role & organization |
| `frameworks` | ISO 27001, SOC 2, HIPAA, DPDP |
| `controls` | 100+ controls with weights & criticality |
| `control_statuses` | Per-user status for every control |
| `audit_reports` | Score snapshots at generation time |
| `risk_assessments` | Severity, likelihood, impact ratings |
| `evidence_documents` | File uploads as control evidence |
| `organizations` | Multi-tenant organization support |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">
Built with ❤️ for compliance automation
</div>
