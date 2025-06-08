#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check status of all GangGPT services
.DESCRIPTION
    Quickly check if Redis, Backend, Frontend, and RAGE:MP services are running
#>

Write-Host "🔍 GangGPT Services Status Check" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Check Redis
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
if ($redisProcess) {
    try {
        $redisTest = echo "ping" | redis-windows\redis-cli.exe -p 4832 -a redis_dev_password 2>$null
        if ($redisTest -eq "PONG") {
            Write-Host "📦 Redis:       ✅ Running (PID: $($redisProcess.Id)) - Connection OK" -ForegroundColor Green
        } else {
            Write-Host "📦 Redis:       ⚠️  Running but connection failed" -ForegroundColor Yellow
        }    } catch {
        Write-Host "📦 Redis:       ⚠️  Running but cannot test connection" -ForegroundColor Yellow
    }
} else {
    Write-Host "📦 Redis:       ❌ Not running" -ForegroundColor Red
}

# Check Backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4828/health" -TimeoutSec 3
    Write-Host "🔧 Backend:     ✅ Running - Status: $($response.status)" -ForegroundColor Green
} catch {
    $backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.ts*" -or $_.CommandLine -like "*dist/server.js*" }
    if ($backendProcess) {
        Write-Host "🔧 Backend:     ⚠️  Process running but not responding" -ForegroundColor Yellow
    } else {
        Write-Host "🔧 Backend:     ❌ Not running" -ForegroundColor Red
    }
}

# Check Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4829" -TimeoutSec 3 -UseBasicParsing
    Write-Host "🌐 Frontend:    ✅ Running - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" }
    if ($frontendProcess) {
        Write-Host "🌐 Frontend:    ⚠️  Process running but not responding" -ForegroundColor Yellow
    } else {
        Write-Host "🌐 Frontend:    ❌ Not running" -ForegroundColor Red
    }
}

# Check RAGE:MP Server
$ragempProcess = Get-Process -Name "ragemp-server" -ErrorAction SilentlyContinue
if ($ragempProcess) {
    Write-Host "🎮 RAGE:MP:     ✅ Running (PID: $($ragempProcess.Id))" -ForegroundColor Green
} else {
    if (Test-Path "ragemp-server\ragemp-server.exe") {
        Write-Host "🎮 RAGE:MP:     ❌ Not running (executable available)" -ForegroundColor Red
    } else {
        Write-Host "🎮 RAGE:MP:     ❌ Not available (executable missing)" -ForegroundColor Red
    }
}

# Check ports
Write-Host "`n📊 Port Status:" -ForegroundColor Yellow
$ports = @(4828, 4829, 4832, 22005)
$portNames = @("Backend", "Frontend", "Redis", "RAGE:MP")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $name = $portNames[$i]
    
    $listening = netstat -an | findstr ":$port " | findstr "LISTENING"
    if ($listening) {
        Write-Host "   Port $port ($name): ✅ Listening" -ForegroundColor Green
    } else {
        Write-Host "   Port $port ($name): ❌ Not listening" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Quick Actions:" -ForegroundColor Yellow
Write-Host "   Start all:     pnpm run dev:all" -ForegroundColor Cyan
Write-Host "   Backend only:  pnpm run dev" -ForegroundColor Cyan
Write-Host "   Frontend only: cd web && pnpm run dev" -ForegroundColor Cyan
Write-Host "   Test env:      pwsh scripts/test-dev-environment.ps1" -ForegroundColor Cyan
