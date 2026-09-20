# Windows Startup Script for Housing Application (.NET Web Server)
$ErrorActionPreference = "Stop"

# Detect database and vault directories
$DefaultDb = "D:\areas_v11\organizer.db"
$DefaultAreas = "D:\areas_v11"

if (Test-Path "D:\areas_v11\organizer.db") {
    $DbPath = "D:\areas_v11\organizer.db"
    $AreasRoot = "D:\areas_v11"
} elseif (Test-Path "$PSScriptRoot\organizer.db") {
    $DbPath = "$PSScriptRoot\organizer.db"
    $AreasRoot = "$PSScriptRoot\areas"
} elseif (Test-Path "D:\areas_v11") {
    $DbPath = "D:\areas_v11\organizer.db"
    $AreasRoot = "D:\areas_v11"
} else {
    $DbPath = "$PSScriptRoot\organizer.db"
    $AreasRoot = "$PSScriptRoot\areas"
}

$Port = 5000

# Get local LAN IPv4 address
$LocalIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*Tailscale*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object -ExpandProperty IPAddress -First 1)

# Get Tailscale IP if connected
$TailscaleIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -like "*Tailscale*" } |
    Select-Object -ExpandProperty IPAddress -First 1)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Housing Application .NET Web Server on Windows" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Database:    $DbPath" -ForegroundColor White
Write-Host "Areas Root:  $AreasRoot" -ForegroundColor White
Write-Host "Local:       http://localhost:$Port" -ForegroundColor Green
if ($LocalIp) {
    Write-Host "Network LAN: http://${LocalIp}:$Port  [Accessible to devices on your Wi-Fi/LAN]" -ForegroundColor Yellow
}
if ($TailscaleIp) {
    Write-Host "Tailscale:   http://${TailscaleIp}:$Port  [Accessible over Tailscale VPN]" -ForegroundColor Magenta
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server.`n" -ForegroundColor DarkGray

if (Get-Command dotnet -ErrorAction SilentlyContinue) {
    Set-Location -Path "$PSScriptRoot\src\HousingApplication.Web"
    dotnet run `
        --urls "http://0.0.0.0:$Port" `
        --ORGANIZER_DB_PATH "$DbPath" `
        --AREAS_ROOT_PATH "$AreasRoot"
} elseif (Test-Path "$PSScriptRoot\dist\win-x64\FileOrganizer.Web.exe") {
    Write-Host "Running standalone executable from dist\win-x64 (no .NET installation required)..." -ForegroundColor Green
    Set-Location -Path "$PSScriptRoot\dist\win-x64"
    .\FileOrganizer.Web.exe `
        --urls "http://0.0.0.0:$Port" `
        --ORGANIZER_DB_PATH "$DbPath" `
        --AREAS_ROOT_PATH "$AreasRoot"
} else {
    Write-Error "Neither .NET SDK ('dotnet') nor standalone executable ('dist\win-x64\FileOrganizer.Web.exe') was found."
}
