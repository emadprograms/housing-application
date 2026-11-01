# Windows Startup Script for Housing Application (.NET Web Server)
$ErrorActionPreference = "Stop"

# Detect database and vault directories
$DbPath = ""
$AreasRoot = ""

$ConfigFilePath = "$PSScriptRoot\config.paths.json"
if (Test-Path $ConfigFilePath) {
    try {
        $cfg = Get-Content $ConfigFilePath -Raw | ConvertFrom-Json
        if ($cfg.organizer_db_path -and (Test-Path $cfg.organizer_db_path)) {
            $DbPath = $cfg.organizer_db_path
        }
        if ($cfg.areas_root_path -and (Test-Path $cfg.areas_root_path)) {
            $AreasRoot = $cfg.areas_root_path
        }
    } catch {}
}

if (-not $DbPath -or -not $AreasRoot) {
    # Check areas_v11 in parent folder or common locations
    if (Test-Path "$PSScriptRoot\..\areas_v11\organizer.db") {
        $DbPath = (Resolve-Path "$PSScriptRoot\..\areas_v11\organizer.db").Path
        $AreasRoot = (Resolve-Path "$PSScriptRoot\..\areas_v11").Path
    } elseif (Test-Path "$PSScriptRoot\areas_v11\organizer.db") {
        $DbPath = (Resolve-Path "$PSScriptRoot\areas_v11\organizer.db").Path
        $AreasRoot = (Resolve-Path "$PSScriptRoot\areas_v11").Path
    } elseif (Test-Path "D:\areas_v11\organizer.db") {
        $DbPath = "D:\areas_v11\organizer.db"
        $AreasRoot = "D:\areas_v11"
    } elseif (Test-Path "$PSScriptRoot\organizer.db") {
        $DbPath = (Resolve-Path "$PSScriptRoot\organizer.db").Path
        $AreasRoot = (Resolve-Path "$PSScriptRoot\areas" -ErrorAction SilentlyContinue).Path
        if (-not $AreasRoot) { $AreasRoot = "$PSScriptRoot\areas" }
    } else {
        $DbPath = "$PSScriptRoot\organizer.db"
        $AreasRoot = "$PSScriptRoot\areas"
    }
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

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue) -and (Test-Path "$env:USERPROFILE\.dotnet\dotnet.exe")) {
    $env:PATH = "$env:USERPROFILE\.dotnet;" + $env:PATH
}

# Project directory candidates
$projectCandidates = @(
    "$PSScriptRoot\src\HousingApplication.Web",
    "$PSScriptRoot\housing-application\src\HousingApplication.Web"
)
$projectDir = $projectCandidates | Where-Object { Test-Path "$_\HousingApplication.Web.csproj" } | Select-Object -First 1

# Standalone executable candidates
$exeCandidates = @(
    "$PSScriptRoot\dist\win-x64\FileOrganizer.Web.exe",
    "$PSScriptRoot\housing-application\dist\win-x64\FileOrganizer.Web.exe"
)
$exePath = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($projectDir -and (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Set-Location -Path $projectDir
    dotnet run `
        --urls "http://0.0.0.0:$Port" `
        --ORGANIZER_DB_PATH "$DbPath" `
        --AREAS_ROOT_PATH "$AreasRoot"
} elseif ($exePath) {
    $exeDir = Split-Path -Parent $exePath
    Write-Host "Running standalone executable from $exeDir (no .NET installation required)..." -ForegroundColor Green
    Set-Location -Path $exeDir
    & $exePath `
        --urls "http://0.0.0.0:$Port" `
        --ORGANIZER_DB_PATH "$DbPath" `
        --AREAS_ROOT_PATH "$AreasRoot"
} else {
    Write-Error "Neither .NET SDK ('dotnet') nor standalone executable ('dist\win-x64\FileOrganizer.Web.exe') was found."
}
