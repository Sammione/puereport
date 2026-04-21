@echo off
echo Starting AI Report Generator...

echo Starting Backend...
start "Backend" cmd /k "pip install -r backend/requirements.txt && python backend/index.py"

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo App is starting. Backend at http://localhost:8000, Frontend at http://localhost:3000
pause
