# GangGPT RAGE:MP Server Download and Setup Script
# This script downloads and configures RAGE:MP server for GangGPT testing

param(
    [string]$ServerPath = "C:\RageMP-Server",
    [string]$BackendUrl = "http://localhost:4828"
)

Write-Host "🎮 GangGPT RAGE:MP Server Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Function to download RAGE:MP server
function Download-RageMPServer {
    param([string]$DestPath)
    
    Write-Host "📥 Downloading RAGE:MP server..." -ForegroundColor Yellow
    
    $serverUrl = "https://cdn.rage.mp/public/files/RAGEMultiplayer_0.3.7.zip"
    $zipPath = "$env:TEMP\RageMP-Server.zip"
    
    try {
        # Download server
        Write-Host "  🔗 Downloading from: $serverUrl" -ForegroundColor Cyan
        Invoke-WebRequest -Uri $serverUrl -OutFile $zipPath -UseBasicParsing
        
        # Create destination directory
        if (!(Test-Path $DestPath)) {
            New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
        }
        
        # Extract server
        Write-Host "  📦 Extracting to: $DestPath" -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $DestPath -Force
        
        # Clean up
        Remove-Item $zipPath -Force
        
        Write-Host "  ✅ RAGE:MP server downloaded successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ❌ Failed to download RAGE:MP server: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to setup GangGPT configuration
function Setup-GangGPTConfig {
    param([string]$ServerPath)
    
    Write-Host "⚙️ Setting up GangGPT configuration..." -ForegroundColor Yellow
    
    # Copy conf.json
    $sourceConf = ".\conf.json"
    $destConf = Join-Path $ServerPath "conf.json"
    
    if (Test-Path $sourceConf) {
        Write-Host "  📝 Copying conf.json..." -ForegroundColor Cyan
        Copy-Item $sourceConf $destConf -Force
    } else {
        Write-Host "  🔧 Creating default conf.json..." -ForegroundColor Cyan
        $confContent = @"
{
    "name": "GangGPT - AI-Powered Roleplay Server",
    "gamemode": "freeroam",
    "url": "",
    "language": "en",
    "description": "Experience the future of GTA V roleplay with AI-driven NPCs, dynamic missions, and intelligent factions.",
    "maxplayers": 1000,
    "port": 22005,
    "disallow-multiple-connections-per-ip": true,
    "limit-time-per-connection": 0,
    "timeout": 60000,
    "modules": ["nodejs-module"],
    "resources": [],
    "stream-distance": 500.0,
    "in-vehicle-stream-distance": 300.0,
    "stream-lag-compensation": 200,
    "fastdl": {
        "host": "",
        "port": 0
    },
    "csharp": "gamemode/",
    "nodejs": {
        "commandline-flags": ["--max-old-space-size=8192", "--max-heap-size=8192"],
        "main-module": "./packages/ganggpt/index.js"
    }
}
"@
        Set-Content -Path $destConf -Value $confContent
    }
    
    # Create packages directory and copy GangGPT package
    $packagesDir = Join-Path $ServerPath "packages"
    if (!(Test-Path $packagesDir)) {
        New-Item -ItemType Directory -Path $packagesDir -Force | Out-Null
    }
    
    $sourcePackage = ".\packages\ganggpt"
    $destPackage = Join-Path $packagesDir "ganggpt"
    
    if (Test-Path $sourcePackage) {
        Write-Host "  📦 Copying GangGPT server package..." -ForegroundColor Cyan
        if (Test-Path $destPackage) {
            Remove-Item $destPackage -Recurse -Force
        }
        Copy-Item $sourcePackage $destPackage -Recurse -Force
    }
    
    # Copy client packages
    $sourceClientPackages = ".\client_packages"
    $destClientPackages = Join-Path $ServerPath "client_packages"
    
    if (Test-Path $sourceClientPackages) {
        Write-Host "  📱 Copying client packages..." -ForegroundColor Cyan
        if (Test-Path $destClientPackages) {
            Remove-Item $destClientPackages -Recurse -Force
        }
        Copy-Item $sourceClientPackages $destClientPackages -Recurse -Force
    }
    
    Write-Host "  ✅ GangGPT configuration complete!" -ForegroundColor Green
}

# Function to start RAGE:MP server
function Start-RageMPServer {
    param([string]$ServerPath)
    
    Write-Host "🚀 Starting RAGE:MP server..." -ForegroundColor Yellow
    
    $serverExe = Join-Path $ServerPath "ragemp-server.exe"
    
    if (!(Test-Path $serverExe)) {
        Write-Host "  ❌ RAGE:MP server executable not found at: $serverExe" -ForegroundColor Red
        return $false
    }
    
    try {
        Set-Location $ServerPath
        Write-Host "  🎮 Launching RAGE:MP server..." -ForegroundColor Cyan
        Write-Host "  📍 Server directory: $ServerPath" -ForegroundColor Cyan
        Write-Host "  🌐 Server will be available at: localhost:22005" -ForegroundColor Cyan
        Write-Host "" -ForegroundColor White
        Write-Host "🎯 GangGPT RAGE:MP Server Starting..." -ForegroundColor Green
        Write-Host "   Connect with RAGE:MP client to: localhost:22005" -ForegroundColor Green
        Write-Host "   Backend API available at: $BackendUrl" -ForegroundColor Green
        Write-Host "" -ForegroundColor White
        
        # Start the server (this will block the terminal)
        & $serverExe
        
        return $true
    }
    catch {
        Write-Host "  ❌ Failed to start RAGE:MP server: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "🔍 Checking for existing RAGE:MP server..." -ForegroundColor Cyan

if (!(Test-Path $ServerPath)) {
    Write-Host "📦 RAGE:MP server not found. Downloading..." -ForegroundColor Yellow
    
    if (!(Download-RageMPServer -DestPath $ServerPath)) {
        Write-Host "❌ Failed to download RAGE:MP server. Manual download required:" -ForegroundColor Red
        Write-Host "   1. Download from: https://rage.mp/" -ForegroundColor White
        Write-Host "   2. Extract to: $ServerPath" -ForegroundColor White
        Write-Host "   3. Run this script again" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "✅ RAGE:MP server directory found at: $ServerPath" -ForegroundColor Green
}

# Setup GangGPT configuration
Setup-GangGPTConfig -ServerPath $ServerPath

# Check if backend is running
Write-Host "🔗 Checking backend availability..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend is running at: $BackendUrl" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend not responding at: $BackendUrl" -ForegroundColor Yellow
    Write-Host "   Make sure to start the backend with: pnpm dev" -ForegroundColor White
}

Write-Host "" -ForegroundColor White
Write-Host "🎮 Ready to start RAGE:MP server!" -ForegroundColor Green
Write-Host "   Configuration: GangGPT enabled on port 22005" -ForegroundColor Green
Write-Host "   Backend integration: $BackendUrl" -ForegroundColor Green
Write-Host "" -ForegroundColor White

$startNow = Read-Host "Start RAGE:MP server now? (y/N)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Start-RageMPServer -ServerPath $ServerPath
} else {
    Write-Host "🎯 To start manually:" -ForegroundColor Yellow
    Write-Host "   cd `"$ServerPath`"" -ForegroundColor White
    Write-Host "   .\ragemp-server.exe" -ForegroundColor White
}
