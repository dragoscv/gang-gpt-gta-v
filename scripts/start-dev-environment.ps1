# Start both the backend API server and frontend web server
# First, ensure ports are free
$backend_port = 4828
$frontend_port = 4829

# Check if backend port is in use and kill the process if it is
$backend_process = Get-NetTCPConnection -LocalPort $backend_port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($backend_process) {
    Write-Host "Process using port $backend_port found. Attempting to kill process ID: $backend_process"
    Stop-Process -Id $backend_process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Check if frontend port is in use and kill the process if it is
$frontend_process = Get-NetTCPConnection -LocalPort $frontend_port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($frontend_process) {
    Write-Host "Process using port $frontend_port found. Attempting to kill process ID: $frontend_process"
    Stop-Process -Id $frontend_process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Start the backend server in a new powershell window
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-with-index.ps1" -WorkingDirectory $PSScriptRoot

# Wait a bit for the backend to initialize
Start-Sleep -Seconds 3

# Start the frontend in a new powershell window
Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\start-frontend.ps1" -WorkingDirectory $PSScriptRoot

# Open the application in the default browser
Start-Process "http://localhost:4829"

Write-Host "Gang-GPT development environment started."
Write-Host "Backend API: http://localhost:$backend_port"
Write-Host "Frontend: http://localhost:$frontend_port"
