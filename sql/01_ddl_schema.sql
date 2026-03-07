-- ═══════════════════════════════════════════════════════════════════
--  OrdoNexus v2 — PostgreSQL DDL Schema
--  Shadow Data Governance & DPDP Compliance Platform
--
--  Run order:
--    psql -U postgres -d ordonexus -f 01_ddl_schema.sql
--    psql -U postgres -d ordonexus -f 02_seed_data.sql
--
--  Tested on: PostgreSQL 14, 15, 16
-- ═══════════════════════════════════════════════════════════════════

-- ── Prerequisites ──────────────────────────────────────────────────
-- Create the DB and user first (run as postgres superuser):
--   CREATE DATABASE ordonexus;
--   CREATE USER ordonexus WITH PASSWORD 'ordonexus';
--   GRANT ALL PRIVILEGES ON DATABASE ordonexus TO ordonexus;
--   \c ordonexus
--   GRANT ALL ON SCHEMA public TO ordonexus;


-- ── Extensions ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- trigram search on file_path


-- ═══════════════════════════════════════════════════════════════════
--  ENUM TYPES
-- ═══════════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE remediation_status_enum AS ENUM ('ACTIVE', 'REMEDIATED', 'IGNORED', 'IN_PROGRESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE scan_status_enum AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE data_source_enum AS ENUM ('S3', 'GCS', 'AZURE_BLOB', 'SFTP', 'LOCAL', 'MOCK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE audit_severity_enum AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('admin', 'analyst', 'viewer', 'auditor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE policy_status_enum AS ENUM ('PASS', 'FAIL', 'PARTIAL', 'SKIP', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: scan_runs
--  Created first — file_metadata references it
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scan_runs (
    id                  BIGSERIAL PRIMARY KEY,

    -- Timing
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,

    -- Identity
    triggered_by        VARCHAR(100) NOT NULL DEFAULT 'manual',
    triggered_user_id   VARCHAR(100),
    status              scan_status_enum NOT NULL DEFAULT 'RUNNING',
    environment         VARCHAR(50) NOT NULL DEFAULT 'production',

    -- Result counters
    files_discovered    INTEGER NOT NULL DEFAULT 0,
    files_scanned       INTEGER NOT NULL DEFAULT 0,
    files_new           INTEGER NOT NULL DEFAULT 0,
    files_updated       INTEGER NOT NULL DEFAULT 0,
    files_skipped       INTEGER NOT NULL DEFAULT 0,
    high_risk_count     INTEGER NOT NULL DEFAULT 0,
    medium_risk_count   INTEGER NOT NULL DEFAULT 0,
    low_risk_count      INTEGER NOT NULL DEFAULT 0,
    critical_risk_count INTEGER NOT NULL DEFAULT 0,
    total_pii_instances INTEGER NOT NULL DEFAULT 0,
    total_liability_inr BIGINT  NOT NULL DEFAULT 0,

    -- Duration (ms)
    duration_ms         INTEGER,

    -- Error details
    error_message       TEXT,
    error_stack         TEXT,

    -- Config snapshot (what was scanned)
    scan_config         JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT ck_sr_counts CHECK (
        files_discovered >= 0 AND files_scanned >= 0
    )
);

CREATE INDEX IF NOT EXISTS ix_sr_started_at   ON scan_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS ix_sr_status        ON scan_runs (status);
CREATE INDEX IF NOT EXISTS ix_sr_environment   ON scan_runs (environment);
CREATE INDEX IF NOT EXISTS ix_sr_triggered_by  ON scan_runs (triggered_by);

COMMENT ON TABLE scan_runs IS
    'Tracks each scan execution. Used for history, analytics, and batch linkage.';


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: file_metadata
--  Core table — one row per unique file path
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS file_metadata (
    id                  BIGSERIAL PRIMARY KEY,

    -- File identity
    file_path           VARCHAR(1000) NOT NULL,
    file_name           VARCHAR(255)  NOT NULL,
    bucket_name         VARCHAR(200)  NOT NULL,
    data_source         data_source_enum NOT NULL DEFAULT 'MOCK',
    environment         VARCHAR(50)  NOT NULL DEFAULT 'production',
    owner_team          VARCHAR(100),
    region              VARCHAR(50),                -- aws region / gcs location
    storage_class       VARCHAR(50),                -- STANDARD | NEARLINE | COLDLINE | GLACIER

    -- File properties
    file_size_bytes     BIGINT NOT NULL DEFAULT 0,
    file_extension      VARCHAR(20),
    mime_type           VARCHAR(100),
    file_hash_sha256    CHAR(64),                   -- for dedup detection

    -- PII Counts (Zero-Trust: counts only — never raw PII)
    aadhaar_count       INTEGER NOT NULL DEFAULT 0,
    pan_count           INTEGER NOT NULL DEFAULT 0,
    gstin_count         INTEGER NOT NULL DEFAULT 0,
    email_count         INTEGER NOT NULL DEFAULT 0,
    phone_count         INTEGER NOT NULL DEFAULT 0,
    passport_count      INTEGER NOT NULL DEFAULT 0,
    dob_count           INTEGER NOT NULL DEFAULT 0,
    total_pii_count     INTEGER GENERATED ALWAYS AS (
                            aadhaar_count + pan_count + gstin_count + email_count +
                            phone_count + passport_count + dob_count
                        ) STORED,

    -- Risk scoring components
    sensitivity_score   NUMERIC(6,2)  NOT NULL DEFAULT 0.0,
    exposure_multiplier NUMERIC(4,2)  NOT NULL DEFAULT 1.0,
    staleness_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    final_risk_score    NUMERIC(8,2)  NOT NULL DEFAULT 0.0,
    risk_level          risk_level_enum NOT NULL DEFAULT 'LOW',

    -- Financial liability (INR)
    financial_liability BIGINT NOT NULL DEFAULT 0,

    -- Remediation state
    remediation_status  remediation_status_enum NOT NULL DEFAULT 'ACTIVE',
    remediation_action  VARCHAR(50),               -- DELETE | ARCHIVE | ENCRYPT | MASK
    remediated_at       TIMESTAMPTZ,
    remediated_by       VARCHAR(100),
    remediation_notes   TEXT,

    -- Timestamps
    file_last_modified  TIMESTAMPTZ,
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_scanned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Scan linkage
    scan_batch_id       BIGINT REFERENCES scan_runs(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT uq_fm_file_path   UNIQUE (file_path),
    CONSTRAINT ck_fm_risk_score  CHECK (final_risk_score >= 0),
    CONSTRAINT ck_fm_sensitivity CHECK (sensitivity_score >= 0 AND sensitivity_score <= 10),
    CONSTRAINT ck_fm_liability   CHECK (financial_liability >= 0)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS ix_fm_bucket           ON file_metadata (bucket_name);
CREATE INDEX IF NOT EXISTS ix_fm_risk_level       ON file_metadata (risk_level);
CREATE INDEX IF NOT EXISTS ix_fm_risk_score       ON file_metadata (final_risk_score DESC);
CREATE INDEX IF NOT EXISTS ix_fm_last_scanned     ON file_metadata (last_scanned_at DESC);
CREATE INDEX IF NOT EXISTS ix_fm_remediation      ON file_metadata (remediation_status);
CREATE INDEX IF NOT EXISTS ix_fm_environment      ON file_metadata (environment);
CREATE INDEX IF NOT EXISTS ix_fm_liability        ON file_metadata (financial_liability DESC);
CREATE INDEX IF NOT EXISTS ix_fm_data_source      ON file_metadata (data_source);
CREATE INDEX IF NOT EXISTS ix_fm_owner_team       ON file_metadata (owner_team);
CREATE INDEX IF NOT EXISTS ix_fm_total_pii        ON file_metadata (total_pii_count DESC);

-- Trigram index for fast LIKE / ILIKE search on file paths
CREATE INDEX IF NOT EXISTS ix_fm_file_path_trgm
    ON file_metadata USING GIN (file_path gin_trgm_ops);

-- Composite: common dashboard filter
CREATE INDEX IF NOT EXISTS ix_fm_env_bucket_risk
    ON file_metadata (environment, bucket_name, risk_level);

-- Partial: only active (unremediated) high-risk files — most queried
CREATE INDEX IF NOT EXISTS ix_fm_active_high_risk
    ON file_metadata (final_risk_score DESC)
    WHERE remediation_status = 'ACTIVE' AND risk_level IN ('HIGH', 'CRITICAL');

COMMENT ON TABLE file_metadata IS
    'Core table. One row per unique file path. Stores PII counts and risk scores only — Zero-Trust.';
COMMENT ON COLUMN file_metadata.total_pii_count IS
    'Computed column: sum of all PII type counts. Auto-maintained by Postgres.';
COMMENT ON COLUMN file_metadata.financial_liability IS
    'Maximum DPDP penalty exposure in INR based on PII types present in this file.';


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: audit_log
--  Append-only. Use JSONB details for flexible event payloads.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action_type     VARCHAR(60)  NOT NULL,
    user_id         VARCHAR(100) NOT NULL DEFAULT 'system',
    user_ip         INET,                               -- native IP type
    session_id      VARCHAR(100),
    file_id         BIGINT,                             -- soft ref (no FK for immutability)
    scan_run_id     BIGINT,
    severity        audit_severity_enum NOT NULL DEFAULT 'INFO',
    details         JSONB NOT NULL DEFAULT '{}'::jsonb, -- rich payload, GIN-indexed

    -- Integrity chain (optional: each row hashes previous)
    row_hash        CHAR(64)                            -- SHA-256 of (prev_hash || payload)
);

-- Indexes
CREATE INDEX IF NOT EXISTS ix_al_timestamp      ON audit_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS ix_al_action_type    ON audit_log (action_type);
CREATE INDEX IF NOT EXISTS ix_al_user_id        ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS ix_al_file_id        ON audit_log (file_id)  WHERE file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_al_scan_run_id    ON audit_log (scan_run_id) WHERE scan_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_al_severity       ON audit_log (severity);

-- GIN index for JSONB querying: WHERE details @> '{"files_scanned": 5}'
CREATE INDEX IF NOT EXISTS ix_al_details_gin    ON audit_log USING GIN (details);

COMMENT ON TABLE audit_log IS
    'Immutable audit trail. Never UPDATE or DELETE rows. All actions logged here for DPDP accountability.';


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: user_scores
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_scores (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     VARCHAR(100) NOT NULL,
    display_name                VARCHAR(200),
    email                       VARCHAR(254),
    team                        VARCHAR(100),
    role                        user_role_enum NOT NULL DEFAULT 'analyst',
    responsibility_score        SMALLINT NOT NULL DEFAULT 50,
    scans_performed             INTEGER NOT NULL DEFAULT 0,
    high_risk_files_remediated  INTEGER NOT NULL DEFAULT 0,
    reports_generated           INTEGER NOT NULL DEFAULT 0,
    alerts_acknowledged         INTEGER NOT NULL DEFAULT 0,
    last_scan_at                TIMESTAMPTZ,
    last_active_at              TIMESTAMPTZ DEFAULT NOW(),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferences                 JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT uq_us_user_id     UNIQUE (user_id),
    CONSTRAINT ck_us_score_range CHECK (responsibility_score BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS ix_us_team   ON user_scores (team);
CREATE INDEX IF NOT EXISTS ix_us_score  ON user_scores (responsibility_score DESC);
CREATE INDEX IF NOT EXISTS ix_us_role   ON user_scores (role);

COMMENT ON TABLE user_scores IS
    'Tracks compliance posture score per user/team for gamification.';


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: risk_snapshots  (time-series)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS risk_snapshots (
    id                  BIGSERIAL PRIMARY KEY,
    snapshot_date       DATE NOT NULL,
    bucket_name         VARCHAR(200) NOT NULL,
    environment         VARCHAR(50)  NOT NULL DEFAULT 'production',
    data_source         data_source_enum NOT NULL DEFAULT 'MOCK',

    -- Aggregates
    total_files         INTEGER NOT NULL DEFAULT 0,
    critical_risk_files INTEGER NOT NULL DEFAULT 0,
    high_risk_files     INTEGER NOT NULL DEFAULT 0,
    medium_risk_files   INTEGER NOT NULL DEFAULT 0,
    low_risk_files      INTEGER NOT NULL DEFAULT 0,
    avg_risk_score      NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    max_risk_score      NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    total_pii_count     INTEGER NOT NULL DEFAULT 0,
    total_aadhaar       INTEGER NOT NULL DEFAULT 0,
    total_pan           INTEGER NOT NULL DEFAULT 0,
    total_gstin         INTEGER NOT NULL DEFAULT 0,
    total_email         INTEGER NOT NULL DEFAULT 0,
    total_liability_inr BIGINT  NOT NULL DEFAULT 0,
    remediated_count    INTEGER NOT NULL DEFAULT 0,

    scan_run_id         BIGINT REFERENCES scan_runs(id) ON DELETE SET NULL,

    CONSTRAINT uq_rs_date_bucket UNIQUE (snapshot_date, bucket_name, environment)
);

CREATE INDEX IF NOT EXISTS ix_rs_date           ON risk_snapshots (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS ix_rs_bucket_date    ON risk_snapshots (bucket_name, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS ix_rs_env_date       ON risk_snapshots (environment, snapshot_date DESC);

COMMENT ON TABLE risk_snapshots IS
    'Daily aggregates per bucket. Enables trend charts without full-table scans.';


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: policy_checks
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS policy_checks (
    id              BIGSERIAL PRIMARY KEY,
    policy_id       VARCHAR(20)  NOT NULL,
    article         VARCHAR(30),
    title           VARCHAR(200),
    check_name      VARCHAR(300) NOT NULL,
    status          policy_status_enum NOT NULL DEFAULT 'UNKNOWN',
    is_automated    BOOLEAN NOT NULL DEFAULT FALSE,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_by      VARCHAR(100) NOT NULL DEFAULT 'system',
    next_review_at  TIMESTAMPTZ,
    notes           TEXT,
    evidence_links  JSONB NOT NULL DEFAULT '[]'::jsonb,

    CONSTRAINT uq_pc_policy_check UNIQUE (policy_id, check_name)
);

CREATE INDEX IF NOT EXISTS ix_pc_policy_id ON policy_checks (policy_id);
CREATE INDEX IF NOT EXISTS ix_pc_status    ON policy_checks (status);

COMMENT ON TABLE policy_checks IS
    'DPDP Article compliance checklist. One row per check per policy.';


-- ═══════════════════════════════════════════════════════════════════
--  TABLE: data_owners
--  Maps buckets/paths to responsible teams
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS data_owners (
    id              BIGSERIAL PRIMARY KEY,
    bucket_name     VARCHAR(200) NOT NULL,
    environment     VARCHAR(50)  NOT NULL DEFAULT 'production',
    owner_team      VARCHAR(100) NOT NULL,
    owner_email     VARCHAR(254),
    slack_channel   VARCHAR(100),
    classification  VARCHAR(50)  NOT NULL DEFAULT 'CONFIDENTIAL',
    retention_days  INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_do_bucket_env UNIQUE (bucket_name, environment)
);

COMMENT ON TABLE data_owners IS
    'Maps storage buckets to responsible teams for alert routing.';


-- ═══════════════════════════════════════════════════════════════════
--  VIEWS
-- ═══════════════════════════════════════════════════════════════════

-- Active high-risk files with owner info (used by Alerts page)
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    fm.id,
    fm.file_name,
    fm.file_path,
    fm.bucket_name,
    fm.risk_level,
    fm.final_risk_score,
    fm.financial_liability,
    fm.total_pii_count,
    fm.aadhaar_count,
    fm.pan_count,
    fm.last_scanned_at,
    do_info.owner_team,
    do_info.owner_email,
    do_info.slack_channel,
    CASE
        WHEN fm.risk_level = 'CRITICAL' THEN 1
        WHEN fm.risk_level = 'HIGH'     THEN 2
        WHEN fm.risk_level = 'MEDIUM'   THEN 3
        ELSE 4
    END AS severity_order
FROM file_metadata fm
LEFT JOIN data_owners do_info
    ON do_info.bucket_name = fm.bucket_name
   AND do_info.environment = fm.environment
WHERE fm.remediation_status = 'ACTIVE'
  AND fm.risk_level IN ('HIGH', 'CRITICAL', 'MEDIUM');

COMMENT ON VIEW v_active_alerts IS
    'Active unremediated files with risk >= MEDIUM, enriched with owner info.';


-- Dashboard summary (replaces /dashboard/summary endpoint aggregation)
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
    COUNT(*)                                                AS total_files,
    SUM(total_pii_count)                                   AS total_pii_instances,
    SUM(aadhaar_count)                                     AS total_aadhaar,
    SUM(pan_count)                                         AS total_pan,
    SUM(gstin_count)                                       AS total_gstin,
    SUM(email_count)                                       AS total_email,
    SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN risk_level = 'HIGH'     THEN 1 ELSE 0 END) AS high_count,
    SUM(CASE WHEN risk_level = 'MEDIUM'   THEN 1 ELSE 0 END) AS medium_count,
    SUM(CASE WHEN risk_level = 'LOW'      THEN 1 ELSE 0 END) AS low_count,
    SUM(financial_liability)                               AS total_liability_inr,
    ROUND(AVG(final_risk_score)::numeric, 2)               AS avg_risk_score,
    MAX(final_risk_score)                                  AS max_risk_score,
    MAX(last_scanned_at)                                   AS last_scan_time
FROM file_metadata
WHERE remediation_status = 'ACTIVE';

COMMENT ON VIEW v_dashboard_summary IS
    'Aggregated metrics for the main dashboard. Query this instead of running COUNT(*) everywhere.';


-- Bucket-level breakdown
CREATE OR REPLACE VIEW v_bucket_breakdown AS
SELECT
    bucket_name,
    environment,
    COUNT(*)                                                AS file_count,
    SUM(CASE WHEN risk_level IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS high_risk_count,
    ROUND(AVG(final_risk_score)::numeric, 2)               AS avg_risk_score,
    SUM(total_pii_count)                                   AS total_pii,
    SUM(financial_liability)                               AS total_liability_inr,
    MAX(last_scanned_at)                                   AS last_scan
FROM file_metadata
WHERE remediation_status = 'ACTIVE'
GROUP BY bucket_name, environment
ORDER BY total_liability_inr DESC;

COMMENT ON VIEW v_bucket_breakdown IS
    'Per-bucket risk aggregation for the Bucket Exposure chart.';


-- ═══════════════════════════════════════════════════════════════════
--  FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Auto-set risk_level from final_risk_score on every insert/update
CREATE OR REPLACE FUNCTION fn_set_risk_level()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.risk_level := CASE
        WHEN NEW.final_risk_score >= 40 THEN 'CRITICAL'::risk_level_enum
        WHEN NEW.final_risk_score >= 20 THEN 'HIGH'::risk_level_enum
        WHEN NEW.final_risk_score >= 10 THEN 'MEDIUM'::risk_level_enum
        ELSE 'LOW'::risk_level_enum
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_set_risk_level ON file_metadata;
CREATE TRIGGER tg_set_risk_level
    BEFORE INSERT OR UPDATE OF final_risk_score ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION fn_set_risk_level();

COMMENT ON FUNCTION fn_set_risk_level IS
    'Auto-derives risk_level enum from final_risk_score. Keeps column consistent.';


-- Auto-set financial_liability from PII counts
CREATE OR REPLACE FUNCTION fn_set_financial_liability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_liability BIGINT := 0;
BEGIN
    IF NEW.aadhaar_count  > 0 THEN v_liability := v_liability + 25000000000; END IF;  -- ₹250 Cr
    IF NEW.pan_count      > 0 THEN v_liability := v_liability +  5000000000; END IF;  -- ₹50 Cr
    IF NEW.gstin_count    > 0 THEN v_liability := v_liability +  1000000000; END IF;  -- ₹10 Cr
    IF NEW.email_count    > 0 THEN v_liability := v_liability +   500000000; END IF;  -- ₹5 Cr
    IF NEW.phone_count    > 0 THEN v_liability := v_liability +   500000000; END IF;  -- ₹5 Cr
    IF NEW.passport_count > 0 THEN v_liability := v_liability + 25000000000; END IF;  -- ₹250 Cr
    NEW.financial_liability := v_liability;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_set_liability ON file_metadata;
CREATE TRIGGER tg_set_liability
    BEFORE INSERT OR UPDATE OF aadhaar_count, pan_count, gstin_count, email_count,
                               phone_count, passport_count ON file_metadata
    FOR EACH ROW EXECUTE FUNCTION fn_set_financial_liability();

COMMENT ON FUNCTION fn_set_financial_liability IS
    'Auto-computes DPDP financial liability in INR whenever PII counts change.';


-- Prevent UPDATE/DELETE on audit_log (immutability enforcement)
CREATE OR REPLACE FUNCTION fn_deny_audit_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only. Updates and deletes are not permitted.';
END;
$$;

DROP TRIGGER IF EXISTS tg_deny_audit_update ON audit_log;
CREATE TRIGGER tg_deny_audit_update
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION fn_deny_audit_mutation();

COMMENT ON FUNCTION fn_deny_audit_mutation IS
    'Enforces immutability of audit_log at the database level.';


-- ═══════════════════════════════════════════════════════════════════
--  USEFUL QUERY HELPERS (stored as comments for reference)
-- ═══════════════════════════════════════════════════════════════════
/*

-- Top 10 highest liability files:
SELECT file_name, bucket_name, risk_level,
       final_risk_score, financial_liability / 1e7 AS liability_crore
FROM file_metadata
WHERE remediation_status = 'ACTIVE'
ORDER BY financial_liability DESC
LIMIT 10;

-- 30-day risk trend (aggregate daily):
SELECT DATE(snapshot_date) AS day,
       SUM(high_risk_files + critical_risk_files) AS high_risk_total,
       SUM(total_liability_inr) / 1e7 AS liability_crore
FROM risk_snapshots
WHERE snapshot_date >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;

-- Audit log for a specific file (JSONB query):
SELECT timestamp, action_type, user_id, details
FROM audit_log
WHERE file_id = 42
ORDER BY timestamp DESC;

-- Files with Aadhaar in public buckets (worst case):
SELECT file_name, file_path, aadhaar_count, final_risk_score
FROM file_metadata
WHERE bucket_name ILIKE '%public%'
  AND aadhaar_count > 0
  AND remediation_status = 'ACTIVE'
ORDER BY aadhaar_count DESC;

-- Full-text search on file paths (trigram):
SELECT file_name, file_path, risk_level
FROM file_metadata
WHERE file_path ILIKE '%salary%'
ORDER BY final_risk_score DESC;

-- JSONB audit detail search:
SELECT * FROM audit_log
WHERE details @> '{"high_risk_files": 3}';

*/

-- ═══════════════════════════════════════════════════════════════════
--  PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ordonexus;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ordonexus;
GRANT SELECT ON v_active_alerts, v_dashboard_summary, v_bucket_breakdown TO ordonexus;

-- ═══════════════════════════════════════════════════════════════════
--  END OF DDL
-- ═══════════════════════════════════════════════════════════════════
