# Windows Background Service Restarter & Updater for Housing Application
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
Write-Host "  Housing Application Service: Update & Restart           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop background service & terminate process to release locked files
Write-Host "[1/3] Stopping running service and releasing file locks..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}
Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      -> Service stopped successfully." -ForegroundColor Green

# 2. Pull latest code and updated binary from GitHub (if in a git repo)
Write-Host "`n[2/3] Checking for updates from GitHub..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
if (Test-Path "$PSScriptRoot\.git") {
    try {
        & git fetch origin main 2>&1 | Out-Null
        & git reset --hard origin/main
        $commit = (& git rev-parse --short HEAD).Trim()
        Write-Host "      -> Updated to latest version (commit: $commit)." -ForegroundColor Green
    } catch {
        Write-Host "      ⚠️ Notice: Could not pull git updates (offline or network error). Continuing with current files." -ForegroundColor Yellow
    }
} else {
    Write-Host "      -> No git repository detected, skipping update check." -ForegroundColor DarkGray
}

# 3. Restart background service
Write-Host "`n[3/3] Starting 24/7 background service..." -ForegroundColor Cyan
if ($task) {
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 3
    Write-Host "      -> Service successfully started and running!" -ForegroundColor Green
} else {
    Write-Host "      Notice: Task '$TaskName' is not registered. Run install-service.bat if you want 24/7 background service." -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  COMPLETE: Service is running with latest version       " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. Refresh your browser with Ctrl + F5 (Hard Refresh)." -ForegroundColor White
Write-Host "2. Verify health status at: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "==========================================================`n" -ForegroundColor Green
Read-Host "Press Enter to finish..."
