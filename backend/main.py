from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
import models
from seed_data import FRAMEWORKS
from routers import auth, frameworks, controls, compliance, gap_analysis, reports

# Create all DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Compliance & Audit Automation Platform",
    description="Automates cybersecurity compliance tracking for ISO 27001, SOC 2, HIPAA, and DPDP.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(frameworks.router)
app.include_router(controls.router)
app.include_router(compliance.router)
app.include_router(gap_analysis.router)
app.include_router(reports.router)


def seed_database():
    """Seed compliance frameworks and controls on first startup."""
    db = SessionLocal()
    try:
        existing = db.query(models.Framework).count()
        if existing > 0:
            return  # Already seeded

        for fw_data in FRAMEWORKS:
            fw = models.Framework(
                name=fw_data["name"],
                description=fw_data["description"],
                version=fw_data["version"],
                total_controls=len(fw_data["controls"])
            )
            db.add(fw)
            db.flush()

            for ctrl_id, name, category, is_critical, weight in fw_data["controls"]:
                ctrl = models.Control(
                    framework_id=fw.id,
                    control_id=ctrl_id,
                    name=name,
                    description=f"{name} — compliance control under {fw_data['name']}.",
                    category=category,
                    is_critical=is_critical,
                    weight=weight
                )
                db.add(ctrl)

        db.commit()
        print("✅ Database seeded with 4 frameworks and 100+ controls.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    seed_database()


@app.get("/")
def root():
    return {
        "message": "AI Compliance & Audit Automation Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
