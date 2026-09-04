@echo off
echo ========================================
echo   Nirikshak AI - Environment Setup
echo ========================================

echo.
echo [1/4] Creating Python virtual environment...
python -m venv .venv
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+ first.
    pause
    exit /b 1
)

echo [2/4] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [3/4] Upgrading pip...
python -m pip install --upgrade pip -q

echo [4/4] Installing all dependencies...
pip install -r requirements.txt

echo.
echo ========================================
echo   Setup Complete!
echo   Run 'start_portal.bat' to launch.
echo ========================================
pause
