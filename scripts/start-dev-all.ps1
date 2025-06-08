#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start all GangGPT development services
.DESCRIPTION
    Starts Redis, Backend, Frontend, and RAGE:MP server for complete development environment
#>

Write-Host "🚀 Starting GangGPT Development Environment..." -ForegroundColor Green

# Change to project root
Set-Location $PSScriptRoot\..

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Redis is running
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if (-not $redisProcess) {
    Write-Host "📦 Starting Redis server..." -ForegroundColor Cyan
    if (Test-Path "redis-windows\redis-server.exe") {
        Start-Process -WindowStyle Hidden "redis-windows\redis-server.exe" "redis-windows\ganggpt-redis.conf"
        Start-Sleep 2
        $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
        if ($redisProcess) {
            Write-Host "✅ Redis started successfully (PID: $($redisProcess.Id))" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start Redis" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Redis not found, continuing with memory fallback" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Redis already running (PID: $($redisProcess.Id))" -ForegroundColor Green
}

# Check if PostgreSQL service is running (optional)
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL service running" -ForegroundColor Green
} else {
    Write-Host "ℹ️  PostgreSQL service not running (using SQLite)" -ForegroundColor Cyan
}

Write-Host "`n🔧 Building project..." -ForegroundColor Yellow
try {
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Starting services..." -ForegroundColor Yellow

# Start backend in background
Write-Host "🔧 Starting Backend (port 4828)..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    pnpm run dev
}

# Start frontend in background
Write-Host "🌐 Starting Frontend (port 4829)..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    cd web
    pnpm run dev
}

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep 10

# Check backend health
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4828/health" -TimeoutSec 5
    Write-Host "✅ Backend healthy: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not responding yet" -ForegroundColor Yellow
}

# Check frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4829" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend accessible (status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend not responding yet" -ForegroundColor Yellow
}

Write-Host "`n🎮 RAGE:MP Server Setup:" -ForegroundColor Magenta
if (Test-Path "ragemp-server\ragemp-server.exe") {
    Write-Host "✅ RAGE:MP server found" -ForegroundColor Green
    Write-Host "📋 To start RAGE:MP server manually:" -ForegroundColor Cyan
    Write-Host "   cd ragemp-server" -ForegroundColor Gray
    Write-Host "   .\ragemp-server.exe" -ForegroundColor Gray
    Write-Host "   Server will run on: 127.0.0.1:22005" -ForegroundColor Gray
} else {
    Write-Host "⚠️  RAGE:MP server not found in ragemp-server/" -ForegroundColor Yellow
    Write-Host "📥 Download from: https://rage.mp/files/server/" -ForegroundColor Cyan
}

Write-Host "`n🚀 Development Environment Ready!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔧 Backend:     http://localhost:4828" -ForegroundColor Cyan
Write-Host "🌐 Frontend:    http://localhost:4829" -ForegroundColor Cyan
Write-Host "🎮 RAGE:MP:     127.0.0.1:22005 (manual start)" -ForegroundColor Cyan
Write-Host "📦 Redis:       localhost:4832" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n⌨️  Commands:" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+C to stop services" -ForegroundColor Gray
Write-Host "  - Logs are in background jobs" -ForegroundColor Gray
Write-Host "  - Use 'Get-Job' to check job status" -ForegroundColor Gray
Write-Host "  - Use 'Receive-Job <ID>' to see job output" -ForegroundColor Gray

# Keep script running and show logs
Write-Host "`n📄 Monitoring services (Ctrl+C to exit)..." -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep 5
        
        # Check job status
        $backendStatus = (Get-Job -Id $backendJob.Id).State
        $frontendStatus = (Get-Job -Id $frontendJob.Id).State
        
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Backend: $backendStatus | Frontend: $frontendStatus" -ForegroundColor DarkGray
        
        if ($backendStatus -eq "Failed" -or $frontendStatus -eq "Failed") {
            Write-Host "❌ Service failure detected!" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host "`n🛑 Stopping services..." -ForegroundColor Yellow
} finally {
    # Cleanup
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Services stopped" -ForegroundColor Green
}
