# GangGPT Production Quick Start Guide

This guide provides step-by-step instructions for deploying GangGPT to a production environment.

## Prerequisites

- Linux-based server with sudo access
- Docker and Docker Compose installed
- Git installed
- Azure OpenAI API access
- PostgreSQL, Redis, and other services are containerized in our Docker setup

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gang-gpt-gta-v.git
cd gang-gpt-gta-v
```

## 2. Set Up Environment Variables

### On Windows (Development Environment)

Run the preparation script to generate secure secrets and prepare your environment:

```powershell
.\scripts\prepare-production.ps1
```

### On Linux (Production Server)

Create required environment variables:

```bash
export POSTGRES_USER=ganggpt
export POSTGRES_PASSWORD=<secure_password>
export POSTGRES_DB=ganggpt_production
export REDIS_PASSWORD=<secure_password>
export JWT_SECRET=<secure_jwt_secret>
export JWT_REFRESH_SECRET=<secure_refresh_secret>
export AZURE_OPENAI_ENDPOINT=<your_azure_openai_endpoint>
export AZURE_OPENAI_API_KEY=<your_azure_openai_api_key>
```

You can generate secure secrets using:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh token secret
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 24
```

## 3. Configure Production Environment File

Review and update the `.env.production` file with your production settings:

```bash
# Use the example as a template
cp .env.example .env.production

# Edit the file with your production values
nano .env.production
```

**Important**: Make sure to set:
- `NODE_ENV=production`
- `DATABASE_SSL=true` (for production database)
- Secure secrets for JWT, Redis, etc.
- Proper Azure OpenAI credentials
- Production URLs for CORS settings

## 4. Deploy to Production

Run the deployment script:

```bash
# Make the script executable
chmod +x ./scripts/deploy-production.sh

# Run the deployment
./scripts/deploy-production.sh
```

The script will:
- Validate environment variables
- Create a database backup (if applicable)
- Pull the latest code
- Build Docker images
- Run database migrations
- Start all services
- Verify the deployment

## 5. Verify the Deployment

Check that all services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Check the API health:

```bash
curl http://localhost:3001/health
```

Check the logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

## 6. Set Up Monitoring

Access the monitoring dashboards:
- Prometheus: http://your-server-ip:9090
- Grafana: http://your-server-ip:3005 (default credentials: admin/admin)

Configure the Grafana dashboards:
1. Log in to Grafana
2. Go to Configuration > Data Sources
3. Add Prometheus as a data source (URL: http://prometheus:9090)
4. Import the pre-configured dashboards from the `monitoring/grafana/dashboards` directory

## 7. Backup and Recovery

### Create a manual backup

```bash
./scripts/backup-database.sh
```

### Restore from backup

If you need to roll back to a previous version:

```bash
# Make the script executable
chmod +x ./scripts/rollback-production.sh

# Roll back to a specific backup
./scripts/rollback-production.sh --backup-dir ./backups/2025-06-05_12-34-56
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check PostgreSQL container is running
   - Verify DATABASE_URL environment variable
   - Check database user permissions

2. **Redis connection errors**
   - Verify Redis container is running
   - Check REDIS_URL and password
   - Redis will use memory fallback if unavailable

3. **Azure OpenAI errors**
   - Verify API key and endpoint
   - Check rate limits and quotas
   - AI features will have graceful degradation

### Getting Help

Consult these resources for additional help:
- `docs/OPERATIONS_PLAYBOOK.md` - For common operational tasks
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - For a complete deployment checklist
- `PRODUCTION_READINESS_FINAL_REPORT.md` - For current project status

## Security Best Practices

- Regularly rotate API keys and passwords
- Keep the server and Docker images updated
- Enable firewall rules to restrict access
- Use HTTPS with valid SSL certificates
- Monitor logs for suspicious activities

## Next Steps

After successful deployment:
1. Set up automatic backups
2. Configure a CI/CD pipeline
3. Implement load balancing for scalability
4. Set up alerting for critical issues
5. Document server architecture and procedures
