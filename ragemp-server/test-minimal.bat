@echo off
echo Testing RAGE:MP Server Initialization...
echo.

echo Testing with minimal configuration (no packages)...
cd /d "%~dp0"

echo Killing any existing processes...
taskkill /f /im "ragemp-server.exe" 2>nul

echo Starting server with minimal config...
start /wait "RAGE:MP Test" ragemp-server.exe --config conf-minimal-test.json

echo.
echo Test completed. Check if server shows "ready to accept connections"
pause
