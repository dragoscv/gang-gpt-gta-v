@echo off
echo.
echo 🚀 Starting GangGPT Development Environment...
echo.

cd /d "%~dp0.."

echo 📋 Checking prerequisites...

:: Check Redis
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ Redis already running
) else (
    if exist "redis-windows\redis-server.exe" (
        echo 📦 Starting Redis server...
        start /B redis-windows\redis-server.exe redis-windows\ganggpt-redis.conf
        timeout /t 2 >nul
        echo ✅ Redis started
    ) else (
        echo ⚠️  Redis not found, continuing with memory fallback
    )
)

echo.
echo 🔧 Building project...
call pnpm build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Build successful

echo.
echo 🎯 Starting services...

:: Start backend
echo 🔧 Starting Backend (port 4828)...
start "GangGPT Backend" cmd /c "pnpm run dev"

:: Start frontend
echo 🌐 Starting Frontend (port 4829)...
start "GangGPT Frontend" cmd /c "cd web && pnpm run dev"

echo.
echo ⏳ Waiting for services to initialize...
timeout /t 10 >nul

echo.
echo 🎮 RAGE:MP Server Setup:
if exist "ragemp-server\ragemp-server.exe" (
    echo ✅ RAGE:MP server found
    echo 📋 To start RAGE:MP server manually:
    echo    cd ragemp-server
    echo    ragemp-server.exe
    echo    Server will run on: 127.0.0.1:22005
) else (
    echo ⚠️  RAGE:MP server not found in ragemp-server/
    echo 📥 Download from: https://rage.mp/files/server/
)

echo.
echo 🚀 Development Environment Ready!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔧 Backend:     http://localhost:4828
echo 🌐 Frontend:    http://localhost:4829
echo 🎮 RAGE:MP:     127.0.0.1:22005 (manual start)
echo 📦 Redis:       localhost:4832
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo.
echo ⌨️  Press any key to continue monitoring or close to stop services...
pause >nul
