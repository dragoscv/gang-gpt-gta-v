#!/usr/bin/env pwsh
# GangGPT RAGE:MP Testing Setup Script
# Quick setup for live testing with RAGE:MP and GTA V

Write-Host "🎮 GangGPT RAGE:MP Testing Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check if RAGE:MP is available
if (Get-Command "ragemp-server" -ErrorAction SilentlyContinue) {
    Write-Host "✅ RAGE:MP Server found" -ForegroundColor Green
} else {
    Write-Host "❌ RAGE:MP Server not found in PATH" -ForegroundColor Red
    Write-Host "   Please ensure RAGE:MP is installed and in your PATH" -ForegroundColor Yellow
}

# Check if Node.js is available
if (Get-Command "node" -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check if pnpm is available
if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
    Write-Host "✅ pnpm found" -ForegroundColor Green
} else {
    Write-Host "❌ pnpm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Blue
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please configure your .env file with proper values" -ForegroundColor Yellow
    Write-Host "   Especially AZURE_OPENAI_* settings for AI functionality" -ForegroundColor Yellow
}

# Build the TypeScript backend
Write-Host "Building TypeScript backend..." -ForegroundColor Blue
pnpm build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Ready to start testing!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend server: pnpm dev" -ForegroundColor White
Write-Host "2. Start the frontend: cd web && pnpm dev" -ForegroundColor White
Write-Host "3. Start RAGE:MP server in this directory" -ForegroundColor White
Write-Host "4. Connect with GTA V client to localhost:22005" -ForegroundColor White
Write-Host ""
Write-Host "📖 See RAGE_MP_TESTING_GUIDE.md for detailed testing procedures" -ForegroundColor Cyan
Write-Host ""

# Offer to start services automatically
$choice = Read-Host "Would you like to start the backend server now? (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "Starting backend server..." -ForegroundColor Blue
    Start-Process pwsh -ArgumentList "-Command", "pnpm dev" -WorkingDirectory (Get-Location)
    
    $frontendChoice = Read-Host "Would you like to start the frontend server too? (y/n)"
    if ($frontendChoice -eq "y" -or $frontendChoice -eq "Y") {
        Write-Host "Starting frontend server..." -ForegroundColor Blue
        Start-Process pwsh -ArgumentList "-Command", "cd web; pnpm dev" -WorkingDirectory (Get-Location)
    }
}

Write-Host ""
Write-Host "🎮 Happy testing! Welcome to the future of AI-powered gaming!" -ForegroundColor Green
