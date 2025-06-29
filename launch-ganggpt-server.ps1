#!/usr/bin/env pwsh
# GangGPT RAGE:MP Complete Setup and Launch Script

Write-Host "🎮 GangGPT RAGE:MP - Complete Server Setup & Launch" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

$ErrorActionPreference = "Continue"

# Step 1: Verify all prerequisites
Write-Host "1️⃣ Verifying Prerequisites..." -ForegroundColor Cyan

# Check loader files (critical from memory)
if (!(Test-Path "E:\GitHub\gang-gpt-gta-v\bin\loader.mjs")) {
    Write-Host "🔧 Missing loader files - fixing..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "E:\GitHub\gang-gpt-gta-v\bin" -Force | Out-Null
    Copy-Item "E:\GitHub\gang-gpt-gta-v\ragemp-server\bin\*" -Destination "E:\GitHub\gang-gpt-gta-v\bin\" -Force
    Write-Host "✅ Loader files installed" -ForegroundColor Green
} else {
    Write-Host "✅ Loader files present" -ForegroundColor Green
}

# Check configuration files
$rootConfig = Get-Content "E:\GitHub\gang-gpt-gta-v\conf.json" | ConvertFrom-Json
$serverConfig = Get-Content "E:\GitHub\gang-gpt-gta-v\ragemp-server\conf.json" | ConvertFrom-Json

Write-Host "✅ Root config port: $($rootConfig.bind)" -ForegroundColor Green
Write-Host "✅ Server config port: $($serverConfig.port)" -ForegroundColor Green

# Step 2: Ensure firewall rules
Write-Host "`n2️⃣ Configuring Windows Firewall..." -ForegroundColor Cyan
try {
    netsh advfirewall firewall add rule name="GangGPT RAGE:MP 22006 TCP" dir=in action=allow protocol=TCP localport=22006 | Out-Null
    netsh advfirewall firewall add rule name="GangGPT RAGE:MP 22006 UDP" dir=in action=allow protocol=UDP localport=22006 | Out-Null
    Write-Host "✅ Firewall rules configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firewall configuration may need admin rights" -ForegroundColor Yellow
}

# Step 3: Clean shutdown any existing servers
Write-Host "`n3️⃣ Cleaning Up Existing Processes..." -ForegroundColor Cyan
$existing = Get-Process -Name "ragemp*" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "🧹 Stopping existing RAGE:MP processes..." -ForegroundColor Yellow
    $existing | Stop-Process -Force
    Start-Sleep -Seconds 5
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
} else {
    Write-Host "✅ No existing processes to clean" -ForegroundColor Green
}

# Step 4: Create minimal test configuration
Write-Host "`n4️⃣ Creating Test Configuration..." -ForegroundColor Cyan
$testConfig = @{
    "maxplayers" = 100
    "name" = "GangGPT Test Server"
    "gamemode" = "freeroam"
    "stream-distance" = 300.0
    "announce" = $false
    "port" = 22006
    "allow-cef-debugging" = $true
    "packages" = @()
} | ConvertTo-Json -Depth 3

$testConfig | Out-File "E:\GitHub\gang-gpt-gta-v\ragemp-server\conf-test.json" -Encoding UTF8
Write-Host "✅ Test configuration created (no custom packages)" -ForegroundColor Green

# Step 5: Start server with test configuration
Write-Host "`n5️⃣ Starting Server with Test Configuration..." -ForegroundColor Cyan
Set-Location "E:\GitHub\gang-gpt-gta-v"

# Rename original config temporarily
Move-Item "ragemp-server\conf.json" "ragemp-server\conf-original.json" -Force
Move-Item "ragemp-server\conf-test.json" "ragemp-server\conf.json" -Force

try {
    $proc = Start-Process -FilePath ".\ragemp-server\ragemp-server.exe" -WorkingDirectory "$(Get-Location)" -PassThru
    Write-Host "✅ Server started with test config (PID: $($proc.Id))" -ForegroundColor Green
    
    # Monitor startup for 30 seconds
    Write-Host "⏳ Monitoring startup (30 seconds)..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep -Seconds 1
        
        if ($proc.HasExited) {
            Write-Host "❌ Server exited after $i seconds (Exit Code: $($proc.ExitCode))" -ForegroundColor Red
            break
        }
        
        # Check port at 15 and 25 seconds
        if ($i -eq 15 -or $i -eq 25) {
            $port = netstat -an | Select-String "22006.*LISTENING"
            if ($port) {
                Write-Host "✅ Server is listening on port 22006!" -ForegroundColor Green
                Write-Host "   $port" -ForegroundColor White
                break
            } else {
                Write-Host "⏳ Port not ready yet (${i}s)..." -ForegroundColor Gray
            }
        }
        
        if ($i % 10 -eq 0) {
            Write-Host "   ${i} seconds elapsed..." -ForegroundColor Gray
        }
    }
    
    # Final check
    if (!$proc.HasExited) {
        $finalPort = netstat -an | Select-String "22006.*LISTENING"
        if ($finalPort) {
            Write-Host "`n🎉 SUCCESS! RAGE:MP Server is online and ready!" -ForegroundColor Green -BackgroundColor DarkGreen
            Write-Host ""
            Write-Host "📊 Server Status:" -ForegroundColor Cyan
            Write-Host "   • Process ID: $($proc.Id)" -ForegroundColor White
            Write-Host "   • Port: 22006 (LISTENING)" -ForegroundColor White
            Write-Host "   • Configuration: Test mode (no custom packages)" -ForegroundColor White
            Write-Host ""
            Write-Host "🎮 Ready for GTA V Connection:" -ForegroundColor Cyan
            Write-Host "   1. Launch GTA V" -ForegroundColor White
            Write-Host "   2. Open RAGE:MP client" -ForegroundColor White
            Write-Host "   3. Add server: localhost:22006" -ForegroundColor White
            Write-Host "   4. Connect and test basic functionality" -ForegroundColor White
            Write-Host ""
            Write-Host "📝 Next Steps:" -ForegroundColor Yellow
            Write-Host "   • Test basic connection first" -ForegroundColor White
            Write-Host "   • If successful, restore GangGPT configuration" -ForegroundColor White
            Write-Host "   • Enable AI features gradually" -ForegroundColor White
        } else {
            Write-Host "`n⚠️  Server is running but port binding needs investigation" -ForegroundColor Yellow
            Write-Host "   This may require checking NodeJS dependencies or RAGE:MP configuration" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Restore original configuration
    if (Test-Path "ragemp-server\conf-original.json") {
        Move-Item "ragemp-server\conf.json" "ragemp-server\conf-test-used.json" -Force -ErrorAction SilentlyContinue
        Move-Item "ragemp-server\conf-original.json" "ragemp-server\conf.json" -Force
    }
}

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "🎮 GangGPT RAGE:MP Setup Complete" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
