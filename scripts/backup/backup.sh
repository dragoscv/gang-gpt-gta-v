#!/bin/bash
# GangGPT Production Backup Script
# Automated database and application backup

set -e

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
POSTGRES_CONTAINER="ganggpt-postgres"
REDIS_CONTAINER="ganggpt-redis"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "🔄 Creating PostgreSQL backup..."
docker exec $POSTGRES_CONTAINER pg_dump -U postgres -d ganggpt > "$BACKUP_DIR/postgres_backup.sql"

# Redis backup
echo "🔄 Creating Redis backup..."
docker exec $REDIS_CONTAINER redis-cli --rdb > "$BACKUP_DIR/redis_backup.rdb"

# Application files backup
echo "🔄 Creating application backup..."
tar -czf "$BACKUP_DIR/app_backup.tar.gz"     --exclude=node_modules     --exclude=.git     --exclude=logs     --exclude=coverage     .

# Upload to cloud storage (S3 compatible)
if [ "$BACKUP_S3_BUCKET" ]; then
    echo "🔄 Uploading to cloud storage..."
    aws s3 sync "$BACKUP_DIR" "s3://$BACKUP_S3_BUCKET/$(date +%Y-%m-%d)/"
fi

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;

echo "✅ Backup completed successfully"