# Windows 24/7 Background Service Installer for Housing Application
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

# 1. Determine Paths
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

$ExePath = "$PSScriptRoot\dist\win-x64\FileOrganizer.Web.exe"
$WorkingDir = "$PSScriptRoot\dist\win-x64"

if (-not (Test-Path $ExePath)) {
    Write-Error "Executable not found at '$ExePath'!"
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Add Windows Firewall Rule
Write-Host "Configuring Windows Firewall for port $Port..." -ForegroundColor Cyan
& netsh advfirewall firewall delete rule name="Housing Application Web (Port $Port)" 2>$null | Out-Null
& netsh advfirewall firewall add rule name="Housing Application Web (Port $Port)" dir=in action=allow protocol=TCP localport=$Port profile=any | Out-Null
Write-Host "[OK] Firewall rule configured for port $Port." -ForegroundColor Green

# 3. Stop and Remove old task if it exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Updating existing background service..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Also terminate any running standalone process so port 5000 is clean
Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 4. Create Scheduled Task to run 24/7 at system startup
Write-Host "Registering background 24/7 service with Windows..." -ForegroundColor Cyan
$Arguments = "--urls http://0.0.0.0:$Port --ORGANIZER_DB_PATH `"$DbPath`" --AREAS_ROOT_PATH `"$AreasRoot`""

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

# 5. Start the service now
Write-Host "Starting service..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3

# 6. Report status
$LocalIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*Tailscale*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object -ExpandProperty IPAddress -First 1)

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: Housing Application is now a 24/7 Service!     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "The server is now running silently in the background." -ForegroundColor White
Write-Host "It will automatically start when the computer turns on," -ForegroundColor White
Write-Host "even if no user is logged in.`n" -ForegroundColor White
Write-Host "Local browser: http://localhost:$Port" -ForegroundColor Cyan
if ($LocalIp) {
    Write-Host "Other PCs:     http://${LocalIp}:$Port" -ForegroundColor Yellow
}
Write-Host "==========================================================`n" -ForegroundColor Green
Read-Host "Press Enter to finish..."
