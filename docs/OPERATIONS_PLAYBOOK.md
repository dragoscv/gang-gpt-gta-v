# GangGPT Operations Playbook

## Introduction

This playbook contains procedures for common operational scenarios encountered in the GangGPT production environment. It serves as a quick reference for resolving issues and maintaining system stability.

## System Architecture Overview

GangGPT consists of the following components:
- Node.js backend (Express + tRPC)
- Next.js frontend
- PostgreSQL database
- Redis cache
- Azure OpenAI integration
- RAGE:MP server integration
- Prometheus/Grafana monitoring

## Common Operational Tasks

### 1. Restarting Services

#### Backend API Service
```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml restart app

# Or execute restart script inside container
docker exec -it ganggpt-app-prod /bin/sh -c "pm2 restart all"
```

#### Frontend Service
```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml restart app

# Or directly inside container
docker exec -it ganggpt-app-prod /bin/sh -c "cd web && pm2 restart all"
```

#### Database
```bash
# Avoid restarting unless absolutely necessary
docker-compose -f docker-compose.prod.yml restart postgres
```

#### Redis
```bash
docker-compose -f docker-compose.prod.yml restart redis
```

### 2. Checking System Health

#### Health Check Endpoints
- Backend: `https://api.ganggpt.com/health`
- Frontend: `https://ganggpt.com/api/health`

#### Logs
```bash
# View recent logs
docker-compose -f docker-compose.prod.yml logs --tail=100 app

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f app
```

#### Monitoring
- Grafana: `https://monitoring.ganggpt.com`
- Prometheus: `https://monitoring.ganggpt.com/prometheus`

### 3. Database Operations

#### Backup Database
```bash
docker exec -t ganggpt-postgres-prod pg_dump -U ganggpt -d ganggpt_production > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restore Database
```bash
# Stop services that use the database
docker-compose -f docker-compose.prod.yml stop app

# Restore from backup
cat backup_file.sql | docker exec -i ganggpt-postgres-prod psql -U ganggpt -d ganggpt_production

# Restart services
docker-compose -f docker-compose.prod.yml start app
```

#### Database Migrations
```bash
# Run migrations
docker exec -it ganggpt-app-prod /bin/sh -c "npx prisma migrate deploy"
```

### 4. Scaling Services

#### Horizontal Scaling (with Kubernetes)
```bash
# Scale backend replicas
kubectl scale deployment ganggpt-backend --replicas=3

# Scale frontend replicas
kubectl scale deployment ganggpt-frontend --replicas=3
```

#### Vertical Scaling (with Docker)
Edit the `docker-compose.prod.yml` file to adjust resource limits:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 5. Troubleshooting Common Issues

#### API Performance Issues
1. Check Redis connectivity
2. Verify database query performance
3. Check for high CPU/memory usage
4. Look for excessive logging
5. Monitor external API calls (especially to Azure OpenAI)

#### Frontend Issues
1. Check browser console for errors
2. Verify API connectivity
3. Check CDN status
4. Test with different browsers/devices

#### Database Issues
1. Check connection count
2. Look for long-running queries
3. Check disk space
4. Verify connection pooling settings

#### Redis Issues
1. Check memory usage
2. Verify connection settings
3. Check for high eviction rates
4. Monitor command latency

#### AI Service Issues
1. Check Azure status page
2. Verify API key validity
3. Monitor rate limits
4. Check fallback mechanisms

## Emergency Procedures

### Service Outage
1. Check monitoring dashboards to identify affected components
2. Review logs for error messages
3. Restart affected services if necessary
4. If issue persists, perform rollback to last known good state
5. Notify users of service disruption

### Database Corruption
1. Stop all services accessing the database
2. Restore from latest backup
3. Run database consistency checks
4. Restart services
5. Validate data integrity

### Security Incident
1. Isolate affected systems
2. Revoke compromised credentials
3. Analyze attack vector
4. Apply necessary patches
5. Restore from clean backup if necessary
6. Document incident and response

### Data Loss
1. Identify scope of data loss
2. Restore from most recent backup
3. Reconcile any missing transactions
4. Review backup procedures
5. Implement additional safeguards

## Maintenance Procedures

### Scheduled Updates
1. Announce maintenance window
2. Create backup of all systems
3. Apply updates in staging environment first
4. Test thoroughly
5. Schedule production update during low-traffic period
6. Apply update with rollback plan ready
7. Verify all systems operational
8. Monitor closely for 24 hours post-update

### Performance Optimization
1. Review performance metrics weekly
2. Identify bottlenecks
3. Optimize database queries
4. Scale resources as needed
5. Consider caching strategies for high-load endpoints

### Security Updates
1. Monitor security advisories
2. Apply critical patches immediately
3. Schedule non-critical updates
4. Run security scans monthly
5. Review access logs regularly

## Contact Information

### Technical Support Team
- Primary: tech-support@ganggpt.com
- Emergency: +1-555-GANG-GPT

### Database Administration
- Primary: dba@ganggpt.com
- Emergency: +1-555-GANG-DBA

### Security Team
- Primary: security@ganggpt.com
- Emergency: +1-555-GANG-SEC

## Appendix

### Environment Variables Reference
See `.env.production` for the complete list of environment variables.

### Monitoring Alerts
| Alert | Severity | Action |
|-------|----------|--------|
| High CPU Usage | Medium | Investigate processes, scale if needed |
| Database Connection Limit | High | Check for connection leaks, increase pool |
| API Error Rate > 1% | High | Check logs, restart service if needed |
| Redis Memory >80% | Medium | Clear cache or scale memory |
| Azure API Rate Limit | High | Implement throttling, check usage patterns |

### Backup Schedule
- Full database backup: Daily at 2 AM
- Transaction logs: Every 15 minutes
- Retention period: 30 days
