#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Unified Development Environment Manager for GangGPT
    
.DESCRIPTION
    This script provides comprehensive development environment management including:
    - Service startup and monitoring
    - Health checks and diagnostics
    - Watch mode for development
    - Environment validation
    
.PARAMETER Mode
    The operation mode: start, stop, restart, status, watch, health
    
.PARAMETER Service
    Specific service to target: all, backend, frontend, ragemp, redis, postgres
    
.PARAMETER VerboseOutput
    Enable verbose output and detailed logging
    
.EXAMPLE
    .\dev.ps1 -Mode start -Service all
    Start all development services
    
.EXAMPLE
    .\dev.ps1 -Mode watch -Service backend
    Start backend in watch mode with auto-reload
    
.EXAMPLE
    .\dev.ps1 -Mode health
    Run comprehensive health checks
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("start", "stop", "restart", "status", "watch", "health")]
    [string]$Mode,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("all", "backend", "frontend", "ragemp", "redis", "postgres")]
    [string]$Service = "all",
    
    [Parameter(Mandatory = $false)]
    [switch]$VerboseOutput
)

# Enable strict mode and error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Configuration
$Config = @{
    Ports = @{
        Backend = 4828
        Frontend = 4829
        RAGEMP = 22005
        Redis = 4832
        Postgres = 4831
    }
    Paths = @{
        Root = $PSScriptRoot | Split-Path
        Scripts = $PSScriptRoot
        RageMP = Join-Path ($PSScriptRoot | Split-Path) "ragemp-server"
        Web = Join-Path ($PSScriptRoot | Split-Path) "web"
        Logs = Join-Path ($PSScriptRoot | Split-Path) "logs"
    }
    Services = @{
        Backend = @{ Name = "GangGPT Backend"; Command = "pnpm run dev"; Path = "" }
        Frontend = @{ Name = "GangGPT Frontend"; Command = "pnpm run dev"; Path = "web" }
        RAGEMP = @{ Name = "RAGE:MP Server"; Command = ".\ragemp_v.exe"; Path = "ragemp-server" }
        Redis = @{ Name = "Redis Server"; Command = "redis-server"; Path = "" }
        Postgres = @{ Name = "PostgreSQL"; Command = "docker"; Args = @("compose", "up", "postgres", "-d") }
    }
}

# Utility Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-Port {
    param([int]$Port, [string]$ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName "127.0.0.1" -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Log "$ServiceName is running on port $Port" "SUCCESS"
            return $true
        } else {
            Write-Log "$ServiceName is not accessible on port $Port" "WARN"
            return $false
        }
    } catch {
        Write-Log "Failed to test $ServiceName on port $Port`: $_" "ERROR"
        return $false
    }
}

function Get-ServiceStatus {
    param([string]$ServiceName = "all")
    
    Write-Log "Checking service status..." "INFO"
    
    $results = @{}
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "backend") {
        $results.Backend = Test-Port -Port $Config.Ports.Backend -ServiceName "Backend API"
    }
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "frontend") {
        $results.Frontend = Test-Port -Port $Config.Ports.Frontend -ServiceName "Frontend Web"
    }
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "ragemp") {
        $results.RAGEMP = Test-Port -Port $Config.Ports.RAGEMP -ServiceName "RAGE:MP Server"
    }
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "redis") {
        $results.Redis = Test-Port -Port $Config.Ports.Redis -ServiceName "Redis Cache"
    }
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "postgres") {
        $results.Postgres = Test-Port -Port $Config.Ports.Postgres -ServiceName "PostgreSQL Database"
    }
    
    return $results
}

function Start-Service {
    param([string]$ServiceName)
    
    Write-Log "Starting $ServiceName service..." "INFO"
    
    switch ($ServiceName) {
        "backend" {
            Set-Location $Config.Paths.Root
            Write-Log "Starting Backend API on port $($Config.Ports.Backend)..." "INFO"
            Start-Process -FilePath "pnpm" -ArgumentList @("run", "dev") -NoNewWindow
        }
        
        "frontend" {
            Set-Location $Config.Paths.Web
            Write-Log "Starting Frontend Web on port $($Config.Ports.Frontend)..." "INFO"
            Start-Process -FilePath "pnpm" -ArgumentList @("run", "dev") -NoNewWindow
        }
        
        "ragemp" {
            Set-Location $Config.Paths.RageMP
            Write-Log "Starting RAGE:MP Server on port $($Config.Ports.RAGEMP)..." "INFO"
            Start-Process -FilePath ".\ragemp_v.exe" -NoNewWindow
        }
        
        "redis" {
            Write-Log "Starting Redis Server..." "INFO"
            $redisPath = Join-Path $Config.Paths.Root "redis-windows"
            if (Test-Path $redisPath) {
                Set-Location $redisPath
                Start-Process -FilePath ".\redis-server.exe" -ArgumentList @(".\ganggpt-redis.conf") -NoNewWindow
            } else {
                Write-Log "Redis not found locally, starting with Docker..." "WARN"
                Set-Location $Config.Paths.Root
                docker compose up redis -d
            }
        }
        
        "postgres" {
            Write-Log "Starting PostgreSQL Database..." "INFO"
            Set-Location $Config.Paths.Root
            docker compose up postgres -d
        }
        
        "all" {
            Start-Service "postgres"
            Start-Sleep -Seconds 3
            Start-Service "redis"
            Start-Sleep -Seconds 2
            Start-Service "backend"
            Start-Sleep -Seconds 5
            Start-Service "frontend"
            Start-Sleep -Seconds 3
            Start-Service "ragemp"
        }
    }
}

function Stop-Service {
    param([string]$ServiceName)
    
    Write-Log "Stopping $ServiceName service..." "INFO"
    
    switch ($ServiceName) {
        "backend" {
            Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*4828*" } | Stop-Process -Force
        }
        
        "frontend" {
            Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*4829*" } | Stop-Process -Force
        }
        
        "ragemp" {
            Get-Process | Where-Object { $_.ProcessName -like "*ragemp*" } | Stop-Process -Force
        }
        
        "redis" {
            Set-Location $Config.Paths.Root
            docker compose stop redis
            Get-Process | Where-Object { $_.ProcessName -like "*redis*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        }
        
        "postgres" {
            Set-Location $Config.Paths.Root
            docker compose stop postgres
        }
        
        "all" {
            docker compose down
            Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*ragemp*" -or $_.ProcessName -like "*redis*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        }
    }
}

function Start-WatchMode {
    param([string]$ServiceName)
    
    Write-Log "Starting $ServiceName in watch mode..." "INFO"
    
    switch ($ServiceName) {
        "backend" {
            Set-Location $Config.Paths.Root
            pnpm run dev:watch:backend
        }
        
        "frontend" {
            Set-Location $Config.Paths.Web
            pnpm run dev
        }
        
        "ragemp" {
            Set-Location $Config.Paths.RageMP
            # Start RAGE:MP with file watching for package changes
            $watcher = New-Object System.IO.FileSystemWatcher
            $watcher.Path = Join-Path $Config.Paths.RageMP "packages"
            $watcher.Filter = "*.js"
            $watcher.EnableRaisingEvents = $true
            
            Start-Process -FilePath ".\ragemp_v.exe" -NoNewWindow
            Write-Log "RAGE:MP started with file watching enabled" "SUCCESS"
        }
        
        "all" {
            Start-Service "postgres"
            Start-Service "redis"
            
            # Start backend in watch mode
            Start-Job -ScriptBlock { 
                Set-Location $using:Config.Paths.Root
                pnpm run dev:watch:backend 
            }
            
            # Start frontend in watch mode
            Start-Job -ScriptBlock { 
                Set-Location $using:Config.Paths.Web
                pnpm run dev 
            }
            
            Start-Sleep -Seconds 5
            Start-WatchMode "ragemp"
        }
    }
}

function Test-Health {
    Write-Log "Running comprehensive health checks..." "INFO"
    
    $healthResults = @{
        Services = Get-ServiceStatus
        Environment = @{}
        Dependencies = @{}
    }
    
    # Check environment variables
    $envVars = @("DATABASE_URL", "REDIS_URL", "AZURE_OPENAI_ENDPOINT", "JWT_SECRET")
    foreach ($var in $envVars) {
        $value = [Environment]::GetEnvironmentVariable($var)
        $healthResults.Environment[$var] = if ($value) { "✅ Set" } else { "❌ Missing" }
    }
    
    # Check dependencies
    try {
        $nodeVersion = node --version
        $healthResults.Dependencies["Node.js"] = "✅ $nodeVersion"
    } catch {
        $healthResults.Dependencies["Node.js"] = "❌ Not found"
    }
    
    try {
        $pnpmVersion = pnpm --version
        $healthResults.Dependencies["pnpm"] = "✅ $pnpmVersion"
    } catch {
        $healthResults.Dependencies["pnpm"] = "❌ Not found"
    }
    
    # Test API endpoints
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$($Config.Ports.Backend)/health" -TimeoutSec 5
        $healthResults.Services["Backend API"] = "✅ Healthy"
    } catch {
        $healthResults.Services["Backend API"] = "❌ Unhealthy"
    }
    
    # Display results
    Write-Log "=== HEALTH CHECK RESULTS ===" "INFO"
    
    Write-Log "Services:" "INFO"
    foreach ($service in $healthResults.Services.GetEnumerator()) {
        Write-Log "  $($service.Key): $($service.Value)" "INFO"
    }
    
    Write-Log "Environment:" "INFO"
    foreach ($env in $healthResults.Environment.GetEnumerator()) {
        Write-Log "  $($env.Key): $($env.Value)" "INFO"
    }
    
    Write-Log "Dependencies:" "INFO"
    foreach ($dep in $healthResults.Dependencies.GetEnumerator()) {
        Write-Log "  $($dep.Key): $($dep.Value)" "INFO"
    }
    
    return $healthResults
}

# Main execution
try {
    Write-Log "GangGPT Development Environment Manager" "INFO"
    Write-Log "Mode: $Mode | Service: $Service" "INFO"
    
    switch ($Mode) {
        "start" {
            Start-Service -ServiceName $Service
            Start-Sleep -Seconds 5
            Get-ServiceStatus -ServiceName $Service
        }
        
        "stop" {
            Stop-Service -ServiceName $Service
        }
        
        "restart" {
            Stop-Service -ServiceName $Service
            Start-Sleep -Seconds 3
            Start-Service -ServiceName $Service
            Start-Sleep -Seconds 5
            Get-ServiceStatus -ServiceName $Service
        }
        
        "status" {
            Get-ServiceStatus -ServiceName $Service
        }
        
        "watch" {
            Start-WatchMode -ServiceName $Service
        }
        
        "health" {
            Test-Health
        }
    }
    
    Write-Log "Operation completed successfully" "SUCCESS"
    
} catch {
    Write-Log "Operation failed: $_" "ERROR"
    exit 1
} finally {
    # Return to original location
    Set-Location $Config.Paths.Root
}
