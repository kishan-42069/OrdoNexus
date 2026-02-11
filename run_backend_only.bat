@echo off
REM OrdoNexus Backend Only Startup Script
REM For systems without Node.js installed

echo ========================================
echo    OrdoNexus Backend - DPDP Compliance
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/2] Installing Python dependencies...
cd backend

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt

echo.
echo [2/2] Starting Backend Server...
echo.
echo ========================================
echo    Backend API is starting!
echo ========================================
echo.
echo API Endpoint: http://localhost:8000
echo API Docs:     http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py
