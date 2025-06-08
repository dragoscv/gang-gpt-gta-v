# 🎮 GangGPT RAGE:MP Live Testing Guide

**Date:** June 8, 2025  
**Status:** Ready for Live Testing  
**Prerequisites:** RAGE:MP Installed, GTA V Available

---

## 🔧 Setup Phase

### 1. Build and Prepare Backend
```bash
# Build the TypeScript backend
pnpm build

# Start the Node.js backend (port 4828)
pnpm dev

# In another terminal, start frontend (port 4829)
cd web && pnpm dev
```

### 2. Configure RAGE:MP Server
- ✅ **Server Config**: `conf.json` configured for 1000 players
- ✅ **Server Name**: "GangGPT - AI-Powered Roleplay Server"
- ✅ **Port**: 22005 (default RAGE:MP)
- ✅ **Client Packages**: Located in `client_packages/`
- ✅ **Server Package**: Located in `packages/ganggpt/`

### 3. Start RAGE:MP Server
```bash
# In the GangGPT project root directory
# Start RAGE:MP server (this will load our packages)
rage-mp-server.exe
```

---

## 🚀 Testing Phases

### Phase 1: Server Startup Verification
**Test:** Server boots without errors
- [ ] RAGE:MP server starts successfully
- [ ] GangGPT package loads (`packages/ganggpt/index.js`)
- [ ] Backend services connect (database, Redis, AI)
- [ ] No console errors or crashes

**Expected Output:**
```
🎮 Loading GangGPT RAGE:MP Package...
✅ GangGPT RAGE:MP Package loaded successfully
✅ Backend services connected
✅ AI systems ready
```

### Phase 2: Client Connection
**Test:** GTA V client connects to server
- [ ] Open GTA V with RAGE:MP
- [ ] Connect to `localhost:22005`
- [ ] Character creation/selection works
- [ ] Client-side scripts load properly

**Expected Behavior:**
- Welcome message appears in chat: "Welcome to GangGPT - AI-Powered Roleplay Server!"
- Help command available: `/help`
- Player data syncs with backend

### Phase 3: Basic AI Systems
**Test:** Core AI functionality
- [ ] **AI Companions**: Test `/ai talk` command
- [ ] **NPC Interactions**: Approach NPCs for conversations
- [ ] **Dynamic Responses**: AI responds contextually to player actions
- [ ] **Memory System**: NPCs remember previous interactions

**Test Commands:**
```
/ai talk Hello, what can you tell me about this city?
/npc approach
/help ai
```

### Phase 4: Faction Systems
**Test:** AI-driven faction dynamics
- [ ] **Join Faction**: Use `/faction join [name]` 
- [ ] **Faction Wars**: Test territory conflicts
- [ ] **AI Faction Leaders**: Interact with AI-controlled faction bosses
- [ ] **Dynamic Events**: Faction-based missions and conflicts

**Test Scenarios:**
1. Join "Los Santos Bloods" faction
2. Attempt to enter rival territory
3. Participate in faction mission
4. Test faction loyalty system

### Phase 5: Economy & Missions
**Test:** AI-generated economic gameplay
- [ ] **Dynamic Missions**: AI creates missions based on city state
- [ ] **Economy Simulation**: Prices change based on supply/demand
- [ ] **Business Operations**: Test drug dealing, vehicle theft, etc.
- [ ] **Risk/Reward Systems**: Higher risk = higher rewards

**Test Commands:**
```
/mission request
/economy status
/business start drugdealing
/stats money
```

### Phase 6: Advanced AI Features
**Test:** Cutting-edge AI capabilities
- [ ] **Procedural Storytelling**: Long-term narrative arcs
- [ ] **Player Adaptation**: AI learns from player behavior
- [ ] **World Events**: AI triggers server-wide events
- [ ] **Social Dynamics**: AI manages player relationships

---

## 🧪 Detailed Test Scenarios

### Scenario 1: New Player Experience
1. **Join Server** → Character creation
2. **First Steps** → Tutorial with AI guide
3. **Meet NPCs** → Introduction to faction representatives
4. **Choose Path** → Select faction or independent route
5. **First Mission** → AI-generated starter mission

### Scenario 2: Faction War Simulation
1. **Setup** → Two players join opposing factions
2. **Territory** → Test territory control mechanics
3. **Conflict** → Trigger faction war event
4. **AI Response** → NPCs react to ongoing conflict
5. **Resolution** → War ends with consequences

### Scenario 3: Economic Ecosystem Test
1. **Market Setup** → AI initializes drug markets
2. **Supply Chain** → Test drug production/distribution
3. **Competition** → Multiple players compete for territory
4. **Price Dynamics** → Verify AI adjusts prices realistically
5. **Law Enforcement** → AI police respond to illegal activity

### Scenario 4: Long-term Gameplay
1. **Character Development** → Progress over multiple sessions
2. **Reputation System** → Build relationships with NPCs
3. **Story Continuity** → AI remembers player history
4. **World Evolution** → City changes based on player actions
5. **Endgame Content** → High-level faction leadership

---

## 📊 Success Criteria

### ✅ Technical Performance
- [ ] Server runs stable for 30+ minutes
- [ ] No memory leaks or crashes
- [ ] Smooth client-server communication
- [ ] AI response times < 2 seconds

### ✅ Gameplay Quality
- [ ] AI responses feel natural and contextual
- [ ] Faction dynamics create engaging conflicts
- [ ] Economy system affects gameplay meaningfully
- [ ] Player actions have visible consequences

### ✅ Immersion Factors
- [ ] NPCs behave realistically
- [ ] World feels alive and dynamic
- [ ] Player choices matter
- [ ] Storytelling is compelling

---

## 🐛 Issue Tracking

### Common Issues to Watch For
- **Memory Usage**: Monitor for memory leaks in AI systems
- **Database Connections**: Ensure stable database connectivity
- **AI Rate Limits**: Watch for Azure OpenAI quota issues
- **Sync Issues**: Client-server state synchronization
- **Performance**: Frame drops or server lag

### Debug Commands
```bash
# Monitor server logs
tail -f logs/ganggpt-server.log

# Check AI service status
curl http://localhost:4828/api/health

# Database connection test
curl http://localhost:4828/api/admin/db-status
```

---

## 🎯 Expected Outcomes

After successful testing, we should have:
1. **Verified Production Readiness**: Confirm all systems work in real environment
2. **Performance Baseline**: Establish performance metrics for optimization
3. **Bug Documentation**: List of any issues found for fixing
4. **Player Experience Validation**: Confirm AI systems create engaging gameplay
5. **Scalability Insights**: Understand server capacity and limitations

---

## 🚀 Next Steps After Testing

1. **Address Issues**: Fix any bugs or performance problems found
2. **Optimize Performance**: Tune AI response times and server performance
3. **Content Expansion**: Add more AI scenarios and faction complexity
4. **Public Testing**: Open server to external testers
5. **Production Deployment**: Launch on cloud infrastructure

---

**Ready to start testing? Let's make GangGPT come alive in GTA V! 🎮**
