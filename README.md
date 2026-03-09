# OrdoNexus v2

> **AI-powered data compliance & risk intelligence platform** — Scan, classify, and remediate sensitive data across cloud storage with real-time risk scoring, DPDP policy tracking, and gamified compliance posture management.

![OrdoNexus Dashboard](assets/dashboard.png)

---

## Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6.22-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.10-22B5BF?style=for-the-badge)
![Axios](https://img.shields.io/badge/Axios-1.6-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-0.27-499848?style=for-the-badge)
![ReportLab](https://img.shields.io/badge/ReportLab-4.1-003865?style=for-the-badge)

### Database & Infrastructure
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-1.13-6BA539?style=for-the-badge)
![AWS S3](https://img.shields.io/badge/AWS_S3_(mock)-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)

---

## Features

- **🔍 File Discovery & Scanning** — Scan mock S3 buckets, detect PII and sensitive data, and track scan history
- **⚠️ Risk Scoring Engine** — Auto-derives risk levels (LOW / MEDIUM / HIGH / CRITICAL) with financial liability estimates in INR
- **📊 Live Dashboard** — KPI summary cards, 30-day risk trend charts, bucket breakdowns, and recent activity feed
- **🚨 Alerts** — Filtered view of unremediated HIGH/CRITICAL files with owner attribution
- **📋 Policy Compliance** — DPDP Article-level checklist with pass/fail tracking
- **🗂️ Audit Log** — Immutable, append-only compliance trail with JSONB search support
- **🎮 Gamification** — Per-user compliance posture scoring and leaderboard via score rings
- **📄 PDF Reports** — One-click compliance report generation via ReportLab
- **🔁 Remediation Simulation** — Simulate file remediation and observe score/liability changes in real time

---

## Project Structure

```
OrdoNexus-main/
├── assets/
│   └── dashboard.png          # UI screenshot
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FilesPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── AuditPage.jsx
│   │   │   ├── PoliciesPage.jsx
│   │   │   └── ScanHistoryPage.jsx
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── BootScreen.jsx
│   │   │   ├── BootSequence.jsx
│   │   │   ├── ScoreRing.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── Toast.jsx
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── main.py                # FastAPI app & all endpoints
│   ├── models.py              # SQLAlchemy models
│   ├── services.py            # Business logic (scanning, scoring, etc.)
│   ├── report_generator.py    # PDF generation
│   ├── init_data.py           # Mock S3 seed structure
│   └── requirements.txt
└── sql/
    ├── 01_ddl_schema.sql      # Schema, triggers, views, indexes
    └── 02_seed_data.sql       # Demo data (60 files, 90 snapshots, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

---

### 1. Database Setup

```bash
# Create the database and user
psql -U postgres -c "CREATE DATABASE ordonexus;"
psql -U postgres -c "CREATE USER ordonexus WITH PASSWORD 'ordonexus';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ordonexus TO ordonexus;"
psql -U postgres -d ordonexus -c "GRANT ALL ON SCHEMA public TO ordonexus;"

# Apply schema and seed data
psql -U ordonexus -d ordonexus -f sql/01_ddl_schema.sql
psql -U ordonexus -d ordonexus -f sql/02_seed_data.sql
```

---

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # Set DATABASE_URL in .env

# Start the server
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

---

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
```

App will be available at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/scan` | Trigger a new scan run |
| `GET` | `/files` | List all scanned files |
| `GET` | `/dashboard/summary` | KPI summary for dashboard |
| `GET` | `/trends` | 30-day risk trend data |
| `GET` | `/alerts` | Active HIGH/CRITICAL alerts |
| `GET` | `/policies` | DPDP compliance checklist |
| `GET` | `/audit-log` | Full audit trail |
| `GET` | `/scan-history` | All past scan runs |
| `GET` | `/gamification` | User scores & leaderboard |
| `GET` | `/report` | Download PDF compliance report |
| `GET` | `/analytics/overview` | Aggregated analytics |
| `GET` | `/top-risky-files` | Top files by risk score |
| `POST` | `/simulate-remediation` | Simulate file remediation |

---

## Database Schema

The PostgreSQL schema includes **7 tables**, **3 views**, **3 triggers**, and **20+ indexes**.

| Table | Purpose |
|-------|---------|
| `file_metadata` | Core — one row per file, PII counts + risk scores |
| `scan_runs` | Scan execution history |
| `audit_log` | Immutable append-only compliance trail |
| `user_scores` | Per-user compliance posture |
| `risk_snapshots` | Daily aggregated risk trend data |
| `policy_checks` | DPDP Article compliance checklist |
| `data_owners` | Bucket-to-team ownership mapping |


## License

[apache license 2.0](LICENSE)
