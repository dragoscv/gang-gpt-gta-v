#!/usr/bin/env pwsh
#
# RAGE:MP Real-Time Connection Monitor
# Monitors server process, network connections, and logs
#

param(
    [switch]$Continuous = $false,
    [int]$IntervalSeconds = 5
)

Write-Host "🔍 RAGE:MP Connection Monitor Starting..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Gray

function Get-RageProcessInfo {
    $rageProcess = Get-Process -Name "ragemp-server" -ErrorAction SilentlyContinue
    if ($rageProcess) {
        return @{
            Running = $true
            PID = $rageProcess.Id
            CPU = $rageProcess.CPU
            Memory = [math]::Round($rageProcess.WorkingSet / 1MB, 2)
            StartTime = $rageProcess.StartTime
        }
    } else {
        return @{ Running = $false }
    }
}

function Get-NetworkConnections {
    $connections = netstat -an | Select-String "22005|4828|4829|4832"
    return $connections
}

function Get-NodeProcesses {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
                    Where-Object { $_.MainWindowTitle -like "*GangGPT*" -or $_.CommandLine -like "*gang*" }
    return $nodeProcesses
}

function Show-StatusReport {
    param($timestamp)
    
    Clear-Host
    Write-Host "🔍 RAGE:MP Monitor - $timestamp" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Gray
    
    # RAGE:MP Server Status
    $rageInfo = Get-RageProcessInfo
    if ($rageInfo.Running) {
        Write-Host "✅ RAGE:MP Server: RUNNING" -ForegroundColor Green
        Write-Host "   PID: $($rageInfo.PID) | CPU: $($rageInfo.CPU) | RAM: $($rageInfo.Memory)MB" -ForegroundColor Gray
        Write-Host "   Started: $($rageInfo.StartTime)" -ForegroundColor Gray
    } else {
        Write-Host "❌ RAGE:MP Server: NOT RUNNING" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Network Status
    Write-Host "🌐 Network Connections:" -ForegroundColor Yellow
    $connections = Get-NetworkConnections
    if ($connections) {
        foreach ($conn in $connections) {
            $line = $conn.Line.Trim()
            if ($line -match "22005") {
                Write-Host "   RAGE:MP: $line" -ForegroundColor Green
            } elseif ($line -match "LISTENING") {
                Write-Host "   Backend: $line" -ForegroundColor Blue
            } else {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   No connections found on monitored ports" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Service Health Check
    Write-Host "🏥 Service Health:" -ForegroundColor Yellow    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:4828/health" -TimeoutSec 3 -UseBasicParsing
        if ($healthResponse.StatusCode -eq 200) {
            $healthData = $healthResponse.Content | ConvertFrom-Json
            Write-Host "   Backend API: ✅ HEALTHY" -ForegroundColor Green
            Write-Host "   Database: $(if($healthData.database) {'✅'} else {'❌'}) $(if($healthData.database) {'CONNECTED'} else {'DISCONNECTED'})" -ForegroundColor $(if($healthData.database) {'Green'} else {'Red'})
            Write-Host "   Redis: $(if($healthData.redis) {'✅'} else {'❌'}) $(if($healthData.redis) {'CONNECTED'} else {'DISCONNECTED'})" -ForegroundColor $(if($healthData.redis) {'Green'} else {'Red'})
            Write-Host "   AI Service: $(if($healthData.ai) {'✅'} else {'❌'}) $(if($healthData.ai) {'CONNECTED'} else {'DISCONNECTED'})" -ForegroundColor $(if($healthData.ai) {'Green'} else {'Red'})
        }
    } catch {
        Write-Host "   Backend API: ❌ UNREACHABLE" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📊 Real-time Monitoring Active..." -ForegroundColor Magenta
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
}

# Main monitoring loop
if ($Continuous) {
    Write-Host "Starting continuous monitoring (every $IntervalSeconds seconds)..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    
    while ($true) {
        try {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Show-StatusReport $timestamp
            Start-Sleep -Seconds $IntervalSeconds
        } catch {
            Write-Host "Monitor interrupted: $($_.Exception.Message)" -ForegroundColor Red
            break
        }
    }
} else {
    # Single status check
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Show-StatusReport $timestamp
}

Write-Host ""
Write-Host "Monitor stopped." -ForegroundColor Yellow
