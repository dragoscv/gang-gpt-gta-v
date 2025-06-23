#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GangGPT Debug Startup - Verbose debugging mode for RAGE:MP server issues
.DESCRIPTION
    Starts all services with maximum debugging and logging enabled
    Includes network diagnostics, verbose RAGE:MP logging, and real-time monitoring
#>

param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$RAGEMPOnly,
    [switch]$ForceIPv4,
    [string]$LogLevel = "debug"
)

# Configuration
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logDir = ".\logs\debug-$timestamp"
$colors = @{
    Success = "Green"; Warning = "Yellow"; Error = "Red"; Info = "Cyan"; Header = "Magenta"
}

function Write-DebugLog {
    param([string]$Message, [string]$Level = "INFO", [string]$Color = "White")
    $timeStamp = Get-Date -Format "HH:mm:ss.fff"
    $logMessage = "[$timeStamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $colors[$Color]
    Add-Content -Path "$logDir\debug.log" -Value $logMessage
}

function Initialize-DebugEnvironment {
    Write-DebugLog "🚀 Initializing GangGPT Debug Environment" "INFO" "Header"
    
    # Create debug log directory
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        Write-DebugLog "Created debug log directory: $logDir" "INFO" "Success"
    }
    
    # Kill any existing processes
    Write-DebugLog "Terminating existing processes..." "INFO" "Warning"
    Get-Process -Name "node", "redis-server", "ragemp-server" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # Network diagnostics
    Write-DebugLog "Running network diagnostics..." "INFO" "Info"
    Test-NetworkSetup
}

function Test-NetworkSetup {
    Write-DebugLog "🔍 Network Setup Diagnostics" "INFO" "Header"
    
    # Check if ports are available
    $requiredPorts = @(4828, 4829, 4832, 22005)
    foreach ($port in $requiredPorts) {
        $listening = netstat -an | Select-String ":$port"
        if ($listening) {
            Write-DebugLog "⚠️  Port $port is already in use: $($listening.Line.Trim())" "WARN" "Warning"
        } else {
            Write-DebugLog "✅ Port $port is available" "INFO" "Success"
        }
    }
    
    # Test network interfaces
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    Write-DebugLog "Active network adapters:" "INFO" "Info"
    foreach ($adapter in $adapters) {
        Write-DebugLog "  - $($adapter.Name): $($adapter.InterfaceDescription)" "INFO" "Info"
    }
    
    # Check firewall status
    try {
        $firewallStatus = Get-NetFirewallProfile | Select-Object Name, Enabled
        foreach ($profile in $firewallStatus) {
            Write-DebugLog "Firewall Profile $($profile.Name): $($profile.Enabled)" "INFO" "Info"
        }
    } catch {
        Write-DebugLog "Could not check firewall status: $($_.Exception.Message)" "WARN" "Warning"
    }
}

function Start-RedisWithDebug {
    if ($RAGEMPOnly) { return }
    
    Write-DebugLog "🗄️  Starting Redis server with debug logging..." "INFO" "Header"
    
    $redisConfig = @"
port 4832
bind 127.0.0.1
save 900 1
save 300 10
save 60 10000
loglevel debug
logfile $logDir/redis.log
"@
    
    $redisConfig | Out-File -FilePath "$logDir\redis.conf" -Encoding utf8
    
    $redisArgs = @(
        "$logDir\redis.conf"
        "--loglevel", "debug"
        "--port", "4832"
    )
    
    $redisProcess = Start-Process -FilePath "redis-server" -ArgumentList $redisArgs -PassThru -WindowStyle Minimized
    Write-DebugLog "Redis server started (PID: $($redisProcess.Id))" "INFO" "Success"
    Start-Sleep -Seconds 2
    
    # Test Redis connection
    try {
        $redisTest = redis-cli -p 4832 ping
        if ($redisTest -eq "PONG") {
            Write-DebugLog "✅ Redis connection test successful" "INFO" "Success"
        } else {
            Write-DebugLog "❌ Redis connection test failed: $redisTest" "ERROR" "Error"
        }
    } catch {
        Write-DebugLog "❌ Redis connection test error: $($_.Exception.Message)" "ERROR" "Error"
    }
}

function Start-BackendWithDebug {
    if ($SkipBackend -or $RAGEMPOnly) { return }
    
    Write-DebugLog "⚙️  Starting backend server with debug logging..." "INFO" "Header"
    
    # Set debug environment variables
    $env:DEBUG = "ganggpt:*,trpc:*,prisma:*"
    $env:LOG_LEVEL = $LogLevel
    $env:NODE_ENV = "development"
    $env:VERBOSE_LOGGING = "true"
    
    $backendArgs = @(
        "--trace-warnings"
        "--inspect=0.0.0.0:9229"
        ".\src\server.ts"
    )
    
    $backendProcess = Start-Process -FilePath "pnpm" -ArgumentList (@("tsx") + $backendArgs) -PassThru -WindowStyle Normal
    Write-DebugLog "Backend server started (PID: $($backendProcess.Id)) with debugging on port 9229" "INFO" "Success"
    Start-Sleep -Seconds 5
    
    # Test backend health
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:4828/health" -Method GET -TimeoutSec 10
        Write-DebugLog "✅ Backend health check: $($healthResponse.status)" "INFO" "Success"
    } catch {
        Write-DebugLog "❌ Backend health check failed: $($_.Exception.Message)" "ERROR" "Error"
    }
}

function Start-FrontendWithDebug {
    if ($SkipFrontend -or $RAGEMPOnly) { return }
    
    Write-DebugLog "🌐 Starting frontend server with debug logging..." "INFO" "Header"
    
    $env:NEXT_DEBUG = "true"
    $env:NODE_ENV = "development"
    
    $frontendProcess = Start-Process -FilePath "pnpm" -ArgumentList @("--filter", "web", "dev") -PassThru -WindowStyle Normal
    Write-DebugLog "Frontend server started (PID: $($frontendProcess.Id))" "INFO" "Success"
    Start-Sleep -Seconds 5
    
    # Test frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:4829" -Method GET -TimeoutSec 10
        Write-DebugLog "✅ Frontend test: HTTP $($frontendResponse.StatusCode)" "INFO" "Success"
    } catch {
        Write-DebugLog "❌ Frontend test failed: $($_.Exception.Message)" "ERROR" "Error"
    }
}

function Start-RAGEMPWithDebug {
    Write-DebugLog "🎮 Starting RAGE:MP server with verbose debugging..." "INFO" "Header"
    
    # Create enhanced RAGE:MP configuration
    $ragempConfig = @{
        "port" = 22005
        "name" = "GangGPT AI-Powered Server [DEBUG MODE]"
        "gamemode" = "ganggpt"
        "maxplayers" = 100
        "announce" = $false
        "voice-chat" = $true
        "allow-cef-debugging" = $true
        "enable-http-security" = $false
        "csharp" = "dotnet"
        "nodejs" = "on"
        "sync-rate" = 60
        "resource-scan-thread-limit" = 0
        "max-ping" = 150
        "min-fps" = 30
        "bind" = if ($ForceIPv4) { "0.0.0.0" } else { "0.0.0.0" }
        "debug" = $true
        "console-logging" = $true
        "log-level" = "debug"
        "log-file" = "$logDir\ragemp.log"
    }
    
    # Save debug configuration
    $ragempConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath ".\conf-debug.json" -Encoding utf8
    Write-DebugLog "Created debug configuration: conf-debug.json" "INFO" "Info"
    
    # Check for RAGE:MP server executable
    $ragempPaths = @(
        ".\packages\ganggpt\ragemp-server.exe",
        ".\ragemp-server.exe",
        "C:\RAGEMP\ragemp-server.exe"
    )
    
    $ragempExe = $null
    foreach ($path in $ragempPaths) {
        if (Test-Path $path) {
            $ragempExe = $path
            Write-DebugLog "Found RAGE:MP server: $path" "INFO" "Success"
            break
        }
    }
    
    if (-not $ragempExe) {
        Write-DebugLog "❌ RAGE:MP server executable not found!" "ERROR" "Error"
        Write-DebugLog "Expected locations:" "ERROR" "Error"
        foreach ($path in $ragempPaths) {
            Write-DebugLog "  - $path" "ERROR" "Error"
        }
        return
    }
    
    # Start RAGE:MP server with debug flags
    $ragempArgs = @(
        "--debug"
        "--console"
        "--config", "conf-debug.json"
        "--log-level", "debug"
    )
    
    Write-DebugLog "Starting RAGE:MP with arguments: $($ragempArgs -join ' ')" "INFO" "Info"
    
    $ragempProcess = Start-Process -FilePath $ragempExe -ArgumentList $ragempArgs -PassThru -WindowStyle Normal -WorkingDirectory (Get-Location)
    Write-DebugLog "RAGE:MP server started (PID: $($ragempProcess.Id))" "INFO" "Success"
    
    # Monitor RAGE:MP startup
    Start-Sleep -Seconds 3
    
    # Check if UDP port is listening
    $udpCheck = netstat -an | Select-String "UDP.*:22005"
    if ($udpCheck) {
        Write-DebugLog "✅ RAGE:MP server is listening on UDP port 22005" "INFO" "Success"
        Write-DebugLog "Port status: $($udpCheck.Line.Trim())" "INFO" "Info"
    } else {
        Write-DebugLog "❌ RAGE:MP server is NOT listening on UDP port 22005" "ERROR" "Error"
    }
    
    # Show connection info
    Write-DebugLog "🎯 RAGE:MP Connection Information:" "INFO" "Header"
    Write-DebugLog "   Server IP: 127.0.0.1 (localhost)" "INFO" "Info"
    Write-DebugLog "   Port: 22005" "INFO" "Info"
    Write-DebugLog "   Connection String: 127.0.0.1:22005" "INFO" "Info"
    
    if ($ForceIPv4) {
        Write-DebugLog "   IPv4 Mode: FORCED" "INFO" "Warning"
    }
}

function Start-DebugMonitoring {
    Write-DebugLog "📊 Starting real-time debug monitoring..." "INFO" "Header"
    
    # Start monitoring script in background
    Start-Process -FilePath "pwsh" -ArgumentList @("-ExecutionPolicy", "Bypass", "-File", ".\scripts\debug-monitor.ps1", "-Continuous", "-ShowLogs") -WindowStyle Normal
    
    Write-DebugLog "Debug monitor started in separate window" "INFO" "Success"
}

function Show-DebugSummary {
    Write-DebugLog "📋 Debug Session Summary" "INFO" "Header"
    Write-DebugLog "Debug logs location: $logDir" "INFO" "Info"
    Write-DebugLog "Configuration files created:" "INFO" "Info"
    Write-DebugLog "  - conf-debug.json (RAGE:MP)" "INFO" "Info"
    Write-DebugLog "  - $logDir\redis.conf (Redis)" "INFO" "Info"
    Write-DebugLog "" "INFO" "Info"
    Write-DebugLog "🔍 Troubleshooting Tips:" "INFO" "Header"
    Write-DebugLog "1. Check debug logs in: $logDir" "INFO" "Info"
    Write-DebugLog "2. Verify firewall allows ports 4828, 4829, 4832, 22005" "INFO" "Info"
    Write-DebugLog "3. Try connecting with RAGE:MP client to: 127.0.0.1:22005" "INFO" "Info"
    Write-DebugLog "4. Check if antivirus is blocking RAGE:MP server" "INFO" "Info"
    Write-DebugLog "5. Ensure GTA V is running before connecting" "INFO" "Info"
    Write-DebugLog "" "INFO" "Info"
    Write-DebugLog "Press Ctrl+C to stop all services" "INFO" "Warning"
}

# Main execution
try {
    Initialize-DebugEnvironment
    
    Write-DebugLog "🚀 Starting services in debug mode..." "INFO" "Header"
    
    # Start services in order
    Start-RedisWithDebug
    Start-BackendWithDebug
    Start-FrontendWithDebug
    Start-RAGEMPWithDebug
    
    # Start monitoring
    Start-DebugMonitoring
    
    Show-DebugSummary
    
    # Keep script running
    Write-DebugLog "✅ All services started in debug mode. Monitoring active..." "INFO" "Success"
    
    # Wait for user input to stop
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if processes are still running
        $processes = Get-Process -Name "node", "redis-server", "ragemp-server" -ErrorAction SilentlyContinue
        if ($processes.Count -eq 0) {
            Write-DebugLog "⚠️  All processes have stopped. Restarting..." "WARN" "Warning"
            break
        }
    }
    
} catch {
    Write-DebugLog "❌ Fatal error in debug startup: $($_.Exception.Message)" "ERROR" "Error"
    Write-DebugLog "Stack trace: $($_.ScriptStackTrace)" "ERROR" "Error"
} finally {
    Write-DebugLog "🛑 Cleaning up debug session..." "INFO" "Warning"
}
