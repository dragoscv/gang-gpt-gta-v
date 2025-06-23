@echo off
title GangGPT Game Launcher
echo.
echo ======================================
echo    GangGPT Game Launcher
echo ======================================
echo.
echo Launching RAGE:MP client...
echo.

pwsh -ExecutionPolicy Bypass -File "%~dp0launch-ganggpt-game.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Press any key to exit...
    pause >nul
)
