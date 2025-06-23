#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GangGPT Debug Monitor - Real-time diagnostics for RAGE:MP connection issues
.DESCRIPTION
    Comprehensive debugging and monitoring script that provides:
    - Real-time service status monitoring
    - Network connectivity diagnostics
    - RAGE:MP server specific debugging
    - Connection testing and validation
    - Live log monitoring with filtering
#>

param(
    [switch]$Continuous,
    [int]$RefreshInterval = 5,
    [switch]$ShowLogs,
    [switch]$TestConnections,
    [switch]$NetworkDiag
)

# Colors for output
$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Show-Header {
    Clear-Host
    Write-ColorText "╔══════════════════════════════════════════════════════════════╗" "Header"
    Write-ColorText "║                    🎮 GangGPT Debug Monitor                   ║" "Header"
    Write-ColorText "║                 RAGE:MP Connection Diagnostics               ║" "Header"
    Write-ColorText "╚══════════════════════════════════════════════════════════════╝" "Header"
    Write-Host ""
    Write-ColorText "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Monitoring Active" "Info"
    Write-Host ""
}

function Test-ServiceHealth {
    Write-ColorText "🔍 SERVICE STATUS DIAGNOSTICS" "Header"
    Write-ColorText "────────────────────────────────────────────────────────────" "Info"
    
    # Check if processes are running
    $services = @(
        @{ Name = "Node.js (Backend)"; Process = "node"; Port = 4828; Protocol = "TCP" }
        @{ Name = "Node.js (Frontend)"; Process = "node"; Port = 4829; Protocol = "TCP" }
        @{ Name = "Redis Server"; Process = "redis-server"; Port = 4832; Protocol = "TCP" }
        @{ Name = "RAGE:MP Server"; Process = "ragemp-server"; Port = 22005; Protocol = "UDP" }
    )
    
    foreach ($service in $services) {
        $process = Get-Process -Name $service.Process -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($process) {
            Write-ColorText "✅ $($service.Name): Running (PID: $($process.Id))" "Success"
        } else {
            Write-ColorText "❌ $($service.Name): Not Running" "Error"
        }
    }
    Write-Host ""
}

function Test-NetworkConnectivity {
    Write-ColorText "🌐 NETWORK CONNECTIVITY DIAGNOSTICS" "Header"
    Write-ColorText "────────────────────────────────────────────────────────────" "Info"
    
    $ports = @(
        @{ Port = 4828; Name = "Backend API"; Protocol = "TCP" }
        @{ Port = 4829; Name = "Frontend Web"; Protocol = "TCP" }
        @{ Port = 4832; Name = "Redis Cache"; Protocol = "TCP" }
        @{ Port = 22005; Name = "RAGE:MP Server"; Protocol = "UDP" }
    )
    
    foreach ($portTest in $ports) {
        if ($portTest.Protocol -eq "TCP") {
            try {
                $connection = Test-NetConnection -ComputerName "localhost" -Port $portTest.Port -InformationLevel Quiet -WarningAction SilentlyContinue
                if ($connection) {
                    Write-ColorText "✅ Port $($portTest.Port) ($($portTest.Name)): OPEN" "Success"
                } else {
                    Write-ColorText "❌ Port $($portTest.Port) ($($portTest.Name)): CLOSED" "Error"
                }
            } catch {
                Write-ColorText "❌ Port $($portTest.Port) ($($portTest.Name)): ERROR - $($_.Exception.Message)" "Error"
            }
        } else {
            # UDP port check using netstat
            $udpPort = netstat -an | Select-String ":$($portTest.Port)\s"
            if ($udpPort) {
                Write-ColorText "✅ Port $($portTest.Port) ($($portTest.Name)): LISTENING (UDP)" "Success"
            } else {
                Write-ColorText "❌ Port $($portTest.Port) ($($portTest.Name)): NOT LISTENING (UDP)" "Error"
            }
        }
    }
    Write-Host ""
}

function Test-APIEndpoints {
    Write-ColorText "🔗 API ENDPOINT TESTING" "Header"
    Write-ColorText "────────────────────────────────────────────────────────────" "Info"
    
    $endpoints = @(
        @{ Url = "http://localhost:4828/health"; Name = "Backend Health" }
        @{ Url = "http://localhost:4829"; Name = "Frontend Homepage" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -TimeoutSec 5 -ErrorAction Stop
            Write-ColorText "✅ $($endpoint.Name): HTTP $($response.StatusCode)" "Success"
        } catch {
            Write-ColorText "❌ $($endpoint.Name): FAILED - $($_.Exception.Message)" "Error"
        }
    }
    Write-Host ""
}

function Show-RAGEMPDiagnostics {
    Write-ColorText "🎮 RAGE:MP SPECIFIC DIAGNOSTICS" "Header"
    Write-ColorText "────────────────────────────────────────────────────────────" "Info"
    
    # Check for RAGE:MP server executable
    $ragempPaths = @(
        ".\packages\ganggpt\ragemp-server.exe",
        ".\ragemp-server.exe",
        "C:\RAGEMP\ragemp-server.exe"
    )
    
    $ragempFound = $false
    foreach ($path in $ragempPaths) {
        if (Test-Path $path) {
            Write-ColorText "✅ RAGE:MP Server found: $path" "Success"
            $ragempFound = $true
            break
        }
    }
    
    if (-not $ragempFound) {
        Write-ColorText "❌ RAGE:MP Server executable not found" "Error"
        Write-ColorText "   Expected locations:" "Warning"
        foreach ($path in $ragempPaths) {
            Write-ColorText "   - $path" "Warning"
        }
    }
    
    # Check configuration files
    $configPaths = @(
        ".\conf.json",
        ".\packages\ganggpt\conf.json"
    )
    
    foreach ($configPath in $configPaths) {
        if (Test-Path $configPath) {
            Write-ColorText "✅ Configuration file found: $configPath" "Success"
            try {
                $config = Get-Content $configPath | ConvertFrom-Json
                Write-ColorText "   Port: $($config.port)" "Info"
                Write-ColorText "   Max Players: $($config.maxplayers)" "Info"
                Write-ColorText "   Name: $($config.name)" "Info"
            } catch {
                Write-ColorText "   ⚠️  Configuration file exists but couldn't parse JSON" "Warning"
            }
        }
    }
    Write-Host ""
}

function Show-ProcessDetails {
    Write-ColorText "📊 PROCESS DETAILS" "Header"
    Write-ColorText "────────────────────────────────────────────────────────────" "Info"
    
    $processes = Get-Process | Where-Object { 
        $_.ProcessName -like "*node*" -or 
        $_.ProcessName -like "*redis*" -or 
        $_.ProcessName -like "*ragemp*" -or
        $_.ProcessName -like "*pnpm*"
    } | Sort-Object ProcessName
    
    if ($processes) {
        foreach ($proc in $processes) {
            $memory = [math]::Round($proc.WorkingSet64 / 1MB, 1)
            $cpu = try { $proc.CPU } catch { "N/A" }
            Write-ColorText "🔸 $($proc.ProcessName) (PID: $($proc.Id)) - Memory: ${memory}MB - CPU: $cpu" "Info"
        }
    } else {
        Write-ColorText "❌ No relevant processes found" "Error"
    }
    Write-Host ""
}

function Show-NetworkInterfaces {
    Write-ColorText "🔧 NETWORK INTERFACE DIAGNOSTICS" "Header"
    Write-ColorText "────────────────────────────────────────────────────────────" "Info"
    
    # Show active network adapters
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    foreach ($adapter in $adapters) {
        Write-ColorText "🔸 $($adapter.Name): $($adapter.InterfaceDescription)" "Info"
    }
    
    # Show listening ports
    Write-ColorText "`n📡 LISTENING PORTS:" "Info"
    $listening = netstat -an | Select-String "LISTENING|UDP.*:.*\*:.*"
    $listening | ForEach-Object {
        if ($_.Line -match ":4828|:4829|:4832|:22005") {
            Write-ColorText "🔸 $($_.Line.Trim())" "Success"
        }
    }
    Write-Host ""
}

function Start-RealTimeMonitoring {
    do {
        Show-Header
        Test-ServiceHealth
        Test-NetworkConnectivity
        Test-APIEndpoints
        Show-RAGEMPDiagnostics
        Show-ProcessDetails
        
        if ($NetworkDiag) {
            Show-NetworkInterfaces
        }
        
        if ($ShowLogs) {
            Write-ColorText "📝 RECENT LOG ENTRIES (Last 10)" "Header"
            Write-ColorText "────────────────────────────────────────────────────────────" "Info"
            if (Test-Path ".\logs") {
                Get-ChildItem ".\logs\*.log" | ForEach-Object {
                    if ($_.LastWriteTime -gt (Get-Date).AddMinutes(-5)) {
                        Write-ColorText "🔸 $($_.Name): Modified $($_.LastWriteTime)" "Info"
                        Get-Content $_.FullName -Tail 3 | ForEach-Object {
                            Write-ColorText "   $_" "Info"
                        }
                    }
                }
            }
            Write-Host ""
        }
        
        Write-ColorText "Press Ctrl+C to stop monitoring | Refreshing in $RefreshInterval seconds..." "Warning"
        Start-Sleep -Seconds $RefreshInterval
        
    } while ($Continuous)
}

# Main execution
if ($TestConnections) {
    Show-Header
    Test-NetworkConnectivity
    Test-APIEndpoints
} elseif ($NetworkDiag) {
    Show-Header
    Show-NetworkInterfaces
} elseif ($Continuous) {
    Start-RealTimeMonitoring
} else {
    Show-Header
    Test-ServiceHealth
    Test-NetworkConnectivity
    Test-APIEndpoints
    Show-RAGEMPDiagnostics
    Show-ProcessDetails
}

Write-ColorText "`n🎯 Debug monitor complete. Use -Continuous for real-time monitoring." "Success"
