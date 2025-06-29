#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Unified Testing Framework for GangGPT
    
.DESCRIPTION
    Comprehensive testing script that handles:
    - Unit tests with coverage
    - Integration tests
    - End-to-end tests
    - RAGE:MP server tests
    - Performance tests
    - Test environment management
    
.PARAMETER Mode
    The test mode: unit, integration, e2e, ragemp, all, watch, coverage
    
.PARAMETER Pattern
    Test file pattern to match (optional)
    
.PARAMETER Environment
    Test environment: development, test, ci
    
.PARAMETER Verbose
    Enable verbose test output
    
.EXAMPLE
    .\test.ps1 -Mode unit -Coverage
    Run unit tests with coverage report
    
.EXAMPLE
    .\test.ps1 -Mode e2e -Pattern "*connection*"
    Run E2E tests matching connection pattern
    
.EXAMPLE
    .\test.ps1 -Mode watch -Pattern "src/modules/ai/**"
    Run tests in watch mode for AI modules
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("unit", "integration", "e2e", "ragemp", "all", "watch", "coverage", "performance")]
    [string]$Mode,
    
    [Parameter(Mandatory = $false)]
    [string]$Pattern = "",
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("development", "test", "ci")]
    [string]$Environment = "test",
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory = $false)]
    [switch]$Coverage
)

# Enable strict mode and error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Configuration
$Config = @{
    Paths = @{
        Root = $PSScriptRoot | Split-Path
        Scripts = $PSScriptRoot
        Tests = Join-Path ($PSScriptRoot | Split-Path) "tests"
        Coverage = Join-Path ($PSScriptRoot | Split-Path) "coverage"
        Results = Join-Path ($PSScriptRoot | Split-Path) "test-results"
    }
    TestEnvironment = @{
        DATABASE_URL = "postgresql://test:test@localhost:4831/gang_gpt_test_db"
        REDIS_URL = "redis://localhost:4832"
        NODE_ENV = "test"
        JWT_SECRET = "test-jwt-secret"
        AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com/"
        AZURE_OPENAI_API_KEY = "test-api-key"
    }
}

# Utility Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        "TEST" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Set-TestEnvironment {
    Write-Log "Setting up test environment..." "INFO"
    
    foreach ($env in $Config.TestEnvironment.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($env.Key, $env.Value)
    }
    
    # Ensure test directories exist
    if (-not (Test-Path $Config.Paths.Coverage)) {
        New-Item -ItemType Directory -Path $Config.Paths.Coverage -Force | Out-Null
    }
    if (-not (Test-Path $Config.Paths.Results)) {
        New-Item -ItemType Directory -Path $Config.Paths.Results -Force | Out-Null
    }
    
    Write-Log "Test environment configured" "SUCCESS"
}

function Start-TestServices {
    Write-Log "Starting test services..." "INFO"
    
    # Start test database
    docker compose -f docker-compose.yml up postgres redis -d
    
    # Wait for services to be ready
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        try {
            $pgReady = Test-NetConnection -ComputerName "127.0.0.1" -Port 4831 -WarningAction SilentlyContinue
            $redisReady = Test-NetConnection -ComputerName "127.0.0.1" -Port 4832 -WarningAction SilentlyContinue
            
            if ($pgReady.TcpTestSucceeded -and $redisReady.TcpTestSucceeded) {
                Write-Log "Test services are ready" "SUCCESS"
                return $true
            }
        } catch {
            # Continue waiting
        }
        
        Write-Log "Waiting for test services... ($attempt/$maxAttempts)" "INFO"
        Start-Sleep -Seconds 2
        
    } while ($attempt -lt $maxAttempts)
    
    Write-Log "Test services failed to start within timeout" "ERROR"
    return $false
}

function Stop-TestServices {
    Write-Log "Stopping test services..." "INFO"
    docker compose stop postgres redis
}

function Invoke-UnitTests {
    param([string]$Pattern = "", [bool]$WithCoverage = $false)
    
    Write-Log "Running unit tests..." "TEST"
    Set-Location $Config.Paths.Root
    
    $args = @("test")
    
    if ($Pattern) {
        $args += @("--testPathPattern", $Pattern)
    }
    
    if ($WithCoverage) {
        $args += @("--coverage")
    }
    
    if ($Verbose) {
        $args += @("--verbose")
    }
    
    try {
        & pnpm @args
        Write-Log "Unit tests completed successfully" "SUCCESS"
        return $true
    } catch {
        Write-Log "Unit tests failed: $_" "ERROR"
        return $false
    }
}

function Invoke-IntegrationTests {
    param([string]$Pattern = "")
    
    Write-Log "Running integration tests..." "TEST"
    Set-Location $Config.Paths.Root
    
    # Ensure test services are running
    if (-not (Start-TestServices)) {
        Write-Log "Failed to start test services" "ERROR"
        return $false
    }
    
    # Run database migrations for tests
    npx prisma migrate reset --force --skip-seed
    npx prisma db push
    
    $args = @("test", "tests/integration", "--runInBand")
    
    if ($Pattern) {
        $args += @("--testNamePattern", $Pattern)
    }
    
    if ($Verbose) {
        $args += @("--verbose")
    }
    
    try {
        & pnpm @args
        Write-Log "Integration tests completed successfully" "SUCCESS"
        return $true
    } catch {
        Write-Log "Integration tests failed: $_" "ERROR"
        return $false
    } finally {
        Stop-TestServices
    }
}

function Invoke-E2ETests {
    param([string]$Pattern = "")
    
    Write-Log "Running end-to-end tests..." "TEST"
    Set-Location $Config.Paths.Root
    
    # Start full development environment
    Write-Log "Starting development services for E2E tests..." "INFO"
    & $Config.Paths.Scripts\dev.ps1 -Mode start -Service all
    
    # Wait for services to be ready
    Start-Sleep -Seconds 10
    
    $args = @("test:e2e")
    
    if ($Pattern) {
        $args += @("--grep", $Pattern)
    }
    
    if ($Verbose) {
        $args += @("--verbose")
    }
    
    try {
        & pnpm @args
        Write-Log "E2E tests completed successfully" "SUCCESS"
        return $true
    } catch {
        Write-Log "E2E tests failed: $_" "ERROR"
        return $false
    } finally {
        Write-Log "Stopping development services..." "INFO"
        & $Config.Paths.Scripts\dev.ps1 -Mode stop -Service all
    }
}

function Invoke-RAGEMPTests {
    Write-Log "Running RAGE:MP server tests..." "TEST"
    
    # Test server startup
    Set-Location (Join-Path $Config.Paths.Root "ragemp-server")
    
    Write-Log "Testing RAGE:MP server startup..." "INFO"
    $serverProcess = Start-Process -FilePath ".\ragemp_v.exe" -PassThru -NoNewWindow
    
    Start-Sleep -Seconds 10
    
    # Test if server is listening
    $isListening = Test-NetConnection -ComputerName "127.0.0.1" -Port 22005 -WarningAction SilentlyContinue
    
    if ($isListening.TcpTestSucceeded) {
        Write-Log "RAGE:MP server started successfully" "SUCCESS"
        $result = $true
    } else {
        Write-Log "RAGE:MP server failed to start" "ERROR"
        $result = $false
    }
    
    # Stop server
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    
    return $result
}

function Invoke-PerformanceTests {
    Write-Log "Running performance tests..." "TEST"
    Set-Location $Config.Paths.Root
    
    # Start services
    & $Config.Paths.Scripts\dev.ps1 -Mode start -Service backend
    Start-Sleep -Seconds 5
    
    try {
        # Run Artillery load tests if available
        if (Get-Command artillery -ErrorAction SilentlyContinue) {
            Write-Log "Running load tests with Artillery..." "INFO"
            artillery run tests/load/api-load-test.yml
        } else {
            Write-Log "Artillery not found, running basic performance tests..." "WARN"
            
            # Basic API response time test
            $startTime = Get-Date
            $response = Invoke-RestMethod -Uri "http://localhost:4828/health" -TimeoutSec 5
            $responseTime = (Get-Date) - $startTime
            
            Write-Log "API response time: $($responseTime.TotalMilliseconds)ms" "INFO"
            
            if ($responseTime.TotalMilliseconds -lt 200) {
                Write-Log "Performance test passed" "SUCCESS"
                return $true
            } else {
                Write-Log "Performance test failed - response too slow" "ERROR"
                return $false
            }
        }
    } catch {
        Write-Log "Performance tests failed: $_" "ERROR"
        return $false
    } finally {
        & $Config.Paths.Scripts\dev.ps1 -Mode stop -Service backend
    }
}

function Start-WatchMode {
    param([string]$Pattern = "")
    
    Write-Log "Starting tests in watch mode..." "TEST"
    Set-Location $Config.Paths.Root
    
    $args = @("test:watch")
    
    if ($Pattern) {
        $args += @("--testPathPattern", $Pattern)
    }
    
    & pnpm @args
}

function Get-CoverageReport {
    Write-Log "Generating coverage report..." "INFO"
    
    if (Test-Path $Config.Paths.Coverage) {
        $indexPath = Join-Path $Config.Paths.Coverage "index.html"
        if (Test-Path $indexPath) {
            Write-Log "Opening coverage report..." "INFO"
            Start-Process $indexPath
        } else {
            Write-Log "Coverage report not found. Run tests with --coverage first." "WARN"
        }
    } else {
        Write-Log "Coverage directory not found. Run tests with --coverage first." "WARN"
    }
}

# Main execution
try {
    Write-Log "GangGPT Testing Framework" "INFO"
    Write-Log "Mode: $Mode | Environment: $Environment" "INFO"
    
    if ($Pattern) {
        Write-Log "Pattern: $Pattern" "INFO"
    }
    
    Set-TestEnvironment
    
    $success = $true
    
    switch ($Mode) {
        "unit" {
            $success = Invoke-UnitTests -Pattern $Pattern -WithCoverage $Coverage
        }
        
        "integration" {
            $success = Invoke-IntegrationTests -Pattern $Pattern
        }
        
        "e2e" {
            $success = Invoke-E2ETests -Pattern $Pattern
        }
        
        "ragemp" {
            $success = Invoke-RAGEMPTests
        }
        
        "performance" {
            $success = Invoke-PerformanceTests
        }
        
        "watch" {
            Start-WatchMode -Pattern $Pattern
        }
        
        "coverage" {
            $success = Invoke-UnitTests -WithCoverage $true
            if ($success) {
                Get-CoverageReport
            }
        }
        
        "all" {
            Write-Log "Running comprehensive test suite..." "TEST"
            
            $results = @{
                Unit = Invoke-UnitTests -WithCoverage $true
                Integration = Invoke-IntegrationTests
                RAGEMP = Invoke-RAGEMPTests
                Performance = Invoke-PerformanceTests
            }
            
            Write-Log "=== TEST RESULTS SUMMARY ===" "INFO"
            foreach ($test in $results.GetEnumerator()) {
                $status = if ($test.Value) { "✅ PASSED" } else { "❌ FAILED" }
                Write-Log "$($test.Key): $status" "INFO"
            }
            
            $success = ($results.Values | Measure-Object -Sum).Sum -eq $results.Count
        }
    }
    
    if ($success) {
        Write-Log "All tests completed successfully" "SUCCESS"
        exit 0
    } else {
        Write-Log "Some tests failed" "ERROR"
        exit 1
    }
    
} catch {
    Write-Log "Testing failed: $_" "ERROR"
    exit 1
} finally {
    Set-Location $Config.Paths.Root
}
