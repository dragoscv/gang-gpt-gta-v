# GangGPT RAGE:MP Server Setup and Launch Script
# This script helps set up and start the RAGE:MP server for live testing

param(
    [string]$RageMPServerPath = "C:\RageMP-Server",
    [switch]$SetupOnly,
    [switch]$StartOnly
)

Write-Host "🎮 GangGPT RAGE:MP Server Setup and Launch" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function to check if RAGE:MP server is downloaded
function Test-RageMPServer {
    param([string]$Path)
    
    if (Test-Path $Path) {
        $serverExe = Get-ChildItem $Path -Name "ragemp-server.exe" -ErrorAction SilentlyContinue
        if ($serverExe) {
            return $true
        }
    }
    return $false
}

# Function to setup GangGPT files
function Setup-GangGPTFiles {
    param([string]$ServerPath)
    
    Write-Host "📁 Setting up GangGPT files..." -ForegroundColor Yellow
    
    # Create directories if they don't exist
    $packagesDir = Join-Path $ServerPath "packages"
    $clientPackagesDir = Join-Path $ServerPath "client_packages"
    
    if (!(Test-Path $packagesDir)) {
        New-Item -ItemType Directory -Path $packagesDir -Force | Out-Null
    }
    
    if (!(Test-Path $clientPackagesDir)) {
        New-Item -ItemType Directory -Path $clientPackagesDir -Force | Out-Null
    }
    
    # Copy GangGPT package
    $sourcePackage = ".\packages\ganggpt"
    $destPackage = Join-Path $packagesDir "ganggpt"
    
    if (Test-Path $sourcePackage) {
        Write-Host "  📦 Copying GangGPT server package..." -ForegroundColor Cyan
        Copy-Item $sourcePackage $destPackage -Recurse -Force
        Write-Host "  ✅ Server package copied" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Server package not found at $sourcePackage" -ForegroundColor Red
    }
    
    # Copy client packages
    $sourceClient = ".\client_packages"
    if (Test-Path $sourceClient) {
        Write-Host "  📱 Copying client packages..." -ForegroundColor Cyan
        Copy-Item "$sourceClient\*" $clientPackagesDir -Recurse -Force
        Write-Host "  ✅ Client packages copied" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Client packages not found at $sourceClient" -ForegroundColor Red
    }
    
    # Copy configuration
    $sourceConf = ".\conf.json"
    $destConf = Join-Path $ServerPath "conf.json"
    
    if (Test-Path $sourceConf) {
        Write-Host "  ⚙️  Copying server configuration..." -ForegroundColor Cyan
        Copy-Item $sourceConf $destConf -Force
        Write-Host "  ✅ Configuration copied" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Configuration not found at $sourceConf" -ForegroundColor Red
    }
}

# Function to ensure backend is built
function Build-Backend {
    Write-Host "🔨 Building GangGPT backend..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        try {
            & npm run build 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Backend built successfully" -ForegroundColor Green
                return $true
            } else {
                Write-Host "  ⚠️  Backend build failed" -ForegroundColor Red
                return $false
            }
        } catch {
            Write-Host "  ⚠️  Error building backend: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "  ⚠️  package.json not found" -ForegroundColor Red
        return $false
    }
}

# Function to start RAGE:MP server
function Start-RageMPServer {
    param([string]$ServerPath)
    
    $serverExe = Join-Path $ServerPath "ragemp-server.exe"
    
    if (Test-Path $serverExe) {
        Write-Host "🚀 Starting RAGE:MP server..." -ForegroundColor Green
        Write-Host "  📍 Server path: $ServerPath" -ForegroundColor Cyan
        Write-Host "  🌐 Server will be available at: localhost:22005" -ForegroundColor Cyan
        Write-Host "  📊 Max players: 1000" -ForegroundColor Cyan
        Write-Host "" -ForegroundColor White
        Write-Host "🎮 To connect:" -ForegroundColor Yellow
        Write-Host "  1. Open RAGE:MP client (C:\RAGEMP\ragemp_v.exe)" -ForegroundColor White
        Write-Host "  2. Connect to: localhost:22005" -ForegroundColor White
        Write-Host "  3. Enjoy GangGPT AI-powered roleplay!" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        
        # Change to server directory and start
        Push-Location $ServerPath
        try {
            & $serverExe
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "  ❌ RAGE:MP server executable not found at $serverExe" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    # Check if RAGE:MP server exists
    if (!(Test-RageMPServer $RageMPServerPath)) {
        Write-Host "❌ RAGE:MP server not found at $RageMPServerPath" -ForegroundColor Red
        Write-Host "" -ForegroundColor White
        Write-Host "📥 Please download RAGE:MP server:" -ForegroundColor Yellow
        Write-Host "  1. Go to https://rage.mp/" -ForegroundColor White
        Write-Host "  2. Download RAGE:MP server" -ForegroundColor White
        Write-Host "  3. Extract to $RageMPServerPath" -ForegroundColor White
        Write-Host "  4. Run this script again" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        Write-Host "💡 Alternative: Specify custom path with -RageMPServerPath parameter" -ForegroundColor Cyan
        exit 1
    }
    
    Write-Host "✅ RAGE:MP server found at $RageMPServerPath" -ForegroundColor Green
    
    # Setup phase
    if (!$StartOnly) {
        # Build backend first
        if (!(Build-Backend)) {
            Write-Host "❌ Backend build failed. Please fix build errors first." -ForegroundColor Red
            exit 1
        }
        
        # Setup GangGPT files
        Setup-GangGPTFiles $RageMPServerPath
        Write-Host "✅ GangGPT setup complete!" -ForegroundColor Green
    }
    
    # Start phase
    if (!$SetupOnly) {
        Write-Host "" -ForegroundColor White
        Write-Host "🔥 Ready to start live testing!" -ForegroundColor Green
        Write-Host "📋 Make sure the following are running:" -ForegroundColor Yellow
        Write-Host "  ✅ GangGPT Backend (port 4828)" -ForegroundColor Green
        Write-Host "  ✅ Redis Cache (port 4832)" -ForegroundColor Green
        Write-Host "  ✅ PostgreSQL Database" -ForegroundColor Green
        Write-Host "" -ForegroundColor White
        
        Read-Host "Press Enter to start RAGE:MP server..."
        Start-RageMPServer $RageMPServerPath
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor White
Write-Host "🎊 GangGPT RAGE:MP setup complete!" -ForegroundColor Green
Write-Host "📖 See LIVE_TESTING_PLAN.md for detailed testing scenarios" -ForegroundColor Cyan
