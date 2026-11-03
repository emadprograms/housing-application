param(
    [string]$AreasRoot = "",
    [string]$DbPath = "",
    [switch]$Unattended
)

$ErrorActionPreference = "Stop"

# Auto-elevate to Administrator if not already elevated
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    if ($AreasRoot) { $argList += " -AreasRoot `"$AreasRoot`"" }
    if ($DbPath) { $argList += " -DbPath `"$DbPath`"" }
    if ($Unattended) { $argList += " -Unattended" }
    
    try {
        $shell = New-Object -ComObject Shell.Application
        $shell.ShellExecute("powershell.exe", $argList, "", "runas", 1)
        Write-Host "Elevation requested via UAC." -ForegroundColor Green
        exit 0
    } catch {
        $proc = Start-Process powershell.exe -Verb RunAs -ArgumentList $argList -PassThru -Wait
        exit $proc.ExitCode
    }
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$TaskName = "HousingApplicationService"
$Port = 5000

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Housing Application: Reinstalling Background Service   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Stop and Uninstall old service
Write-Host "[1/4] Stopping and removing existing background service..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "      -> Scheduled task unregistered." -ForegroundColor Green
}

Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Clean up any leftover .old files
$oldExe = Join-Path $RepoRoot "dist\win-x64\FileOrganizer.Web.exe.old"
if (Test-Path $oldExe) {
    Remove-Item -Force $oldExe -ErrorAction SilentlyContinue
}

# 2. Determine paths (read from config.paths.json if present)
$ConfigFilePath = Join-Path $RepoRoot "config.paths.json"
if (Test-Path $ConfigFilePath) {
    try {
        $cfg = Get-Content $ConfigFilePath -Raw | ConvertFrom-Json
        if (-not $DbPath -and $cfg.organizer_db_path -and (Test-Path $cfg.organizer_db_path)) {
            $DbPath = $cfg.organizer_db_path
        }
        if (-not $AreasRoot -and $cfg.areas_root_path -and (Test-Path $cfg.areas_root_path)) {
            $AreasRoot = $cfg.areas_root_path
        }
    } catch {}
}

if (-not $AreasRoot) {
    if (Test-Path "$RepoRoot\..\areas_v11") {
        $AreasRoot = (Resolve-Path "$RepoRoot\..\areas_v11").Path
    } elseif (Test-Path "$env:USERPROFILE\Documents\Programs\areas_v11") {
        $AreasRoot = "$env:USERPROFILE\Documents\Programs\areas_v11"
    } else {
        $AreasRoot = "D:\areas_v11"
    }
}
if (-not $DbPath) {
    $DbPath = Join-Path $AreasRoot "organizer.db"
}

Write-Host "[2/4] Configuration verified:" -ForegroundColor Yellow
Write-Host "      Areas Root: $AreasRoot" -ForegroundColor DarkGray
Write-Host "      Database:   $DbPath" -ForegroundColor DarkGray

$configData = @{
    areas_root_path = $AreasRoot
    organizer_db_path = $DbPath
}
$configData | ConvertTo-Json -Depth 2 | Set-Content -Path $ConfigFilePath -Encoding UTF8

# 3. Add Firewall Rule
Write-Host "[3/4] Configuring Windows Firewall for port $Port..." -ForegroundColor Cyan
& netsh advfirewall firewall delete rule name="Housing Application Web (Port $Port)" 2>$null | Out-Null
& netsh advfirewall firewall add rule name="Housing Application Web (Port $Port)" dir=in action=allow protocol=TCP localport=$Port profile=any | Out-Null

# 4. Register and Start Scheduled Task
Write-Host "[4/4] Registering background 24/7 service..." -ForegroundColor Cyan
$ExePath = Join-Path $RepoRoot "dist\win-x64\FileOrganizer.Web.exe"
$WorkingDir = Join-Path $RepoRoot "dist\win-x64"

if (-not (Test-Path $ExePath)) {
    Write-Error "Executable not found at '$ExePath'!"
    if (-not $Unattended) { Read-Host "Press Enter to exit..." }
    exit 1
}

$Arguments = "--urls http://0.0.0.0:$Port"
$Action = New-ScheduledTaskAction -Execute $ExePath -Argument $Arguments -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Description "Housing Application Web Server (24/7 background service)" `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal `
    -Settings $Settings `
    -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3

# Report status
$LocalIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*Tailscale*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object -ExpandProperty IPAddress -First 1)

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: Housing Application Service is Running!        " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Local browser: http://localhost:$Port" -ForegroundColor Cyan
if ($LocalIp) {
    Write-Host "Other PCs:     http://${LocalIp}:$Port" -ForegroundColor Yellow
}
Write-Host "==========================================================`n" -ForegroundColor Green

if (-not $Unattended) {
    Read-Host "Press Enter to finish..."
}
