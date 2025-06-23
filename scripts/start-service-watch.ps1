#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Lightweight GangGPT Watch Mode for individual service development
.DESCRIPTION
    Start specific services with watch mode for targeted development
.PARAMETER Service
    Service to run: backend, frontend, ragemp, or all
.PARAMETER Port
    Custom port for the service
.EXAMPLE
    .\start-service-watch.ps1 -Service backend
    .\start-service-watch.ps1 -Service frontend
    .\start-service-watch.ps1 -Service all
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backend", "frontend", "ragemp", "all")]
    [string]$Service,
    [int]$Port = 0,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-ServiceLog {
    param([string]$Message, [string]$Level = "Info")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

# Change to project root
Set-Location $PSScriptRoot\..

Write-Host "⚡ GangGPT Service Watch Mode" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

switch ($Service) {
    "backend" {
        Write-ServiceLog "Starting Backend with watch mode..." "Info"
        Write-ServiceLog "Watching: src/**/*.ts" "Info"
        Write-ServiceLog "Port: 4828" "Info"
        Write-Host ""
        
        $env:NODE_ENV = "development"
        $env:LOG_LEVEL = "debug"
        $env:WATCH_MODE = "true"
        
        # Use tsx watch for automatic restart on file changes
        npx tsx watch --clear-screen=false src/server.ts
    }
    
    "frontend" {
        $frontendPort = if ($Port -gt 0) { $Port } else { 4829 }
        Write-ServiceLog "Starting Frontend with hot reload..." "Info"
        Write-ServiceLog "Watching: web/**/*" "Info"
        Write-ServiceLog "Port: $frontendPort" "Info"
        Write-Host ""
        
        Set-Location web
        $env:NODE_ENV = "development"
        $env:NEXT_PUBLIC_API_URL = "http://localhost:4828"
        $env:PORT = $frontendPort
        $env:FAST_REFRESH = "true"
        
        # Next.js dev server with built-in hot reloading
        pnpm run dev
    }
    
    "ragemp" {
        Write-ServiceLog "Starting RAGE:MP server..." "Info"
        Write-ServiceLog "Watching: ragemp-server/packages/**/*.js" "Info"
        Write-ServiceLog "Port: 22005" "Info"
        Write-Host ""
        
        if (-not (Test-Path "ragemp-server\ragemp-server.exe")) {
            Write-ServiceLog "RAGE:MP server not found!" "Error"
            exit 1
        }
        
        # Simple file watcher for RAGE:MP packages
        $watcher = New-Object System.IO.FileSystemWatcher
        $watcher.Path = "$(Get-Location)\ragemp-server\packages"
        $watcher.Filter = "*.js"
        $watcher.IncludeSubdirectories = $true
        $watcher.EnableRaisingEvents = $true
        
        $action = {
            $path = $Event.SourceEventArgs.FullPath
            $name = $Event.SourceEventArgs.Name
            $changeType = $Event.SourceEventArgs.ChangeType
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] File changed: $name ($changeType)" -ForegroundColor Yellow
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Restarting RAGE:MP server..." -ForegroundColor Blue
            
            # Kill existing server process
            Get-Process -Name "ragemp-server" -ErrorAction SilentlyContinue | Stop-Process -Force
            Start-Sleep 2
            
            # Restart server
            Set-Location ragemp-server
            Start-Process -NoNewWindow ".\ragemp-server.exe"
            Set-Location ..
        }
        
        Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
        
        # Start initial server
        Set-Location ragemp-server
        Write-ServiceLog "Starting RAGE:MP server..." "Info"
        & ".\ragemp-server.exe"
    }
    
    "all" {
        Write-ServiceLog "Starting ALL services with watch mode..." "Info"
        Write-Host ""
        
        # Use the comprehensive watch script
        & "$PSScriptRoot\start-dev-watch.ps1" @args
    }
}
