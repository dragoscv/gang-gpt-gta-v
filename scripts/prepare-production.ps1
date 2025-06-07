# GangGPT Production Preparation Script for Windows
# This script helps prepare the environment for production deployment

# Configuration
$LogFile = ".\logs\production_prep_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').log"

# Create log directory if it doesn't exist
if (-not (Test-Path -Path ".\logs")) {
    New-Item -ItemType Directory -Path ".\logs" | Out-Null
}

# Log function
function Write-Log {
    param (
        [string]$Message,
        [ValidateSet("INFO", "WARNING", "ERROR")]
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp - $Level - $Message"
    
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Display a step header
function Show-StepHeader {
    param (
        [string]$Title,
        [int]$StepNumber,
        [int]$TotalSteps
    )
    
    Write-Host ""
    Write-Host "Step $StepNumber/$TotalSteps: $Title" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Log "Starting Step $StepNumber/$TotalSteps: $Title"
}

# Check if Docker is installed and running
function Test-DockerSetup {
    try {
        $dockerVersion = docker --version
        Write-Log "Docker is installed: $dockerVersion"
        
        $dockerPs = docker ps | Out-String
        if ($dockerPs -match "CONTAINER ID") {
            Write-Log "Docker is running properly"
            return $true
        } else {
            Write-Log "Docker might not be running properly" -Level "WARNING"
            return $false
        }
    } catch {
        Write-Log "Docker is not installed or not in PATH: $_" -Level "ERROR"
        return $false
    }
}

# Validate environment variables
function Test-EnvironmentVariables {
    $requiredVars = @(
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_DB",
        "REDIS_PASSWORD",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        if (-not $value) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Log "Missing required environment variables: $($missingVars -join ', ')" -Level "ERROR"
        return $false
    } else {
        Write-Log "All required environment variables are set"
        return $true
    }
}

# Generate secure secrets
function New-SecureSecrets {
    # Generate JWT secret
    $jwtSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    
    # Generate refresh token secret
    $refreshSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    
    # Generate Redis password
    $redisPassword = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    
    # Generate database password
    $dbPassword = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    
    Write-Log "Secure secrets generated"
    
    return @{
        JwtSecret = $jwtSecret
        RefreshSecret = $refreshSecret
        RedisPassword = $redisPassword
        DbPassword = $dbPassword
    }
}

# Check project dependencies
function Test-ProjectDependencies {
    # Check if package.json exists
    if (-not (Test-Path -Path ".\package.json")) {
        Write-Log "package.json not found in the current directory" -Level "ERROR"
        return $false
    }
    
    # Check if prisma directory exists
    if (-not (Test-Path -Path ".\prisma")) {
        Write-Log "prisma directory not found" -Level "ERROR"
        return $false
    }
    
    # Check if Docker configuration exists
    if (-not (Test-Path -Path ".\docker-compose.prod.yml")) {
        Write-Log "docker-compose.prod.yml not found" -Level "ERROR"
        return $false
    }
    
    Write-Log "All project dependencies found"
    return $true
}

# Prepare environment file for production
function Set-ProductionEnvironment {
    param (
        [hashtable]$Secrets
    )
    
    $envFile = ".\.env.production"
    
    if (Test-Path -Path $envFile) {
        $backup = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item -Path $envFile -Destination $backup
        Write-Log "Backup of existing .env.production created at $backup"
    }
    
    # Read existing .env.production if it exists, otherwise use .env.example
    if (Test-Path -Path $envFile) {
        $envContent = Get-Content -Path $envFile
    } elseif (Test-Path -Path ".\.env.example") {
        $envContent = Get-Content -Path ".\.env.example"
    } else {
        Write-Log "Neither .env.production nor .env.example found" -Level "ERROR"
        return $false
    }
    
    # Update environment variables
    $envContent = $envContent -replace "NODE_ENV=.*", "NODE_ENV=production"
    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$($Secrets.JwtSecret)"
    $envContent = $envContent -replace "JWT_REFRESH_SECRET=.*", "JWT_REFRESH_SECRET=$($Secrets.RefreshSecret)"
    $envContent = $envContent -replace "REDIS_PASSWORD=.*", "REDIS_PASSWORD=$($Secrets.RedisPassword)"
    
    # Write updated content to .env.production
    $envContent | Set-Content -Path $envFile
    Write-Log "Production environment file updated with secure secrets"
    
    return $true
}

# Test Docker build
function Test-DockerBuild {
    try {
        # Only build, don't run
        $buildOutput = docker-compose -f docker-compose.prod.yml build 2>&1
        Write-Log "Docker build completed successfully"
        return $true
    } catch {
        Write-Log "Docker build failed: $_" -Level "ERROR"
        return $false
    }
}

# Main function
function Start-ProductionPreparation {
    Write-Host "GangGPT Production Preparation Script" -ForegroundColor Green
    Write-Host "-------------------------------------" -ForegroundColor Green
    Write-Log "Starting production preparation script"
    
    $totalSteps = 5
    $success = $true
    
    # Step 1: Check Docker setup
    Show-StepHeader -Title "Checking Docker Setup" -StepNumber 1 -TotalSteps $totalSteps
    $dockerOk = Test-DockerSetup
    if (-not $dockerOk) {
        Write-Host "Docker is not properly set up. Please install and start Docker before continuing." -ForegroundColor Red
        $success = $false
    }
    
    # Step 2: Check project dependencies
    Show-StepHeader -Title "Checking Project Dependencies" -StepNumber 2 -TotalSteps $totalSteps
    $dependenciesOk = Test-ProjectDependencies
    if (-not $dependenciesOk) {
        Write-Host "Project dependencies check failed. Make sure you're in the correct directory." -ForegroundColor Red
        $success = $false
    }
    
    # Step 3: Generate secure secrets
    Show-StepHeader -Title "Generating Secure Secrets" -StepNumber 3 -TotalSteps $totalSteps
    $secrets = New-SecureSecrets
    
    Write-Host "Generated secrets (save these in a secure location):" -ForegroundColor Yellow
    Write-Host "JWT_SECRET=$($secrets.JwtSecret)" -ForegroundColor Yellow
    Write-Host "JWT_REFRESH_SECRET=$($secrets.RefreshSecret)" -ForegroundColor Yellow
    Write-Host "REDIS_PASSWORD=$($secrets.RedisPassword)" -ForegroundColor Yellow
    Write-Host "DATABASE_PASSWORD=$($secrets.DbPassword)" -ForegroundColor Yellow
    
    # Step 4: Update environment file
    Show-StepHeader -Title "Updating Production Environment File" -StepNumber 4 -TotalSteps $totalSteps
    $envOk = Set-ProductionEnvironment -Secrets $secrets
    if (-not $envOk) {
        Write-Host "Failed to update production environment file." -ForegroundColor Red
        $success = $false
    }
    
    # Step 5: Test Docker build
    Show-StepHeader -Title "Testing Docker Build" -StepNumber 5 -TotalSteps $totalSteps
    $buildOk = Test-DockerBuild
    if (-not $buildOk) {
        Write-Host "Docker build test failed. Please check the logs for details." -ForegroundColor Red
        $success = $false
    }
    
    # Final results
    Write-Host ""
    Write-Host "Production Preparation Results:" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    if ($success) {
        Write-Host "✅ All preparation steps completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Green
        Write-Host "1. Store the generated secrets in a secure credential manager" -ForegroundColor Green
        Write-Host "2. Configure Azure OpenAI API keys in your production environment" -ForegroundColor Green
        Write-Host "3. Configure Redis in your production environment" -ForegroundColor Green
        Write-Host "4. Run the deployment script: ./scripts/deploy-production.sh" -ForegroundColor Green
    } else {
        Write-Host "❌ Some preparation steps failed. Please fix the issues before deploying." -ForegroundColor Red
        Write-Host "   Check the log file for details: $LogFile" -ForegroundColor Red
    }
    
    Write-Log "Production preparation script completed with status: $($success ? 'SUCCESS' : 'FAILED')"
}

# Run the script
Start-ProductionPreparation
