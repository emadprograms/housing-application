# Windows Background Service Uninstaller for Housing Application
$ErrorActionPreference = "Stop"

# Auto-elevate to Administrator if not already elevated
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$TaskName = "HousingApplicationService"
Write-Host "Stopping and removing Housing Application background service..." -ForegroundColor Yellow

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "[OK] Background task removed." -ForegroundColor Green
} else {
    Write-Host "Service task was not registered." -ForegroundColor DarkGray
}

Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Service stopped and completely uninstalled.            " -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Green
Read-Host "Press Enter to finish..."
