"""
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
}


class DiscoveryService:
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
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    
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
