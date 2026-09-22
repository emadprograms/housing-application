# Windows Background Service Updater for Housing Application
$ErrorActionPreference = "Stop"

# Auto-elevate to Administrator if not already elevated
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$TaskName = "HousingApplicationService"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Updating Housing Application Service from GitHub        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop background service & terminate process to release locked files
Write-Host "[1/4] Stopping running service and releasing file locks..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}
Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      -> Service stopped and process terminated successfully." -ForegroundColor Green

# 2. Pull latest commits and binary distributions
Write-Host "`n[2/4] Pulling latest code and updated binary from GitHub..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
try {
    & git fetch origin main
    & git reset --hard origin/main
    Write-Host "      -> Git repository updated to latest origin/main." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning during Git update: $_" -ForegroundColor Red
}

# 3. Restart background service
Write-Host "`n[3/4] Starting 24/7 background service..." -ForegroundColor Cyan
if ($task) {
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 3
    Write-Host "      -> Service successfully started!" -ForegroundColor Green
} else {
    Write-Host "      Notice: Task '$TaskName' is not registered. Run install-service.bat if you want 24/7 background service." -ForegroundColor Yellow
}

# 4. Report status & commit
$commit = (& git rev-parse --short HEAD).Trim()
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: Housing Application Updated to Commit $commit   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. Refresh your browser with Ctrl + F5 (Hard Refresh)." -ForegroundColor White
Write-Host "2. Verify health status at: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "==========================================================`n" -ForegroundColor Green
Read-Host "Press Enter to finish..."
