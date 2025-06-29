# 🔧 Troubleshooting Guide

## Overview

This guide covers common issues, connection problems, and troubleshooting steps for the GangGPT server and client connections.

## 🚨 Common Issues

### RAGE:MP Server Issues

#### Server Won't Start
**Symptoms**: Server process exits immediately or fails to bind to port

**Solutions**:
1. **Check port availability**:
   ```powershell
   netstat -an | findstr :22005
   ```

2. **Verify configuration**:
   ```bash
   # Check ragemp-server/conf.json
   cat ragemp-server/conf.json
   ```

3. **Check required files**:
   ```powershell
   # Verify loader files exist
   ls bin/loader.mjs, bin/bt.dat, bin/enc.dat
   ```

4. **Run with elevated permissions**:
   ```powershell
   # Start PowerShell as Administrator
   .\start-ragemp-server.ps1
   ```

#### Server Crashes on Startup
**Symptoms**: Server starts but crashes after loading packages

**Solutions**:
1. **Check package dependencies**:
   ```bash
   # Verify ganggpt package exists
   ls ragemp-server/packages/ganggpt/
   ```

2. **Verify Node.js modules**:
   ```bash
   cd ragemp-server/packages/ganggpt
   npm install
   ```

3. **Check server logs**:
   ```powershell
   Get-Content ragemp-server/logs/error.log -Tail 50
   ```

### Connection Issues

#### Client Can't Connect to Server
**Symptoms**: RAGE:MP client shows "Connection timeout" or "Server not found"

**Solutions**:
1. **Verify server is running**:
   ```powershell
   # Check if server process is active
   Get-Process | Where-Object {$_.ProcessName -like "*ragemp*"}
   ```

2. **Check port binding**:
   ```powershell
   netstat -an | findstr :22005
   ```

3. **Test connectivity**:
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 22005
   ```

4. **Firewall configuration**:
   ```powershell
   # Add firewall rules
   New-NetFirewallRule -DisplayName "RAGE:MP Server" -Direction Inbound -Protocol TCP -LocalPort 22005 -Action Allow
   New-NetFirewallRule -DisplayName "RAGE:MP Client" -Direction Outbound -Protocol TCP -LocalPort 22005 -Action Allow
   ```

#### Rockstar Games Services Issues
**Symptoms**: Can't authenticate with Rockstar or "Rockstar Services Unavailable"

**Solutions**:
1. **Clear Rockstar cache**:
   ```powershell
   # Clear Rockstar Games Launcher cache
   Remove-Item -Path "$env:USERPROFILE\Documents\Rockstar Games\Launcher" -Recurse -Force
   Remove-Item -Path "$env:LOCALAPPDATA\Rockstar Games" -Recurse -Force
   ```

2. **Reset network configuration**:
   ```powershell
   # Reset network stack
   netsh winsock reset
   netsh int ip reset
   ipconfig /flushdns
   # Restart required
   ```

3. **Check DNS resolution**:
   ```powershell
   nslookup prod.cloud.rockstargames.com
   nslookup auth.rockstargames.com
   ```

### Database Connection Issues

#### PostgreSQL Connection Failed
**Symptoms**: "Database connection error" or "ECONNREFUSED"

**Solutions**:
1. **Verify PostgreSQL is running**:
   ```bash
   # Check if PostgreSQL service is active
   docker ps | grep postgres
   ```

2. **Check connection string**:
   ```bash
   # Verify DATABASE_URL in .env
   echo $DATABASE_URL
   ```

3. **Test database connection**:
   ```bash
   # Run Prisma introspection
   npx prisma db pull
   ```

### Redis Connection Issues

#### Redis Connection Failed
**Symptoms**: "Redis connection error" or cache operations failing

**Solutions**:
1. **Verify Redis is running**:
   ```bash
   # Check Redis service
   docker ps | grep redis
   ```

2. **Test Redis connection**:
   ```bash
   # Connect to Redis CLI
   redis-cli ping
   ```

3. **Check Redis configuration**:
   ```bash
   # Verify REDIS_URL in .env
   echo $REDIS_URL
   ```

### AI Service Issues

#### Azure OpenAI API Errors
**Symptoms**: "AI service unavailable" or API quota exceeded

**Solutions**:
1. **Verify API credentials**:
   ```bash
   # Check Azure OpenAI configuration
   echo $AZURE_OPENAI_ENDPOINT
   echo $AZURE_OPENAI_API_KEY
   ```

2. **Test API connectivity**:
   ```bash
   # Run AI service validation
   npm run validate:ai
   ```

3. **Check API quotas**:
   - Log into Azure Portal
   - Navigate to your OpenAI resource
   - Check usage and quotas

## 🛠️ Diagnostic Tools

### Automated Diagnostics

#### Health Check Script
```powershell
# Run comprehensive health check
.\scripts\check-services.ps1
```

#### Connection Test
```powershell
# Test all service connections
.\scripts\test-connections.ps1
```

### Manual Diagnostics

#### Check Service Status
```powershell
# Backend API
curl http://localhost:4828/health

# Frontend
curl http://localhost:4829

# RAGE:MP Server
Test-NetConnection -ComputerName 127.0.0.1 -Port 22005
```

#### View Logs
```powershell
# Application logs
Get-Content logs/combined.log -Tail 50

# Error logs
Get-Content logs/error.log -Tail 50

# RAGE:MP logs
Get-Content ragemp-server/logs/error.log -Tail 50
```

## 🚀 Quick Fixes

### Emergency Server Restart
```powershell
# Stop all services
.\scripts\stop-all-services.ps1

# Clean temporary files
Remove-Item -Path "*.aof", "*.rdb", "test-results.json" -Force

# Start services in order
.\scripts\start-dev-all.ps1
```

### Reset Development Environment
```powershell
# Clean and reinstall dependencies
pnpm clean:all
pnpm install

# Reset database
npx prisma migrate reset --force
npx prisma db push

# Restart all services
pnpm run dev:all
```

### Clear All Caches
```powershell
# Clear Redis
redis-cli FLUSHALL

# Clear Node.js cache
npm cache clean --force

# Clear browser cache (manual)
# Clear Rockstar Games cache (see above)
```

## 📞 Getting Help

### Before Seeking Help
1. ✅ Run automated diagnostics
2. ✅ Check service logs
3. ✅ Verify all services are running
4. ✅ Test with minimal configuration

### Support Channels
- **GitHub Issues**: Report bugs with full diagnostic output
- **Community Discord**: Real-time help from community
- **Documentation**: Check all guides for detailed solutions

### Providing Diagnostic Information
When reporting issues, include:
```powershell
# System information
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion

# Service status
.\scripts\check-services.ps1

# Recent logs
Get-Content logs/error.log -Tail 20
Get-Content ragemp-server/logs/error.log -Tail 20

# Network configuration
ipconfig /all
netstat -an | findstr :22005
```

## 🔍 Advanced Troubleshooting

### Performance Issues
- **High CPU Usage**: Check for infinite loops in AI processing
- **Memory Leaks**: Monitor Node.js heap usage
- **Slow Responses**: Analyze database query performance

### Security Issues
- **Authentication Failures**: Verify JWT secret configuration
- **API Rate Limiting**: Check rate limit settings
- **CORS Errors**: Verify allowed origins

### Development Issues
- **TypeScript Errors**: Run type checking: `npm run typecheck`
- **Build Failures**: Clear build cache: `npm run clean:build`
- **Test Failures**: Run individual test suites: `npm run test:unit`

Remember: When in doubt, restart services in the correct order: Database → Redis → Backend → Frontend → RAGE:MP Server.
