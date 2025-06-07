#!/bin/bash
# GangGPT Production Deployment Script
# This script automates the deployment of GangGPT to a production environment.
# It handles environment setup, database migrations, and service deployment.

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
DEPLOYMENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="./backups/$DEPLOYMENT_DATE"
LOG_FILE="./logs/deployment_$DEPLOYMENT_DATE.log"

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p ./logs

# Log function
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Step 1: Ensure we have the right environment variables
check_environment() {
  log "Checking environment variables..."
  
  required_vars=(
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "POSTGRES_DB"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "AZURE_OPENAI_ENDPOINT"
    "AZURE_OPENAI_API_KEY"
  )
  
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      log "ERROR: Required environment variable $var is not set"
      exit 1
    fi
  done
  
  log "Environment variables validated successfully"
}

# Step 2: Create database backup before deployment
backup_database() {
  log "Creating database backup..."
  
  if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_DIR/database_backup.sql"
    log "Database backup created at $BACKUP_DIR/database_backup.sql"
  else
    log "Database is not running, skipping backup"
  fi
}

# Step 3: Pull latest code
update_code() {
  log "Pulling latest code from repository..."
  git pull origin main
  log "Code updated successfully"
}

# Step 4: Build production Docker images
build_images() {
  log "Building Docker images..."
  docker-compose -f docker-compose.prod.yml build
  log "Docker images built successfully"
}

# Step 5: Run database migrations
run_migrations() {
  log "Running database migrations..."
  docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
  log "Database migrations completed"
}

# Step 6: Deploy services
deploy_services() {
  log "Deploying services..."
  docker-compose -f docker-compose.prod.yml up -d
  log "Services deployed successfully"
}

# Step 7: Verify deployment
verify_deployment() {
  log "Verifying deployment..."
  sleep 10  # Give services time to start
  
  # Check if services are running
  if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log "ERROR: Services failed to start"
    exit 1
  fi
  
  # Check API health
  if curl -s http://localhost:3001/health | grep -q "ok"; then
    log "API health check passed"
  else
    log "ERROR: API health check failed"
    exit 1
  fi
  
  log "Deployment verified successfully"
}

# Step 8: Run post-deployment tasks
post_deployment() {
  log "Running post-deployment tasks..."
  
  # Clear Redis cache
  docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a "$REDIS_PASSWORD" FLUSHALL
  
  # Generate API documentation
  # docker-compose -f docker-compose.prod.yml exec -T app npm run generate-docs
  
  log "Post-deployment tasks completed"
}

# Main deployment flow
main() {
  log "Starting GangGPT production deployment"
  
  check_environment
  backup_database
  update_code
  build_images
  run_migrations
  deploy_services
  verify_deployment
  post_deployment
  
  log "Deployment completed successfully!"
  log "GangGPT is now running in production"
}

# Execute main function
main "$@"
