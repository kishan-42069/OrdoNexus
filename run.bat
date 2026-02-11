@echo off
REM OrdoNexus Startup Script for Windows
REM Starts both Backend (FastAPI) and Frontend (Vite) concurrently

echo ========================================
echo    OrdoNexus - Shadow Data Governance
echo    DPDP Compliance Platform
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

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Installing Python dependencies...
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet
cd ..

echo.
echo [2/4] Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [3/4] Starting Backend Server (FastAPI)...
start "OrdoNexus Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python main.py"

timeout /t 3 /nobreak >nul

echo.
echo [4/4] Starting Frontend Server (Vite)...
start "OrdoNexus Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo    OrdoNexus is starting!
echo ========================================
echo.
echo Backend API:  http://localhost:8000
echo Frontend UI:  http://localhost:5173
echo API Docs:     http://localhost:8000/docs
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5173

echo.
echo Application is running. Close the terminal windows to stop the servers.
echo.
