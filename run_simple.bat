@echo off
echo Starting Simple AI Report Generator...

echo Starting Backend...
start "Backend" cmd /k "cd backend && pip install -r requirements.txt && python index.py"

echo Starting Simple Frontend...
start "Simple Frontend" cmd /k "cd frontend && python ../backend/serve_simple.py"

echo App is running. Use the browser window that just opened.
pause
