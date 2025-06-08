# GangGPT RAGE:MP Configuration Script
# Run this after downloading and extracting RAGE:MP server

param(
    [string]$ServerPath = "C:\RageMP-Server"
)

Write-Host "🎮 GangGPT RAGE:MP Configuration" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if server directory exists
if (!(Test-Path $ServerPath)) {
    Write-Host "❌ RAGE:MP server not found at: $ServerPath" -ForegroundColor Red
    Write-Host "Please download and extract RAGE:MP server first!" -ForegroundColor Yellow
    Write-Host "1. Visit: https://rage.mp/" -ForegroundColor White
    Write-Host "2. Download server package" -ForegroundColor White
    Write-Host "3. Extract to: $ServerPath" -ForegroundColor White
    exit 1
}

Write-Host "✅ RAGE:MP server found at: $ServerPath" -ForegroundColor Green

# Setup GangGPT configuration
Write-Host "⚙️ Configuring GangGPT..." -ForegroundColor Yellow

# Copy conf.json
$sourceConf = ".\conf.json"
$destConf = Join-Path $ServerPath "conf.json"

if (Test-Path $sourceConf) {
    Write-Host "  📝 Copying conf.json..." -ForegroundColor Cyan
    Copy-Item $sourceConf $destConf -Force
    Write-Host "    ✅ Configuration copied" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ conf.json not found, using default configuration" -ForegroundColor Yellow
}

# Create packages directory
$packagesDir = Join-Path $ServerPath "packages"
if (!(Test-Path $packagesDir)) {
    Write-Host "  📁 Creating packages directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $packagesDir -Force | Out-Null
}

# Copy GangGPT server package
$sourcePackage = ".\packages\ganggpt"
$destPackage = Join-Path $packagesDir "ganggpt"

if (Test-Path $sourcePackage) {
    Write-Host "  📦 Copying GangGPT server package..." -ForegroundColor Cyan
    if (Test-Path $destPackage) {
        Remove-Item $destPackage -Recurse -Force
    }
    Copy-Item $sourcePackage $destPackage -Recurse -Force
    Write-Host "    ✅ Server package copied" -ForegroundColor Green
} else {
    Write-Host "    ❌ GangGPT server package not found at: $sourcePackage" -ForegroundColor Red
    exit 1
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
    Write-Host "    ✅ Client packages copied" -ForegroundColor Green
} else {
    Write-Host "    ❌ Client packages not found at: $sourceClientPackages" -ForegroundColor Red
    exit 1
}

# Check backend status
Write-Host "🔗 Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4828/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ Backend is running at: http://localhost:4828" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Backend not responding at: http://localhost:4828" -ForegroundColor Yellow
    Write-Host "     Start with: pnpm dev" -ForegroundColor White
}

# Check if server executable exists
$serverExe = Join-Path $ServerPath "ragemp-server.exe"
if (Test-Path $serverExe) {
    Write-Host "✅ RAGE:MP server executable found" -ForegroundColor Green
} else {
    Write-Host "❌ ragemp-server.exe not found" -ForegroundColor Red
    Write-Host "   Make sure you extracted the complete server package" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor White
Write-Host "🎯 Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "📍 Server Path: $ServerPath" -ForegroundColor Cyan
Write-Host "🌐 Server Port: 22005" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://localhost:4828" -ForegroundColor Cyan
Write-Host "🎮 Client Connect: localhost:22005" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure backend is running: pnpm dev" -ForegroundColor White
Write-Host "2. Start RAGE:MP server:" -ForegroundColor White
Write-Host "   cd `"$ServerPath`"" -ForegroundColor Gray
Write-Host "   .\ragemp-server.exe" -ForegroundColor Gray
Write-Host "3. Connect with client: C:\RAGEMP\ragemp_v.exe" -ForegroundColor White
Write-Host "4. Use testing checklist: LIVE_TESTING_CHECKLIST.md" -ForegroundColor White
Write-Host "" -ForegroundColor White

$startNow = Read-Host "Start RAGE:MP server now? (y/N)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host "🎮 Starting RAGE:MP server..." -ForegroundColor Green
    Set-Location $ServerPath
    & $serverExe
}
