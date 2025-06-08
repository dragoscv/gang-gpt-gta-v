@echo off
echo Starting RAGE:MP Server for GangGPT...
echo Current directory: %CD%
echo.

echo Checking files...
if exist "ragemp-server.exe" (
    echo ✓ ragemp-server.exe found
) else (
    echo ✗ ragemp-server.exe not found
    pause
    exit /b 1
)

if exist "conf.json" (
    echo ✓ conf.json found
) else (
    echo ✗ conf.json not found
    pause
    exit /b 1
)

echo.
echo Starting server...
ragemp-server.exe
echo.
echo Server process exited with code: %ERRORLEVEL%
pause
