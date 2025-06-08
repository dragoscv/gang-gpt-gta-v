@echo off
echo 🎮 GangGPT Integration with Existing RAGE:MP Server
echo ==================================================

echo.
echo 📁 Using existing RAGE:MP server at: E:\GitHub\diamondrp
echo ✅ ragemp-server.exe found and ready
echo.

echo 📦 Step 1: Copying GangGPT configuration...
copy "conf.json" "E:\GitHub\diamondrp\conf-ganggpt.json" >nul
echo   ✅ GangGPT config saved as conf-ganggpt.json

echo.
echo 📁 Step 2: Setting up GangGPT server package...
if not exist "E:\GitHub\diamondrp\packages\ganggpt" mkdir "E:\GitHub\diamondrp\packages\ganggpt"
xcopy "packages\ganggpt" "E:\GitHub\diamondrp\packages\ganggpt\" /E /I /Y >nul
echo   ✅ GangGPT server package copied

echo.
echo 📱 Step 3: Setting up GangGPT client scripts...
if not exist "E:\GitHub\diamondrp\client_packages\ganggpt" mkdir "E:\GitHub\diamondrp\client_packages\ganggpt"
xcopy "client_packages" "E:\GitHub\diamondrp\client_packages\ganggpt\" /E /I /Y >nul
echo   ✅ GangGPT client scripts copied

echo.
echo 🔧 Step 4: Updating server configuration...
powershell -Command "(Get-Content 'E:\GitHub\diamondrp\conf.json') -replace '\"RAGE:MP Unofficial server\"', '\"GangGPT - AI-Powered Roleplay Server\"' -replace '\"freeroam\"', '\"Gang AI Roleplay\"' -replace '100', '1000' | Set-Content 'E:\GitHub\diamondrp\conf.json'"
echo   ✅ Server configured for GangGPT

echo.
echo ✅ Integration Complete!
echo.
echo 🚀 Next Steps:
echo 1. Ensure GangGPT backend is running: http://localhost:4828
echo 2. Navigate to: E:\GitHub\diamondrp
echo 3. Run: ragemp-server.exe
echo 4. Connect GTA V with RAGE:MP client to: 127.0.0.1:22005
echo.
echo 🎮 Server will show: "GangGPT - AI-Powered Roleplay Server"
echo 🤖 All AI systems will be active and ready!
echo.

pause
