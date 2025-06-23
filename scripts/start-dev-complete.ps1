#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete GangGPT Development Environment Startup
.DESCRIPTION
    Starts ALL services including Redis, Backend, Frontend, and RAGE:MP server with proper connection flow
    Ensures services start in correct order and verifies connectivity before proceeding
#>

param(
    [switch]$SkipBuild,
    [switch]$Verbose,
    [int]$WaitTime = 15
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

Write-Host "🚀 GangGPT Complete Development Environment" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Change to project root
Set-Location $PSScriptRoot\..

function Write-StatusMessage {
    param([string]$Message, [string]$Status = "Info")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Status) {
        "Success" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "Error" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "Warning" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "Info" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        "Progress" { Write-Host "[$timestamp] 🔄 $Message" -ForegroundColor Blue }
    }
}

function Test-ServiceHealth {
    param([string]$Url, [string]$ServiceName, [int]$TimeoutSec = 5)
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        Write-StatusMessage "$ServiceName is healthy" "Success"
        return $true
    } catch {
        Write-StatusMessage "$ServiceName not responding: $($_.Exception.Message)" "Warning"
        return $false
    }
}

function Wait-ForPort {
    param([int]$Port, [string]$ServiceName, [int]$MaxWaitSec = 30)
    Write-StatusMessage "Waiting for $ServiceName on port $Port..." "Progress"
    $waited = 0
    while ($waited -lt $MaxWaitSec) {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-StatusMessage "$ServiceName is listening on port $Port" "Success"
            return $true
        }
        Start-Sleep 2
        $waited += 2
    }
    Write-StatusMessage "$ServiceName failed to start on port $Port after ${MaxWaitSec}s" "Error"
    return $false
}

# 1. Prerequisites Check
Write-StatusMessage "Checking prerequisites..." "Info"

# Check Node.js and pnpm
try {
    $nodeVersion = node --version
    $pnpmVersion = pnpm --version
    Write-StatusMessage "Node.js: $nodeVersion | pnpm: $pnpmVersion" "Success"
} catch {
    Write-StatusMessage "Node.js or pnpm not found. Please install them first." "Error"
    exit 1
}

# 2. Start Redis if needed
Write-StatusMessage "Setting up Redis..." "Info"
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if (-not $redisProcess) {
    if (Test-Path "redis-windows\redis-server.exe") {
        Write-StatusMessage "Starting Redis server..." "Progress"
        Start-Process -WindowStyle Hidden "redis-windows\redis-server.exe" "redis-windows\ganggpt-redis.conf"
        Start-Sleep 3
        $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
        if ($redisProcess) {
            Write-StatusMessage "Redis started (PID: $($redisProcess.Id))" "Success"
        } else {
            Write-StatusMessage "Redis failed to start" "Warning"
        }
    } else {
        Write-StatusMessage "Redis not found, using memory fallback" "Warning"
    }
} else {
    Write-StatusMessage "Redis already running (PID: $($redisProcess.Id))" "Success"
}

# 3. Build project if needed
if (-not $SkipBuild) {
    Write-StatusMessage "Building project..." "Progress"
    try {
        pnpm install
        pnpm build
        Write-StatusMessage "Build completed successfully" "Success"
    } catch {
        Write-StatusMessage "Build failed: $_" "Error"
        exit 1
    }
} else {
    Write-StatusMessage "Skipping build (--SkipBuild specified)" "Info"
}

# 4. Start Backend
Write-StatusMessage "Starting Backend API server..." "Progress"
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:NODE_ENV = "development"
    $env:LOG_LEVEL = "info"
    pnpm run dev
}

# Wait for backend to be ready
Start-Sleep 8
if (-not (Wait-ForPort -Port 4828 -ServiceName "Backend" -MaxWaitSec 20)) {
    Write-StatusMessage "Backend failed to start" "Error"
    exit 1
}

# Verify backend health
if (-not (Test-ServiceHealth -Url "http://localhost:4828/health" -ServiceName "Backend")) {
    Write-StatusMessage "Backend health check failed" "Error"
    exit 1
}

# 5. Start Frontend
Write-StatusMessage "Starting Frontend web server..." "Progress"
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd web
    $env:NODE_ENV = "development"
    $env:NEXT_PUBLIC_API_URL = "http://localhost:4828"
    pnpm run dev
}

# Wait for frontend to be ready
Start-Sleep 8
if (-not (Wait-ForPort -Port 4829 -ServiceName "Frontend" -MaxWaitSec 20)) {
    Write-StatusMessage "Frontend failed to start" "Error"
    exit 1
}

# 6. Start RAGE:MP Server
Write-StatusMessage "Starting RAGE:MP game server..." "Progress"
if (-not (Test-Path "ragemp-server\ragemp-server.exe")) {
    Write-StatusMessage "RAGE:MP server not found at ragemp-server\ragemp-server.exe" "Error"
    Write-StatusMessage "Please download and extract RAGE:MP server from https://rage.mp/files/server/" "Info"
    exit 1
}

# Start RAGE:MP server in background
$rageJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd ragemp-server
    .\ragemp-server.exe
}

# Wait for RAGE:MP server to bind to port 22005
Start-Sleep 5
$portCheck = 0
$maxPortChecks = 10
while ($portCheck -lt $maxPortChecks) {
    $netstatOutput = netstat -an | Select-String "22005"
    if ($netstatOutput) {
        Write-StatusMessage "RAGE:MP server is listening on port 22005" "Success"
        break
    }
    $portCheck++
    Start-Sleep 2
}

if ($portCheck -eq $maxPortChecks) {
    Write-StatusMessage "RAGE:MP server failed to bind to port 22005" "Error"
    Write-StatusMessage "Checking RAGE:MP server logs..." "Info"
    $rageLogs = Receive-Job $rageJob -ErrorAction SilentlyContinue
    if ($rageLogs) {
        Write-Host $rageLogs -ForegroundColor Gray
    }
} else {
    Write-StatusMessage "RAGE:MP server started successfully" "Success"
}

# 7. Final health checks and service verification
Write-StatusMessage "Running final service verification..." "Progress"

# Test all endpoints
$backendHealth = Test-ServiceHealth -Url "http://localhost:4828/health" -ServiceName "Backend API"
$frontendHealth = Test-NetConnection -ComputerName "localhost" -Port 4829 -WarningAction SilentlyContinue
$rageHealthy = (netstat -an | Select-String "22005") -ne $null

Write-Host "`n🎯 Service Status Summary:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if ($backendHealth) {
    Write-Host "✅ Backend API:     http://localhost:4828 (READY)" -ForegroundColor Green
} else {
    Write-Host "❌ Backend API:     http://localhost:4828 (FAILED)" -ForegroundColor Red
}

if ($frontendHealth.TcpTestSucceeded) {
    Write-Host "✅ Frontend Web:    http://localhost:4829 (READY)" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend Web:    http://localhost:4829 (FAILED)" -ForegroundColor Red
}

if ($rageHealthy) {
    Write-Host "✅ RAGE:MP Server:  127.0.0.1:22005 (READY)" -ForegroundColor Green
} else {
    Write-Host "❌ RAGE:MP Server:  127.0.0.1:22005 (FAILED)" -ForegroundColor Red
}

if ($redisProcess) {
    Write-Host "✅ Redis Cache:     localhost:4832 (READY)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis Cache:     localhost:4832 (FALLBACK)" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# 8. Test backend connectivity from RAGE:MP
Write-StatusMessage "Testing RAGE:MP ↔ Backend connectivity..." "Progress"
try {
    $testResult = Invoke-RestMethod -Uri "http://localhost:4828/api/game/state" -TimeoutSec 5
    Write-StatusMessage "Backend game API is responding correctly" "Success"
    if ($Verbose) {
        Write-Host "Response: $($testResult | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
} catch {
    Write-StatusMessage "Backend game API test failed: $($_.Exception.Message)" "Warning"
}

# 9. Open browser to frontend
Write-StatusMessage "Opening frontend in browser..." "Info"
Start-Process "http://localhost:4829"

Write-Host "`n🚀 GangGPT Development Environment is READY!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n📋 Quick Start Guide:" -ForegroundColor Yellow
Write-Host "1. Frontend is now open in your browser (http://localhost:4829)" -ForegroundColor Cyan
Write-Host "2. Click 'Launch Game' to start RAGE:MP client and connect" -ForegroundColor Cyan
Write-Host "3. The game will automatically connect to 127.0.0.1:22005" -ForegroundColor Cyan
Write-Host "4. Use /ai [message] in-game to test AI integration" -ForegroundColor Cyan

Write-Host "`n⌨️  Management Commands:" -ForegroundColor Yellow
Write-Host "  • Ctrl+C:          Stop all services" -ForegroundColor Gray
Write-Host "  • Get-Job:         Check service status" -ForegroundColor Gray
Write-Host "  • Receive-Job <ID>: View service logs" -ForegroundColor Gray

Write-Host "`n📊 Live Monitoring (Press Ctrl+C to stop)..." -ForegroundColor Blue

# 10. Live monitoring loop
try {
    $lastCheck = Get-Date
    while ($true) {
        Start-Sleep 10
        
        $currentTime = Get-Date
        if (($currentTime - $lastCheck).TotalMinutes -ge 1) {
            # Check services every minute
            $backendJob = Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
            $frontendJob = Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
            $rageJob = Get-Job -Id $rageJob.Id -ErrorAction SilentlyContinue
            
            $timestamp = Get-Date -Format "HH:mm:ss"
            $status = "Backend: $($backendJob.State) | Frontend: $($frontendJob.State) | RAGE:MP: $($rageJob.State)"
            Write-Host "[$timestamp] 📊 $status" -ForegroundColor DarkGray
            
            # Check for failures
            if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed" -or $rageJob.State -eq "Failed") {
                Write-StatusMessage "Service failure detected!" "Error"
                
                if ($backendJob.State -eq "Failed") {
                    Write-Host "Backend logs:" -ForegroundColor Red
                    Receive-Job $backendJob | Write-Host -ForegroundColor Gray
                }
                if ($frontendJob.State -eq "Failed") {
                    Write-Host "Frontend logs:" -ForegroundColor Red
                    Receive-Job $frontendJob | Write-Host -ForegroundColor Gray
                }
                if ($rageJob.State -eq "Failed") {
                    Write-Host "RAGE:MP logs:" -ForegroundColor Red
                    Receive-Job $rageJob | Write-Host -ForegroundColor Gray
                }
                break
            }
            
            $lastCheck = $currentTime
        }
    }
} catch {
    Write-StatusMessage "Monitoring interrupted" "Info"
} finally {
    # Cleanup
    Write-StatusMessage "Stopping all services..." "Progress"
    
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Stop-Job $rageJob -ErrorAction SilentlyContinue
    
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $rageJob -ErrorAction SilentlyContinue
    
    # Stop Redis if we started it
    if ($redisProcess -and -not (Get-Process -Name "redis-server" -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $redisProcess.Id })) {
        Write-StatusMessage "Stopping Redis..." "Progress"
        Stop-Process -Id $redisProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    Set-Location $OriginalLocation
    Write-StatusMessage "All services stopped. Environment cleaned up." "Success"
}
