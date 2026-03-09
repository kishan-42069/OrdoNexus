"""
<<<<<<< HEAD
OrdoNexus v2 — PostgreSQL Models
Matches the actual DB schema created by sql/01_ddl_schema.sql exactly.
Uses SQLAlchemy Enum with create_type=False so it binds to the existing
PG enum types without trying to recreate or alter them.
"""
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Text,
    Index, BigInteger, Numeric, create_engine, Enum, Boolean, text
)
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

_UTC = timezone.utc

def _now():
    """Return current UTC time as a timezone-aware datetime (Python 3.13 safe)."""
    return datetime.now(_UTC)

Base = declarative_base()

# ── Enum definitions that mirror the DB types ──────────────────────
# create_type=False = do NOT issue CREATE TYPE (it already exists in PG)
# name must match the PG enum type name exactly.

ScanStatusEnum = Enum(
    'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED',
    name='scan_status_enum', create_type=False
)
RemediationStatusEnum = Enum(
    'ACTIVE', 'REMEDIATED', 'IGNORED', 'IN_PROGRESS',
    name='remediation_status_enum', create_type=False
)
RiskLevelEnum = Enum(
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
    name='risk_level_enum', create_type=False
)
DataSourceEnum = Enum(
    'S3', 'GCS', 'AZURE_BLOB', 'SFTP', 'LOCAL', 'MOCK',
    name='data_source_enum', create_type=False
)
AuditSeverityEnum = Enum(
    'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL',
    name='audit_severity_enum', create_type=False
)
UserRoleEnum = Enum(
    'admin', 'analyst', 'viewer', 'auditor',
    name='user_role_enum', create_type=False
)
PolicyStatusEnum = Enum(
    'PASS', 'FAIL', 'PARTIAL', 'SKIP', 'UNKNOWN',
    name='policy_status_enum', create_type=False
)


class ScanRun(Base):
    """Tracks each scan execution."""
    __tablename__ = "scan_runs"

    id                   = Column(BigInteger, primary_key=True, autoincrement=True)
    started_at           = Column(DateTime(timezone=True), default=_now, nullable=False)
    completed_at         = Column(DateTime(timezone=True))
    triggered_by         = Column(String(100), default="manual", nullable=False)
    triggered_user_id    = Column(String(100))
    status               = Column(ScanStatusEnum, nullable=False, default="RUNNING")
    environment          = Column(String(50), default="production", nullable=False)
    files_discovered     = Column(Integer, default=0, nullable=False)
    files_scanned        = Column(Integer, default=0, nullable=False)
    files_new            = Column(Integer, default=0, nullable=False)
    files_updated        = Column(Integer, default=0, nullable=False)
    files_skipped        = Column(Integer, default=0, nullable=False)
    high_risk_count      = Column(Integer, default=0, nullable=False)
    medium_risk_count    = Column(Integer, default=0, nullable=False)
    low_risk_count       = Column(Integer, default=0, nullable=False)
    critical_risk_count  = Column(Integer, default=0, nullable=False)
    total_pii_instances  = Column(Integer, default=0, nullable=False)
    total_liability_inr  = Column(BigInteger, default=0, nullable=False)
    duration_ms          = Column(Integer)
    error_message        = Column(Text)
    scan_config          = Column(JSONB, default=dict)

    __table_args__ = (
        Index("ix_sr_started_at", "started_at"),
        Index("ix_sr_status",     "status"),
        {'extend_existing': True},
    )


class FileMetadata(Base):
    """Core table — one row per unique file. PII counts only (Zero-Trust)."""
    __tablename__ = "file_metadata"

    id                   = Column(BigInteger, primary_key=True, autoincrement=True)
    file_path            = Column(String(1000), nullable=False, unique=True)
    file_name            = Column(String(255), nullable=False)
    bucket_name          = Column(String(200), nullable=False)
    data_source          = Column(DataSourceEnum, default="MOCK", nullable=False)
    environment          = Column(String(50), default="production", nullable=False)
    owner_team           = Column(String(100))
    file_size_bytes      = Column(BigInteger, default=0, nullable=False)
    file_extension       = Column(String(20))
    mime_type            = Column(String(100))

    aadhaar_count        = Column(Integer, default=0, nullable=False)
    pan_count            = Column(Integer, default=0, nullable=False)
    gstin_count          = Column(Integer, default=0, nullable=False)
    email_count          = Column(Integer, default=0, nullable=False)
    phone_count          = Column(Integer, default=0, nullable=False)
    passport_count       = Column(Integer, default=0, nullable=False)
    dob_count            = Column(Integer, default=0, nullable=False)

    sensitivity_score    = Column(Numeric(6, 2), default=0.0, nullable=False)
    exposure_multiplier  = Column(Numeric(4, 2), default=1.0, nullable=False)
    staleness_multiplier = Column(Numeric(4, 2), default=1.0, nullable=False)
    final_risk_score     = Column(Numeric(8, 2), default=0.0, nullable=False)
    risk_level           = Column(RiskLevelEnum, default="LOW", nullable=False)

    financial_liability  = Column(BigInteger, default=0, nullable=False)

    remediation_status   = Column(RemediationStatusEnum, default="ACTIVE", nullable=False)
    remediation_action   = Column(String(50))
    remediated_at        = Column(DateTime(timezone=True))
    remediated_by        = Column(String(100))

    file_last_modified   = Column(DateTime(timezone=True))
    first_seen_at        = Column(DateTime(timezone=True), default=_now, nullable=False)
    last_scanned_at      = Column(DateTime(timezone=True), default=_now, nullable=False)

    scan_batch_id        = Column(BigInteger)

    __table_args__ = (
        Index("ix_fm_bucket",      "bucket_name"),
        Index("ix_fm_risk_level",  "risk_level"),
        Index("ix_fm_risk_score",  "final_risk_score"),
        Index("ix_fm_scanned_at",  "last_scanned_at"),
        Index("ix_fm_remediation", "remediation_status"),
        {'extend_existing': True},
    )


class AuditLog(Base):
    """Immutable audit trail."""
    __tablename__ = "audit_log"

    id           = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp    = Column(DateTime(timezone=True), default=_now, nullable=False)
    action_type  = Column(String(60), nullable=False)
    user_id      = Column(String(100), default="system", nullable=False)
    file_id      = Column(BigInteger)
    scan_run_id  = Column(BigInteger)
    severity     = Column(AuditSeverityEnum, default="INFO", nullable=False)
    details      = Column(JSONB, default=dict, nullable=False)

    __table_args__ = (
        Index("ix_al_timestamp",   "timestamp"),
        Index("ix_al_action_type", "action_type"),
        Index("ix_al_user_id",     "user_id"),
        Index("ix_al_severity",    "severity"),
        {'extend_existing': True},
    )


class UserScore(Base):
    """Gamification — per-user compliance posture."""
    __tablename__ = "user_scores"

    id                         = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id                    = Column(String(100), unique=True, nullable=False)
    display_name               = Column(String(200))
    team                       = Column(String(100))
    role                       = Column(UserRoleEnum, default="analyst", nullable=False)
    responsibility_score       = Column(Integer, default=50, nullable=False)
    scans_performed            = Column(Integer, default=0, nullable=False)
    high_risk_files_remediated = Column(Integer, default=0, nullable=False)
    reports_generated          = Column(Integer, default=0, nullable=False)
    last_scan_at               = Column(DateTime(timezone=True))
    last_active_at             = Column(DateTime(timezone=True), default=_now)
    created_at                 = Column(DateTime(timezone=True), default=_now, nullable=False)
    preferences                = Column(JSONB, default=dict, nullable=False)

    __table_args__ = (
        Index("ix_us_team",  "team"),
        Index("ix_us_score", "responsibility_score"),
        {'extend_existing': True},
    )


class RiskSnapshot(Base):
    """Daily risk aggregates per bucket — powers trend charts."""
    __tablename__ = "risk_snapshots"

    id                  = Column(BigInteger, primary_key=True, autoincrement=True)
    snapshot_date       = Column(Date, nullable=False)
    bucket_name         = Column(String(200), nullable=False)
    environment         = Column(String(50), default="production", nullable=False)
    total_files         = Column(Integer, default=0, nullable=False)
    critical_risk_files = Column(Integer, default=0, nullable=False)
    high_risk_files     = Column(Integer, default=0, nullable=False)
    medium_risk_files   = Column(Integer, default=0, nullable=False)
    low_risk_files      = Column(Integer, default=0, nullable=False)
    avg_risk_score      = Column(Numeric(8, 2), default=0.0, nullable=False)
    max_risk_score      = Column(Numeric(8, 2), default=0.0, nullable=False)
    total_pii_count     = Column(Integer, default=0, nullable=False)
    total_liability_inr = Column(BigInteger, default=0, nullable=False)
    scan_run_id         = Column(BigInteger)

    __table_args__ = (
        Index("ix_rs_date",        "snapshot_date"),
        Index("ix_rs_bucket_date", "bucket_name", "snapshot_date"),
        {'extend_existing': True},
    )


class PolicyCheck(Base):
    """DPDP Article compliance checklist."""
    __tablename__ = "policy_checks"

    id              = Column(BigInteger, primary_key=True, autoincrement=True)
    policy_id       = Column(String(20), nullable=False)
    article         = Column(String(30))
    title           = Column(String(200))
    check_name      = Column(String(300), nullable=False)
    status          = Column(PolicyStatusEnum, default="UNKNOWN", nullable=False)
    is_automated    = Column(Boolean, default=False, nullable=False)
    last_checked_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    checked_by      = Column(String(100), default="system", nullable=False)
    notes           = Column(Text)

    __table_args__ = (
        Index("ix_pc_policy_id", "policy_id"),
        Index("ix_pc_status",    "status"),
        {'extend_existing': True},
    )


# ── DB Connection ──────────────────────────────────────────────────
_raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql://ordonexus:ordonexus@localhost:5432/ordonexus"
)
# Auto-apply psycopg3 driver prefix (required for Python 3.13 on Windows)
DATABASE_URL = (
    _raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if not _raw_url.startswith("postgresql+")
    else _raw_url
)

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=False,
)

=======
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
>>>>>>> upstream/main
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
<<<<<<< HEAD
    """
    Ensure all tables exist. Since the schema is managed by sql/01_ddl_schema.sql
    (run as the postgres superuser), we use checkfirst=True so SQLAlchemy never
    tries to CREATE TYPE or ALTER anything — it only creates missing tables.
    """
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("✅ PostgreSQL schema initialized")


def get_db():
    """FastAPI dependency — yields a DB session."""
=======
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully")


def get_db():
    """Dependency for FastAPI to get database session"""
>>>>>>> upstream/main
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
