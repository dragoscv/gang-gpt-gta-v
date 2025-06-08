# 🎮 Quick RAGE:MP Setup for GangGPT Live Testing

## 🎯 Goal: See GangGPT Running in GTA V

### Step 1: Download RAGE:MP Server
1. **Download**: https://cdn.rage.mp/public/files/RAGEMultiplayer_0.3.7.zip
2. **Extract** to: `C:\RageMP-Server\` (or any folder you prefer)

### Step 2: Copy GangGPT Files to RAGE:MP Server
```powershell
# Navigate to your RAGE:MP server folder
cd C:\RageMP-Server

# Copy GangGPT configuration
copy "E:\GitHub\gang-gpt-gta-v\conf.json" ".\conf.json"

# Copy GangGPT server package
xcopy "E:\GitHub\gang-gpt-gta-v\packages\ganggpt" ".\packages\ganggpt\" /E /I

# Copy client scripts
xcopy "E:\GitHub\gang-gpt-gta-v\client_packages" ".\client_packages\" /E /I
```

### Step 3: Start RAGE:MP Server
```powershell
cd C:\RageMP-Server
.\ragemp-server.exe
```

### Step 4: Connect with GTA V
1. **Start GTA V** (Story Mode or Online Mode)
2. **Run RAGE:MP Client**: `C:\RAGEMP\ragemp_v.exe`
3. **Connect to**: `127.0.0.1:22005`
4. **Server Name**: "GangGPT - AI-Powered Roleplay Server"

## 🎮 What You'll See

### In RAGE:MP Server Console:
- ✅ GangGPT package loading
- ✅ Backend integration active
- ✅ AI services connected
- ✅ Player join/leave events

### In GTA V:
- 🌍 Los Santos world with AI NPCs
- 🤖 AI companions responding to your actions
- 🏢 Dynamic faction territories
- 💰 AI-driven economy system
- 📱 In-game interface for AI interactions

## 🚀 Backend Status
✅ **Backend**: Running on http://localhost:4828  
✅ **Frontend**: Running on http://localhost:4829  
✅ **Database**: Connected (PostgreSQL)  
✅ **Cache**: Connected (Redis)  
✅ **AI**: Azure OpenAI GPT-4o-mini ready  

## 🔧 If You Need Help
- **Check logs**: RAGE:MP server console shows GangGPT loading
- **Backend health**: http://localhost:4828/health
- **Frontend dashboard**: http://localhost:4829
- **API stats**: http://localhost:4828/api/stats

---
🎯 **Result**: You'll have a fully functional AI-powered GTA V server running with real AI companions, dynamic missions, and intelligent NPCs!
