@echo off
echo 🎮 GangGPT RAGE:MP Quick Setup
echo ================================

echo.
echo 📥 Step 1: Download RAGE:MP Server
echo Please download RAGE:MP server from:
echo https://cdn.rage.mp/public/files/RAGEMultiplayer_0.3.7.zip
echo.
echo Extract it to: C:\RageMP-Server\
echo.

pause

echo.
echo 📦 Step 2: Setting up GangGPT files...

if not exist "C:\RageMP-Server" (
    echo ❌ Please download and extract RAGE:MP server to C:\RageMP-Server first
    pause
    exit /b 1
)

echo   📄 Copying configuration...
copy "conf.json" "C:\RageMP-Server\conf.json" >nul

echo   📁 Creating directories...
if not exist "C:\RageMP-Server\packages" mkdir "C:\RageMP-Server\packages"
if not exist "C:\RageMP-Server\client_packages" mkdir "C:\RageMP-Server\client_packages"

echo   📦 Copying GangGPT server package...
xcopy "packages\ganggpt" "C:\RageMP-Server\packages\ganggpt\" /E /I /Y >nul

echo   📱 Copying client scripts...
xcopy "client_packages" "C:\RageMP-Server\client_packages\" /E /I /Y >nul

echo.
echo ✅ Setup complete!
echo.
echo 🚀 Step 3: Start RAGE:MP Server
echo Navigate to C:\RageMP-Server and run: ragemp-server.exe
echo.
echo 🎮 Step 4: Connect with GTA V
echo 1. Start GTA V
echo 2. Run RAGE:MP client
echo 3. Connect to: 127.0.0.1:22005
echo.

pause
