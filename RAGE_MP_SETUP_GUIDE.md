# 🎮 GangGPT RAGE:MP Server Setup Guide

This guide will help you set up and run GangGPT as a live RAGE:MP server with real GTA V integration.

## 📋 Prerequisites

### Required Software
- **RAGE:MP Server** (latest version)
- **GTA V** (legitimate copy)
- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** 6+

### API Access
- **Azure OpenAI** API key with GPT-4o-mini access
- Valid database connection string

## 🔧 Installation Steps

### 1. Download GangGPT
```bash
git clone https://github.com/yourusername/gang-gpt-gta-v.git
cd gang-gpt-gta-v
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb ganggpt

# Configure environment
cp .env.example .env
# Edit .env with your database and API credentials

# Run migrations
npm run db:generate
npm run db:migrate
```

### 3. RAGE:MP Integration
```bash
# Copy client files to your RAGE:MP server
cp -r client_packages/* /path/to/ragemp/client_packages/

# Copy server package
cp -r packages/ganggpt /path/to/ragemp/packages/

# Merge configuration (or add to existing conf.json)
cat conf.json >> /path/to/ragemp/conf.json
```

### 4. Start Services
```bash
# Terminal 1: Start GangGPT backend
npm run dev

# Terminal 2: Start RAGE:MP server
cd /path/to/ragemp
./ragemp-server
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ganggpt"

# Redis
REDIS_URL="redis://localhost:6379"

# Azure OpenAI
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_ENDPOINT="https://your-endpoint.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini"

# Server
PORT=22005
NODE_ENV="production"
```

### RAGE:MP Configuration (conf.json)
```json
{
  "name": "GangGPT - AI-Powered Los Santos",
  "gamemode": "freeroam",
  "maxplayers": 100,
  "packages": [
    "ganggpt"
  ],
  "announce": true,
  "token": "your-server-token"
}
```

## 🎮 Testing the Setup

### 1. Verify Backend
Visit `http://localhost:22005/health` - should return:
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "ai": "ready",
    "redis": "connected"
  }
}
```

### 2. Connect with GTA V
1. Start GTA V
2. Open RAGE:MP client
3. Connect to your server IP
4. Test in-game commands:
   - `/ai hello` - Test AI interaction
   - `/stats` - Check player stats
   - `/help` - View available commands

### 3. Verify AI Features
- **Chat with NPCs**: NPCs should respond to proximity and chat
- **Dynamic Missions**: Check `/missions` for AI-generated tasks
- **Faction Activities**: Join a faction and test territory control
- **Economy**: Buy/sell items and watch dynamic pricing

## 🛡️ Security Checklist

- [ ] Change default database passwords
- [ ] Secure Azure OpenAI API keys
- [ ] Enable firewall rules for required ports
- [ ] Set up SSL certificates for production
- [ ] Configure rate limiting for API endpoints
- [ ] Enable logging and monitoring

## 📊 Monitoring

### Health Endpoints
- **Backend Health**: `http://localhost:22005/health`
- **Player Stats**: `http://localhost:22005/api/stats`
- **Server Info**: `http://localhost:22005/api/server/info`

### Log Files
- **Backend Logs**: `logs/ganggpt.log`
- **RAGE:MP Logs**: `server_log.txt`
- **Error Logs**: `logs/error.log`

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check database connection
npm run db:status

# Verify environment variables
npm run config:check

# Check logs
tail -f logs/ganggpt.log
```

#### RAGE:MP Package Not Loading
```bash
# Verify file paths
ls -la packages/ganggpt/

# Check RAGE:MP console for errors
# Ensure conf.json includes "ganggpt" in packages array
```

#### AI Features Not Working
```bash
# Test AI API directly
curl -X POST http://localhost:22005/api/ai/demo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Check Azure OpenAI credentials
# Verify rate limits aren't exceeded
```

#### Database Connection Issues
```bash
# Test connection
psql -h localhost -U username -d ganggpt

# Check if migrations ran
npm run db:status

# Reset database if needed
npm run db:reset
```

## 🎯 Performance Optimization

### Server Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ for 50+ players
- **Storage**: SSD recommended
- **Network**: 100Mbps+ upload

### Scaling Tips
- Use Redis clustering for high load
- Implement database read replicas
- Enable CDN for static assets
- Monitor AI API usage and costs

## 🔄 Updates

### Updating GangGPT
```bash
# Backup database
pg_dump ganggpt > backup.sql

# Pull latest changes
git pull origin main
npm install

# Run migrations
npm run db:migrate

# Restart services
npm run restart
```

## 🆘 Support

### Getting Help
- **Documentation**: `/docs` folder
- **Logs**: Check console and log files
- **Community**: Join our Discord server
- **Issues**: GitHub Issues page

### Reporting Bugs
Include:
- Server specifications
- Player count when issue occurred
- Relevant log entries
- Steps to reproduce

---

🎮 **Welcome to the AI-powered streets of Los Santos!**

Your RAGE:MP server is now ready to provide players with an immersive, AI-driven GTA V experience unlike anything they've seen before.
