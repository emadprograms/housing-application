param(
    [switch]$Unattended
)

# Windows Background Service Uninstaller for Housing Application
$ErrorActionPreference = "Stop"

# Auto-elevate to Administrator if not already elevated
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    if ($Unattended) { $argList += " -Unattended" }
    try {
        $shell = New-Object -ComObject Shell.Application
        $shell.ShellExecute("powershell.exe", $argList, "", "runas", 1)
        exit 0
    } catch {
        $proc = Start-Process powershell.exe -Verb RunAs -ArgumentList $argList -PassThru -Wait
        exit $proc.ExitCode
    }
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
if (-not $Unattended) {
    Read-Host "Press Enter to finish..."
}
