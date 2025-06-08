# GangGPT Unified Development Environment

## 🚀 Quick Start (One Command)

Start the complete development environment with a single command:

```bash
pnpm run dev:all
```

This will automatically start:
- ✅ Redis server (port 4832)
- ✅ Backend server (port 4828) 
- ✅ Frontend server (port 4829)
- 📋 Instructions for RAGE:MP server

## 📊 Status Check

Check the status of all services:

```bash
pnpm run dev:status
```

## 🎯 VS Code Tasks

Press `Ctrl+Shift+P` and type "Tasks: Run Task" to access:

- **GangGPT: Start All Services** - Runs the unified development environment
- **GangGPT: Start Backend Only** - Starts just the backend server
- **GangGPT: Start Frontend Only** - Starts just the frontend server
- **GangGPT: Start Redis** - Starts just Redis server
- **GangGPT: Check Services Status** - Checks all service statuses
- **GangGPT: Build Project** - Builds the entire project
- **GangGPT: Run Tests** - Executes the test suite

## 🌐 Service URLs

Once started, access the services at:

- **Frontend Dashboard**: http://localhost:4829
- **Backend API**: http://localhost:4828
- **Backend Health**: http://localhost:4828/health
- **Redis**: localhost:4832 (with authentication)

## 🎮 RAGE:MP Server

For live GTA V testing, start the RAGE:MP server manually:

1. Download RAGE:MP server from https://rage.mp/files/server/
2. Extract to `ragemp-server/` directory
3. Run: `cd ragemp-server && .\ragemp-server.exe`
4. Server will bind to: 127.0.0.1:22005

## ⚙️ Environment Configuration

The system uses these configuration files:
- `.env` - Environment variables with Redis credentials
- `redis-windows/ganggpt-redis.conf` - Redis configuration
- `package.json` - Development scripts
- `.vscode/tasks.json` - VS Code task definitions

## 🔧 Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
Get-Process -Name "redis-server"

# Start Redis manually if needed
redis-windows\redis-server.exe redis-windows\ganggpt-redis.conf
```

### Backend Issues
```bash
# Check backend health
curl http://localhost:4828/health

# Start backend manually
pnpm run dev
```

### Frontend Issues
```bash
# Start frontend manually
cd web && pnpm run dev
```

## 📋 Manual Service Management

If you prefer to start services individually:

```bash
# Start Redis
redis-windows\redis-server.exe redis-windows\ganggpt-redis.conf

# Start Backend (in new terminal)
pnpm run dev

# Start Frontend (in new terminal) 
cd web && pnpm run dev

# Start RAGE:MP (in new terminal)
cd ragemp-server && .\ragemp-server.exe
```

## 🏗️ Development Workflow

1. **First Time Setup**: `pnpm install && pnpm build`
2. **Daily Development**: `pnpm run dev:all`
3. **Status Check**: `pnpm run dev:status`
4. **Testing**: `pnpm test` or `pnpm run test:e2e`
5. **Live Gaming**: Manually start RAGE:MP server + connect GTA V client

## 📊 Service Health Status

The system monitors:
- ✅ Redis connection and authentication
- ✅ Database connectivity (PostgreSQL/SQLite)
- ✅ AI service configuration (Azure OpenAI)
- ✅ Backend API responsiveness
- ✅ Frontend server status
- ⚠️ RAGE:MP server status (manual start)

## 🎯 Production Ready

This development environment is:
- ✅ Self-contained with all dependencies
- ✅ Automated startup and monitoring
- ✅ Production-grade configuration
- ✅ Ready for live RAGE:MP + GTA V testing
- ✅ Fully documented and maintainable

## 🏆 Achievement

You now have a **world-class, unified development environment** that starts all GangGPT services with a single command, providing a seamless development experience for the most advanced AI-powered GTA V multiplayer server ever created!

---

*Last Updated: June 8, 2025 - Unified Development Environment Complete* ✅
