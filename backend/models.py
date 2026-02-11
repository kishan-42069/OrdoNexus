"""
SQLAlchemy Database Models for OrdoNexus
Implements Zero-Trust metadata storage (no actual PII stored)
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()


class FileMetadata(Base):
    """
    Stores metadata about scanned files with risk scoring.
    CRITICAL: Only stores PII counts, NEVER actual PII values (Zero-Trust principle).
    """
    __tablename__ = "file_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String(500), nullable=False, unique=True)
    bucket_name = Column(String(200), nullable=False)  # Mock bucket (directory name)
    file_size_bytes = Column(Integer, default=0)
    file_extension = Column(String(20))
    
    # PII Detection Counts (Zero-Trust: counts only, no actual values)
    aadhaar_count = Column(Integer, default=0)
    pan_count = Column(Integer, default=0)
    gstin_count = Column(Integer, default=0)
    email_count = Column(Integer, default=0)
    
    # Risk Scoring Components
    sensitivity_score = Column(Float, default=0.0)  # 0-10 scale
    exposure_multiplier = Column(Float, default=1.0)  # Based on bucket type
    staleness_multiplier = Column(Float, default=1.0)  # Based on file age
    final_risk_score = Column(Float, default=0.0)  # Sensitivity × Exposure × Staleness
    
    # Metadata
    last_modified = Column(DateTime)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<FileMetadata(id={self.id}, path={self.file_path}, risk={self.final_risk_score})>"


class AuditLog(Base):
    """
    Immutable audit trail for all system actions.
    Required for DPDP compliance demonstration.
    """
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action_type = Column(String(50), nullable=False)  # 'SCAN', 'SIMULATE_REMEDIATION', 'REPORT_GENERATED'
    user_id = Column(String(100), default="system_user")
    file_id = Column(Integer, nullable=True)  # Reference to FileMetadata.id
    details = Column(Text)  # JSON string with action details
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action_type}, time={self.timestamp})>"


class UserScore(Base):
    """
    Gamification: Tracks Data Responsibility Score for users/teams.
    """
    __tablename__ = "user_score"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), unique=True, nullable=False)
    responsibility_score = Column(Integer, default=50)  # 0-100 scale
    high_risk_files_remediated = Column(Integer, default=0)
    scans_performed = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<UserScore(user={self.user_id}, score={self.responsibility_score})>"


# Database setup
DATABASE_URL = "sqlite:///./ordonexus.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully")


def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
