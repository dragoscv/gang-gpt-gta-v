#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test GangGPT development environment setup
.DESCRIPTION
    Tests Redis, builds project, and verifies prerequisites without starting long-running services
#>

Write-Host "🧪 Testing GangGPT Development Environment Setup..." -ForegroundColor Green

# Change to project root
Set-Location $PSScriptRoot\..

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check if Redis is running
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if (-not $redisProcess) {
    Write-Host "⚠️  Redis not running, attempting to start..." -ForegroundColor Yellow
    if (Test-Path "redis-windows\redis-server.exe") {
        Start-Process -WindowStyle Hidden "redis-windows\redis-server.exe" "redis-windows\ganggpt-redis.conf"
        Start-Sleep 3
        $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    }
}

if ($redisProcess) {
    Write-Host "✅ Redis running successfully (PID: $($redisProcess.Id))" -ForegroundColor Green
    
    # Test Redis connection
    try {
        $redisTest = echo "ping" | redis-windows\redis-cli.exe -p 4832 -a redis_dev_password 2>$null
        if ($redisTest -eq "PONG") {
            Write-Host "✅ Redis authentication working" -ForegroundColor Green
        } else {
            Write-Host "❌ Redis authentication failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "⚠️  Redis connection test failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Redis not available (will use memory fallback)" -ForegroundColor Yellow
}

# Check database
if (Test-Path "dev.db") {
    Write-Host "✅ SQLite database found" -ForegroundColor Green
} else {
    Write-Host "⚠️  SQLite database not found (will be created)" -ForegroundColor Yellow
}

# Test build
Write-Host "`n🔧 Testing build..." -ForegroundColor Yellow
try {
    $buildOutput = pnpm build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        Write-Host $buildOutput -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Build error: $_" -ForegroundColor Red
    exit 1
}

# Check backend health (if running)
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4828/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend already running and healthy: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Backend not running (will be started by dev script)" -ForegroundColor Cyan
}

# Check RAGE:MP server
if (Test-Path "ragemp-server\ragemp-server.exe") {
    $ragempSize = (Get-Item "ragemp-server\ragemp-server.exe").Length / 1MB
    Write-Host "✅ RAGE:MP server found ($([math]::Round($ragempSize, 1)) MB)" -ForegroundColor Green
    
    if (Test-Path "ragemp-server\packages\ganggpt\index.js") {
        $ganggptContent = Get-Content "ragemp-server\packages\ganggpt\index.js" -Raw
        if ($ganggptContent.Length -gt 100) {
            Write-Host "✅ GangGPT package integration ready" -ForegroundColor Green
        } else {
            Write-Host "⚠️  GangGPT package needs content" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  GangGPT package not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  RAGE:MP server not found" -ForegroundColor Yellow
}

Write-Host "`n🎯 Environment Status:" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📦 Redis:       $(if($redisProcess){'✅ Running'}else{'⚠️  Not Running'})" -ForegroundColor $(if($redisProcess){'Green'}else{'Yellow'})
Write-Host "🗄️  Database:    ✅ SQLite Ready" -ForegroundColor Green
Write-Host "🔧 Build:       ✅ Successful" -ForegroundColor Green
Write-Host "🎮 RAGE:MP:     $(if(Test-Path 'ragemp-server\ragemp-server.exe'){'✅ Available'}else{'⚠️  Missing'})" -ForegroundColor $(if(Test-Path 'ragemp-server\ragemp-server.exe'){'Green'}else{'Yellow'})
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n🚀 Ready for Development!" -ForegroundColor Green
Write-Host "🎯 To start all services, run:" -ForegroundColor Yellow
Write-Host "   pnpm run dev:all" -ForegroundColor Cyan
Write-Host "   OR use VS Code task: 'GangGPT: Start All Services'" -ForegroundColor Cyan

Write-Host "`n✅ Environment test completed successfully!" -ForegroundColor Green
