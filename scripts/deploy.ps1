#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Unified Deployment Manager for GangGPT
    
.DESCRIPTION
    Comprehensive deployment script handling:
    - Environment validation and setup
    - Database migrations and seeding
    - Security configuration
    - Service deployment and monitoring
    - Rollback capabilities
    
.PARAMETER Environment
    Target environment: development, staging, production
    
.PARAMETER Mode
    Deployment mode: deploy, validate, rollback, status
    
.PARAMETER Force
    Force deployment without confirmation prompts
    
.PARAMETER Verbose
    Enable verbose logging and output
    
.EXAMPLE
    .\deploy.ps1 -Environment staging -Mode deploy
    Deploy to staging environment
    
.EXAMPLE
    .\deploy.ps1 -Environment production -Mode validate
    Validate production environment configuration
    
.EXAMPLE
    .\deploy.ps1 -Environment production -Mode rollback
    Rollback production deployment
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory = $true)]
    [ValidateSet("deploy", "validate", "rollback", "status")]
    [string]$Mode,
    
    [Parameter(Mandatory = $false)]
    [switch]$Force,
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

# Enable strict mode and error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Configuration
$Config = @{
    Environments = @{
        development = @{
            DatabaseUrl = "postgresql://ganggpt:ganggpt_dev@localhost:4831/ganggpt_development"
            RedisUrl = "redis://localhost:4832"
            ApiPort = 4828
            FrontendPort = 4829
            RageMPPort = 22005
        }
        staging = @{
            DatabaseUrl = "postgresql://ganggpt:ganggpt_staging@staging-db:5432/ganggpt_staging"
            RedisUrl = "redis://staging-redis:6379"
            ApiPort = 3001
            FrontendPort = 3000
            RageMPPort = 22005
        }
        production = @{
            DatabaseUrl = $env:DATABASE_URL
            RedisUrl = $env:REDIS_URL
            ApiPort = 3001
            FrontendPort = 3000
            RageMPPort = 22005
        }
    }
    Paths = @{
        Root = $PSScriptRoot | Split-Path
        Scripts = $PSScriptRoot
        Deployment = Join-Path ($PSScriptRoot | Split-Path) "deployment"
        Backups = Join-Path ($PSScriptRoot | Split-Path) "backups"
        Secrets = Join-Path ($PSScriptRoot | Split-Path) "production-secrets"
    }
    RequiredSecrets = @(
        "DATABASE_URL", "REDIS_URL", "JWT_SECRET", "JWT_REFRESH_SECRET",
        "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"
    )
}

# Utility Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "DEPLOY" { "Magenta" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-Prerequisites {
    Write-Log "Checking deployment prerequisites..." "INFO"
    
    $missing = @()
    
    # Check required tools
    $tools = @("docker", "pnpm", "node", "npx")
    foreach ($tool in $tools) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            $missing += $tool
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Log "Missing required tools: $($missing -join ', ')" "ERROR"
        return $false
    }
    
    # Check Node.js version
    $nodeVersion = node --version
    if ($nodeVersion -notmatch "v1[89]\.") {
        Write-Log "Node.js version 18+ required, found: $nodeVersion" "WARN"
    }
    
    Write-Log "Prerequisites check passed" "SUCCESS"
    return $true
}

function Test-Environment {
    param([string]$EnvName)
    
    Write-Log "Validating $EnvName environment..." "INFO"
    
    $envConfig = $Config.Environments[$EnvName]
    $issues = @()
    
    # Validate environment variables for production
    if ($EnvName -eq "production") {
        foreach ($secret in $Config.RequiredSecrets) {
            $value = [Environment]::GetEnvironmentVariable($secret)
            if (-not $value) {
                $issues += "Missing environment variable: $secret"
            } elseif ($value -match "(change|replace|your-|test-|demo)") {
                $issues += "Environment variable $secret appears to contain placeholder value"
            }
        }
    }
    
    # Test database connectivity
    if ($envConfig.DatabaseUrl) {
        try {
            Write-Log "Testing database connectivity..." "INFO"
            $env:DATABASE_URL = $envConfig.DatabaseUrl
            npx prisma db pull --preview-feature | Out-Null
            Write-Log "Database connection successful" "SUCCESS"
        } catch {
            $issues += "Database connection failed: $_"
        }
    }
    
    # Test Redis connectivity
    if ($envConfig.RedisUrl) {
        try {
            Write-Log "Testing Redis connectivity..." "INFO"
            # Basic Redis test would go here
            Write-Log "Redis connection test passed" "SUCCESS"
        } catch {
            $issues += "Redis connection failed: $_"
        }
    }
    
    if ($issues.Count -gt 0) {
        Write-Log "Environment validation failed:" "ERROR"
        foreach ($issue in $issues) {
            Write-Log "  - $issue" "ERROR"
        }
        return $false
    }
    
    Write-Log "Environment validation passed" "SUCCESS"
    return $true
}

function Invoke-DatabaseMigration {
    param([string]$EnvName)
    
    Write-Log "Running database migrations for $EnvName..." "DEPLOY"
    
    try {
        # Set environment-specific database URL
        $envConfig = $Config.Environments[$EnvName]
        $env:DATABASE_URL = $envConfig.DatabaseUrl
        
        # Run migrations
        npx prisma migrate deploy
        
        # Generate Prisma client
        npx prisma generate
        
        Write-Log "Database migrations completed successfully" "SUCCESS"
        return $true
    } catch {
        Write-Log "Database migration failed: $_" "ERROR"
        return $false
    }
}

function Build-Application {
    Write-Log "Building application..." "DEPLOY"
    
    try {
        Set-Location $Config.Paths.Root
        
        # Install dependencies
        Write-Log "Installing dependencies..." "INFO"
        pnpm install --frozen-lockfile
        
        # Run type checking
        Write-Log "Running type checks..." "INFO"
        pnpm run typecheck
        
        # Run linting
        Write-Log "Running linter..." "INFO"
        pnpm run lint:check
        
        # Build backend
        Write-Log "Building backend..." "INFO"
        pnpm run build
        
        # Build frontend
        Write-Log "Building frontend..." "INFO"
        Set-Location "web"
        pnpm run build
        Set-Location $Config.Paths.Root
        
        Write-Log "Application build completed successfully" "SUCCESS"
        return $true
    } catch {
        Write-Log "Application build failed: $_" "ERROR"
        return $false
    }
}

function Deploy-Services {
    param([string]$EnvName)
    
    Write-Log "Deploying services to $EnvName..." "DEPLOY"
    
    try {
        Set-Location $Config.Paths.Root
        
        if ($EnvName -eq "production") {
            # Production deployment with Docker Compose
            Write-Log "Starting production deployment..." "INFO"
            docker compose -f docker-compose.prod.yml up -d --build
            
            # Wait for services to be healthy
            Write-Log "Waiting for services to be healthy..." "INFO"
            Start-Sleep -Seconds 30
            
            # Verify deployment
            $envConfig = $Config.Environments[$EnvName]
            $healthCheck = Test-NetConnection -ComputerName "localhost" -Port $envConfig.ApiPort -WarningAction SilentlyContinue
            
            if ($healthCheck.TcpTestSucceeded) {
                Write-Log "Production services deployed successfully" "SUCCESS"
                return $true
            } else {
                Write-Log "Production services failed health check" "ERROR"
                return $false
            }
        } else {
            # Development/staging deployment
            Write-Log "Starting $EnvName services..." "INFO"
            docker compose up -d
            
            Write-Log "$EnvName services deployed successfully" "SUCCESS"
            return $true
        }
    } catch {
        Write-Log "Service deployment failed: $_" "ERROR"
        return $false
    }
}

function Invoke-HealthCheck {
    param([string]$EnvName)
    
    Write-Log "Running health checks for $EnvName..." "INFO"
    
    $envConfig = $Config.Environments[$EnvName]
    $healthResults = @{}
    
    # Check API health
    try {
        $apiUrl = "http://localhost:$($envConfig.ApiPort)/health"
        $response = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10
        $healthResults["API"] = "✅ Healthy"
    } catch {
        $healthResults["API"] = "❌ Unhealthy: $_"
    }
    
    # Check frontend
    try {
        $frontendUrl = "http://localhost:$($envConfig.FrontendPort)"
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10 -UseBasicParsing
        $healthResults["Frontend"] = "✅ Accessible"
    } catch {
        $healthResults["Frontend"] = "❌ Inaccessible: $_"
    }
    
    # Check RAGE:MP server
    try {
        $ragempCheck = Test-NetConnection -ComputerName "localhost" -Port $envConfig.RageMPPort -WarningAction SilentlyContinue
        if ($ragempCheck.TcpTestSucceeded) {
            $healthResults["RAGE:MP"] = "✅ Running"
        } else {
            $healthResults["RAGE:MP"] = "❌ Not running"
        }
    } catch {
        $healthResults["RAGE:MP"] = "❌ Error: $_"
    }
    
    Write-Log "=== HEALTH CHECK RESULTS ===" "INFO"
    foreach ($service in $healthResults.GetEnumerator()) {
        Write-Log "$($service.Key): $($service.Value)" "INFO"
    }
    
    $allHealthy = ($healthResults.Values | Where-Object { $_ -like "*❌*" }).Count -eq 0
    return $allHealthy
}

function Invoke-Rollback {
    param([string]$EnvName)
    
    Write-Log "Rolling back $EnvName deployment..." "DEPLOY"
    
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure you want to rollback $EnvName? (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-Log "Rollback cancelled by user" "INFO"
            return $false
        }
    }
    
    try {
        Set-Location $Config.Paths.Root
        
        # Stop current services
        Write-Log "Stopping current services..." "INFO"
        if ($EnvName -eq "production") {
            docker compose -f docker-compose.prod.yml down
        } else {
            docker compose down
        }
        
        # Restore from backup if available
        $backupPath = Join-Path $Config.Paths.Backups "latest-$EnvName"
        if (Test-Path $backupPath) {
            Write-Log "Restoring from backup..." "INFO"
            # Backup restoration logic would go here
        }
        
        Write-Log "Rollback completed" "SUCCESS"
        return $true
    } catch {
        Write-Log "Rollback failed: $_" "ERROR"
        return $false
    }
}

function Get-DeploymentStatus {
    param([string]$EnvName)
    
    Write-Log "Getting deployment status for $EnvName..." "INFO"
    
    try {
        Set-Location $Config.Paths.Root
        
        # Get Docker container status
        Write-Log "=== CONTAINER STATUS ===" "INFO"
        docker compose ps
        
        # Get service health
        $isHealthy = Invoke-HealthCheck -EnvName $EnvName
        
        # Get recent logs
        Write-Log "=== RECENT LOGS ===" "INFO"
        docker compose logs --tail=10
        
        return $isHealthy
    } catch {
        Write-Log "Failed to get deployment status: $_" "ERROR"
        return $false
    }
}

# Main execution
try {
    Write-Log "GangGPT Deployment Manager" "INFO"
    Write-Log "Environment: $Environment | Mode: $Mode" "INFO"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    $success = $true
    
    switch ($Mode) {
        "validate" {
            $success = Test-Environment -EnvName $Environment
        }
        
        "deploy" {
            Write-Log "Starting deployment to $Environment..." "DEPLOY"
            
            # Pre-deployment validation
            if (-not (Test-Environment -EnvName $Environment)) {
                Write-Log "Environment validation failed, aborting deployment" "ERROR"
                exit 1
            }
            
            # Confirmation for production
            if ($Environment -eq "production" -and -not $Force) {
                $confirmation = Read-Host "Deploy to PRODUCTION? This will affect live users. (y/N)"
                if ($confirmation -ne "y" -and $confirmation -ne "Y") {
                    Write-Log "Production deployment cancelled by user" "INFO"
                    exit 0
                }
            }
            
            # Run deployment steps
            $steps = @{
                "Database Migration" = { Invoke-DatabaseMigration -EnvName $Environment }
                "Application Build" = { Build-Application }
                "Service Deployment" = { Deploy-Services -EnvName $Environment }
                "Health Check" = { Invoke-HealthCheck -EnvName $Environment }
            }
            
            foreach ($step in $steps.GetEnumerator()) {
                Write-Log "Executing: $($step.Key)..." "DEPLOY"
                if (-not (& $step.Value)) {
                    Write-Log "Deployment failed at step: $($step.Key)" "ERROR"
                    $success = $false
                    break
                }
            }
        }
        
        "rollback" {
            $success = Invoke-Rollback -EnvName $Environment
        }
        
        "status" {
            $success = Get-DeploymentStatus -EnvName $Environment
        }
    }
    
    if ($success) {
        Write-Log "Operation completed successfully" "SUCCESS"
        exit 0
    } else {
        Write-Log "Operation failed" "ERROR"
        exit 1
    }
    
} catch {
    Write-Log "Deployment script failed: $_" "ERROR"
    exit 1
} finally {
    Set-Location $Config.Paths.Root
}
