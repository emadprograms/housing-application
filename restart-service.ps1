# Windows Background Service Restarter for Housing Application
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
Write-Host "  Restarting Housing Application 24/7 Background Service   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "Stopping service..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    
    Write-Host "Starting service..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 2
    Write-Host "[OK] Service successfully restarted and running!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service task '$TaskName' is not installed yet." -ForegroundColor Yellow
    Write-Host "Please run install-service.bat first to set up the service." -ForegroundColor DarkGray
}

Write-Host "==========================================================`n" -ForegroundColor Cyan
Read-Host "Press Enter to finish..."
