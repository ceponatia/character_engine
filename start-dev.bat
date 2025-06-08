@echo off
echo 🚀 Starting RPG Chatbot Development Servers...
echo.

REM Check if directories exist
if not exist "backend" (
    echo ❌ Error: backend directory not found
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: frontend directory not found
    pause
    exit /b 1
)

echo 📦 Starting backend server (port 3001)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo 🎨 Starting frontend server (port 3000)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Development servers started successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3001
echo ❤️  Health:   http://localhost:3001/health
echo 👥 Characters: http://localhost:3001/api/characters
echo.
echo Press any key to exit...
pause >nul