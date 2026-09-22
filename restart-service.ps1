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
$Port = 5000

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Housing Application 24/7 Background Service Restarter    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop background service & terminate process to release locked files
Write-Host "[1/2] Stopping running service and releasing file locks..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}
Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "      -> Service stopped! All files are now completely unlocked." -ForegroundColor Green

# 2. Check binary status
$exePath = Join-Path $PSScriptRoot "dist\win-x64\FileOrganizer.Web.exe"
if (Test-Path $exePath) {
    $exeItem = Get-Item $exePath
    Write-Host "      Executable:    $($exeItem.FullName)" -ForegroundColor DarkGray
    Write-Host "      Last Modified: $($exeItem.LastWriteTime)" -ForegroundColor DarkGray
}

Write-Host "`n----------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "  TIP: If you are mirroring/copying files from the main PC," -ForegroundColor White
Write-Host "       mirror them NOW while the service is stopped." -ForegroundColor Yellow
Write-Host "----------------------------------------------------------`n" -ForegroundColor DarkCyan

$answer = Read-Host "Press [Enter] to start the service (or type 'Q' to quit and leave it stopped)"
if ($answer -match '^[Qq]') {
    Write-Host "`nService remains stopped. You can mirror/copy files now." -ForegroundColor Yellow
    Write-Host "Run restart-service.bat again whenever you are ready to start.`n" -ForegroundColor DarkGray
    exit 0
}

# 3. Start background service
Write-Host "`n[2/2] Starting 24/7 background service..." -ForegroundColor Cyan
if ($task) {
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 2
    Write-Host "      -> Service successfully started and running!" -ForegroundColor Green
} else {
    Write-Host "      ⚠️ Notice: Task '$TaskName' is not registered." -ForegroundColor Yellow
    Write-Host "      Please run install-service.bat first to set up the service." -ForegroundColor DarkGray
}

$LocalIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*Tailscale*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object -ExpandProperty IPAddress -First 1)

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  COMPLETE: Service is Running                            " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Local browser: http://localhost:$Port" -ForegroundColor Cyan
if ($LocalIp) {
    Write-Host "LAN address:   http://${LocalIp}:$Port" -ForegroundColor Yellow
}
Write-Host "Remember to refresh your browser (Ctrl + F5)." -ForegroundColor DarkGray
Write-Host "==========================================================`n" -ForegroundColor Green
Start-Sleep -Seconds 2
