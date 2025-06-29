# 🎮 GangGPT - AI-Powered GTA V Multiplayer Server Documentation

## Overview

GangGPT is an innovative AI-powered Grand Theft Auto V multiplayer server built on RAGE:MP, transforming traditional roleplay into an immersive, procedurally-generated experience. The project combines advanced AI systems with modern web technologies to create a living, breathing virtual world.

## Documentation Structure

- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Complete setup and development workflow
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment and configuration
- **[Testing Guide](TESTING_GUIDE.md)** - All testing procedures and validation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Connection issues and common problems
- **[API Reference](API_REFERENCE.md)** - API documentation and endpoints

## Quick Start

```bash
# Clone and setup
git clone https://github.com/dragoscv/gang-gpt-gta-v.git
cd gang-gpt-gta-v
pnpm install

# Start development environment
pnpm run dev:all
```

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: RAGE:MP (Grand Theft Auto V multiplayer mod)
- **AI Integration**: Azure OpenAI GPT-4o-mini
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session and temporary data
- **Authentication**: JWT with bcrypt hashing
- **Real-time**: Socket.IO for live updates

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Headless UI and Radix UI
- **State Management**: Zustand with persistence
- **API Layer**: tRPC for type-safe APIs

## Project Status

✅ **Core Infrastructure Complete**
- Backend API with tRPC integration
- Frontend web application
- RAGE:MP server integration
- Redis caching system
- PostgreSQL database with Prisma

✅ **AI Systems Operational**
- Azure OpenAI integration
- AI-powered NPC interactions
- Dynamic mission generation
- Faction AI behavior

✅ **Development Environment Ready**
- Docker containerization
- Development scripts and tasks
- Testing framework setup
- VS Code integration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   RAGE:MP       │
│   (Next.js)     │◄──►│   (Node.js/TS)  │◄──►│   Server        │
│   Port: 4829    │    │   Port: 4828    │    │   Port: 22005   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   Database      │              │
         │              └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │   Redis Cache   │
                        │   & Sessions    │
                        └─────────────────┘
```

## Key Features

### 🤖 AI-Powered Systems
- **Intelligent NPCs**: Context-aware AI companions with persistent memory
- **Dynamic Missions**: Procedurally generated missions based on faction dynamics
- **Faction AI**: Autonomous faction behavior and territory control
- **Player Analytics**: AI-driven player behavior analysis

### 🌐 Real-time Features
- **Live Events**: Real-time faction wars and territory changes
- **Player Tracking**: Live player positions and activities
- **Chat System**: In-game chat with AI moderation
- **World State**: Dynamic world events and environmental changes

### 🛡️ Security & Performance
- **Authentication**: JWT-based secure authentication
- **Rate Limiting**: API protection against abuse
- **Monitoring**: Comprehensive logging and metrics
- **Scalability**: Designed for 1000+ concurrent players

## Getting Help

- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Join community discussions
- **Wiki**: Detailed documentation and guides
- **Discord**: Real-time community support

## Contributing

Please read our [Development Guide](DEVELOPMENT_GUIDE.md) for information on our development process, coding standards, and how to submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚀 Development Workflow

### Quick Start

```powershell
# Start complete development environment
.\scripts\dev.ps1 -Mode start -Services all

# Start with watch mode for auto-restart on changes
.\scripts\dev.ps1 -Mode watch -Services all

# Start only specific services
.\scripts\dev.ps1 -Mode start -Services backend,frontend
.\scripts\dev.ps1 -Mode start -Services ragemp
```

### Unified Development Scripts

The project uses three main PowerShell scripts for consistent development experience:

#### `scripts/dev.ps1` - Development Environment Manager
Comprehensive development environment management with the following modes and services:

**Modes:**
- `start` - Start services
- `stop` - Stop services  
- `restart` - Restart services
- `watch` - Start with file watching and auto-restart
- `status` - Check service status

**Services:**
- `all` - All services (default)
- `backend` - Node.js backend API
- `frontend` - Next.js web application
- `ragemp` - RAGE:MP game server
- `redis` - Redis cache server
- `database` - PostgreSQL database

**Examples:**
```powershell
# Start all services in development mode
.\scripts\dev.ps1 -Mode start -Services all -Verbose

# Watch mode for backend and frontend only
.\scripts\dev.ps1 -Mode watch -Services backend,frontend

# Check status of all services
.\scripts\dev.ps1 -Mode status

# Stop specific services
.\scripts\dev.ps1 -Mode stop -Services ragemp,redis
```

#### `scripts/test.ps1` - Unified Testing Manager
Comprehensive testing with multiple modes and environments:

**Modes:**
- `unit` - Run unit tests with Jest/Vitest
- `integration` - Run integration tests
- `e2e` - Run end-to-end tests with Playwright
- `watch` - Run tests in watch mode
- `coverage` - Generate test coverage reports

**Examples:**
```powershell
# Run all unit tests
.\scripts\test.ps1 -Mode unit -Verbose

# Run integration tests for staging environment
.\scripts\test.ps1 -Mode integration -Environment staging

# Run e2e tests with specific browser
.\scripts\test.ps1 -Mode e2e -Browser chromium

# Watch mode for test development
.\scripts\test.ps1 -Mode watch

# Generate coverage report with threshold
.\scripts\test.ps1 -Mode coverage -Threshold 80
```

#### `scripts/deploy.ps1` - Deployment Manager
Production-ready deployment with comprehensive validation:

**Environments:**
- `development` - Local development
- `staging` - Staging environment
- `production` - Production deployment

**Modes:**
- `deploy` - Deploy to environment
- `validate` - Validate environment configuration
- `rollback` - Rollback deployment
- `status` - Check deployment status

**Examples:**
```powershell
# Deploy to staging
.\scripts\deploy.ps1 -Environment staging -Mode deploy

# Validate production environment
.\scripts\deploy.ps1 -Environment production -Mode validate

# Deploy to production (requires confirmation)
.\scripts\deploy.ps1 -Environment production -Mode deploy

# Emergency rollback
.\scripts\deploy.ps1 -Environment production -Mode rollback -Force
```

### VS Code Integration

Use VS Code tasks for one-click development (Ctrl+Shift+P > "Tasks: Run Task"):

- **GangGPT: Start All Services** - Start complete development environment
- **GangGPT: Start Watch Mode (All Services)** - Watch mode with auto-restart
- **GangGPT: Watch Backend Only** - Backend development focus
- **GangGPT: Watch Frontend Only** - Frontend development focus
- **GangGPT: Run Tests** - Execute test suite
- **GangGPT: Check Services Status** - Monitor service health
