# GangGPT Production Deployment Guide

This document outlines the steps to deploy GangGPT to a production environment. Follow these instructions to ensure a secure, reliable, and performant deployment.

## Prerequisites

- Linux-based server (Ubuntu 22.04 LTS recommended)
- Docker and Docker Compose installed
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- Azure OpenAI API access

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourorg/gang-gpt-gta-v.git
cd gang-gpt-gta-v
```

### 2. Configure Environment Variables

Copy the example production environment file and edit it with your settings:

```bash
cp .env.production .env
```

Edit the `.env` file with your production values, especially:

- Database credentials
- Redis password
- JWT secrets (generate with `openssl rand -base64 32`)
- Azure OpenAI API key and endpoint
- SMTP settings
- Domain name

### 3. Set Up SSL Certificates

If you're using Let's Encrypt:

```bash
mkdir -p nginx/ssl
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

### 4. Configure Nginx

Edit the `nginx/nginx.conf` file to use your domain name and SSL certificates.

### 5. Start the Production Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 6. Verify the Deployment

Check that all services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Access the application via:

- Frontend: https://yourdomain.com
- Backend Health: https://yourdomain.com/api/health
- Grafana Dashboard: https://yourdomain.com/grafana (if configured)

## Monitoring & Maintenance

### Checking Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

### Updating the Application

```bash
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Database Backups

Regular database backups are essential. Set up a cron job:

```bash
# Add this to your crontab (crontab -e)
0 2 * * * docker exec ganggpt-postgres-prod pg_dump -U ganggpt -d ganggpt_production > /backups/ganggpt-db-$(date +\%Y\%m\%d).sql
```

### Monitoring Alerts

Configure alerts in Grafana for:

1. High CPU/Memory usage
2. Low disk space
3. Failed API requests
4. High error rates
5. Database connection issues

## Security Considerations

1. **Firewall Configuration**: Only expose necessary ports
2. **Regular Updates**: Keep all containers updated
3. **API Rate Limiting**: Prevents abuse
4. **JWT Token Security**: Short expiration times
5. **Input Validation**: All user inputs must be validated
6. **Data Encryption**: Sensitive data should be encrypted

## Performance Tuning

1. **Database Indexes**: Ensure proper indexes exist
2. **Redis Caching**: Tune TTL values
3. **Node.js Memory**: Adjust heap size limits
4. **Connection Pooling**: Database connection optimization

## Troubleshooting

### Common Issues

1. **Database Connections Exhausted**
   - Solution: Check connection pooling settings

2. **High Memory Usage**
   - Solution: Inspect for memory leaks, adjust container limits

3. **Slow API Responses**
   - Solution: Check database query performance, add indexes

4. **Authentication Failures**
   - Solution: Verify JWT configuration and secrets

## Support

For production support, contact:
- Email: support@ganggpt.com
- Discord: discord.gg/ganggpt

---

**Note**: This guide assumes a basic single-server deployment. For high-availability setups, additional configuration for load balancing and clustering would be required.
