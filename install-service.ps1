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

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Housing Application: 24/7 Background Service Setup    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Please specify where your document archives and database are located." -ForegroundColor White
Write-Host "(You can copy & paste the paths or drag-and-drop folders into this window)`n" -ForegroundColor DarkGray

# 1. Ask for areas_v11 folder
$defaultAreas = "D:\areas_v11"
if (-not (Test-Path $defaultAreas)) {
    if (Test-Path "C:\areas_v11") { $defaultAreas = "C:\areas_v11" }
    elseif (Test-Path "$PSScriptRoot\areas") { $defaultAreas = "$PSScriptRoot\areas" }
}

$AreasRoot = ""
while (-not $AreasRoot) {
    Write-Host "[1/2] Directory of 'areas_v11' folder:" -ForegroundColor Yellow
    Write-Host "      Default: $defaultAreas" -ForegroundColor DarkGray
    $inputAreas = Read-Host "      Enter folder path (Press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($inputAreas)) {
        $AreasRoot = $defaultAreas
    } else {
        $AreasRoot = $inputAreas.Trim().Trim('"').Trim("'")
    }

    if (-not (Test-Path $AreasRoot)) {
        Write-Host "      ⚠️  Warning: Folder '$AreasRoot' does not exist on disk right now." -ForegroundColor Red
        $confirm = Read-Host "      Do you want to use this path anyway? (Y/N) [Default: Y]"
        if ($confirm -match '^[Nn]') {
            $AreasRoot = ""
        }
    }
}
Write-Host "      -> Selected Areas Directory: $AreasRoot`n" -ForegroundColor Green

# 2. Ask for organizer.db location (file or containing folder)
$defaultDb = Join-Path $AreasRoot "organizer.db"
$DbPath = ""
while (-not $DbPath) {
    Write-Host "[2/2] Location of 'organizer.db' (file path OR containing folder):" -ForegroundColor Yellow
    Write-Host "      Default: $defaultDb" -ForegroundColor DarkGray
    $inputDb = Read-Host "      Enter file or folder path (Press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($inputDb)) {
        $DbPath = $defaultDb
    } else {
        $cleaned = $inputDb.Trim().Trim('"').Trim("'")
        if (Test-Path $cleaned -PathType Container) {
            # User provided a directory
            $DbPath = Join-Path $cleaned "organizer.db"
        } elseif ($cleaned -notlike "*.db") {
            # Folder or filename without extension
            $DbPath = Join-Path $cleaned "organizer.db"
        } else {
            $DbPath = $cleaned
        }
    }

    if (Test-Path $DbPath) {
        $sizeMb = [math]::Round(((Get-Item $DbPath).Length / 1MB), 2)
        Write-Host "      -> Found existing database ($sizeMb MB): $DbPath" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Notice: Database file does not exist at '$DbPath'." -ForegroundColor Yellow
        Write-Host "         SQLite will automatically create a new database at this location." -ForegroundColor DarkGray
        $confirm = Read-Host "      Continue with this database path? (Y/N) [Default: Y]"
        if ($confirm -match '^[Nn]') {
            $DbPath = ""
        }
    }
}
Write-Host "      -> Selected Database: $DbPath`n" -ForegroundColor Green

# Summary and confirmation
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Configuration Summary:" -ForegroundColor White
Write-Host "  Areas Folder: $AreasRoot" -ForegroundColor White
Write-Host "  Database:     $DbPath" -ForegroundColor White
Write-Host "  Web Port:     $Port" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
$proceed = Read-Host "Proceed with service installation? (Y/N) [Default: Y]"
if ($proceed -match '^[Nn]') {
    Write-Host "Installation canceled." -ForegroundColor Yellow
    exit 0
}

# Save paths into config.paths.json for persistent reference
$configData = @{
    areas_root_path = $AreasRoot
    organizer_db_path = $DbPath
}
$configData | ConvertTo-Json -Depth 2 | Set-Content -Path (Join-Path $PSScriptRoot "config.paths.json") -Encoding UTF8
Write-Host "`nSaved path settings to config.paths.json." -ForegroundColor DarkGray

$ExePath = "$PSScriptRoot\dist\win-x64\FileOrganizer.Web.exe"
$WorkingDir = "$PSScriptRoot\dist\win-x64"

if (-not (Test-Path $ExePath)) {
    Write-Error "Executable not found at '$ExePath'!"
    Read-Host "Press Enter to exit..."
    exit 1
}

# 3. Add Windows Firewall Rule
Write-Host "Configuring Windows Firewall for port $Port..." -ForegroundColor Cyan
& netsh advfirewall firewall delete rule name="Housing Application Web (Port $Port)" 2>$null | Out-Null
& netsh advfirewall firewall add rule name="Housing Application Web (Port $Port)" dir=in action=allow protocol=TCP localport=$Port profile=any | Out-Null
Write-Host "[OK] Firewall rule configured for port $Port." -ForegroundColor Green

# 4. Stop and Remove old task if it exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Updating existing background service..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Also terminate any running standalone process so port 5000 is clean
Get-Process -Name "FileOrganizer.Web" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# 5. Create Scheduled Task to run 24/7 at system startup
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

# 6. Start the service now
Write-Host "Starting service..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 3

# 7. Report status
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
