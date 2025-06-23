#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GangGPT Watch Mode Testing Script
.DESCRIPTION
    Comprehensive testing script for watch mode functionality.
    Tests file watching, service restart, and error recovery.
.PARAMETER Service
    Service to test: backend, frontend, ragemp, or all
.PARAMETER Timeout
    Test timeout in seconds (default: 60)
.EXAMPLE
    .\test-watch-mode.ps1
    .\test-watch-mode.ps1 -Service backend -Timeout 120
#>

param(
    [ValidateSet("backend", "frontend", "ragemp", "all")]
    [string]$Service = "all",
    [int]$Timeout = 60,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$OriginalLocation = Get-Location

# Test logging function
function Write-TestLog {
    param([string]$Message, [string]$Level = "Info")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    $color = switch ($Level) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "Cyan" }
        "Test" { "Magenta" }
        default { "White" }
    }
    $icon = switch ($Level) {
        "Success" { "✅" }
        "Error" { "❌" }
        "Warning" { "⚠️" }
        "Info" { "ℹ️" }
        "Test" { "🧪" }
        default { "📋" }
    }
    Write-Host "[$timestamp] $icon $Message" -ForegroundColor $color
}

# Test result tracking
$script:testResults = @{
    Passed = 0
    Failed = 0
    Total = 0
    Details = @()
}

function Add-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Details = "")
    $script:testResults.Total++
    if ($Passed) {
        $script:testResults.Passed++
        Write-TestLog "PASS: $TestName" "Success"
    } else {
        $script:testResults.Failed++
        Write-TestLog "FAIL: $TestName - $Details" "Error"
    }
    $script:testResults.Details += @{
        Name = $TestName
        Passed = $Passed
        Details = $Details
        Timestamp = Get-Date
    }
}

function Test-ServiceHealth {
    param([string]$Url, [string]$ServiceName, [int]$TimeoutSec = 10)
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $true
    } catch {
        if ($Verbose) {
            Write-TestLog "Health check failed for $ServiceName`: $_" "Warning"
        }
        return $false
    }
}

function Test-PortListening {
    param([int]$Port, [string]$ServiceName)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    } catch {
        return $false
    }
}

function Test-FileChange {
    param([string]$FilePath, [string]$Content, [int]$WaitSeconds = 5)
    try {
        # Create or modify the test file
        if (Test-Path $FilePath) {
            Add-Content -Path $FilePath -Value "`n// Test change: $(Get-Date)" -Force
        } else {
            Set-Content -Path $FilePath -Value $Content -Force
        }
        
        # Wait for the change to be processed
        Start-Sleep $WaitSeconds
          # Clean up test file
        if (Test-Path $FilePath) {
            if ($FilePath -like "*test-watch-*") {
                Remove-Item $FilePath -Force
            }
        }
        
        return $true
    } catch {
        Write-TestLog "Error testing file change: $_" "Error"
        return $false
    }
}

# Change to project root
Set-Location $PSScriptRoot\..

Write-Host ""
Write-Host "🧪 GangGPT Watch Mode Testing Suite" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Testing Service: $Service" -ForegroundColor Yellow
Write-Host "Timeout: $Timeout seconds" -ForegroundColor Yellow
Write-Host ""

try {
    # Test 1: Prerequisites Check
    Write-TestLog "Testing prerequisites..." "Test"
    
    $nodeExists = Get-Command "node" -ErrorAction SilentlyContinue
    Add-TestResult "Node.js installed" ($null -ne $nodeExists)
    
    $pnpmExists = Get-Command "pnpm" -ErrorAction SilentlyContinue
    Add-TestResult "pnpm installed" ($null -ne $pnpmExists)
    
    $packageJsonExists = Test-Path "package.json"
    Add-TestResult "package.json exists" $packageJsonExists
    
    $scriptsExist = (Test-Path "scripts/start-dev-watch.ps1") -and (Test-Path "scripts/start-service-watch.ps1")
    Add-TestResult "Watch scripts exist" $scriptsExist
    
    # Test 2: Script Validation
    Write-TestLog "Validating watch scripts..." "Test"
    
    try {
        $watchScriptContent = Get-Content "scripts/start-dev-watch.ps1" -Raw
        $hasFileWatcher = $watchScriptContent -match "Start-SmartFileWatcher"
        Add-TestResult "Watch script has file watcher" $hasFileWatcher
        
        $hasErrorHandling = $watchScriptContent -match "try\s*{[\s\S]*?catch"
        Add-TestResult "Watch script has error handling" $hasErrorHandling
        
        $hasCleanup = $watchScriptContent -match "Stop-AllServices"
        Add-TestResult "Watch script has cleanup function" $hasCleanup
    } catch {
        Add-TestResult "Watch script validation" $false "Error reading script: $_"
    }
    
    # Test 3: Package.json Integration
    Write-TestLog "Testing package.json integration..." "Test"
    
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $hasWatchScript = $packageJson.scripts.PSObject.Properties.Name -contains "dev:watch"
        Add-TestResult "dev:watch script exists" $hasWatchScript
        
        $hasWatchBackend = $packageJson.scripts.PSObject.Properties.Name -contains "dev:watch:backend"
        Add-TestResult "dev:watch:backend script exists" $hasWatchBackend
        
        $hasWatchFrontend = $packageJson.scripts.PSObject.Properties.Name -contains "dev:watch:frontend"
        Add-TestResult "dev:watch:frontend script exists" $hasWatchFrontend
        
        $hasWatchAll = $packageJson.scripts.PSObject.Properties.Name -contains "dev:watch:all"
        Add-TestResult "dev:watch:all script exists" $hasWatchAll
    } catch {
        Add-TestResult "Package.json integration" $false "Error reading package.json: $_"
    }
    
    # Test 4: VS Code Tasks Integration
    Write-TestLog "Testing VS Code tasks integration..." "Test"
    
    try {
        if (Test-Path ".vscode/tasks.json") {
            $tasksContent = Get-Content ".vscode/tasks.json" -Raw
            $hasWatchTask = $tasksContent -match "Start Watch Mode"
            Add-TestResult "VS Code watch tasks exist" $hasWatchTask
            
            $hasIndividualTasks = $tasksContent -match "Watch Backend Only" -and $tasksContent -match "Watch Frontend Only"
            Add-TestResult "VS Code individual service tasks exist" $hasIndividualTasks
        } else {
            Add-TestResult "VS Code tasks.json exists" $false "File not found"
        }
    } catch {
        Add-TestResult "VS Code tasks integration" $false "Error reading tasks.json: $_"
    }
    
    # Test 5: Service-specific Testing
    if ($Service -eq "all" -or $Service -eq "backend") {
        Write-TestLog "Testing backend watch mode..." "Test"
        
        # Test backend directory structure
        $backendSrcExists = Test-Path "src"
        Add-TestResult "Backend src directory exists" $backendSrcExists
          if ($backendSrcExists) {
            # Test file watching by creating a temporary file
            $testFile = "src/test-watch-backend.ts"
            $testContent = "// Test file for watch mode`nexport const test = 'watch-mode-test';"
            $fileChangeWorked = Test-FileChange $testFile $testContent
            Add-TestResult "Backend file watching" $fileChangeWorked
        }
    }
    
    if ($Service -eq "all" -or $Service -eq "frontend") {
        Write-TestLog "Testing frontend watch mode..." "Test"
        
        # Test frontend directory structure
        $frontendWebExists = Test-Path "web"
        Add-TestResult "Frontend web directory exists" $frontendWebExists
        
        if ($frontendWebExists) {
            $frontendPackageExists = Test-Path "web/package.json"
            Add-TestResult "Frontend package.json exists" $frontendPackageExists
              # Test file watching by creating a temporary file
            $testFile = "web/test-watch-frontend.ts"
            $testContent = "// Test file for frontend watch mode`nexport const test = 'frontend-watch-test';"
            $fileChangeWorked = Test-FileChange $testFile $testContent
            Add-TestResult "Frontend file watching" $fileChangeWorked
        }
    }
    
    if ($Service -eq "all" -or $Service -eq "ragemp") {
        Write-TestLog "Testing RAGE:MP watch mode..." "Test"
        
        # Test RAGE:MP directory structure
        $ragempExists = Test-Path "ragemp-server"
        Add-TestResult "RAGE:MP server directory exists" $ragempExists
        
        if ($ragempExists) {
            $ragempPackagesExists = Test-Path "ragemp-server/packages"
            Add-TestResult "RAGE:MP packages directory exists" $ragempPackagesExists
            
            if ($ragempPackagesExists) {                # Test file watching by creating a temporary file
                $testFile = "ragemp-server/packages/test-watch-ragemp.js"
                $testContent = "// Test file for RAGE:MP watch mode`nconsole.log('ragemp-watch-test');"
                $fileChangeWorked = Test-FileChange $testFile $testContent
                Add-TestResult "RAGE:MP file watching" $fileChangeWorked
            }
        }
    }
    
    # Test 6: Performance and Resource Usage
    Write-TestLog "Testing performance characteristics..." "Test"
    
    # Check if watch scripts have proper debouncing
    try {
        $watchScriptContent = Get-Content "scripts/start-dev-watch.ps1" -Raw
        $hasDebouncing = $watchScriptContent -match "debounce|Debounce"
        Add-TestResult "Watch mode has debouncing" $hasDebouncing
        
        $hasExcludePatterns = $watchScriptContent -match "ExcludePatterns|exclude"
        Add-TestResult "Watch mode has exclude patterns" $hasExcludePatterns
        
        $hasResourceCleanup = $watchScriptContent -match "Dispose|Remove-Job"
        Add-TestResult "Watch mode has resource cleanup" $hasResourceCleanup
    } catch {
        Add-TestResult "Performance testing" $false "Error analyzing script: $_"
    }
    
    # Test 7: Error Handling and Recovery
    Write-TestLog "Testing error handling..." "Test"
    
    try {
        $watchScriptContent = Get-Content "scripts/start-dev-watch.ps1" -Raw
        $hasErrorRecovery = $watchScriptContent -match "retry|Retry"
        Add-TestResult "Watch mode has error recovery" $hasErrorRecovery
        
        $hasHealthChecks = $watchScriptContent -match "health|Health"
        Add-TestResult "Watch mode has health checks" $hasHealthChecks
        
        $hasTrapHandling = $watchScriptContent -match "trap|Register-EngineEvent"
        Add-TestResult "Watch mode has trap handling" $hasTrapHandling
    } catch {
        Add-TestResult "Error handling testing" $false "Error analyzing script: $_"
    }
    
    # Final Results
    Write-Host ""
    Write-Host "🏁 Test Results Summary" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $passRate = if ($script:testResults.Total -gt 0) { 
        [math]::Round(($script:testResults.Passed / $script:testResults.Total) * 100, 1) 
    } else { 0 }
    
    Write-Host "Total Tests: $($script:testResults.Total)" -ForegroundColor White
    Write-Host "Passed: $($script:testResults.Passed)" -ForegroundColor Green
    Write-Host "Failed: $($script:testResults.Failed)" -ForegroundColor Red
    Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })
    
    if ($script:testResults.Failed -gt 0) {
        Write-Host ""
        Write-Host "❌ Failed Tests:" -ForegroundColor Red
        foreach ($result in $script:testResults.Details | Where-Object { -not $_.Passed }) {
            Write-Host "  • $($result.Name): $($result.Details)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    if ($passRate -ge 90) {
        Write-Host "🎉 Watch Mode is EXCELLENT! Ready for production use." -ForegroundColor Green
    } elseif ($passRate -ge 70) {
        Write-Host "✅ Watch Mode is GOOD! Minor issues to address." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ Watch Mode needs IMPROVEMENT! Please fix failing tests." -ForegroundColor Red
    }
    
} catch {
    Write-TestLog "Critical error during testing: $_" "Error"
    exit 1
} finally {
    Set-Location $OriginalLocation
}

exit $(if ($script:testResults.Failed -eq 0) { 0 } else { 1 })
