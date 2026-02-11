"""
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
)
from init_data import create_mock_s3_structure
from report_generator import generate_compliance_report

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    }


@app.post("/scan")
async def trigger_scan(db: Session = Depends(get_db)):
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


@app.post("/simulate-remediation")
async def simulate_remediation(file_id: int, db: Session = Depends(get_db)):
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
    }


@app.get("/gamification")
async def get_gamification(db: Session = Depends(get_db)):
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
    
    return {
        "user_id": user.user_id,
        "responsibility_score": user.responsibility_score,
        "scans_performed": user.scans_performed,
        "high_risk_files_remediated": user.high_risk_files_remediated,
        "total_files": len(files),
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
