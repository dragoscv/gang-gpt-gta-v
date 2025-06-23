#!/usr/bin/env pwsh
#
# RAGE:MP Server Restart with Advanced Debugging
# Restarts the server with enhanced logging and monitoring
#

param(
    [switch]$KillExisting = $true,
    [switch]$MonitorConnections = $true
)

Write-Host "🔄 RAGE:MP Advanced Server Restart" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Gray

# Kill existing RAGE:MP processes
if ($KillExisting) {
    Write-Host "🗡️ Stopping existing RAGE:MP processes..." -ForegroundColor Yellow
    Get-Process -Name "ragemp-server" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Ensure backend is running
Write-Host "🔍 Checking backend status..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:4828/health" -TimeoutSec 5 -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is healthy" -ForegroundColor Green
        $healthData = $healthResponse.Content | ConvertFrom-Json
        Write-Host "   Database: $(if($healthData.services.database.status -eq 'up') {'✅'} else {'❌'}) $($healthData.services.database.status)" -ForegroundColor $(if($healthData.services.database.status -eq 'up') {'Green'} else {'Red'})
        Write-Host "   Redis: $(if($healthData.services.redis.status -eq 'up') {'✅'} else {'❌'}) $($healthData.services.redis.status)" -ForegroundColor $(if($healthData.services.redis.status -eq 'up') {'Green'} else {'Red'})
        Write-Host "   AI: $(if($healthData.services.ai.status -eq 'up') {'✅'} else {'❌'}) $($healthData.services.ai.status)" -ForegroundColor $(if($healthData.services.ai.status -eq 'up') {'Green'} else {'Red'})
    }
} catch {
    Write-Host "❌ Backend is not responding - starting anyway" -ForegroundColor Red
}

# Create enhanced server configuration
$originalConfig = Get-Content ".\ragemp-server\conf.json" | ConvertFrom-Json
Write-Host "📋 Current server configuration:" -ForegroundColor Yellow
Write-Host "   Port: $($originalConfig.port)" -ForegroundColor Gray
Write-Host "   Bind: $($originalConfig.bind)" -ForegroundColor Gray
Write-Host "   Connection Timeout: $($originalConfig.'connection-timeout')" -ForegroundColor Gray
Write-Host "   Download Timeout: $($originalConfig.'download-timeout')" -ForegroundColor Gray

# Navigate to RAGE:MP server directory
Set-Location -Path ".\ragemp-server"

Write-Host "🚀 Starting RAGE:MP Server with enhanced debugging..." -ForegroundColor Green
Write-Host "   Monitoring for connection issues..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop server" -ForegroundColor Gray
Write-Host ""

# Start the server and capture output
if ($MonitorConnections) {
    # Start server in background for monitoring
    $serverProcess = Start-Process -FilePath ".\ragemp-server.exe" -PassThru -NoNewWindow
    
    Write-Host "🔍 Server started (PID: $($serverProcess.Id)) - Starting connection monitor..." -ForegroundColor Green
    
    # Monitor connections in parallel
    $monitorJob = Start-Job -ScriptBlock {
        param($serverPid)
        
        $lastCheck = Get-Date
        while (Get-Process -Id $serverPid -ErrorAction SilentlyContinue) {
            # Check for connections on port 22005
            $connections = netstat -an | Select-String "22005"
            $currentTime = Get-Date
            
            if ($connections) {
                foreach ($conn in $connections) {
                    if ($conn -match "ESTABLISHED") {
                        Write-Host "🔗 Active connection detected: $($conn.Line.Trim())" -ForegroundColor Green
                    }
                }
            }
            
            # Check every 2 seconds
            Start-Sleep -Seconds 2
        }
        
        Write-Host "⚠️ RAGE:MP Server process ended" -ForegroundColor Red
    } -ArgumentList $serverProcess.Id
    
    # Wait for server process
    try {
        $serverProcess.WaitForExit()
    } catch {
        Write-Host "Server monitoring interrupted: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        # Clean up monitoring job
        Stop-Job -Job $monitorJob -ErrorAction SilentlyContinue
        Remove-Job -Job $monitorJob -ErrorAction SilentlyContinue
    }
    
} else {
    # Start server normally
    & ".\ragemp-server.exe"
}

Write-Host ""
Write-Host "🛑 RAGE:MP Server stopped" -ForegroundColor Yellow

# Return to original directory
Set-Location -Path ".."
