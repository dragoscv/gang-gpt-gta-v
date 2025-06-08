# GangGPT Development Guide

## Quick Start

### 🚀 One-Command Setup
```bash
# Start all services (Redis, Backend, Frontend)
pnpm run dev:all
```

### 🎮 VS Code Tasks
Use `Ctrl+Shift+P` and run:
- **GangGPT: Start All Services** - Complete development environment
- **GangGPT: Start Backend Only** - Backend server only
- **GangGPT: Start Frontend Only** - Frontend server only
- **GangGPT: Start RAGE:MP Server** - Game server only

## Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Backend** | 4828 | http://localhost:4828 | API server, AI systems |
| **Frontend** | 4829 | http://localhost:4829 | Web dashboard |
| **Redis** | 4832 | localhost:4832 | Cache and sessions |
| **RAGE:MP** | 22005 | 127.0.0.1:22005 | Game server |

## Development Workflow

### 1. Environment Setup
```bash
# Test environment readiness
pwsh scripts/test-dev-environment.ps1

# Start all services
pnpm run dev:all
```

### 2. Backend Development
```bash
# Backend only with hot reload
pnpm run dev

# Build project
pnpm build

# Run tests
pnpm test
```

### 3. Frontend Development
```bash
cd web
pnpm run dev
```

### 4. RAGE:MP Development
```bash
cd ragemp-server
./ragemp-server.exe
```

## Services Status

### ✅ Backend Health Check
```bash
curl http://localhost:4828/health
```

### ✅ Redis Connection
```bash
redis-windows/redis-cli.exe -p 4832 -a redis_dev_password ping
```

### ✅ Frontend Access
```bash
curl http://localhost:4829
```

## Configuration

### Environment Variables (.env)
- `DATABASE_URL` - SQLite database path
- `REDIS_URL` - Redis connection string
- `AZURE_OPENAI_*` - AI service configuration
- `JWT_SECRET` - Authentication secrets

### RAGE:MP Configuration (ragemp-server/conf.json)
- `port`: 22005
- `maxplayers`: 1000
- `name`: "GangGPT - AI-Powered Roleplay Server"

## Troubleshooting

### Redis Issues
```bash
# Check Redis process
Get-Process redis-server

# Start Redis manually
redis-windows/redis-server.exe redis-windows/ganggpt-redis.conf
```

### Build Issues
```bash
# Clean build
pnpm run clean:build && pnpm build

# Full reset
pnpm run clean:all
```

### RAGE:MP Issues
- Ensure `ragemp-server.exe` exists in `ragemp-server/` directory
- Check `packages/ganggpt/index.js` has content
- Verify backend is running before starting RAGE:MP

## Features Available

### 🤖 AI Systems
- GPT-4o-mini integration
- Dynamic NPC behavior
- Intelligent mission generation
- Faction AI decision making

### 🎮 Game Integration
- Real-time player tracking
- Chat system integration
- Economy simulation
- Territory management

### 🌐 Web Dashboard
- Real-time statistics
- Player management
- AI configuration
- System monitoring

## Production Deployment

### Docker
```bash
pnpm run docker:build
pnpm run docker:run
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm run test:e2e
```

### Live RAGE:MP Testing
1. Run `pnpm run dev:all`
2. Start RAGE:MP server
3. Connect GTA V client to `127.0.0.1:22005`
4. Test AI commands: `/ai`, `/ask`

## Support

- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Development**: This guide

---

## Quick Commands Reference

```bash
# Start everything
pnpm run dev:all

# Individual services
pnpm run dev          # Backend
cd web && pnpm run dev # Frontend

# Testing
pwsh scripts/test-dev-environment.ps1  # Environment test
pnpm test                              # Unit tests
pnpm run test:e2e                      # E2E tests

# Utilities
pnpm build            # Build project
pnpm run clean:all    # Full reset
pnpm run db:studio    # Database browser
```
