# 🧠 GangGPT Project Memory Guide

This document provides instructions for accessing and updating project memory using the Memory MCP Server.

## 📋 How to Check Project Status

### Quick Status Check
```typescript
// Use this command to get current project status
mcp_memorymcpserv_open_nodes(["GangGPT_Project_Status"])
```

### Technical Architecture Review
```typescript
// Get infrastructure and technical details
mcp_memorymcpserv_open_nodes(["GangGPT_Infrastructure"])
```

### Action Items and Remaining Tasks
```typescript
// Check what needs to be done next
mcp_memorymcpserv_open_nodes(["GangGPT_Remaining_Tasks"])
```

### Key Files and Structure
```typescript
// Get important file locations and structure
mcp_memorymcpserv_open_nodes(["GangGPT_Key_Files"])
```

### Recent Changes History
```typescript
// Review recent technical fixes and changes
mcp_memorymcpserv_open_nodes(["GangGPT_Recent_Fixes"])
```

## 🔍 Search Project Memory

### Search for Specific Topics
```typescript
// Search across all stored knowledge
mcp_memorymcpserv_search_nodes("production readiness")
mcp_memorymcpserv_search_nodes("Redis authentication")
mcp_memorymcpserv_search_nodes("health checks")
```

## 📝 Update Project Memory

### Add New Observations
```typescript
// Add new progress to existing entities
mcp_memorymcpserv_add_observations([
  {
    entityName: "GangGPT_Project_Status",
    contents: ["New milestone achieved", "Additional progress made"]
  }
])
```

### Create New Memory Entities
```typescript
// Create new memory categories as needed
mcp_memorymcpserv_create_entities([
  {
    name: "New_Category_Name",
    entityType: "category_type",
    observations: ["Observation 1", "Observation 2"]
  }
])
```

## 🎯 Current Project State (as of June 6, 2025)

### ✅ Achievements
- **92% production readiness** achieved
- All core services healthy (PostgreSQL, Redis, Azure OpenAI)
- Performance: 1.2ms API response times
- Frontend fully operational
- Docker infrastructure running smoothly

### 🎯 Next Steps (8% remaining)
- Production environment deployment
- SSL/TLS configuration
- Load testing (1000+ users)
- Security audit
- CI/CD finalization

### 🔧 Key Technical Details
- Redis password: `redis_dev_password`
- Health status: All services "healthy"
- Docker containers: `ganggpt-redis`, `ganggpt-postgres`
- Test results: 12/13 passed (92% success rate)

## 🚀 Quick Commands for Development

### Check Current Status
```bash
# Run production readiness test
node scripts/test-production-readiness.js

# Check health status
curl http://localhost:22005/health

# View Docker containers
docker ps
```

### Start Development Environment
```bash
# Start infrastructure
docker-compose up -d postgres redis

# Start backend
pnpm dev

# Start frontend (in separate terminal)
cd web && pnpm dev
```

---
*This memory system helps maintain context across development sessions and team collaboration.*
