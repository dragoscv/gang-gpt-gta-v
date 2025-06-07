# 🏗️ Infrastructure Documentation

GangGPT's infrastructure is designed for scalability, reliability, and optimal
performance across development and production environments.

## 🎯 Overview

Our infrastructure leverages Google Cloud Platform for hosting, with Azure
OpenAI for AI services, ensuring global availability and enterprise-grade
reliability.

### Architecture Principles

- **Microservices** - Modular, independently deployable services
- **Containerization** - Docker containers for consistent environments
- **Auto-scaling** - Dynamic resource allocation based on demand
- **High Availability** - 99.9% uptime with failover mechanisms
- **Security First** - Zero-trust architecture with encryption everywhere

## 🌐 Environment Strategy

### Development Environment (`ganggpt-dev`)

```text
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Project                     │
│                      ganggpt-dev                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Compute       │    Storage      │      Services           │
│                 │                 │                         │
│ • GCE Instance  │ • Cloud SQL     │ • Firebase Auth         │
│   (e2-medium)   │   (PostgreSQL)  │ • Cloud Redis           │
│ • 2 vCPUs       │ • db-f1-micro   │ • Cloud Storage         │
│ • 4GB RAM       │ • 10GB SSD      │ • Cloud CDN             │
│ • Ubuntu 22.04  │                 │ • Cloud Monitoring      │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Production Environment (`ganggpt-prod`)

```text
┌─────────────────────────────────────────────────────────────┐
│                Google Cloud Project                         │
│                   ganggpt-prod                             │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Compute       │    Storage      │      Services           │
│                 │                 │                         │
│ • GKE Cluster   │ • Cloud SQL     │ • Firebase Auth         │
│   (3 nodes)     │   (PostgreSQL)  │ • Cloud Memorystore     │
│ • n1-standard-2 │ • db-n1-std-1   │ • Cloud Storage         │
│ • Auto-scaling  │ • 100GB SSD     │ • Cloud CDN             │
│ • Load Balancer │ • Read replicas │ • Cloud Monitoring      │
│                 │ • Automated     │ • Cloud Logging         │
│                 │   backups       │ • Cloud Security        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 🐳 Container Architecture

### Base Images

```dockerfile
# Production base image
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Development image
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 22005
CMD ["npm", "run", "dev"]

# Production image
FROM base AS production
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 22005
CMD ["npm", "start"]
```

### Service Containers

1. **Game Server** - Main RAGE:MP server
2. **AI Service** - Azure OpenAI integration
3. **Database Service** - PostgreSQL with connection pooling
4. **Redis Cache** - Session and memory storage
5. **Web Dashboard** - Administrative interface
6. **Monitoring** - Prometheus + Grafana

## 🚀 Deployment Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy GangGPT

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/setup-gcloud@v2
      - run: docker build -t gcr.io/$PROJECT_ID/ganggpt:$GITHUB_SHA .
      - run: docker push gcr.io/$PROJECT_ID/ganggpt:$GITHUB_SHA

  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: development
    steps:
      - run:
          gcloud compute instances update-container ganggpt-dev-vm
          --container-image gcr.io/$PROJECT_ID/ganggpt:$GITHUB_SHA

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run:
          kubectl set image deployment/ganggpt
          ganggpt=gcr.io/$PROJECT_ID/ganggpt:$GITHUB_SHA
```

### Deployment Strategies

- **Development** - Direct VM container updates
- **Production** - Rolling updates with zero downtime
- **Rollback** - Automatic rollback on health check failures
- **Blue-Green** - Future implementation for critical updates

## 📊 Database Architecture

### PostgreSQL Schema Design

```sql
-- Core player data
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    total_playtime INTERVAL DEFAULT '0 minutes'
);

-- NPC memory and state
CREATE TABLE npc_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npc_id VARCHAR(100) NOT NULL,
    player_id UUID REFERENCES players(id),
    memory_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    emotional_weight INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Faction relationships
CREATE TABLE faction_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_a VARCHAR(100) NOT NULL,
    faction_b VARCHAR(100) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    strength INTEGER CHECK (strength BETWEEN -100 AND 100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faction_a, faction_b)
);

-- Mission tracking
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    generated_by VARCHAR(50) DEFAULT 'ai',
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 10),
    estimated_duration INTERVAL,
    reward_pool INTEGER DEFAULT 0,
    faction_impact JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- AI companion data
CREATE TABLE companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    name VARCHAR(100) NOT NULL,
    companion_type VARCHAR(50) NOT NULL,
    personality JSONB NOT NULL,
    experience_points INTEGER DEFAULT 0,
    loyalty_level INTEGER DEFAULT 50,
    memory_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Performance

- **Connection Pooling** - PgBouncer for efficient connections
- **Read Replicas** - Separate read/write operations
- **Indexing Strategy** - Optimized indexes for common queries
- **Partitioning** - Time-based partitioning for large tables
- **Monitoring** - Real-time performance metrics

## 🔄 Caching Strategy

### Redis Configuration

```yaml
# Redis cluster configuration
redis:
  cluster:
    enabled: true
    nodes: 3
  memory:
    maxmemory: 2gb
    policy: allkeys-lru
  persistence:
    aof: true
    rdb: true
  security:
    auth: true
    tls: true
```

### Cache Layers

1. **L1 Cache** - In-memory application cache
2. **L2 Cache** - Redis cluster for shared data
3. **L3 Cache** - CDN for static assets
4. **Database Cache** - Query result caching

### Cache Keys Structure

```text
ganggpt:
├── player:{id}:profile
├── npc:{id}:memory
├── faction:{name}:state
├── mission:{id}:details
├── ai:response:{hash}
└── session:{id}:data
```

## 🔐 Security Implementation

### Network Security

```text
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Armor                              │
│                 (DDoS Protection)                           │
├─────────────────────────────────────────────────────────────┤
│                 Load Balancer                               │
│              (SSL Termination)                              │
├─────────────────────────────────────────────────────────────┤
│                  VPC Network                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Public    │  │   Private   │  │      Data           │  │
│  │   Subnet    │  │   Subnet    │  │     Subnet          │  │
│  │             │  │             │  │                     │  │
│  │ • Gateway   │  │ • App Nodes │  │ • Database          │  │
│  │ • CDN       │  │ • AI Services│  │ • Redis             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication & Authorization

```typescript
// JWT token structure
interface AuthToken {
  sub: string; // Player ID
  email: string; // Player email
  tier: SubscriptionTier; // Subscription level
  permissions: string[]; // Game permissions
  iat: number; // Issued at
  exp: number; // Expires at
}

// Permission system
enum Permission {
  PLAY_GAME = 'play:game',
  CREATE_FACTION = 'create:faction',
  ADMIN_COMMANDS = 'admin:commands',
  AI_PREMIUM = 'ai:premium',
  BETA_FEATURES = 'beta:features',
}
```

### Data Encryption

- **At Rest** - AES-256 encryption for all stored data
- **In Transit** - TLS 1.3 for all network communication
- **Application** - bcrypt for password hashing
- **API Keys** - Vault storage with rotation

## 📈 Monitoring & Observability

### Metrics Collection

```yaml
# Prometheus configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ganggpt-server'
    static_configs:
      - targets: ['localhost:22005']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'ganggpt-ai-service'
    static_configs:
      - targets: ['ai-service:3000']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Key Performance Indicators

```typescript
interface ServerMetrics {
  // Performance metrics
  playerCount: number;
  averageLatency: number;
  memoryUsage: number;
  cpuUsage: number;

  // AI metrics
  aiResponseTime: number;
  aiRequestCount: number;
  aiErrorRate: number;

  // Game metrics
  missionsGenerated: number;
  npcInteractions: number;
  factionEvents: number;

  // Business metrics
  subscriptionConversions: number;
  playerRetention: number;
  revenuePerUser: number;
}
```

### Alerting Rules

```yaml
groups:
  - name: ganggpt-alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High CPU usage detected'

      - alert: AIServiceDown
        expr: up{job="ganggpt-ai-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'AI service is down'

      - alert: DatabaseConnectionFailed
        expr: postgres_up == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: 'Database connection failed'
```

## 🔧 Configuration Management

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=22005
SERVER_NAME="GangGPT Server"
MAX_PLAYERS=128
TICKRATE=60

# Database
DATABASE_URL="postgresql://user:pass@db:5432/ganggpt"
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL="redis://redis:6379"
REDIS_PASSWORD="secure_password"
REDIS_TTL=3600

# Azure OpenAI
AZURE_OPENAI_ENDPOINT="https://ganggpt.openai.azure.com/"
AZURE_OPENAI_KEY="your_api_key"
AZURE_OPENAI_DEPLOYMENT="gpt-4-turbo"

# Google Cloud
GOOGLE_CLOUD_PROJECT="ganggpt-prod"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Security
JWT_SECRET="your_jwt_secret"
ENCRYPTION_KEY="your_encryption_key"
CORS_ORIGINS="https://ganggpt.com,https://admin.ganggpt.com"

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
LOG_LEVEL="info"
```

### Terraform Infrastructure

```hcl
# main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "ganggpt-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = "ganggpt-cluster"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }
}

# Node Pool
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  node_config {
    preemptible  = var.preemptible
    machine_type = var.machine_type

    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }
}

# Cloud SQL
resource "google_sql_database_instance" "main" {
  name             = "ganggpt-db"
  database_version = "POSTGRES_15"
  region          = var.region

  settings {
    tier = var.db_tier
    disk_size = var.db_disk_size

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }
  }
}
```

## 🛠️ Development Workflow

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/gang-gpt-gta-v.git
cd gang-gpt-gta-v

# Install dependencies
npm install

# Start development services
docker-compose up -d postgres redis

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Docker Compose for Development

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ganggpt_dev
      POSTGRES_USER: ganggpt
      POSTGRES_PASSWORD: development
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  ganggpt-server:
    build: .
    ports:
      - '22005:22005'
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://ganggpt:development@postgres:5432/ganggpt_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

## 🚀 Scaling Strategy

### Horizontal Scaling

```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ganggpt-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ganggpt-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Performance Optimization

1. **Connection Pooling** - Efficient database connections
2. **Caching Layers** - Multi-tier caching strategy
3. **CDN Integration** - Global content delivery
4. **Resource Optimization** - Lazy loading and code splitting
5. **Database Optimization** - Query optimization and indexing

## 📋 Maintenance & Operations

### Backup Strategy

```bash
# Automated daily backups
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump $DATABASE_URL > "backup_db_$DATE.sql"
gsutil cp "backup_db_$DATE.sql" gs://ganggpt-backups/database/

# Redis backup
redis-cli --rdb redis_backup_$DATE.rdb
gsutil cp "redis_backup_$DATE.rdb" gs://ganggpt-backups/redis/

# Clean up local files
rm "backup_db_$DATE.sql" "redis_backup_$DATE.rdb"
```

### Health Checks

```typescript
// Health check endpoints
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAIService(),
    checkMemoryUsage(),
    checkDiskSpace(),
  ]);

  const health = {
    status: checks.every(c => c.status === 'fulfilled')
      ? 'healthy'
      : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: checks.map((check, index) => ({
      name: ['database', 'redis', 'ai', 'memory', 'disk'][index],
      status: check.status,
      details: check.status === 'fulfilled' ? check.value : check.reason,
    })),
  };

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Disaster Recovery

1. **RTO (Recovery Time Objective)** - 15 minutes
2. **RPO (Recovery Point Objective)** - 5 minutes
3. **Backup Frequency** - Continuous + daily snapshots
4. **Multi-Region** - Planned for high availability
5. **Runbook** - Detailed disaster recovery procedures

## 📊 Cost Optimization

### Resource Usage Monitoring

```typescript
interface CostMetrics {
  compute: {
    gkeNodes: number;
    vmInstances: number;
    cpuHours: number;
    memoryGB: number;
  };
  storage: {
    databaseGB: number;
    redisGB: number;
    backupGB: number;
  };
  network: {
    ingressGB: number;
    egressGB: number;
    cdnRequests: number;
  };
  services: {
    aiApiCalls: number;
    firestoreReads: number;
    firestoreWrites: number;
  };
}
```

### Cost Optimization Strategies

1. **Right-sizing** - Regular instance size optimization
2. **Preemptible Instances** - For non-critical workloads
3. **Committed Use Discounts** - Long-term resource commitments
4. **Auto-scaling** - Dynamic resource allocation
5. **Resource Scheduling** - Time-based scaling

## 🔮 Future Roadmap

### Short Term (3 months)

- [ ] Implement auto-scaling
- [ ] Add comprehensive monitoring
- [ ] Optimize database performance
- [ ] Implement disaster recovery

### Medium Term (6 months)

- [ ] Multi-region deployment
- [ ] Advanced caching strategies
- [ ] Performance analytics dashboard
- [ ] Automated security scanning

### Long Term (12 months)

- [ ] Edge computing integration
- [ ] AI model optimization
- [ ] Global CDN implementation
- [ ] Advanced predictive scaling
