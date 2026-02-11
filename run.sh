#!/bin/bash
# OrdoNexus Startup Script for Linux/Mac
# Starts both Backend (FastAPI) and Frontend (Vite) concurrently

echo "========================================"
echo "   OrdoNexus - Shadow Data Governance"
echo "   DPDP Compliance Platform"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Installing Python dependencies..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt --quiet
cd ..

echo ""
echo "[2/4] Installing Frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "[3/4] Starting Backend Server (FastAPI)..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

sleep 3

echo ""
echo "[4/4] Starting Frontend Server (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "   OrdoNexus is running!"
echo "========================================"
echo ""
echo "Backend API:  http://localhost:8000"
echo "Frontend UI:  http://localhost:5173"
echo "API Docs:     http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
