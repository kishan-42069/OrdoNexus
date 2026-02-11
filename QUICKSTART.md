# How to Run OrdoNexus

## Quick Start Guide

### Step 1: Check Prerequisites

You need:
- **Python 3.8-3.12** (Python 3.13 has compatibility issues with some libraries)
- **Node.js 16+** (for the frontend)

### Step 2: Run the Application

#### Option A: Full Application (Backend + Frontend)

**Windows:**
```bash
.\run.bat
```

**Linux/Mac:**
```bash
chmod +x run.sh
./run.sh
```

#### Option B: Backend Only (If Node.js not installed)

**Windows:**
```bash
.\run_backend_only.bat
```

Then access the API at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 3: Use the Application

1. **Trigger a Scan**: Click "🔍 Trigger Scan" button
2. **View Results**: See files, PII tags, and risk scores in the grid
3. **Simulate Remediation**: Click "Simulate" on any file
4. **Download Report**: Click "📄 Download Report"

## Manual Setup (Alternative)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Troubleshooting

### Python Version Issue
If you see SQLAlchemy errors, you might be using Python 3.13. Please use Python 3.8-3.12 instead.

### Node.js Not Installed
Use `run_backend_only.bat` to run just the backend and access the API at http://localhost:8000/docs

### Port Already in Use
- Backend (8000): Stop any other process using port 8000
- Frontend (5173): Stop any other Vite dev servers

## Access Points

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/
