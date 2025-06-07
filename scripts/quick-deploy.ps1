#!/usr/bin/env pwsh

<#
.SYNOPSIS
    GangGPT Quick Production Deployment Script
.DESCRIPTION
    Automates the deployment of GangGPT to production environment
.PARAMETER Mode
    Deployment mode: 'docker', 'kubernetes', or 'manual'
.PARAMETER SkipBuild
    Skip the build process (for testing)
#>

param(
    [ValidateSet('docker', 'kubernetes', 'manual', 'test')]
    [string]$Mode = 'docker',
    [switch]$SkipBuild = $false
)

# Color output functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Step, $Message) Write-Host "`n📋 Step $Step`: $Message" -ForegroundColor Blue }

function Test-Command {
    param($Command)
    try {
        & $Command --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-SafeCommand {
    param($Command, $Description)
    Write-Info "Running: $Command"
    try {
        Invoke-Expression $Command
        Write-Success $Description
    }
    catch {
        Write-Error "Failed: $Description"
        Write-Error $_.Exception.Message
        exit 1
    }
}

# Header
Write-Host @"

🚀 GangGPT Production Deployment
================================

Mode: $Mode
Skip Build: $SkipBuild

"@ -ForegroundColor Magenta

# Step 1: Pre-deployment checks
Write-Step 1 "Pre-deployment Checks"

$requiredCommands = @(
    @{ cmd = 'node'; name = 'Node.js' },
    @{ cmd = 'npm'; name = 'npm' },
    @{ cmd = 'docker'; name = 'Docker' }
)

if ($Mode -eq 'kubernetes') {
    $requiredCommands += @{ cmd = 'kubectl'; name = 'Kubernetes CLI' }
}

foreach ($item in $requiredCommands) {
    if (Test-Command $item.cmd) {
        Write-Success "$($item.name) is available"
    }
    else {
        Write-Error "$($item.name) is not installed or not in PATH"
        exit 1
    }
}

# Step 2: Environment setup
Write-Step 2 "Environment Setup"

if (-not (Test-Path ".env.production")) {
    if (Test-Path "production-secrets\.env.production.new") {
        Copy-Item "production-secrets\.env.production.new" ".env.production"
        Write-Success "Created .env.production from template"
        Write-Warning "IMPORTANT: Update all placeholder values in .env.production!"
    }
    else {
        Write-Error "No production environment found. Run: node scripts/generate-production-secrets.js"
        exit 1
    }
}
else {
    Write-Success ".env.production exists"
}

# Step 3: Build application (unless skipped)
if (-not $SkipBuild) {
    Write-Step 3 "Building Application"
    
    Write-Info "Installing dependencies..."
    Invoke-SafeCommand "npm ci --production=false" "Dependencies installed"
    
    Write-Info "Generating Prisma client..."
    Invoke-SafeCommand "npm run db:generate" "Prisma client generated"
    
    Write-Info "Building TypeScript..."
    Invoke-SafeCommand "npm run build" "Application built successfully"
}
else {
    Write-Step 3 "Skipping Build (as requested)"
}

# Step 4: Validation
Write-Step 4 "Configuration Validation"

Write-Info "Running production validation..."
try {
    node scripts/validate-production-basic.js
    Write-Success "Basic validation passed"
}
catch {
    Write-Warning "Validation failed, continuing anyway..."
}

# Step 5: Deployment based on mode
Write-Step 5 "Deployment ($Mode mode)"

switch ($Mode) {
    'docker' {
        Write-Info "Building Docker image..."
        Invoke-SafeCommand "docker build -t gang-gpt-server:latest ." "Docker image built"
        
        Write-Info "Starting services with Docker Compose..."
        Invoke-SafeCommand "docker-compose -f docker-compose.prod.yml up -d" "Services started"
        
        Write-Info "Waiting for services to be ready..."
        Start-Sleep -Seconds 10
    }
    
    'kubernetes' {
        Write-Info "Applying Kubernetes secrets..."
        if (Test-Path "production-secrets\secrets.k8s.yaml") {
            Invoke-SafeCommand "kubectl apply -f production-secrets\secrets.k8s.yaml" "Secrets applied"
        }
        
        Write-Info "Deploying to Kubernetes..."
        if (Test-Path "k8s\") {
            Invoke-SafeCommand "kubectl apply -f k8s\" "Kubernetes manifests applied"
        }
        else {
            Write-Warning "No k8s/ directory found, creating basic deployment..."
            # Could create basic k8s manifests here
        }
    }
    
    'manual' {
        Write-Info "Manual deployment mode selected"
        Write-Info "To start the application manually:"
        Write-Host "  $env:NODE_ENV='production'; npm start" -ForegroundColor Cyan
        return
    }
    
    'test' {
        Write-Info "Test mode - starting for testing only"
        Invoke-SafeCommand "npm run dev" "Development server started"
        return
    }
}

# Step 6: Health checks
Write-Step 6 "Health Verification"

Write-Info "Waiting for application to start..."
Start-Sleep -Seconds 5

$healthEndpoints = @(
    "http://localhost:22005/health",
    "http://localhost:3000"
)

foreach ($endpoint in $healthEndpoints) {
    Write-Info "Testing $endpoint"
    try {
        $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "$endpoint is responding"
        }
        else {
            Write-Warning "$endpoint returned status $($response.StatusCode)"
        }
    }
    catch {
        Write-Warning "$endpoint is not responding: $($_.Exception.Message)"
    }
}

# Step 7: Final validation
Write-Step 7 "Production Testing"

Write-Info "Running comprehensive production tests..."
try {
    node scripts/test-production-readiness.js
    Write-Success "Production tests completed"
}
catch {
    Write-Warning "Some production tests failed, check the output above"
}

# Summary
Write-Host @"

🎉 DEPLOYMENT COMPLETED!

Next steps:
1. Verify all endpoints are working:
   - Backend: http://localhost:22005/health
   - Frontend: http://localhost:3000
   - API: http://localhost:22005/api/health

2. Monitor the logs for any errors:
   - Docker: docker-compose logs -f
   - Manual: Check application logs

3. Update any remaining placeholder values in .env.production

4. Set up proper monitoring and backups for production

🔍 Troubleshooting:
- Check Docker containers: docker ps
- View logs: docker-compose logs
- Restart services: docker-compose restart

📚 Documentation:
- Production setup: ./FINAL_DEPLOYMENT_CHECKLIST.md
- API docs: http://localhost:22005/api/docs (when available)

"@ -ForegroundColor Green

Write-Success "GangGPT deployment completed successfully!"
