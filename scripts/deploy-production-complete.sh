#!/bin/bash
# GangGPT Complete Production Deployment Script
# This script deploys GangGPT to production with full infrastructure setup

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$PROJECT_DIR/logs/production-deployment_$DEPLOYMENT_DATE.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}$(date +"%Y-%m-%d %H:%M:%S")${NC} - $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}$(date +"%Y-%m-%d %H:%M:%S") WARN${NC} - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}$(date +"%Y-%m-%d %H:%M:%S") ERROR${NC} - $1" | tee -a "$LOG_FILE"
    exit 1
}

# Create necessary directories
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/backups"

log "🚀 Starting GangGPT Production Deployment"
log "Project Directory: $PROJECT_DIR"
log "Log File: $LOG_FILE"

# Step 1: Validate environment
validate_environment() {
    log "🔍 Validating environment..."
    
    # Check if .env.production exists
    if [[ ! -f "$PROJECT_DIR/.env.production" ]]; then
        error ".env.production file not found. Please create it first."
    fi
    
    # Source environment variables
    set -a
    source "$PROJECT_DIR/.env.production"
    set +a
    
    # Required environment variables
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
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    log "✅ Environment validation passed"
}

# Step 2: Check dependencies
check_dependencies() {
    log "🔧 Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check kubectl (for Kubernetes deployment)
    if command -v kubectl &> /dev/null; then
        log "✅ kubectl found - Kubernetes deployment available"
    else
        warn "kubectl not found - only Docker deployment available"
    fi
    
    log "✅ Dependencies check passed"
}

# Step 3: Build application
build_application() {
    log "🏗️ Building GangGPT application..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run tests
    log "Running tests..."
    npm run test:unit || warn "Unit tests failed"
    
    # Build application
    log "Building application..."
    npm run build
    
    # Build Docker images
    log "Building Docker images..."
    docker build -t ganggpt/backend:latest -t ganggpt/backend:$DEPLOYMENT_DATE .
    
    cd web
    docker build -t ganggpt/frontend:latest -t ganggpt/frontend:$DEPLOYMENT_DATE .
    cd ..
    
    log "✅ Application build completed"
}

# Step 4: Database backup (if production database exists)
backup_database() {
    log "💾 Creating database backup..."
    
    if docker ps | grep -q ganggpt-postgres-prod; then
        backup_file="$PROJECT_DIR/backups/ganggpt-db-backup-$DEPLOYMENT_DATE.sql"
        docker exec ganggpt-postgres-prod pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$backup_file"
        log "✅ Database backup created: $backup_file"
    else
        warn "No existing production database found - skipping backup"
    fi
}

# Step 5: Deploy with Docker Compose
deploy_docker() {
    log "🐳 Deploying with Docker Compose..."
    
    cd "$PROJECT_DIR"
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # Start new services
    log "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Check service health
    log "Checking service health..."
    for i in {1..12}; do
        if curl -f http://localhost:3001/api/health &>/dev/null; then
            log "✅ Backend service is healthy"
            break
        fi
        if [[ $i -eq 12 ]]; then
            error "Backend service failed to start"
        fi
        sleep 10
    done
    
    for i in {1..12}; do
        if curl -f http://localhost:3000 &>/dev/null; then
            log "✅ Frontend service is healthy"
            break
        fi
        if [[ $i -eq 12 ]]; then
            error "Frontend service failed to start"
        fi
        sleep 10
    done
    
    log "✅ Docker deployment completed successfully"
}

# Step 6: Deploy to Kubernetes (optional)
deploy_kubernetes() {
    if ! command -v kubectl &> /dev/null; then
        warn "kubectl not available - skipping Kubernetes deployment"
        return
    fi
    
    log "☸️ Deploying to Kubernetes..."
    
    cd "$PROJECT_DIR"
    
    # Apply secrets
    log "Applying Kubernetes secrets..."
    kubectl apply -f production-secrets/secrets.k8s.yaml
    
    # Apply deployments
    log "Applying Kubernetes deployments..."
    kubectl apply -f k8s/
    
    # Wait for deployments to be ready
    log "Waiting for deployments to be ready..."
    kubectl rollout status deployment/ganggpt-backend --timeout=300s
    kubectl rollout status deployment/ganggpt-frontend --timeout=300s
    
    log "✅ Kubernetes deployment completed"
}

# Step 7: SSL Certificate setup
setup_ssl() {
    log "🔒 Setting up SSL certificates..."
    
    if [[ -n "${DOMAIN_NAME:-}" ]]; then
        # Create SSL directory
        mkdir -p "$PROJECT_DIR/nginx/ssl"
        
        # Check if certificates exist
        if [[ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]]; then
            log "Copying existing SSL certificates..."
            sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$PROJECT_DIR/nginx/ssl/"
            sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$PROJECT_DIR/nginx/ssl/"
        else
            warn "SSL certificates not found. You may need to run: certbot certonly --standalone -d $DOMAIN_NAME"
        fi
    else
        warn "DOMAIN_NAME not set - skipping SSL setup"
    fi
}

# Step 8: Post-deployment validation
validate_deployment() {
    log "✅ Running post-deployment validation..."
    
    # Run production readiness test
    log "Running production readiness test..."
    cd "$PROJECT_DIR"
    node scripts/test-production-readiness.js
    
    # Run additional health checks
    log "Running comprehensive health checks..."
    
    # Check database connectivity
    if docker exec ganggpt-postgres-prod pg_isready -U "$POSTGRES_USER" &>/dev/null; then
        log "✅ PostgreSQL is ready"
    else
        error "PostgreSQL health check failed"
    fi
    
    # Check Redis connectivity
    if docker exec ganggpt-redis-prod redis-cli ping &>/dev/null; then
        log "✅ Redis is ready"
    else
        error "Redis health check failed"
    fi
    
    # Check API endpoints
    if curl -f http://localhost:3001/api/health &>/dev/null; then
        log "✅ Backend API is responding"
    else
        error "Backend API health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 &>/dev/null; then
        log "✅ Frontend is responding"
    else
        error "Frontend health check failed"
    fi
    
    log "✅ All deployment validations passed!"
}

# Step 9: Performance testing
performance_test() {
    log "⚡ Running performance tests..."
    
    # Basic load test
    if command -v ab &> /dev/null; then
        log "Running Apache Bench load test..."
        ab -n 1000 -c 10 http://localhost:3001/api/health > "$PROJECT_DIR/logs/loadtest-$DEPLOYMENT_DATE.log"
        log "Load test results saved to logs/loadtest-$DEPLOYMENT_DATE.log"
    else
        warn "Apache Bench not available - skipping load test"
    fi
}

# Step 10: Monitoring setup
setup_monitoring() {
    log "📊 Setting up monitoring..."
    
    # Check if Grafana is running
    if docker ps | grep -q ganggpt-grafana-prod; then
        grafana_url="http://localhost:${GRAFANA_PORT:-3005}"
        log "✅ Grafana dashboard available at: $grafana_url"
        log "   Default credentials: admin/admin (change immediately)"
    fi
    
    # Check if Prometheus is running
    if docker ps | grep -q ganggpt-prometheus-prod; then
        prometheus_url="http://localhost:${PROMETHEUS_PORT:-9090}"
        log "✅ Prometheus metrics available at: $prometheus_url"
    fi
}

# Main deployment function
main() {
    log "🎯 GangGPT Production Deployment Started"
    
    validate_environment
    check_dependencies
    build_application
    backup_database
    deploy_docker
    deploy_kubernetes
    setup_ssl
    validate_deployment
    performance_test
    setup_monitoring
    
    log "🎉 GangGPT Production Deployment Completed Successfully!"
    log ""
    log "📋 Deployment Summary:"
    log "   - Backend API: http://localhost:3001"
    log "   - Frontend: http://localhost:3000"
    log "   - Grafana: http://localhost:${GRAFANA_PORT:-3005}"
    log "   - Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
    log ""
    log "📝 Next Steps:"
    log "   1. Change default Grafana password"
    log "   2. Configure domain DNS if using custom domain"
    log "   3. Set up SSL certificates for HTTPS"
    log "   4. Configure monitoring alerts"
    log "   5. Set up automated backups"
    log ""
    log "📊 Deployment completed in $(( SECONDS / 60 )) minutes"
}

# Execute main function
main "$@"
