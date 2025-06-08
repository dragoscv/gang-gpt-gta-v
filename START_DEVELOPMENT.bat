@echo off
title GangGPT Development Environment
cls

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                   GangGPT Development                     ║
echo  ║             AI-Powered GTA V Multiplayer Server          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  🚀 Starting complete development environment...
echo.

cd /d "%~dp0"

REM Start the unified development environment
call pnpm run dev:all

echo.
echo  ✅ Development environment started!
echo  📋 Check service status with: pnpm run dev:status
echo.
pause
