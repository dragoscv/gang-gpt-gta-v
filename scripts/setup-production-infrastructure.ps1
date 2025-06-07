#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sets up production infrastructure for GangGPT
.DESCRIPTION
    This script sets up the necessary infrastructure for production deployment:
    - Redis for caching and session management
    - PostgreSQL for persistent data storage
    - Environment configuration validation
    - Health checks and monitoring setup
#>

param(
    [string]$Mode = "docker",  # docker, kubernetes, manual
    [switch]$SkipRedis,
    [switch]$SkipPostgres,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 GangGPT Production Infrastructure Setup" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Yellow

# Check prerequisites
function Test-Prerequisites {
    Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Blue
    
    $missing = @()
    
    if ($Mode -eq "docker") {
        if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
            $missing += "Docker"
        }
        if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
            $missing += "Docker Compose"
        }
    }
    
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        $missing += "Node.js"
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing prerequisites: $($missing -join ', ')" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All prerequisites satisfied" -ForegroundColor Green
}

# Setup Redis
function Start-Redis {
    if ($SkipRedis) {
        Write-Host "⏭️ Skipping Redis setup" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n🔴 Setting up Redis..." -ForegroundColor Blue
    
    switch ($Mode) {
        "docker" {
            if ($DryRun) {
                Write-Host "Would run: docker-compose up -d redis" -ForegroundColor Gray
                return
            }
            
            Write-Host "Starting Redis with Docker Compose..."
            docker-compose up -d redis
            
            # Wait for Redis to be ready
            $retries = 0
            do {
                Start-Sleep 2
                $retries++
                $redisReady = docker-compose ps redis | Select-String "healthy"
            } while (!$redisReady -and $retries -lt 30)
            
            if ($redisReady) {
                Write-Host "✅ Redis is ready" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Redis may not be fully ready" -ForegroundColor Yellow
            }
        }
        "kubernetes" {
            Write-Host "Applying Redis Kubernetes manifests..."
            if (!$DryRun) {
                kubectl apply -f k8s/redis.yaml
            }
        }
        "manual" {
            Write-Host "Manual Redis setup instructions:" -ForegroundColor Yellow
            Write-Host "1. Install Redis: https://redis.io/download" -ForegroundColor White
            Write-Host "2. Start Redis: redis-server" -ForegroundColor White
            Write-Host "3. Verify: redis-cli ping" -ForegroundColor White
        }
    }
}

# Setup PostgreSQL
function Start-PostgreSQL {
    if ($SkipPostgres) {
        Write-Host "⏭️ Skipping PostgreSQL setup" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n🐘 Setting up PostgreSQL..." -ForegroundColor Blue
    
    switch ($Mode) {
        "docker" {
            if ($DryRun) {
                Write-Host "Would run: docker-compose up -d postgres" -ForegroundColor Gray
                return
            }
            
            Write-Host "Starting PostgreSQL with Docker Compose..."
            docker-compose up -d postgres
            
            # Wait for PostgreSQL to be ready
            $retries = 0
            do {
                Start-Sleep 2
                $retries++
                $pgReady = docker-compose ps postgres | Select-String "healthy"
            } while (!$pgReady -and $retries -lt 30)
            
            if ($pgReady) {
                Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
            } else {
                Write-Host "⚠️ PostgreSQL may not be fully ready" -ForegroundColor Yellow
            }
        }
        "kubernetes" {
            Write-Host "Applying PostgreSQL Kubernetes manifests..."
            if (!$DryRun) {
                kubectl apply -f k8s/postgres.yaml
            }
        }
        "manual" {
            Write-Host "Manual PostgreSQL setup instructions:" -ForegroundColor Yellow
            Write-Host "1. Install PostgreSQL: https://www.postgresql.org/download/" -ForegroundColor White
            Write-Host "2. Create database: ganggpt_production" -ForegroundColor White
            Write-Host "3. Update DATABASE_URL in .env.production" -ForegroundColor White
        }
    }
}

# Update environment for production database
function Update-DatabaseConfig {
    Write-Host "`n🗄️ Updating database configuration..." -ForegroundColor Blue
    
    if (Test-Path ".env.production") {
        $envContent = Get-Content ".env.production" -Raw
        
        if ($Mode -eq "docker") {
            $newDatabaseUrl = "postgresql://ganggpt:ganggpt_dev_password@localhost:5432/ganggpt_development"
            $envContent = $envContent -replace 'DATABASE_URL=".*"', "DATABASE_URL=`"$newDatabaseUrl`""
            
            if (!$DryRun) {
                Set-Content ".env.production" $envContent
            }
            Write-Host "✅ Updated DATABASE_URL for Docker PostgreSQL" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ .env.production not found. Run generate-production-secrets.js first" -ForegroundColor Yellow
    }
}

# Run database migrations
function Start-DatabaseMigrations {
    Write-Host "`n📊 Running database migrations..." -ForegroundColor Blue
    
    if ($DryRun) {
        Write-Host "Would run: npm run db:push" -ForegroundColor Gray
        return
    }
    
    try {
        npm run db:generate
        npm run db:push
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Database migrations failed: $_" -ForegroundColor Red
        Write-Host "Make sure the database is running and accessible" -ForegroundColor Yellow
    }
}

# Test infrastructure
function Test-Infrastructure {
    Write-Host "`n🧪 Testing infrastructure..." -ForegroundColor Blue
    
    if ($DryRun) {
        Write-Host "Would run infrastructure tests" -ForegroundColor Gray
        return
    }
    
    # Test Redis
    try {
        if ($Mode -eq "docker") {
            $redisTest = docker-compose exec -T redis redis-cli ping
            if ($redisTest -eq "PONG") {
                Write-Host "✅ Redis: Connected" -ForegroundColor Green
            } else {
                Write-Host "❌ Redis: Connection failed" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "❌ Redis: Test failed - $_" -ForegroundColor Red
    }
    
    # Test PostgreSQL
    try {
        if ($Mode -eq "docker") {
            $pgTest = docker-compose exec -T postgres pg_isready -U ganggpt
            if ($pgTest -match "accepting connections") {
                Write-Host "✅ PostgreSQL: Connected" -ForegroundColor Green
            } else {
                Write-Host "❌ PostgreSQL: Connection failed" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "❌ PostgreSQL: Test failed - $_" -ForegroundColor Red
    }
}

# Main execution
try {
    Test-Prerequisites
    Start-Redis
    Start-PostgreSQL
    Update-DatabaseConfig
    Start-DatabaseMigrations
    Test-Infrastructure
    
    Write-Host "`n🎉 Production infrastructure setup completed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Run production readiness test: node scripts/test-production-readiness.js" -ForegroundColor White
    Write-Host "2. Start the application: npm run start" -ForegroundColor White
    Write-Host "3. Monitor health endpoints: curl http://localhost:22005/health" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Setup failed: $_" -ForegroundColor Red
    exit 1
}
