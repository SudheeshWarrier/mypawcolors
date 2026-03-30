@echo off
REM Quick Start Script for Data Manager
REM This script will install dependencies and start the app

echo.
echo ========================================
echo   Data Manager - Quick Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [✓] Python found
echo.

REM Install dependencies
echo [*] Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [✓] Dependencies installed

echo.
echo ========================================
echo   Starting Data Manager...
echo ========================================
echo.
echo The app will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

REM Start the app
python app.py

pause
