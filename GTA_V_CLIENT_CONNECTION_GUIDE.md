# 🎮 GTA V Client Connection Guide for GangGPT Testing

## 📋 Prerequisites

### ✅ Current Status (Confirmed Working):
- 🟢 **RAGE:MP Server:** Running on `127.0.0.1:22005`
- 🟢 **GangGPT Backend:** Running on `http://localhost:4828`
- 🟢 **AI Package:** Loaded and active
- 🟢 **Server Name:** "GangGPT - AI-Powered Roleplay Server"

### 🎯 Required Software:
1. **Grand Theft Auto V** (Steam/Epic/Rockstar version)
2. **RAGE:MP Client** (Download from https://rage.mp/)
3. **GTA V must be updated** to the latest version

---

## 🚀 Step-by-Step Connection Process

### Step 1: Install RAGE:MP Client
1. Download RAGE:MP from https://rage.mp/
2. Install it (typically to `C:\RAGEMP\`)
3. Make sure GTA V is closed before installation

### Step 2: Launch RAGE:MP
1. **Close GTA V completely** (important!)
2. Run **RAGE:MP** as Administrator
3. Wait for the RAGE:MP launcher to load

### Step 3: Connect to GangGPT Server
1. In RAGE:MP launcher, click **"Direct Connect"** or **"Add Server"**
2. Enter server details:
   - **IP:** `127.0.0.1`
   - **Port:** `22005`
   - **Name:** `GangGPT Local Test`
3. Click **"Connect"** or **"Join"**

### Step 4: Character Creation
1. GTA V will launch automatically through RAGE:MP
2. Wait for the game to load completely
3. Create your character when prompted
4. Choose spawn location (usually Los Santos)

---

## 🤖 Testing GangGPT AI Features

### Basic Commands to Test:
Once you're in-game, open chat (T key) and try these commands:

#### 🆘 Help & Information:
```
/help          - Show all available commands
/ganggpt       - About the AI system
/status        - Server status and player count
```

#### 🤖 AI Interaction Commands:
```
/ai Hello!                    - Basic AI greeting
/ask What can you do?         - Ask about AI capabilities
/ai Tell me about Los Santos  - Ask about the game world
/ask How do I make money?     - Gameplay questions
/ai What are factions?        - Ask about server features
```

#### 📝 Example Conversations:
```
/ai Hello, I'm new here. What should I do first?
/ask Where can I find a job in the city?
/ai How do I join a faction or gang?
/ask What's the best way to earn money legally?
/ai Tell me about the police system
/ask Where can I buy a car?
```

---

## 🎯 Expected AI Responses

The AI should provide contextual responses about:
- **🏙️ Los Santos locations and activities**
- **💰 Money-making opportunities (legal/illegal)**
- **🏢 Factions and gang information**
- **🚗 Vehicle purchasing and mechanics**
- **👮 Police and law enforcement**
- **🏠 Property and real estate**
- **🎭 Roleplay guidance and tips**

---

## 🔧 Troubleshooting

### Common Issues:

#### ❌ Can't Connect to Server:
- Verify RAGE:MP server is running (`127.0.0.1:22005`)
- Check Windows Firewall settings
- Try restarting RAGE:MP client
- Ensure GTA V is completely closed before launching RAGE:MP

#### ❌ Server Shows as Offline:
- Check if the RAGE:MP server process is running
- Verify port `22005` is not blocked
- Restart the server: `cd E:\GitHub\diamondrp && .\ragemp-server.exe`

#### ❌ AI Commands Not Working:
- Type exactly: `/ai Hello` or `/ask Question?`
- Make sure you're using the in-game chat (T key)
- Check server console for any error messages

#### ❌ Character Creation Issues:
- Wait for full game load before creating character
- Try different spawn locations if one doesn't work
- Restart RAGE:MP client if stuck on loading screen

---

## 📊 Testing Checklist

### ✅ Connection Test:
- [ ] RAGE:MP client launches successfully
- [ ] Can connect to `127.0.0.1:22005`
- [ ] Server shows as "GangGPT - AI-Powered Roleplay Server"
- [ ] Character creation works
- [ ] Successfully spawn in Los Santos

### ✅ AI Functionality Test:
- [ ] `/help` command shows GangGPT commands
- [ ] `/ai Hello` gets an AI response
- [ ] `/ask What can you do?` provides capabilities info
- [ ] AI responds with context about Los Santos
- [ ] Multiple AI interactions work consecutively
- [ ] AI provides roleplay-appropriate responses

### ✅ Advanced Feature Test:
- [ ] AI gives faction/gang information
- [ ] AI provides money-making advice
- [ ] AI explains server mechanics
- [ ] Responses are contextual and intelligent
- [ ] AI maintains conversation flow

---

## 🎮 Live Testing Scenarios

### Scenario 1: New Player Experience
```
1. Connect to server
2. Create character  
3. Type: /ai I'm new to this server, what should I do?
4. Follow AI's suggestions
5. Ask follow-up questions about recommended activities
```

### Scenario 2: Roleplay Guidance
```
1. Type: /ask How do I roleplay properly on this server?
2. Ask about faction systems: /ai Tell me about gangs and factions
3. Get money advice: /ask What's the best way to make money here?
4. Vehicle info: /ai Where can I buy a car?
```

### Scenario 3: AI Conversation Flow
```
1. Start: /ai Hello, who are you?
2. Continue: /ask What makes this server special?
3. Deep dive: /ai Tell me about the AI features
4. Practical: /ask How can the AI help me in the game?
```

---

## 🚨 Emergency Commands

If anything goes wrong during testing:

### Server Management:
```bash
# Stop RAGE:MP server
taskkill /f /im ragemp-server.exe

# Restart server
cd E:\GitHub\diamondrp && .\ragemp-server.exe
```

### Check Backend Status:
```bash
# Check if backend is running
netstat -an | findstr 4828

# Test backend health
curl http://localhost:4828/health
```

---

## 📝 Testing Notes Template

Keep track of your testing with this template:

```
## GangGPT Live Test Session - [Date/Time]

### Connection:
- [ ] RAGE:MP connected successfully
- [ ] Character creation: [Success/Issues]
- [ ] Spawn location: [Location]

### AI Commands Tested:
- [ ] /help - Response: [Notes]
- [ ] /ai Hello - Response: [Notes]  
- [ ] /ask capabilities - Response: [Notes]
- [ ] [Other commands] - Response: [Notes]

### AI Quality Assessment:
- Response relevance: [1-10]
- Roleplay appropriateness: [1-10]
- Information accuracy: [1-10]
- Conversation flow: [1-10]

### Issues Found:
- [List any bugs, errors, or improvements needed]

### Suggestions:
- [Ideas for AI improvement or new features]
```

---

## 🎉 Success Criteria

The test is successful if:
1. ✅ **Connection works** - Can join server smoothly
2. ✅ **AI responds** - All AI commands work as expected  
3. ✅ **Quality responses** - AI provides helpful, contextual information
4. ✅ **Roleplay ready** - Server feels immersive and AI-enhanced
5. ✅ **Stable operation** - No crashes or major issues

---

Ready to test? Let's get you connected to the GangGPT server! 🚀
