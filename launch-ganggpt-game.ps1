#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Launch GangGPT Game Client
.DESCRIPTION
    Launches RAGE:MP client and connects to the GangGPT server
.PARAMETER ServerAddress
    Server address to connect to (default: localhost:22005)
.PARAMETER SkipUpdater
    Skip using the updater and launch directly
#>

param(
    [string]$ServerAddress = "localhost:22005",
    [switch]$SkipUpdater
)

Write-Host "🎮 GangGPT Game Launcher" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Local RAGE:MP executable (prioritized)
$localRagePath = Join-Path $PSScriptRoot "ragemp_v.exe"

# Common RAGE:MP paths (fallback)
$rageUpdaterPaths = @(
    "C:\RAGEMP\updater.exe",
    "C:\RageMP\updater.exe", 
    "C:\Program Files\RAGE Multiplayer\updater.exe",
    "C:\Program Files (x86)\RAGE Multiplayer\updater.exe"
)

$rageClientPaths = @(
    $localRagePath,  # Local project executable first
    "C:\RAGEMP\ragemp_v.exe",
    "C:\RageMP\ragemp_v.exe",
    "C:\Program Files\RAGE Multiplayer\ragemp_v.exe", 
    "C:\Program Files (x86)\RAGE Multiplayer\ragemp_v.exe"
)

function Find-RageMP {
    Write-Host "🔍 Looking for RAGE:MP installation..." -ForegroundColor Cyan
    
    # First check for local project executable
    if (Test-Path $localRagePath) {
        Write-Host "✅ Found local RAGE:MP client: $localRagePath" -ForegroundColor Green
        Write-Host "🎯 Using project-local executable (recommended)" -ForegroundColor Cyan
        return @{ Type = "Client"; Path = $localRagePath }
    }
    
    # Try to find updater second (if user wants to use external installation)
    if (-not $SkipUpdater) {
        foreach ($path in $rageUpdaterPaths) {
            if (Test-Path $path) {
                Write-Host "✅ Found RAGE:MP updater: $path" -ForegroundColor Green
                return @{ Type = "Updater"; Path = $path }
            }
        }
    }
    
    # Try to find external client executable
    foreach ($path in $rageClientPaths[1..($rageClientPaths.Length-1)]) {  # Skip local path (already checked)
        if (Test-Path $path) {
            Write-Host "✅ Found RAGE:MP client: $path" -ForegroundColor Green
            return @{ Type = "Client"; Path = $path }
        }
    }
    
    return $null
}

function Test-ServerConnection {
    param([string]$Address)
    
    Write-Host "🔌 Testing connection to $Address..." -ForegroundColor Cyan
      $parts = $Address -split ":"
    $serverHost = $parts[0]
    $port = if ($parts.Length -gt 1) { $parts[1] } else { "22005" }
    
    try {
        $tcpTest = Test-NetConnection -ComputerName $serverHost -Port $port -WarningAction SilentlyContinue
        if ($tcpTest.TcpTestSucceeded) {
            Write-Host "✅ Server is reachable" -ForegroundColor Green
            return $true
        }
    } catch {
        # TCP test failed, but RAGE:MP uses UDP primarily
    }
    
    # Check if server is actually listening (for UDP we can't easily test)
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4828/api/game/state" -TimeoutSec 3
        if ($response) {
            Write-Host "✅ GangGPT backend is responding" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "⚠️  Could not verify server status, but continuing..." -ForegroundColor Yellow
    }
    
    return $false
}

function Test-ExistingRageMP {
    Write-Host "🔍 Checking for existing RAGE:MP instances..." -ForegroundColor Cyan
    
    # Check for updater processes
    $updaterProcesses = Get-Process -Name "updater" -ErrorAction SilentlyContinue
    # Check for RAGE:MP client processes
    $clientProcesses = Get-Process -Name "ragemp_v" -ErrorAction SilentlyContinue
    
    if ($updaterProcesses -or $clientProcesses) {
        Write-Host "⚠️  Found existing RAGE:MP processes:" -ForegroundColor Yellow
        
        if ($updaterProcesses) {
            foreach ($proc in $updaterProcesses) {
                Write-Host "   • Updater (PID: $($proc.Id))" -ForegroundColor Gray
            }
        }
        
        if ($clientProcesses) {
            foreach ($proc in $clientProcesses) {
                Write-Host "   • Client (PID: $($proc.Id))" -ForegroundColor Gray
            }
        }
        
        $response = Read-Host "Kill existing processes and continue? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Write-Host "🛑 Terminating existing RAGE:MP processes..." -ForegroundColor Yellow
            
            if ($updaterProcesses) {
                $updaterProcesses | Stop-Process -Force
                Write-Host "   ✅ Terminated updater processes" -ForegroundColor Green
            }
            
            if ($clientProcesses) {
                $clientProcesses | Stop-Process -Force
                Write-Host "   ✅ Terminated client processes" -ForegroundColor Green
            }
            
            # Wait a moment for processes to fully terminate
            Start-Sleep -Seconds 2
            return $true
        } else {
            Write-Host "❌ Cannot launch while other instances are running" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host "✅ No existing RAGE:MP processes found" -ForegroundColor Green
    return $true
}

function Launch-RageMP {
    param(
        [hashtable]$RageInfo,
        [string]$Server
    )
    
    Write-Host "🚀 Launching RAGE:MP..." -ForegroundColor Green
    
    if ($RageInfo.Type -eq "Updater") {
        # Use the correct RAGE:MP protocol format
        $launchCommand = "`"$($RageInfo.Path)`" ragemp://$Server/"
        Write-Host "📋 Command: $launchCommand" -ForegroundColor Gray
        
        try {
            Start-Process -FilePath $RageInfo.Path -ArgumentList "ragemp://$Server/" -ErrorAction Stop
            Write-Host "✅ RAGE:MP updater launched successfully!" -ForegroundColor Green
            Write-Host "ℹ️  If prompted, allow the updater to download and launch the game" -ForegroundColor Cyan
            return $true
        } catch {
            Write-Host "❌ Failed to launch updater: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
        
    } elseif ($RageInfo.Type -eq "Client") {
        # Direct client launch with server parameter and admin privileges
        try {
            Write-Host "🔑 Requesting administrator privileges for RAGE:MP client..." -ForegroundColor Yellow
            Start-Process -FilePath $RageInfo.Path -ArgumentList "--connect", $Server -Verb RunAs -ErrorAction Stop
            Write-Host "✅ RAGE:MP client launched successfully with admin privileges!" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed to launch client: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "💡 Make sure to click 'Yes' when prompted for administrator privileges" -ForegroundColor Cyan
            return $false
        }
    }
    
    return $false
}

# Main execution
try {
    # Check for existing RAGE:MP processes first
    if (-not (Test-ExistingRageMP)) {
        exit 1
    }
    
    # Check server connection
    Test-ServerConnection -Address $ServerAddress | Out-Null
    
    # Find RAGE:MP installation
    $rageInfo = Find-RageMP
    
    if (-not $rageInfo) {
        Write-Host "❌ RAGE:MP not found!" -ForegroundColor Red
        Write-Host "📥 Please download and install RAGE:MP from: https://rage.mp/" -ForegroundColor Yellow
        Write-Host "💡 After installation, run this script again" -ForegroundColor Cyan
        
        # Offer to open download page
        $response = Read-Host "Open RAGE:MP download page? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Start-Process "https://rage.mp/"
        }
        
        exit 1
    }
    
    # Launch the game
    $success = Launch-RageMP -RageInfo $rageInfo -Server $ServerAddress
    
    if ($success) {
        Write-Host "`n🎮 Game launching..." -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "📋 Next Steps:" -ForegroundColor Yellow
        Write-Host "  1. Wait for RAGE:MP to download updates (if needed)" -ForegroundColor Gray
        Write-Host "  2. Wait for GTA V to launch" -ForegroundColor Gray
        Write-Host "  3. Once in-game, you should auto-connect to the server" -ForegroundColor Gray
        Write-Host "  4. Type /ai hello to test the AI system" -ForegroundColor Gray
        Write-Host "`n🎯 Server: $ServerAddress" -ForegroundColor Cyan
        Write-Host "🌐 Web Interface: http://localhost:4829" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Failed to launch game" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
