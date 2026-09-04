@echo off
echo Starting Parliament Anomaly Investigation System...

set "ROOT_DIR=%~dp0"

start "FastAPI Backend" cmd /k "cd /d "%ROOT_DIR%" && .\.venv\Scripts\python.exe -m uvicorn backend_api:app --host 127.0.0.1 --port 8080"

timeout /t 3 /nobreak >nul

start "Next.js Frontend" cmd /k "cd /d "%ROOT_DIR%" && npm run dev -- -p 3001"

echo.
echo ============================================================
echo Backend launched on: http://127.0.0.1:8080
echo Frontend launched on: http://localhost:3001
echo ============================================================
echo You can now open http://localhost:3001 in your browser!
pause
