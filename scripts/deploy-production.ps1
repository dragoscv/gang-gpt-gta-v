#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Production Deployment Script for GangGPT
    
.DESCRIPTION
    Comprehensive deployment script that handles:
    - Pre-deployment validation
    - Database migrations
    - Service deployment
    - Health checks
    - Rollback capabilities
    
.PARAMETER Environment
    Target environment: staging, production
    
.PARAMETER SkipTests
    Skip test execution during deployment
    
.PARAMETER SkipBackup
    Skip database backup before deployment
    
.PARAMETER RollbackVersion
    Version to rollback to (optional)
    
.EXAMPLE
    .\deploy-production.ps1 -Environment staging
    Deploy to staging environment
    
.EXAMPLE
    .\deploy-production.ps1 -Environment production -SkipTests
    Deploy to production without running tests
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment,
    
    [switch]$SkipTests,
    [switch]$SkipBackup,
    [string]$RollbackVersion
)

$ErrorActionPreference = "Stop"

# Configuration
$CONFIG = @{
    staging = @{
        dockerCompose = "docker-compose.yml"
        namespace = "ganggpt-staging"
        replicas = 2
        dbUrl = "postgresql://staging_user:staging_pass@db-staging:5432/ganggpt_staging"
    }
    production = @{
        dockerCompose = "docker-compose.production.yml"
        namespace = "ganggpt-production"
        replicas = 5
        dbUrl = $env:DATABASE_URL_PRODUCTION
    }
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🚀 GangGPT Production Deployment" -ForegroundColor Yellow
    Write-Host "   $Message" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check required tools
    $tools = @("docker", "docker-compose", "kubectl", "pnpm")
    foreach ($tool in $tools) {
        if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "❌ Required tool not found: $tool"
        }
        Write-Host "✅ $tool" -ForegroundColor Green
    }
    
    # Check environment variables
    $requiredEnvVars = @(
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "DATABASE_URL_PRODUCTION",
        "JWT_SECRET",
        "SMTP_HOST"
    )
    
    foreach ($envVar in $requiredEnvVars) {
        if (!$env:$envVar) {
            throw "❌ Required environment variable not set: $envVar"
        }
        Write-Host "✅ $envVar" -ForegroundColor Green
    }
    
    Write-Host "✅ All prerequisites met" -ForegroundColor Green
}

function Invoke-Tests {
    if ($SkipTests) {
        Write-Host "⏭️ Skipping tests (--skip-tests flag)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🧪 Running test suite..." -ForegroundColor Yellow
    
    try {
        $testResult = pnpm test 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Tests failed: $testResult"
        }
        
        # Parse test results
        $testOutput = $testResult -join "`n"
        if ($testOutput -match "Tests\s+(\d+)\s+passed") {
            $passedTests = $matches[1]
            Write-Host "✅ $passedTests tests passed" -ForegroundColor Green
        }
        
        if ($testOutput -match "(\d+)\s+skipped") {
            $skippedTests = $matches[1]
            Write-Host "⏭️ $skippedTests tests skipped" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Test suite failed: $_" -ForegroundColor Red
        throw "Deployment aborted due to test failures"
    }
}

function Invoke-DatabaseBackup {
    if ($SkipBackup) {
        Write-Host "⏭️ Skipping database backup (--skip-backup flag)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "💾 Creating database backup..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
    $backupFile = "backup-$Environment-$timestamp.sql"
    
    try {
        # Create backup using kubectl exec for production
        if ($Environment -eq "production") {
            kubectl exec -n $CONFIG.$Environment.namespace deployment/postgres -- pg_dump -U postgres ganggpt > $backupFile
        } else {
            docker-compose exec postgres pg_dump -U postgres ganggpt > $backupFile
        }
        
        Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
        
        # Upload to S3 if configured
        if ($env:BACKUP_S3_BUCKET) {
            aws s3 cp $backupFile "s3://$env:BACKUP_S3_BUCKET/database-backups/$backupFile"
            Write-Host "✅ Backup uploaded to S3" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "❌ Backup failed: $_" -ForegroundColor Red
        throw "Deployment aborted due to backup failure"
    }
}

function Invoke-Build {
    Write-Host "🔨 Building application..." -ForegroundColor Yellow
    
    try {
        # Clean and install dependencies
        pnpm install --frozen-lockfile
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
        
        # Build all packages
        pnpm build
        Write-Host "✅ Build completed" -ForegroundColor Green
        
        # Build Docker images
        $dockerFile = if ($Environment -eq "production") { "Dockerfile.production" } else { "Dockerfile" }
        $tag = "ganggpt:$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
        
        docker build -f $dockerFile -t $tag .
        Write-Host "✅ Docker image built: $tag" -ForegroundColor Green
        
        return $tag
        
    } catch {
        Write-Host "❌ Build failed: $_" -ForegroundColor Red
        throw "Deployment aborted due to build failure"
    }
}

function Invoke-DatabaseMigration {
    Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
    
    try {
        # Set database URL for migrations
        $env:DATABASE_URL = $CONFIG.$Environment.dbUrl
        
        # Run migrations
        pnpm --filter @ganggpt/database migrate:deploy
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Migration failed: $_" -ForegroundColor Red
        throw "Deployment aborted due to migration failure"
    }
}

function Invoke-Deployment {
    param([string]$ImageTag)
    
    Write-Host "🚢 Deploying to $Environment..." -ForegroundColor Yellow
    
    try {
        if ($Environment -eq "production") {
            # Kubernetes deployment
            kubectl apply -f k8s/production/
            kubectl set image deployment/backend backend=$ImageTag -n $CONFIG.$Environment.namespace
            kubectl set image deployment/frontend frontend=$ImageTag -n $CONFIG.$Environment.namespace
            
            # Wait for rollout
            kubectl rollout status deployment/backend -n $CONFIG.$Environment.namespace --timeout=300s
            kubectl rollout status deployment/frontend -n $CONFIG.$Environment.namespace --timeout=300s
            
        } else {
            # Docker Compose deployment
            $env:IMAGE_TAG = $ImageTag
            docker-compose -f $CONFIG.$Environment.dockerCompose up -d
        }
        
        Write-Host "✅ Deployment completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
        throw "Deployment failed: $_"
    }
}

function Test-Health {
    Write-Host "🏥 Performing health checks..." -ForegroundColor Yellow
    
    $maxAttempts = 30
    $attempt = 0
    
    $healthUrl = if ($Environment -eq "production") {
        "https://api.ganggpt.com/health"
    } else {
        "http://localhost:4828/health"
    }
    
    do {
        $attempt++
        Write-Host "Attempt $attempt/$maxAttempts - Checking $healthUrl" -ForegroundColor Gray
        
        try {
            $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
            
            if ($response.status -eq "healthy") {
                Write-Host "✅ Health check passed" -ForegroundColor Green
                
                # Check service status
                if ($response.services) {
                    foreach ($service in $response.services.PSObject.Properties) {
                        $status = $service.Value.status
                        $name = $service.Name
                        
                        if ($status -eq "up") {
                            Write-Host "  ✅ $name" -ForegroundColor Green
                        } else {
                            Write-Host "  ❌ $name" -ForegroundColor Red
                        }
                    }
                }
                
                return $true
            }
        } catch {
            Write-Host "  ❌ Health check failed: $_" -ForegroundColor Red
        }
        
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 10
        }
        
    } while ($attempt -lt $maxAttempts)
    
    throw "Health checks failed after $maxAttempts attempts"
}

function Invoke-SmokeTests {
    Write-Host "💨 Running smoke tests..." -ForegroundColor Yellow
    
    $baseUrl = if ($Environment -eq "production") {
        "https://api.ganggpt.com"
    } else {
        "http://localhost:4828"
    }
    
    $tests = @(
        @{ name = "Health endpoint"; url = "$baseUrl/health"; expectedStatus = 200 }
        @{ name = "API status"; url = "$baseUrl/api/status"; expectedStatus = 200 }
        @{ name = "CORS headers"; url = "$baseUrl/health"; expectedHeaders = @("Access-Control-Allow-Origin") }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($test in $tests) {
        try {
            $response = Invoke-WebRequest -Uri $test.url -Method GET -UseBasicParsing
            
            if ($response.StatusCode -eq $test.expectedStatus) {
                Write-Host "  ✅ $($test.name)" -ForegroundColor Green
                $passed++
            } else {
                Write-Host "  ❌ $($test.name) - Status: $($response.StatusCode)" -ForegroundColor Red
                $failed++
            }
            
            # Check headers if specified
            if ($test.expectedHeaders) {
                foreach ($header in $test.expectedHeaders) {
                    if ($response.Headers[$header]) {
                        Write-Host "    ✅ Header: $header" -ForegroundColor Green
                    } else {
                        Write-Host "    ❌ Missing header: $header" -ForegroundColor Red
                        $failed++
                    }
                }
            }
            
        } catch {
            Write-Host "  ❌ $($test.name) - Error: $_" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host "📊 Smoke tests completed: $passed passed, $failed failed" -ForegroundColor Cyan
    
    if ($failed -gt 0) {
        throw "Smoke tests failed"
    }
}

function Invoke-Rollback {
    param([string]$Version)
    
    Write-Host "🔄 Rolling back to version $Version..." -ForegroundColor Yellow
    
    try {
        if ($Environment -eq "production") {
            kubectl rollout undo deployment/backend -n $CONFIG.$Environment.namespace
            kubectl rollout undo deployment/frontend -n $CONFIG.$Environment.namespace
        } else {
            docker-compose -f $CONFIG.$Environment.dockerCompose down
            $env:IMAGE_TAG = $Version
            docker-compose -f $CONFIG.$Environment.dockerCompose up -d
        }
        
        Write-Host "✅ Rollback completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Rollback failed: $_" -ForegroundColor Red
        throw "Rollback failed: $_"
    }
}

function Send-Notification {
    param(
        [string]$Status,
        [string]$Message
    )
    
    if ($env:SLACK_WEBHOOK_URL) {
        $payload = @{
            text = "🚀 GangGPT Deployment $Status"
            attachments = @(@{
                color = if ($Status -eq "SUCCESS") { "good" } else { "danger" }
                fields = @(
                    @{ title = "Environment"; value = $Environment; short = $true }
                    @{ title = "Status"; value = $Status; short = $true }
                    @{ title = "Message"; value = $Message; short = $false }
                    @{ title = "Timestamp"; value = (Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"); short = $true }
                )
            })
        }
        
        try {
            Invoke-RestMethod -Uri $env:SLACK_WEBHOOK_URL -Method POST -Body ($payload | ConvertTo-Json -Depth 3) -ContentType "application/json"
        } catch {
            Write-Host "Failed to send notification: $_" -ForegroundColor Yellow
        }
    }
}

# Main deployment process
try {
    Write-Header "Starting deployment to $Environment"
    
    # Handle rollback if requested
    if ($RollbackVersion) {
        Invoke-Rollback -Version $RollbackVersion
        Test-Health
        Send-Notification -Status "SUCCESS" -Message "Rollback to $RollbackVersion completed successfully"
        Write-Host "🎉 Rollback completed successfully!" -ForegroundColor Green
        exit 0
    }
    
    # Pre-deployment checks
    Test-Prerequisites
    Invoke-Tests
    Invoke-DatabaseBackup
    
    # Build and deploy
    $imageTag = Invoke-Build
    Invoke-DatabaseMigration
    Invoke-Deployment -ImageTag $imageTag
    
    # Post-deployment validation
    Test-Health
    Invoke-SmokeTests
    
    # Success notification
    Send-Notification -Status "SUCCESS" -Message "Deployment to $Environment completed successfully"
    
    Write-Header "Deployment completed successfully! 🎉"
    Write-Host "Environment: $Environment" -ForegroundColor Green
    Write-Host "Image Tag: $imageTag" -ForegroundColor Green
    Write-Host "Health Check: ✅ PASSED" -ForegroundColor Green
    Write-Host "Smoke Tests: ✅ PASSED" -ForegroundColor Green
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "❌ Deployment failed: $errorMessage" -ForegroundColor Red
    
    # Send failure notification
    Send-Notification -Status "FAILED" -Message "Deployment to $Environment failed: $errorMessage"
    
    # Optionally trigger automatic rollback for production
    if ($Environment -eq "production" -and !$RollbackVersion) {
        Write-Host "🔄 Triggering automatic rollback..." -ForegroundColor Yellow
        try {
            Invoke-Rollback -Version "previous"
            Test-Health
            Write-Host "✅ Automatic rollback completed" -ForegroundColor Green
        } catch {
            Write-Host "❌ Automatic rollback failed: $_" -ForegroundColor Red
        }
    }
    
    exit 1
}
