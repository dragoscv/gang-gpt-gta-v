# 🎮 GangGPT RAGE:MP Manual Setup Guide - June 8, 2025

## 📋 Step-by-Step Setup Instructions

### 1. Download RAGE:MP Server
Since automatic download isn't working, please follow these steps:

1. **Visit the RAGE:MP website**: https://rage.mp/
2. **Click "DOWNLOAD RAGE MULTIPLAYER"** (main download button)
3. **Choose "Server" option** when prompted
4. **Download the server package** to your Downloads folder
5. **Extract the ZIP file** to `C:\RageMP-Server\`

### 2. Quick Setup with PowerShell
Once you have the server downloaded and extracted, run this command:

```powershell
# Navigate to the GangGPT project directory
cd "e:\GitHub\gang-gpt-gta-v"

# Run the configuration setup
.\configure-ragemp.ps1
```

### 3. Manual Setup (Alternative)
If you prefer to set up manually:

#### Copy Configuration Files
```powershell
# Copy the main configuration
Copy-Item ".\conf.json" "C:\RageMP-Server\conf.json" -Force

# Create packages directory
New-Item -ItemType Directory -Path "C:\RageMP-Server\packages" -Force

# Copy GangGPT server package
Copy-Item ".\packages\ganggpt" "C:\RageMP-Server\packages\ganggpt" -Recurse -Force

# Copy client packages
Copy-Item ".\client_packages" "C:\RageMP-Server\client_packages" -Recurse -Force
```

### 4. Verify Backend is Running
```powershell
# Check if backend is responding
Invoke-WebRequest -Uri "http://localhost:4828/health" -UseBasicParsing
```

### 5. Start RAGE:MP Server
```powershell
# Navigate to server directory
cd "C:\RageMP-Server"

# Start the server
.\ragemp-server.exe
```

### 6. Connect with Client
1. **Open RAGE:MP Client**: `C:\RAGEMP\ragemp_v.exe`
2. **Connect to**: `localhost:22005`
3. **Start testing** the AI systems!

## 🚀 Quick Test Commands
Once connected, try these in the game chat:

- `/ai companion` - Spawn an AI companion
- `/ai mission` - Generate a dynamic mission
- `/faction create TestFaction` - Create a test faction
- `/help` - See all available commands

## 📊 What to Expect
- **Server Console**: Should show GangGPT package loading
- **Backend Logs**: Should show player connection events
- **AI Responses**: Should see GPT-4o-mini generated content
- **Database**: Should track player activities

## 🆘 Troubleshooting
- **Server won't start**: Check conf.json syntax
- **Package errors**: Verify packages/ganggpt exists
- **Backend connection fails**: Ensure backend runs on port 4828
- **AI not responding**: Check Azure OpenAI configuration

---
*Ready to experience the future of AI-powered roleplay gaming!*
