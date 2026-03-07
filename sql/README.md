# OrdoNexus v2 — PostgreSQL Setup Guide

## Run Order

```bash
# 1. Create DB and user (as postgres superuser)
psql -U postgres -c "CREATE DATABASE ordonexus;"
psql -U postgres -c "CREATE USER ordonexus WITH PASSWORD 'ordonexus';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ordonexus TO ordonexus;"
psql -U postgres -d ordonexus -c "GRANT ALL ON SCHEMA public TO ordonexus;"

# 2. Run DDL (schema, triggers, views)
psql -U ordonexus -d ordonexus -f 01_ddl_schema.sql

# 3. Load seed/demo data
psql -U ordonexus -d ordonexus -f 02_seed_data.sql

# 4. Verify
psql -U ordonexus -d ordonexus -c "SELECT * FROM v_dashboard_summary;"
```

## What You Get

### Tables (7)
| Table | Rows (seed) | Purpose |
|---|---|---|
| `scan_runs` | 5 | Scan execution history |
| `file_metadata` | 60 | Core — one row per file, PII counts + risk scores |
| `audit_log` | 30+ | Immutable append-only compliance trail |
| `user_scores` | 8 | Per-user compliance posture |
| `risk_snapshots` | 90 | Daily aggregates for trend charts |
| `policy_checks` | 25 | DPDP Article compliance checklist |
| `data_owners` | 6 | Bucket-to-team mapping |

### Views (3)
- `v_dashboard_summary` — aggregated KPIs
- `v_active_alerts` — unremediated HIGH/CRITICAL files with owner info
- `v_bucket_breakdown` — per-bucket risk stats

### Triggers (3)
- `tg_set_risk_level` — auto-derives risk_level from score
- `tg_set_liability` — auto-computes financial_liability from PII counts
- `tg_deny_audit_update` — enforces audit_log immutability

### Indexes
20+ indexes including GIN (trigram search on file_path, JSONB on audit details), partial indexes for active high-risk files.

## Key Queries

```sql
-- Dashboard summary
SELECT * FROM v_dashboard_summary;

-- Top 10 highest liability files
SELECT file_name, bucket_name, risk_level,
       financial_liability / 1e7 AS liability_crore
FROM file_metadata
WHERE remediation_status = 'ACTIVE'
ORDER BY financial_liability DESC LIMIT 10;

-- 30-day trend
SELECT DATE(snapshot_date), SUM(total_liability_inr)/1e7 AS crore
FROM risk_snapshots
WHERE snapshot_date >= NOW() - INTERVAL '30 days'
GROUP BY 1 ORDER BY 1;

-- JSONB audit search
SELECT * FROM audit_log WHERE details @> '{"high_risk_files": 8}';

-- Full-text file search (trigram)
SELECT file_name, risk_level FROM file_metadata
WHERE file_path ILIKE '%salary%';
```
