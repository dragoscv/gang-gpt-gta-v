#!/bin/bash
# GangGPT Production Rollback Script
# This script rolls back a failed deployment to a previous stable version

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
ROLLBACK_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="./logs/rollback_$ROLLBACK_DATE.log"
DEFAULT_BACKUP_DIR=""

# Log function
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

# Show usage
show_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -b, --backup-dir <path>  Specify backup directory (required)"
  echo "  -v, --version <tag>      Rollback to specific Git version/tag"
  echo "  -h, --help               Show this help message"
}

# Parse command line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
      -b|--backup-dir)
        BACKUP_DIR="$2"
        shift
        shift
        ;;
      -v|--version)
        GIT_VERSION="$2"
        shift
        shift
        ;;
      -h|--help)
        show_usage
        exit 0
        ;;
      *)
        log "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
  done
  
  # Check for required parameters
  if [ -z "$BACKUP_DIR" ]; then
    log "ERROR: Backup directory is required (-b, --backup-dir)"
    show_usage
    exit 1
  fi
  
  # Ensure backup directory exists
  if [ ! -d "$BACKUP_DIR" ]; then
    log "ERROR: Backup directory does not exist: $BACKUP_DIR"
    exit 1
  fi
}

# Step 1: Stop current services
stop_services() {
  log "Stopping current services..."
  docker-compose -f docker-compose.prod.yml down
  log "Services stopped successfully"
}

# Step 2: Rollback code if a specific version is specified
rollback_code() {
  if [ -n "$GIT_VERSION" ]; then
    log "Rolling back code to version $GIT_VERSION..."
    git fetch --all
    git checkout "$GIT_VERSION"
    log "Code rolled back successfully"
  else
    log "No Git version specified, skipping code rollback"
  fi
}

# Step 3: Restore database from backup
restore_database() {
  log "Restoring database from backup..."
  
  # Start only the database service
  docker-compose -f docker-compose.prod.yml up -d postgres
  
  # Wait for database to be ready
  log "Waiting for database to be ready..."
  sleep 10
  
  # Check if database backup file exists
  DB_BACKUP_FILE="$BACKUP_DIR/database_backup.sql"
  if [ -f "$DB_BACKUP_FILE" ]; then
    # Restore database
    cat "$DB_BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    log "Database restored successfully"
  else
    log "ERROR: Database backup file not found: $DB_BACKUP_FILE"
    exit 1
  fi
}

# Step 4: Rebuild and start services
rebuild_services() {
  log "Rebuilding and starting services..."
  docker-compose -f docker-compose.prod.yml build
  docker-compose -f docker-compose.prod.yml up -d
  log "Services rebuilt and started"
}

# Step 5: Verify rollback
verify_rollback() {
  log "Verifying rollback..."
  sleep 10  # Give services time to start
  
  # Check if services are running
  if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log "ERROR: Services failed to start after rollback"
    exit 1
  fi
  
  # Check API health
  if curl -s http://localhost:3001/health | grep -q "ok"; then
    log "API health check passed"
  else
    log "ERROR: API health check failed after rollback"
    exit 1
  fi
  
  log "Rollback verified successfully"
}

# Main rollback flow
main() {
  log "Starting GangGPT production rollback"
  
  parse_arguments "$@"
  stop_services
  rollback_code
  restore_database
  rebuild_services
  verify_rollback
  
  log "Rollback completed successfully!"
  log "GangGPT has been restored to a previous stable version"
}

# Execute main function
main "$@"
