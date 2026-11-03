# Build & Publish Standalone Windows Executable (dist/win-x64)
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ProjectPath = Join-Path $RepoRoot "src\HousingApplication.Web\HousingApplication.Web.csproj"
$OutputDir = Join-Path $RepoRoot "dist\win-x64"

if (Test-Path "$env:USERPROFILE\.dotnet\dotnet.exe") {
    $env:DOTNET_ROOT = "$env:USERPROFILE\.dotnet"
    $env:PATH = "$env:USERPROFILE\.dotnet;" + $env:PATH
}

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Error ".NET SDK ('dotnet') is required to build the application."
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Building Housing Application (Release | win-x64)        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Release file lock if standalone binary is currently running
$running = Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "Stopping running FileOrganizer.Web process to release file locks..." -ForegroundColor Yellow
    $running | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

dotnet publish $ProjectPath `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -o $OutputDir

Write-Host "`n[OK] Published standalone executable to: $OutputDir\FileOrganizer.Web.exe" -ForegroundColor Green
