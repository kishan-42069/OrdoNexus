"""
<<<<<<< HEAD
OrdoNexus v2 — FastAPI Backend (PostgreSQL edition)
Clean rewrite — all enum/cast issues resolved
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Optional
from datetime import datetime, timedelta, timezone
import random

_now = lambda: datetime.now(timezone.utc)

from models import init_db, get_db, FileMetadata, AuditLog, UserScore, ScanRun, RiskSnapshot
from services import (
    DiscoveryService, ClassificationEngine, RiskScoringEngine,
    AuditLogger, GamificationService, SnapshotService,
=======
FastAPI Main Application for OrdoNexus
Shadow Data Governance Platform for DPDP Compliance
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json

from models import init_db, get_db, FileMetadata, AuditLog, UserScore
from services import (
    DiscoveryService, ClassificationEngine, RiskScoringEngine,
    AuditLogger, GamificationService
>>>>>>> upstream/main
)
from init_data import create_mock_s3_structure
from report_generator import generate_compliance_report

<<<<<<< HEAD

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_mock_s3_structure()
    init_db()
    print("✅ OrdoNexus v2 (PostgreSQL) Ready")
    yield


app = FastAPI(title="OrdoNexus API v2", version="2.0.0-pg", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
=======
# Initialize FastAPI app
app = FastAPI(
    title="OrdoNexus API",
    description="Shadow Data Governance Platform for DPDP Compliance",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
>>>>>>> upstream/main
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


<<<<<<< HEAD
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "OrdoNexus API",
        "version": "2.0.0-pg",
        "db": "postgresql",
        "docs": "http://localhost:8000/docs",
=======
@app.on_event("startup")
async def startup_event():
    """Initialize database and mock data on startup"""
    print("🚀 Starting OrdoNexus Backend...")
    
    # Create mock S3 structure
    create_mock_s3_structure()
    
    # Initialize database
    init_db()
    
    print("✅ OrdoNexus Backend Ready!")


# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "OrdoNexus API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
>>>>>>> upstream/main
    }


@app.post("/scan")
async def trigger_scan(db: Session = Depends(get_db)):
<<<<<<< HEAD
    scan_start = _now()
    scan_run = ScanRun(
        triggered_by="manual",
        triggered_user_id="default_user",
        status="RUNNING",
    )
    db.add(scan_run)
    db.commit()
    db.refresh(scan_run)

    try:
        discovered_files = DiscoveryService.scan_directory()
        scanned = high_risk = medium_risk = low_risk = critical_risk = 0
        new_files = updated_files = total_pii = 0

        for file_info in discovered_files:
            existing = db.query(FileMetadata).filter(
                FileMetadata.file_path == file_info["file_path"]
            ).first()

            pii  = ClassificationEngine.detect_pii(file_info["file_path"])
            sens = RiskScoringEngine.calculate_sensitivity(pii)
            exp  = RiskScoringEngine.calculate_exposure(file_info["bucket_name"])
            stal = RiskScoringEngine.calculate_staleness(file_info["last_modified"])
            risk = RiskScoringEngine.calculate_final_risk(sens, exp, stal)
            level = RiskScoringEngine.derive_risk_level(risk)
            liability = 0
            if pii["aadhaar_count"]  > 0: liability += 2500000000
            if pii["pan_count"]      > 0: liability += 500000000
            if pii["gstin_count"]    > 0: liability += 100000000
            if pii["email_count"]    > 0: liability += 50000000
            if pii["phone_count"]    > 0: liability += 50000000
            if pii["passport_count"] > 0: liability += 2500000000

            if existing:
                existing.aadhaar_count       = pii["aadhaar_count"]
                existing.pan_count           = pii["pan_count"]
                existing.gstin_count         = pii["gstin_count"]
                existing.email_count         = pii["email_count"]
                existing.phone_count         = pii.get("phone_count", 0)
                existing.passport_count      = pii.get("passport_count", 0)
                existing.dob_count           = pii.get("dob_count", 0)
                existing.sensitivity_score   = sens
                existing.exposure_multiplier = exp
                existing.staleness_multiplier= stal
                existing.final_risk_score    = risk
                existing.risk_level          = level
                existing.financial_liability = liability
                existing.last_scanned_at     = _now()
                existing.scan_batch_id       = scan_run.id
                updated_files += 1
            else:
                db.add(FileMetadata(
                    file_path            = file_info["file_path"],
                    file_name            = file_info["file_name"],
                    bucket_name          = file_info["bucket_name"],
                    file_size_bytes      = file_info["file_size_bytes"],
                    file_extension       = file_info["file_extension"],
                    scan_batch_id        = scan_run.id,
                    aadhaar_count        = pii["aadhaar_count"],
                    pan_count            = pii["pan_count"],
                    gstin_count          = pii["gstin_count"],
                    email_count          = pii["email_count"],
                    phone_count          = pii.get("phone_count", 0),
                    passport_count       = pii.get("passport_count", 0),
                    dob_count            = pii.get("dob_count", 0),
                    sensitivity_score    = sens,
                    exposure_multiplier  = exp,
                    staleness_multiplier = stal,
                    final_risk_score     = risk,
                    risk_level           = level,
                    financial_liability  = liability,
                    file_last_modified   = file_info["last_modified"],
                ))
                new_files += 1

            scanned    += 1
            total_pii  += sum(pii.values())
            if level == "CRITICAL": critical_risk += 1
            elif level == "HIGH":   high_risk += 1
            elif level == "MEDIUM": medium_risk += 1
            else:                   low_risk += 1

        db.commit()

        scan_end = _now()
        scan_run.status             = "COMPLETED"
        scan_run.completed_at       = scan_end
        scan_run.duration_ms        = int((scan_end - scan_start).total_seconds() * 1000)
        scan_run.files_discovered   = len(discovered_files)
        scan_run.files_scanned      = scanned
        scan_run.files_new          = new_files
        scan_run.files_updated      = updated_files
        scan_run.high_risk_count    = high_risk
        scan_run.medium_risk_count  = medium_risk
        scan_run.low_risk_count     = low_risk
        scan_run.critical_risk_count= critical_risk
        scan_run.total_pii_instances= total_pii
        scan_run.total_liability_inr= int(
            db.query(func.sum(FileMetadata.financial_liability)).scalar() or 0
        )
        db.commit()

        SnapshotService.take_snapshot(db, scan_run.id)
        # Use action_type "SCAN" so the Audit page ACTION_CONFIG shows the correct icon/label
        AuditLogger.log_action(db, "SCAN", {
            "scan_run_id": scan_run.id,
            "files_scanned": scanned,
            "high_risk_files": high_risk,
            "total_pii": total_pii,
        }, scan_run_id=scan_run.id)

        user = GamificationService.update_score_after_scan(db, "default_user", high_risk + critical_risk)

        return {
            "status": "success",
            "scan_run_id": scan_run.id,
            "files_scanned": scanned,
            "files_new": new_files,
            "files_updated": updated_files,
            "critical_risk_files": critical_risk,
            "high_risk_files": high_risk,
            "medium_risk_files": medium_risk,
            "low_risk_files": low_risk,
            "responsibility_score": user.responsibility_score,
        }

    except Exception as e:
        db.rollback()
        scan_run.status = "FAILED"
        scan_run.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")


@app.get("/files")
async def get_files(
    db: Session = Depends(get_db),
    bucket: Optional[str] = None,
    risk_level: Optional[str] = None,
    sort_by: str = "risk_score",
    sort_dir: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    query = db.query(FileMetadata)
    if bucket:     query = query.filter(FileMetadata.bucket_name == bucket)
    if risk_level: query = query.filter(FileMetadata.risk_level == risk_level.upper())
    if search:     query = query.filter(FileMetadata.file_path.ilike(f"%{search}%"))

    total = query.count()

    col = {
        "financial_liability": FileMetadata.financial_liability,
        "file_name":           FileMetadata.file_name,
    }.get(sort_by, FileMetadata.final_risk_score)

    query = query.order_by(col.desc() if sort_dir == "desc" else col)
    files = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total, "page": page, "page_size": page_size,
        "files": [{
            "id": f.id,
            "file_name": f.file_name,
            "file_path": f.file_path,
            "bucket_name": f.bucket_name,
            "file_size_bytes": f.file_size_bytes,
            "file_extension": f.file_extension,
            "pii_tags": _pii_tags(f),
            "pii_counts": {
                "aadhaar": f.aadhaar_count, "pan": f.pan_count,
                "gstin": f.gstin_count,     "email": f.email_count,
                "phone": f.phone_count,     "passport": f.passport_count,
            },
            "risk_score":          float(f.final_risk_score),
            "risk_level":          f.risk_level,
            "sensitivity":         float(f.sensitivity_score),
            "exposure":            float(f.exposure_multiplier),
            "staleness":           float(f.staleness_multiplier),
            "financial_liability": int(f.financial_liability or 0),
            "remediation_status":  f.remediation_status,
            "last_modified": f.file_last_modified.isoformat() if f.file_last_modified else None,
            "scanned_at":    f.last_scanned_at.isoformat()    if f.last_scanned_at    else None,
        } for f in files],
    }
=======
    """
    POST /scan
    Triggers a full scan of the mock S3 environment.
    Discovers files, classifies PII, and calculates risk scores.
    """
    try:
        # Discover files
        discovered_files = DiscoveryService.scan_directory()
        
        scanned_count = 0
        high_risk_count = 0
        
        for file_info in discovered_files:
            # Check if file already exists in DB
            existing = db.query(FileMetadata).filter(
                FileMetadata.file_path == file_info["file_path"]
            ).first()
            
            # Classify PII
            pii_counts = ClassificationEngine.detect_pii(file_info["file_path"])
            
            # Calculate risk components
            sensitivity = RiskScoringEngine.calculate_sensitivity(pii_counts)
            exposure = RiskScoringEngine.calculate_exposure(file_info["bucket_name"])
            staleness = RiskScoringEngine.calculate_staleness(file_info["last_modified"])
            final_risk = RiskScoringEngine.calculate_final_risk(sensitivity, exposure, staleness)
            
            if existing:
                # Update existing record
                existing.aadhaar_count = pii_counts["aadhaar_count"]
                existing.pan_count = pii_counts["pan_count"]
                existing.gstin_count = pii_counts["gstin_count"]
                existing.email_count = pii_counts["email_count"]
                existing.sensitivity_score = sensitivity
                existing.exposure_multiplier = exposure
                existing.staleness_multiplier = staleness
                existing.final_risk_score = final_risk
                existing.scanned_at = datetime.utcnow()
            else:
                # Create new record
                file_metadata = FileMetadata(
                    file_path=file_info["file_path"],
                    bucket_name=file_info["bucket_name"],
                    file_size_bytes=file_info["file_size_bytes"],
                    file_extension=file_info["file_extension"],
                    last_modified=file_info["last_modified"],
                    **pii_counts,
                    sensitivity_score=sensitivity,
                    exposure_multiplier=exposure,
                    staleness_multiplier=staleness,
                    final_risk_score=final_risk
                )
                db.add(file_metadata)
            
            scanned_count += 1
            if final_risk >= 20.0:  # High risk threshold
                high_risk_count += 1
        
        db.commit()
        
        # Log audit trail
        AuditLogger.log_action(
            db,
            action_type="SCAN",
            details={
                "files_scanned": scanned_count,
                "high_risk_files": high_risk_count,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Update gamification score
        user = GamificationService.update_score_after_scan(db, "default_user", high_risk_count)
        
        return {
            "status": "success",
            "files_scanned": scanned_count,
            "high_risk_files": high_risk_count,
            "responsibility_score": user.responsibility_score
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@app.get("/files")
async def get_files(db: Session = Depends(get_db)):
    """
    GET /files
    Returns list of all scanned files with risk scores.
    """
    files = db.query(FileMetadata).all()
    
    result = []
    for file in files:
        # Calculate financial liability
        liability = RiskScoringEngine.calculate_financial_liability(file)
        
        # Determine risk level
        if file.final_risk_score >= 20.0:
            risk_level = "HIGH"
        elif file.final_risk_score >= 10.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Build PII tags
        pii_tags = []
        if file.aadhaar_count > 0:
            pii_tags.append(f"Aadhaar ({file.aadhaar_count})")
        if file.pan_count > 0:
            pii_tags.append(f"PAN ({file.pan_count})")
        if file.gstin_count > 0:
            pii_tags.append(f"GSTIN ({file.gstin_count})")
        if file.email_count > 0:
            pii_tags.append(f"Email ({file.email_count})")
        
        result.append({
            "id": file.id,
            "file_name": file.file_path.split("\\")[-1],  # Extract filename
            "file_path": file.file_path,
            "bucket_name": file.bucket_name,
            "pii_tags": pii_tags,
            "risk_score": file.final_risk_score,
            "risk_level": risk_level,
            "sensitivity": file.sensitivity_score,
            "exposure": file.exposure_multiplier,
            "staleness": file.staleness_multiplier,
            "financial_liability": liability,
            "scanned_at": file.scanned_at.isoformat() if file.scanned_at else None
        })
    
    return result
>>>>>>> upstream/main


@app.post("/simulate-remediation")
async def simulate_remediation(file_id: int, db: Session = Depends(get_db)):
<<<<<<< HEAD
    file = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file:
        raise HTTPException(404, "File not found")

    liability = int(file.financial_liability or 0)
    risk_before = float(file.final_risk_score)
    recommendation = "Archive to cold storage" if float(file.staleness_multiplier) > 1.5 else "Delete permanently"

    # Mark the file as remediated so it is excluded from future active-file queries
    file.remediation_status = "REMEDIATED"
    file.remediated_at = _now()
    file.remediated_by = "default_user"
    file.remediation_action = recommendation
    db.commit()

    AuditLogger.log_action(db, "SIMULATE_REMEDIATION", {
        "file_path": file.file_path,
        "risk_reduction": risk_before,
        "liability_saved": liability,
    }, file_id=file_id, severity="WARN")

    user = GamificationService.update_score_after_remediation(db, "default_user")
    return {
        "status": "success",
        "file_name": file.file_name,
        "current_risk": risk_before,
        "risk_reduction": risk_before,
        "financial_liability_saved": liability,
        "recommendation": recommendation,
        "new_responsibility_score": user.responsibility_score,
=======
    """
    POST /simulate-remediation
    Simulates "What-If" analysis for file deletion/archival.
    Returns potential risk reduction and financial savings.
    """
    file = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Calculate savings
    liability_saved = RiskScoringEngine.calculate_financial_liability(file)
    risk_reduction = file.final_risk_score
    
    # Log audit trail
    AuditLogger.log_action(
        db,
        action_type="SIMULATE_REMEDIATION",
        file_id=file_id,
        details={
            "file_path": file.file_path,
            "risk_reduction": risk_reduction,
            "liability_saved": liability_saved,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    # Update gamification (simulation counts as proactive action)
    user = GamificationService.update_score_after_remediation(db, "default_user")
    
    return {
        "status": "success",
        "file_name": file.file_path.split("\\")[-1],
        "current_risk": file.final_risk_score,
        "risk_reduction": risk_reduction,
        "financial_liability_saved": liability_saved,
        "recommendation": "Archive to cold storage" if file.staleness_multiplier > 1.5 else "Delete permanently",
        "new_responsibility_score": user.responsibility_score
>>>>>>> upstream/main
    }


@app.get("/gamification")
async def get_gamification(db: Session = Depends(get_db)):
<<<<<<< HEAD
    user = GamificationService.get_or_create_user(db, "default_user")
    files = db.query(FileMetadata).all()
=======
    """
    GET /gamification
    Returns current user's Data Responsibility Score.
    """
    user = GamificationService.get_or_create_user(db, "default_user")
    
    # Calculate total risk across all files
    files = db.query(FileMetadata).all()
    total_risk = sum(f.final_risk_score for f in files)
    total_liability = sum(RiskScoringEngine.calculate_financial_liability(f) for f in files)
    high_risk_files = len([f for f in files if f.final_risk_score >= 20.0])
    
>>>>>>> upstream/main
    return {
        "user_id": user.user_id,
        "responsibility_score": user.responsibility_score,
        "scans_performed": user.scans_performed,
        "high_risk_files_remediated": user.high_risk_files_remediated,
        "total_files": len(files),
<<<<<<< HEAD
        "high_risk_files":   len([f for f in files if f.risk_level in ("HIGH", "CRITICAL")]),
        "medium_risk_files": len([f for f in files if f.risk_level == "MEDIUM"]),
        "low_risk_files":    len([f for f in files if f.risk_level == "LOW"]),
        "total_risk": round(sum(float(f.final_risk_score) for f in files), 2),
        "total_financial_liability": sum(int(f.financial_liability or 0) for f in files),
        "last_updated": user.last_active_at.isoformat() if user.last_active_at else None,
    }


@app.get("/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    files = db.query(FileMetadata).filter(FileMetadata.remediation_status == "ACTIVE").all()
    if not files:
        return {"total_files": 0, "total_pii_instances": 0, "pii_breakdown": {},
                "bucket_stats": {}, "risk_distribution": {"critical": 0, "high": 0, "medium": 0, "low": 0}, "total_liability": 0}

    bucket_stats = {}
    for f in files:
        b = f.bucket_name
        if b not in bucket_stats:
            bucket_stats[b] = {"count": 0, "total_risk": 0.0, "total_liability": 0, "pii_count": 0}
        bucket_stats[b]["count"]         += 1
        bucket_stats[b]["total_risk"]    += float(f.final_risk_score)
        bucket_stats[b]["total_liability"]+= int(f.financial_liability or 0)
        bucket_stats[b]["pii_count"]     += (
            f.aadhaar_count + f.pan_count + f.gstin_count + f.email_count + f.phone_count
        )

    return {
        "total_files": len(files),
        "total_pii_instances": sum(
            f.aadhaar_count + f.pan_count + f.gstin_count + f.email_count + f.phone_count
            for f in files
        ),
        "pii_breakdown": {
            "aadhaar":  sum(f.aadhaar_count for f in files),
            "pan":      sum(f.pan_count     for f in files),
            "gstin":    sum(f.gstin_count   for f in files),
            "email":    sum(f.email_count   for f in files),
            "phone":    sum(f.phone_count   for f in files),
            "passport": sum(f.passport_count for f in files),
        },
        "bucket_stats": bucket_stats,
        "risk_distribution": {
            "critical": sum(1 for f in files if f.risk_level == "CRITICAL"),
            "high":     sum(1 for f in files if f.risk_level == "HIGH"),
            "medium":   sum(1 for f in files if f.risk_level == "MEDIUM"),
            "low":      sum(1 for f in files if f.risk_level == "LOW"),
        },
        "total_liability": sum(int(f.financial_liability or 0) for f in files),
        # Also count CRITICAL in high for charts that merge them
        "total_high_critical": sum(1 for f in files if f.risk_level in ("HIGH", "CRITICAL")),
    }


@app.get("/trends")
async def get_trends(db: Session = Depends(get_db)):
    snaps = db.query(RiskSnapshot).order_by(RiskSnapshot.snapshot_date.desc()).limit(90).all()
    if snaps:
        by_date = {}
        for s in snaps:
            d = s.snapshot_date.strftime("%Y-%m-%d") if hasattr(s.snapshot_date, "strftime") else str(s.snapshot_date)[:10]
            if d not in by_date:
                by_date[d] = {"date": d, "risk_score": 0.0, "financial_liability": 0, "files_at_risk": 0, "n": 0}
            by_date[d]["risk_score"]          += float(s.avg_risk_score or 0)
            by_date[d]["financial_liability"] += int(s.total_liability_inr or 0)
            by_date[d]["files_at_risk"]       += (s.high_risk_files or 0) + (s.critical_risk_files or 0)
            by_date[d]["n"] += 1
        trends = sorted([
            {**v, "risk_score": round(v["risk_score"] / v["n"], 1)}
            for v in by_date.values()
        ], key=lambda x: x["date"])
    else:
        now = _now()
        trends = [{
            "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
            "risk_score": round(20 + random.uniform(-3, 6), 1),
            "financial_liability": 3150000000,
            "files_at_risk": 5,
        } for i in range(29, -1, -1)]
    return {"trends": trends}


@app.get("/alerts")
async def get_alerts(db: Session = Depends(get_db)):
    files = db.query(FileMetadata).filter(
        FileMetadata.remediation_status == "ACTIVE",
        FileMetadata.risk_level.in_(["HIGH", "CRITICAL", "MEDIUM"])
    ).order_by(FileMetadata.final_risk_score.desc()).all()

    alerts = [{
        "id": f"alert-{f.id}",
        "severity": f.risk_level,
        "file_id": f.id,
        "file_name": f.file_name,
        "bucket": f.bucket_name,
        "message": (
            f"Sensitive PII in public bucket: {f.file_name}"
            if f.bucket_name == "public_web"
            else f"High-risk PII exposure detected: {f.file_name}"
        ),
        "risk_score": float(f.final_risk_score),
        "financial_liability": int(f.financial_liability or 0),
        "created_at": f.last_scanned_at.isoformat() if f.last_scanned_at else None,
    } for f in files]

    return {"alerts": alerts, "total": len(alerts)}


@app.get("/policies")
async def get_policies():
    return {"policies": [
        {"id": "POL-001", "article": "Article 4", "title": "Data Minimisation",
         "description": "Data collected must be limited to what is necessary.",
         "status": "PARTIAL",
         "checks": [
             {"name": "No data older than 2 years in active buckets", "passed": False},
             {"name": "No redundant copies of PII across buckets",    "passed": True},
             {"name": "Retention policy defined per bucket",          "passed": False},
         ]},
        {"id": "POL-002", "article": "Article 5", "title": "Accuracy of Data",
         "description": "Data must be accurate and up to date.",
         "status": "PASSING",
         "checks": [
             {"name": "Regular scanning schedule configured", "passed": True},
             {"name": "Stale data flagged automatically",     "passed": True},
             {"name": "Version control on sensitive records", "passed": True},
         ]},
        {"id": "POL-003", "article": "Article 6", "title": "Storage Limitation",
         "description": "Data must not be stored longer than necessary.",
         "status": "FAILING",
         "checks": [
             {"name": "Files older than 730 days reviewed",  "passed": False},
             {"name": "Auto-deletion policy configured",     "passed": False},
             {"name": "Cold storage migration configured",   "passed": False},
         ]},
        {"id": "POL-004", "article": "Article 8", "title": "Security Safeguards",
         "description": "Implement appropriate technical safeguards.",
         "status": "PASSING",
         "checks": [
             {"name": "PII values never stored (Zero-Trust)", "passed": True},
             {"name": "Access controls per bucket",           "passed": True},
             {"name": "Encryption at rest enabled",           "passed": True},
         ]},
        {"id": "POL-005", "article": "Article 9", "title": "Accountability",
         "description": "Demonstrate compliance at all times.",
         "status": "PASSING",
         "checks": [
             {"name": "Immutable audit trail maintained",  "passed": True},
             {"name": "Reports generated regularly",       "passed": True},
             {"name": "DPO designated",                   "passed": True},
         ]},
    ]}


@app.get("/audit-log")
async def get_audit_log(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    action_type: Optional[str] = None,
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if action_type:
        query = query.filter(AuditLog.action_type == action_type.upper())
    logs = query.limit(limit).all()
    return [{
        "id": log.id,
        "timestamp": log.timestamp.isoformat(),
        "action_type": log.action_type,
        "user_id": log.user_id,
        "file_id": log.file_id,
        "severity": log.severity,
        "details": log.details if isinstance(log.details, dict) else {},
    } for log in logs]


@app.get("/scan-history")
async def get_scan_history(db: Session = Depends(get_db), limit: int = 10):
    runs = db.query(ScanRun).order_by(ScanRun.started_at.desc()).limit(limit).all()
    return [{
        "id": r.id,
        "started_at":   r.started_at.isoformat(),
        "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        "status": r.status,
        "triggered_by": r.triggered_by,
        "files_scanned": r.files_scanned,
        "high_risk_count": r.high_risk_count,
        "total_pii_instances": r.total_pii_instances,
        "duration_ms": r.duration_ms,
    } for r in runs]


@app.get("/report")
async def generate_report(db: Session = Depends(get_db)):
    try:
        pdf_path = generate_compliance_report(db)
        AuditLogger.log_action(db, "REPORT_GENERATED", {"report_path": pdf_path})
        return FileResponse(pdf_path, media_type="application/pdf",
                            filename="OrdoNexus_DPDP_Report.pdf")
    except Exception as e:
        raise HTTPException(500, f"Report failed: {e}")


def _pii_tags(f: FileMetadata) -> list:
    tags = []
    if f.aadhaar_count  > 0: tags.append(f"Aadhaar ({f.aadhaar_count})")
    if f.pan_count      > 0: tags.append(f"PAN ({f.pan_count})")
    if f.gstin_count    > 0: tags.append(f"GSTIN ({f.gstin_count})")
    if f.email_count    > 0: tags.append(f"Email ({f.email_count})")
    if f.phone_count    > 0: tags.append(f"Phone ({f.phone_count})")
    if f.passport_count > 0: tags.append(f"Passport ({f.passport_count})")
    return tags


# ── NEW: Recent Activity (for dashboard widget) ──────────────────
@app.get("/recent-activity")
async def recent_activity(db: Session = Depends(get_db), limit: int = 10):
    """Latest audit events formatted for the dashboard activity feed."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    events = []
    for log in logs:
        details = log.details if isinstance(log.details, dict) else {}
        desc = log.action_type
        if log.action_type in ("SCAN", "SCAN_COMPLETED"):
            desc = f"Scanned {details.get('files_scanned', '?')} files — {details.get('high_risk_files', 0)} high risk"
        elif log.action_type == "SIMULATE_REMEDIATION":
            fname = (details.get('file_path', '').replace('\\', '/').split('/')[-1]
                     or 'Unknown file')
            desc = f"Remediated {fname}"
        elif log.action_type == "REPORT_GENERATED":
            desc = "Compliance report exported"
        events.append({
            "id":        log.id,
            "type":      log.action_type,
            "desc":      desc,
            "user":      log.user_id,
            "severity":  log.severity,
            "timestamp": log.timestamp.isoformat(),
        })
    return {"events": events}


# ── NEW: Analytics Overview (week comparison for trend arrows) ───
@app.get("/analytics/overview")
async def analytics_overview(db: Session = Depends(get_db)):
    """Aggregate stats with week-over-week deltas for trend arrows."""
    now = _now()
    week_ago = now - timedelta(days=7)

    # Current counts
    active = db.query(FileMetadata).filter(FileMetadata.remediation_status == "ACTIVE")
    total_files     = active.count()
    total_liability = int(active.with_entities(func.coalesce(func.sum(FileMetadata.financial_liability), 0)).scalar())
    total_pii       = int(active.with_entities(func.coalesce(
        func.sum(FileMetadata.aadhaar_count + FileMetadata.pan_count +
                 FileMetadata.gstin_count + FileMetadata.email_count +
                 FileMetadata.phone_count + FileMetadata.passport_count), 0
    )).scalar())

    # Remediated this week
    remediated_week = db.query(FileMetadata).filter(
        FileMetadata.remediation_status == "REMEDIATED",
        FileMetadata.remediated_at >= week_ago,
    ).count()

    # Scans this week
    scans_week = db.query(ScanRun).filter(ScanRun.started_at >= week_ago).count()

    # Last scan info
    last_scan = db.query(ScanRun).order_by(ScanRun.started_at.desc()).first()

    return {
        "total_files":       total_files,
        "total_liability":   total_liability,
        "total_pii":         total_pii,
        "remediated_week":   remediated_week,
        "scans_week":        scans_week,
        "last_scan_at":      last_scan.started_at.isoformat() if last_scan else None,
        "last_scan_status":  last_scan.status if last_scan else None,
        "last_scan_files":   last_scan.files_scanned if last_scan else 0,
        "last_scan_duration":last_scan.duration_ms if last_scan else None,
    }


# ── NEW: Top risky files (for dashboard widget) ──────────────────
@app.get("/top-risky-files")
async def top_risky_files(db: Session = Depends(get_db), limit: int = 5):
    """Top N highest-risk active files for the dashboard."""
    files = db.query(FileMetadata).filter(
        FileMetadata.remediation_status == "ACTIVE"
    ).order_by(FileMetadata.final_risk_score.desc()).limit(limit).all()
    return {"files": [{
        "id":          f.id,
        "file_name":   f.file_name,
        "bucket_name": f.bucket_name,
        "risk_level":  f.risk_level,
        "risk_score":  float(f.final_risk_score),
        "liability":   int(f.financial_liability or 0),
        "pii_tags":    _pii_tags(f),
    } for f in files]}
=======
        "high_risk_files": high_risk_files,
        "total_risk": round(total_risk, 2),
        "total_financial_liability": total_liability,
        "last_updated": user.last_updated.isoformat()
    }


@app.get("/report")
async def generate_report(db: Session = Depends(get_db)):
    """
    GET /report
    Generates and downloads DPDP Compliance PDF report.
    """
    try:
        # Generate report
        pdf_path = generate_compliance_report(db)
        
        # Log audit trail
        AuditLogger.log_action(
            db,
            action_type="REPORT_GENERATED",
            details={
                "report_path": pdf_path,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename="OrdoNexus_DPDP_Compliance_Report.pdf"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@app.get("/audit-log")
async def get_audit_log(db: Session = Depends(get_db)):
    """
    GET /audit-log
    Returns the immutable audit trail.
    """
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()
    
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "action_type": log.action_type,
            "user_id": log.user_id,
            "file_id": log.file_id,
            "details": json.loads(log.details) if log.details else {}
        }
        for log in logs
    ]
>>>>>>> upstream/main


if __name__ == "__main__":
    import uvicorn
<<<<<<< HEAD
    uvicorn.run(app, host="0.0.0.0", port=8000)
=======
    uvicorn.run(app, host="0.0.0.0", port=8000)
>>>>>>> upstream/main
