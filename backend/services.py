"""
<<<<<<< HEAD
OrdoNexus v2 — Services (PostgreSQL edition)
"""
import re
from pathlib import Path
from datetime import datetime, timezone

_now = lambda: datetime.now(timezone.utc)
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from models import FileMetadata, AuditLog, UserScore, ScanRun, RiskSnapshot

PII_PATTERNS = {
    "aadhaar":  r'\b\d{4}\s\d{4}\s\d{4}\b',
    "pan":      r'\b[A-Z]{5}\d{4}[A-Z]\b',
    "gstin":    r'\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]\b',
    "email":    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone":    r'\b[6-9]\d{9}\b',
    "passport": r'\b[A-Z][1-9]\d{7}\b',
    "dob":      r'\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b',
}

SENSITIVITY_WEIGHTS = {
    "aadhaar": 10.0, "pan": 8.0, "gstin": 6.0,
    "email": 3.0, "phone": 3.0, "passport": 10.0, "dob": 2.0,
}

EXPOSURE_MULTIPLIERS = {
    "public_web": 3.0, "legacy_archive": 2.0, "finance_private": 1.5,
    "hr_data": 1.5, "customer_db_dumps": 2.0, "log_exports": 1.2,
}

DPDP_PENALTIES = {
    "aadhaar": 2500000000, "pan": 500000000, "gstin": 100000000,
    "email": 50000000, "phone": 50000000, "passport": 2500000000, "dob": 10000000,
=======
Core Business Logic Services for OrdoNexus
- Discovery Service: Scans local filesystem (mock S3)
- Classification Engine: PII detection using regex
- Risk Scoring: Implements Sensitivity × Exposure × Staleness formula
- Audit Logger: Immutable action tracking
"""
import re
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json
from sqlalchemy.orm import Session

from models import FileMetadata, AuditLog, UserScore


# ==================== PII DETECTION PATTERNS ====================
PII_PATTERNS = {
    "aadhaar": r'\b\d{4}\s\d{4}\s\d{4}\b',  # Format: 1234 5678 9012
    "pan": r'\b[A-Z]{5}\d{4}[A-Z]\b',  # Format: ABCDE1234F
    "gstin": r'\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]\b',  # Format: 29ABCDE1234F1Z5
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
}


# ==================== RISK SCORING CONFIGURATION ====================
SENSITIVITY_WEIGHTS = {
    "aadhaar": 10.0,  # Highest sensitivity (government ID)
    "pan": 8.0,       # High sensitivity (tax ID)
    "gstin": 6.0,     # Medium-high sensitivity (business ID)
    "email": 3.0      # Medium sensitivity
}

EXPOSURE_MULTIPLIERS = {
    "public_web": 3.0,      # Public-facing = highest exposure
    "legacy_archive": 2.0,  # Old data = medium exposure
    "finance_private": 1.5  # Private but still risky
}

# DPDP Penalty Mapping (in INR per violation)
DPDP_PENALTIES = {
    "aadhaar": 250_00_00_000,  # ₹250 Crore for Aadhaar breach
    "pan": 50_00_00_000,       # ₹50 Crore for PAN breach
    "gstin": 10_00_00_000,     # ₹10 Crore for GSTIN breach
    "email": 5_00_00_000       # ₹5 Crore for email breach
>>>>>>> upstream/main
}


class DiscoveryService:
<<<<<<< HEAD
    @staticmethod
    def scan_directory(base_path: str = "mock_s3") -> List[Dict]:
        discovered = []
        base = Path(base_path)
        if not base.exists():
            raise FileNotFoundError(f"Path not found: {base_path}")
        for fp in base.rglob("*"):
            if fp.is_file():
                rel = fp.relative_to(base)
                bucket = rel.parts[0] if rel.parts else "unknown"
                discovered.append({
                    "file_path":       str(fp),
                    "file_name":       fp.name,
                    "bucket_name":     bucket,
                    "file_size_bytes": fp.stat().st_size,
                    "file_extension":  fp.suffix,
                    "last_modified":   datetime.fromtimestamp(fp.stat().st_mtime),
                })
        return discovered


class ClassificationEngine:
    @staticmethod
    def detect_pii(file_path: str) -> Dict[str, int]:
        counts = {k + "_count": 0 for k in PII_PATTERNS}
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            for pii_type, pattern in PII_PATTERNS.items():
                counts[f"{pii_type}_count"] = len(re.findall(pattern, content))
        except Exception as e:
            print(f"Warning: could not read {file_path}: {e}")
        return counts


class RiskScoringEngine:
    @staticmethod
    def calculate_sensitivity(pii_counts: Dict[str, int]) -> float:
        s = 0.0
        for pii_type, weight in SENSITIVITY_WEIGHTS.items():
            count = pii_counts.get(f"{pii_type}_count", 0)
            if count > 0:
                s += weight * min(1.0, count / 5.0)
        return round(min(10.0, s), 2)

    @staticmethod
    def calculate_exposure(bucket_name: str) -> float:
        return EXPOSURE_MULTIPLIERS.get(bucket_name, 1.0)

    @staticmethod
    def calculate_staleness(last_modified: datetime) -> float:
        age_days = (datetime.now() - last_modified).days
        if age_days > 730:  return 2.5
        if age_days > 365:  return 2.0
        if age_days > 180:  return 1.5
        return 1.0

    @staticmethod
    def calculate_final_risk(sens: float, exp: float, stal: float) -> float:
        return round(sens * exp * stal, 2)

    @staticmethod
    def derive_risk_level(score: float) -> str:
        if score >= 40: return "CRITICAL"
        if score >= 20: return "HIGH"
        if score >= 10: return "MEDIUM"
        return "LOW"

    @staticmethod
    def calculate_financial_liability(file) -> int:
        lib = 0
        if file.aadhaar_count  > 0: lib += DPDP_PENALTIES["aadhaar"]
        if file.pan_count      > 0: lib += DPDP_PENALTIES["pan"]
        if file.gstin_count    > 0: lib += DPDP_PENALTIES["gstin"]
        if file.email_count    > 0: lib += DPDP_PENALTIES["email"]
        if file.phone_count    > 0: lib += DPDP_PENALTIES["phone"]
        if file.passport_count > 0: lib += DPDP_PENALTIES["passport"]
        return lib


class AuditLogger:
    @staticmethod
    def log_action(db: Session, action_type: str, details: Dict,
                   file_id=None, scan_run_id=None,
                   user_id: str = "system", severity: str = "INFO"):
        try:
            entry = AuditLog(
                action_type=action_type,
                user_id=user_id,
                file_id=file_id,
                scan_run_id=scan_run_id,
                severity=severity,
                details=details,
            )
            db.add(entry)
            db.commit()
            return entry
        except Exception as e:
            db.rollback()
            print(f"Audit log warning: {e}")


class GamificationService:
    @staticmethod
    def get_or_create_user(db: Session, user_id: str = "default_user") -> UserScore:
        user = db.query(UserScore).filter(UserScore.user_id == user_id).first()
        if not user:
            user = UserScore(
                user_id=user_id,
                responsibility_score=50,
                role="analyst",   # plain string — no enum cast issue
            )
=======
    """Scans local filesystem (simulating S3 buckets)"""
    
    @staticmethod
    def scan_directory(base_path: str = "mock_s3") -> List[Dict]:
        """
        Scans all files in mock_s3 directory structure.
        Returns list of file metadata dictionaries.
        """
        discovered_files = []
        base = Path(base_path)
        
        if not base.exists():
            raise FileNotFoundError(f"Mock S3 directory not found: {base_path}")
        
        # Recursively scan all files
        for file_path in base.rglob("*"):
            if file_path.is_file():
                # Extract bucket name (first subdirectory)
                relative_path = file_path.relative_to(base)
                bucket_name = relative_path.parts[0] if relative_path.parts else "unknown"
                
                discovered_files.append({
                    "file_path": str(file_path),
                    "bucket_name": bucket_name,
                    "file_size_bytes": file_path.stat().st_size,
                    "file_extension": file_path.suffix,
                    "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime)
                })
        
        return discovered_files


class ClassificationEngine:
    """PII detection using regex patterns"""
    
    @staticmethod
    def detect_pii(file_path: str) -> Dict[str, int]:
        """
        Scans file content for PII patterns.
        Returns counts of each PII type found (Zero-Trust: no actual values stored).
        """
        pii_counts = {
            "aadhaar_count": 0,
            "pan_count": 0,
            "gstin_count": 0,
            "email_count": 0
        }
        
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Detect each PII type
            for pii_type, pattern in PII_PATTERNS.items():
                matches = re.findall(pattern, content)
                pii_counts[f"{pii_type}_count"] = len(matches)
        
        except Exception as e:
            print(f"⚠️  Error reading file {file_path}: {e}")
        
        return pii_counts


class RiskScoringEngine:
    """Calculates risk scores using the formula: Risk = Sensitivity × Exposure × Staleness"""
    
    @staticmethod
    def calculate_sensitivity(pii_counts: Dict[str, int]) -> float:
        """
        Calculate sensitivity score based on PII types and counts found.
        Returns 0-10 scale.
        """
        sensitivity = 0.0
        
        for pii_type, weight in SENSITIVITY_WEIGHTS.items():
            count = pii_counts.get(f"{pii_type}_count", 0)
            if count > 0:
                # Logarithmic scaling to prevent extreme values
                sensitivity += weight * min(1.0, count / 5.0)
        
        return min(10.0, sensitivity)  # Cap at 10
    
    @staticmethod
    def calculate_exposure(bucket_name: str) -> float:
        """
        Calculate exposure multiplier based on bucket type.
        """
        return EXPOSURE_MULTIPLIERS.get(bucket_name, 1.0)
    
    @staticmethod
    def calculate_staleness(last_modified: datetime) -> float:
        """
        Calculate staleness multiplier based on file age.
        Older files = higher risk (data minimization principle).
        """
        age_days = (datetime.now() - last_modified).days
        
        if age_days > 730:  # > 2 years
            return 2.5
        elif age_days > 365:  # > 1 year
            return 2.0
        elif age_days > 180:  # > 6 months
            return 1.5
        else:
            return 1.0
    
    @staticmethod
    def calculate_final_risk(sensitivity: float, exposure: float, staleness: float) -> float:
        """
        Final risk score = Sensitivity × Exposure × Staleness
        """
        return round(sensitivity * exposure * staleness, 2)
    
    @staticmethod
    def calculate_financial_liability(file_metadata: FileMetadata) -> float:
        """
        Calculate potential DPDP penalty for this file.
        """
        liability = 0.0
        
        if file_metadata.aadhaar_count > 0:
            liability += DPDP_PENALTIES["aadhaar"]
        if file_metadata.pan_count > 0:
            liability += DPDP_PENALTIES["pan"]
        if file_metadata.gstin_count > 0:
            liability += DPDP_PENALTIES["gstin"]
        if file_metadata.email_count > 0:
            liability += DPDP_PENALTIES["email"]
        
        return liability


class AuditLogger:
    """Immutable audit trail for compliance"""
    
    @staticmethod
    def log_action(db: Session, action_type: str, details: Dict, file_id: int = None, user_id: str = "system_user"):
        """
        Create an audit log entry.
        """
        log_entry = AuditLog(
            action_type=action_type,
            user_id=user_id,
            file_id=file_id,
            details=json.dumps(details)
        )
        db.add(log_entry)
        db.commit()
        return log_entry


class GamificationService:
    """Manages Data Responsibility Scores"""
    
    @staticmethod
    def get_or_create_user(db: Session, user_id: str = "default_user") -> UserScore:
        """Get or create user score record"""
        user = db.query(UserScore).filter(UserScore.user_id == user_id).first()
        if not user:
            user = UserScore(user_id=user_id, responsibility_score=50)
>>>>>>> upstream/main
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
<<<<<<< HEAD

    @staticmethod
    def update_score_after_scan(db: Session, user_id: str, high_risk_count: int) -> UserScore:
        user = GamificationService.get_or_create_user(db, user_id)
        user.scans_performed += 1
        user.last_scan_at = _now()
        if high_risk_count > 0:
            user.responsibility_score = max(0, user.responsibility_score - (high_risk_count * 2))
        else:
            user.responsibility_score = min(100, user.responsibility_score + 5)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update_score_after_remediation(db: Session, user_id: str) -> UserScore:
        user = GamificationService.get_or_create_user(db, user_id)
        user.high_risk_files_remediated += 1
        user.responsibility_score = min(100, user.responsibility_score + 10)
        db.commit()
        db.refresh(user)
        return user


class SnapshotService:
    @staticmethod
    def take_snapshot(db: Session, scan_run_id: int):
        today = _now().date()

        # Delete any existing snapshots for today (handles re-scans on the same day)
        db.query(RiskSnapshot).filter(RiskSnapshot.snapshot_date == today).delete()
        db.flush()

        for (bname,) in db.query(FileMetadata.bucket_name).distinct():
            rows = db.query(FileMetadata).filter(
                FileMetadata.bucket_name == bname,
                FileMetadata.remediation_status == "ACTIVE"
            ).all()
            if not rows:
                continue
            db.add(RiskSnapshot(
                snapshot_date=today,
                bucket_name=bname,
                total_files=len(rows),
                critical_risk_files=sum(1 for r in rows if r.risk_level == "CRITICAL"),
                high_risk_files=sum(1 for r in rows if r.risk_level == "HIGH"),
                medium_risk_files=sum(1 for r in rows if r.risk_level == "MEDIUM"),
                low_risk_files=sum(1 for r in rows if r.risk_level == "LOW"),
                avg_risk_score=round(sum(float(r.final_risk_score) for r in rows) / len(rows), 2),
                max_risk_score=max(float(r.final_risk_score) for r in rows),
                total_pii_count=sum(
                    r.aadhaar_count + r.pan_count + r.gstin_count + r.email_count + r.phone_count
                    for r in rows
                ),
                total_liability_inr=sum(r.financial_liability or 0 for r in rows),
                scan_run_id=scan_run_id,
            ))
        db.commit()
=======
    
    @staticmethod
    def update_score_after_scan(db: Session, user_id: str, high_risk_count: int):
        """Update score after a scan is performed"""
        user = GamificationService.get_or_create_user(db, user_id)
        user.scans_performed += 1
        
        # Decrease score if high-risk files found
        if high_risk_count > 0:
            user.responsibility_score = max(0, user.responsibility_score - (high_risk_count * 2))
        else:
            # Increase score for clean scan
            user.responsibility_score = min(100, user.responsibility_score + 5)
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def update_score_after_remediation(db: Session, user_id: str):
        """Update score after successful remediation"""
        user = GamificationService.get_or_create_user(db, user_id)
        user.high_risk_files_remediated += 1
        user.responsibility_score = min(100, user.responsibility_score + 10)
        
        db.commit()
        db.refresh(user)
        return user
>>>>>>> upstream/main
