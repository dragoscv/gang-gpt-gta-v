#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GangGPT Development Environment with Watch Mode
.DESCRIPTION
    Starts all services (Redis, Backend, Frontend, RAGE:MP) with automatic restart on file changes.
    Implements comprehensive watch mode for live development with hot reloading.
.PARAMETER SkipBuild
    Skip initial build process
.PARAMETER Verbose
    Enable verbose logging
.PARAMETER NoRageMP
    Skip RAGE:MP server startup (for web-only development)
.EXAMPLE
    .\start-dev-watch.ps1
    .\start-dev-watch.ps1 -Verbose -SkipBuild
#>

param(
    [switch]$SkipBuild,
    [switch]$Verbose,
    [switch]$NoRageMP,
    [int]$WaitTime = 10
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

# Enhanced logging function
function Write-WatchLog {
    param([string]$Message, [string]$Service = "WATCH", [string]$Level = "Info")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    $color = switch ($Level) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "Cyan" }
        "Progress" { "Blue" }
        "Debug" { "DarkGray" }
        default { "White" }
    }
    $icon = switch ($Level) {
        "Success" { "✅" }
        "Error" { "❌" }
        "Warning" { "⚠️" }
        "Info" { "ℹ️" }
        "Progress" { "🔄" }
        "Debug" { "🔍" }
        default { "📋" }
    }
    Write-Host "[$timestamp] [$Service] $icon $Message" -ForegroundColor $color
}

function Test-ServiceHealth {
    param([string]$Url, [string]$ServiceName, [int]$TimeoutSec = 3)
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Wait-ForPort {
    param([int]$Port, [string]$ServiceName, [int]$MaxWaitSec = 30)
    $waited = 0
    while ($waited -lt $MaxWaitSec) {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-WatchLog "$ServiceName ready on port $Port" $ServiceName "Success"
            return $true
        }
        Start-Sleep 2
        $waited += 2
    }
    Write-WatchLog "Failed to start on port $Port after ${MaxWaitSec}s" $ServiceName "Error"
    return $false
}

function Stop-ServiceJob {
    param([System.Management.Automation.Job]$Job, [string]$ServiceName)
    if ($Job -and $Job.State -eq "Running") {
        Write-WatchLog "Stopping $ServiceName..." $ServiceName "Warning"
        Stop-Job $Job -Force
        Remove-Job $Job -Force
    }
}

# Enhanced error handling and cross-platform support
function Test-CommandAvailable {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Get-ProcessByPort {
    param([int]$Port)
    try {
        if ($IsWindows -or $env:OS -eq "Windows_NT") {
            $result = netstat -ano | Select-String ":$Port " | Select-Object -First 1
            if ($result) {
                $processId = ($result.Line -split '\s+')[-1]
                return Get-Process -Id $processId -ErrorAction SilentlyContinue
            }
        } else {
            $result = lsof -i :$Port -t 2>/dev/null
            if ($result) {
                return Get-Process -Id $result -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Write-WatchLog "Error checking port $Port`: $_" "SYSTEM" "Warning"
    }
    return $null
}

function Stop-ProcessGracefully {
    param([System.Diagnostics.Process]$Process, [string]$ServiceName, [int]$TimeoutSec = 10)
    
    if (-not $Process) { return }
    
    try {
        Write-WatchLog "Stopping $ServiceName gracefully..." $ServiceName "Warning"
        
        # Try graceful shutdown first
        if (-not $Process.HasExited) {
            $Process.CloseMainWindow()
            $Process.WaitForExit($TimeoutSec * 1000)
        }
        
        # Force kill if still running
        if (-not $Process.HasExited) {
            Write-WatchLog "Force killing $ServiceName..." $ServiceName "Warning"
            $Process.Kill()
            $Process.WaitForExit(5000)
        }
        
        Write-WatchLog "$ServiceName stopped successfully" $ServiceName "Success"
    } catch {
        Write-WatchLog "Error stopping $ServiceName`: $_" $ServiceName "Error"
    }
}

function Test-ServiceReady {
    param([string]$Url, [string]$ServiceName, [int]$MaxAttempts = 10, [int]$DelaySeconds = 2)
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 3 -ErrorAction Stop
            Write-WatchLog "$ServiceName is ready (attempt $i/$MaxAttempts)" $ServiceName "Success"
            return $true
        } catch {
            if ($i -eq $MaxAttempts) {
                Write-WatchLog "$ServiceName failed to become ready after $MaxAttempts attempts" $ServiceName "Error"
                return $false
            }
            Write-WatchLog "$ServiceName not ready, retrying... (attempt $i/$MaxAttempts)" $ServiceName "Debug"
            Start-Sleep $DelaySeconds
        }
    }
    return $false
}

function Start-ServiceWithRetry {
    param([scriptblock]$StartScript, [string]$ServiceName, [int]$MaxRetries = 3)
    
    for ($retry = 1; $retry -le $MaxRetries; $retry++) {
        try {
            Write-WatchLog "Starting $ServiceName (attempt $retry/$MaxRetries)..." $ServiceName "Progress"
            & $StartScript
            return $true
        } catch {
            Write-WatchLog "Failed to start $ServiceName (attempt $retry/$MaxRetries): $_" $ServiceName "Error"
            if ($retry -eq $MaxRetries) {
                Write-WatchLog "$ServiceName failed to start after $MaxRetries attempts" $ServiceName "Error"
                return $false
            }
            Start-Sleep 5
        }
    }
    return $false
}

# Enhanced file watcher with better performance and reliability
function Start-SmartFileWatcher {
    param(
        [string]$Path, 
        [string[]]$Extensions, 
        [string[]]$ExcludePatterns,
        [scriptblock]$Action, 
        [string]$ServiceName,
        [int]$DebounceMs = 1000
    )
    
    if (-not (Test-Path $Path)) {
        Write-WatchLog "Path does not exist: $Path" $ServiceName "Warning"
        return $null
    }
    
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $Path
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    
    # Enhanced debounce mechanism with per-file tracking
    $script:changeTracker = @{}
    $script:pendingChanges = @{}
    
    $actionBlock = {
        $eventPath = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType
        $fileName = Split-Path $eventPath -Leaf
        $extension = [System.IO.Path]::GetExtension($eventPath)
        $now = Get-Date
        
        # Check if file extension is in our watch list
        if ($using:Extensions -and $using:Extensions.Count -gt 0) {
            if ($extension -notin $using:Extensions) {
                return
            }
        }
        
        # Check exclude patterns
        foreach ($pattern in $using:ExcludePatterns) {
            if ($eventPath -match $pattern) {
                return
            }
        }
        
        # Enhanced debounce: track per file and batch changes
        $fileKey = $eventPath.ToLower()
        if ($script:changeTracker[$fileKey] -and 
            ($now - $script:changeTracker[$fileKey]).TotalMilliseconds -lt $using:DebounceMs) {
            return
        }
        $script:changeTracker[$fileKey] = $now
        
        # Queue change for batch processing
        $script:pendingChanges[$fileKey] = @{
            Path = $eventPath
            FileName = $fileName
            ChangeType = $changeType
            Timestamp = $now
        }
        
        # Process changes after debounce period
        Start-Sleep -Milliseconds ($using:DebounceMs / 2)
        
        if ($script:pendingChanges.Count -gt 0) {
            $changes = $script:pendingChanges.Values
            $script:pendingChanges.Clear()
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss.fff')] [$using:ServiceName] 🔍 Files changed: $($changes.Count) files" -ForegroundColor Blue
            foreach ($change in $changes | Select-Object -First 3) {
                Write-Host "  📄 $($change.FileName) ($($change.ChangeType))" -ForegroundColor DarkGray
            }
            if ($changes.Count -gt 3) {
                Write-Host "  📄 ... and $($changes.Count - 3) more files" -ForegroundColor DarkGray
            }
            
            # Execute the restart action
            try {
                & $using:Action
            } catch {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss.fff')] [$using:ServiceName] ❌ Error in action: $_" -ForegroundColor Red
            }
        }
    }
    
    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $actionBlock | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $actionBlock | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $actionBlock | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $actionBlock | Out-Null
    
    Write-WatchLog "Smart file watcher started for $Path (extensions: $($Extensions -join ', '))" $ServiceName "Success"
    return $watcher
}

# Change to project root
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "🎮 GangGPT Development Environment - WATCH MODE" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔄 Live Reloading: Backend, Frontend, RAGE:MP Server" -ForegroundColor Yellow
Write-Host "📁 Watching: src/, web/, ragemp-server/packages/" -ForegroundColor Yellow
Write-Host "⚡ Auto-restart on file changes" -ForegroundColor Yellow
Write-Host ""

# Global job tracking
$script:backendJob = $null
$script:frontendJob = $null
$script:ragempJob = $null
$script:redisJob = $null
$script:watchers = @()

# Cleanup function
function Stop-AllServices {
    Write-WatchLog "Stopping all services..." "CLEANUP" "Warning"
    
    # Stop file watchers
    foreach ($watcher in $script:watchers) {
        if ($watcher) {
            $watcher.EnableRaisingEvents = $false
            $watcher.Dispose()
        }
    }
    
    # Stop jobs
    Stop-ServiceJob $script:backendJob "Backend"
    Stop-ServiceJob $script:frontendJob "Frontend"
    Stop-ServiceJob $script:ragempJob "RAGE:MP"
    Stop-ServiceJob $script:redisJob "Redis"
    
    # Kill any remaining processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*gang-gpt*" } | Stop-Process -Force
    
    Write-WatchLog "All services stopped" "CLEANUP" "Success"
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-AllServices }
trap { Stop-AllServices; exit 1 }

try {    # 1. Enhanced Prerequisites Check
    Write-WatchLog "Checking prerequisites..." "INIT" "Info"
    
    # Check Node.js
    if (-not (Test-CommandAvailable "node")) {
        Write-WatchLog "Node.js not found. Please install Node.js 18+ from https://nodejs.org" "INIT" "Error"
        exit 1
    }
    
    # Check pnpm
    if (-not (Test-CommandAvailable "pnpm")) {
        Write-WatchLog "pnpm not found. Installing pnpm..." "INIT" "Warning"
        try {
            npm install -g pnpm
            Write-WatchLog "pnpm installed successfully" "INIT" "Success"
        } catch {
            Write-WatchLog "Failed to install pnpm. Please install manually: npm install -g pnpm" "INIT" "Error"
            exit 1
        }
    }
    
    # Check tsx for watch mode
    if (-not (Test-CommandAvailable "npx")) {
        Write-WatchLog "npx not found. Please reinstall Node.js" "INIT" "Error"
        exit 1
    }
    
    try {
        $nodeVersion = node --version
        $pnpmVersion = pnpm --version
        Write-WatchLog "Node.js: $nodeVersion | pnpm: $pnpmVersion" "INIT" "Success"
        
        # Check if we're in the right directory
        if (-not (Test-Path "package.json")) {
            Write-WatchLog "package.json not found. Make sure you're in the project root directory" "INIT" "Error"
            exit 1
        }
        
        # Verify project dependencies
        if (-not (Test-Path "node_modules")) {
            Write-WatchLog "node_modules not found. Running pnpm install..." "INIT" "Warning"
            pnpm install
        }
    } catch {
        Write-WatchLog "Error checking prerequisites: $_" "INIT" "Error"
        exit 1
    }
    
    # 2. Start Redis
    Write-WatchLog "Setting up Redis..." "REDIS" "Info"
    $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
    if (-not $redisProcess) {
        if (Test-Path "redis-windows\redis-server.exe") {
            Write-WatchLog "Starting Redis server..." "REDIS" "Progress"
            $script:redisJob = Start-Job -ScriptBlock {
                Set-Location $using:PWD
                & "redis-windows\redis-server.exe" "redis-windows\ganggpt-redis.conf"
            }
            Start-Sleep 3
            
            $redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
            if ($redisProcess) {
                Write-WatchLog "Started (PID: $($redisProcess.Id))" "REDIS" "Success"
            } else {
                Write-WatchLog "Failed to start, using memory fallback" "REDIS" "Warning"
            }
        } else {
            Write-WatchLog "Not found, using memory fallback" "REDIS" "Warning"
        }
    } else {
        Write-WatchLog "Already running (PID: $($redisProcess.Id))" "REDIS" "Success"
    }
    
    # 3. Build project if needed
    if (-not $SkipBuild) {
        Write-WatchLog "Building project..." "BUILD" "Progress"
        try {
            pnpm install | Out-Host
            pnpm build | Out-Host
            Write-WatchLog "Build completed successfully" "BUILD" "Success"
        } catch {
            Write-WatchLog "Build failed: $_" "BUILD" "Error"
            exit 1
        }
    } else {
        Write-WatchLog "Skipping build (--SkipBuild specified)" "BUILD" "Info"
    }
    
    # 4. Backend with Watch Mode
    function Start-BackendWithWatch {
        Write-WatchLog "Starting Backend with watch mode..." "BACKEND" "Progress"
        
        Stop-ServiceJob $script:backendJob "Backend"
        
        $script:backendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            $env:NODE_ENV = "development"
            $env:LOG_LEVEL = "debug"
            $env:WATCH_MODE = "true"
            
            # Use tsx watch for auto-restart on file changes
            npx tsx watch --clear-screen=false src/server.ts
        }
        
        # Wait for backend to be ready
        Start-Sleep 8
        if (Wait-ForPort -Port 4828 -ServiceName "BACKEND" -MaxWaitSec 20) {
            if (Test-ServiceHealth -Url "http://localhost:4828/health" -ServiceName "BACKEND") {
                Write-WatchLog "Backend healthy and ready" "BACKEND" "Success"
            }
        }
    }
    
    # Start initial backend
    Start-BackendWithWatch
      # Setup backend file watcher (as backup to tsx watch)
    $backendWatcher = Start-SmartFileWatcher -Path "$(Get-Location)\src" -Extensions @(".ts", ".js", ".json") -ExcludePatterns @("node_modules", "\.next", "dist", "\.git", "\.log$", "\.tmp$") -ServiceName "BACKEND" -Action {
        Write-WatchLog "Backend source files changed, tsx will auto-restart" "BACKEND" "Info"
    }
    $script:watchers += $backendWatcher
    
    # 5. Frontend with Watch Mode
    function Start-FrontendWithWatch {
        Write-WatchLog "Starting Frontend with watch mode..." "FRONTEND" "Progress"
        
        Stop-ServiceJob $script:frontendJob "Frontend"
        
        $script:frontendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            cd web
            $env:NODE_ENV = "development"
            $env:NEXT_PUBLIC_API_URL = "http://localhost:4828"
            $env:FAST_REFRESH = "true"
            
            # Next.js dev server has built-in hot reloading
            pnpm run dev
        }
        
        # Wait for frontend to be ready
        Start-Sleep 8
        if (Wait-ForPort -Port 4829 -ServiceName "FRONTEND" -MaxWaitSec 20) {
            Write-WatchLog "Frontend ready with hot reloading" "FRONTEND" "Success"
        }
    }
    
    # Start initial frontend
    Start-FrontendWithWatch
    
    # Setup frontend file watcher (for non-Next.js files)
    $frontendWatcher = Start-SmartFileWatcher -Path "$(Get-Location)\web" -Extensions @("*.*") -ExcludePatterns @() -ServiceName "FRONTEND" -Action {
        # Next.js handles most reloading, but restart for package.json changes
        if ($args[0] -like "*package.json*") {
            Write-WatchLog "Package.json changed, restarting..." "FRONTEND" "Warning"
            Start-FrontendWithWatch
        }
    }
    $script:watchers += $frontendWatcher
    
    # 6. RAGE:MP Server with Watch Mode
    if (-not $NoRageMP) {
        function Start-RageMPWithWatch {
            Write-WatchLog "Starting RAGE:MP server with watch mode..." "RAGEMP" "Progress"
            
            Stop-ServiceJob $script:ragempJob "RAGE:MP"
            
            $script:ragempJob = Start-Job -ScriptBlock {
                Set-Location $using:PWD
                cd ragemp-server
                
                # Start RAGE:MP server
                & ".\ragemp-server.exe"
            }
            
            Start-Sleep 5
            Write-WatchLog "RAGE:MP server started (check console for status)" "RAGEMP" "Success"
        }
        
        # Start initial RAGE:MP server
        if (Test-Path "ragemp-server\ragemp-server.exe") {
            Start-RageMPWithWatch
            
            # Setup RAGE:MP packages file watcher
            if (Test-Path "ragemp-server\packages") {
                $ragempWatcher = Start-SmartFileWatcher -Path "$(Get-Location)\ragemp-server\packages" -Extensions @("*.js") -ExcludePatterns @() -ServiceName "RAGEMP" -Action {
                    Write-WatchLog "RAGE:MP package changed, restarting server..." "RAGEMP" "Warning"
                    Start-RageMPWithWatch
                }
                $script:watchers += $ragempWatcher
            }
        } else {
            Write-WatchLog "RAGE:MP server not found, skipping" "RAGEMP" "Warning"
        }
    } else {
        Write-WatchLog "RAGE:MP server skipped (--NoRageMP specified)" "RAGEMP" "Info"
    }
    
    # 7. Service Health Monitoring
    Write-WatchLog "Starting health monitoring..." "MONITOR" "Info"
    
    $healthJob = Start-Job -ScriptBlock {
        while ($true) {
            Start-Sleep 30  # Check every 30 seconds
            
            $backendHealthy = try { 
                Invoke-RestMethod -Uri "http://localhost:4828/health" -TimeoutSec 3 -ErrorAction Stop
                $true 
            } catch { $false }
            
            $frontendHealthy = try { 
                $response = Invoke-WebRequest -Uri "http://localhost:4829" -TimeoutSec 3 -ErrorAction Stop
                $response.StatusCode -eq 200
            } catch { $false }
            
            if (-not $backendHealthy) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [MONITOR] ⚠️ Backend health check failed" -ForegroundColor Yellow
            }
            
            if (-not $frontendHealthy) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [MONITOR] ⚠️ Frontend health check failed" -ForegroundColor Yellow
            }
        }
    }
    
    # 8. Display service status
    Write-Host ""
    Write-WatchLog "Development environment ready!" "INIT" "Success"
    Write-Host ""
    Write-Host "🌐 Services:" -ForegroundColor Green
    Write-Host "  Backend API:    http://localhost:4828" -ForegroundColor Cyan
    Write-Host "  Frontend Web:   http://localhost:4829" -ForegroundColor Cyan
    Write-Host "  RAGE:MP Server: localhost:22005" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 Watching for changes:" -ForegroundColor Green
    Write-Host "  Backend:        src/**/*.ts (tsx watch)" -ForegroundColor Yellow
    Write-Host "  Frontend:       web/**/* (Next.js hot reload)" -ForegroundColor Yellow
    if (-not $NoRageMP) {
        Write-Host "  RAGE:MP:        ragemp-server/packages/**/*.js" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "🎮 Ready for development! Press Ctrl+C to stop all services." -ForegroundColor Green
    Write-Host ""
    
    # Keep script running and monitor jobs
    while ($true) {
        Start-Sleep 5
        
        # Check if any job has failed
        $failedJobs = @()
        if ($script:backendJob -and $script:backendJob.State -eq "Failed") {
            $failedJobs += "Backend"
        }
        if ($script:frontendJob -and $script:frontendJob.State -eq "Failed") {
            $failedJobs += "Frontend"
        }
        if ($script:ragempJob -and $script:ragempJob.State -eq "Failed") {
            $failedJobs += "RAGE:MP"
        }
        
        if ($failedJobs) {
            Write-WatchLog "Services failed: $($failedJobs -join ', ')" "MONITOR" "Error"
            Write-WatchLog "Attempting to restart failed services..." "MONITOR" "Warning"
            
            if ($failedJobs -contains "Backend") {
                Start-BackendWithWatch
            }
            if ($failedJobs -contains "Frontend") {
                Start-FrontendWithWatch
            }
            if ($failedJobs -contains "RAGE:MP" -and -not $NoRageMP) {
                Start-RageMPWithWatch
            }
        }
    }
    
} catch {
    Write-WatchLog "Error: $($_.Exception.Message)" "ERROR" "Error"
    exit 1
} finally {
    Set-Location $OriginalLocation
    Stop-AllServices
}
