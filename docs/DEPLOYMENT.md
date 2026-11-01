# Deployment & Operations Guide

## 1. Archive & Database Path Resolution
By default, `appsettings.json` and `scripts/run-windows.ps1` resolve paths in this order:
1. `config.paths.json` in the repository root (written automatically by `scripts/service/install-service.bat`), if present.
2. Sibling archive directory `..\areas_v11` (`..\areas_v11\organizer.db`).
3. Local `.\areas_v11` or `D:\areas_v11`.
4. Fallback `.\areas` and `.\organizer.db` inside the repository root.

You can also pass explicit overrides to either `dotnet run` or `FileOrganizer.Web.exe`:
```powershell
.\dist\win-x64\FileOrganizer.Web.exe --urls "http://0.0.0.0:5000" --ORGANIZER_DB_PATH "D:\areas_v11\organizer.db" --AREAS_ROOT_PATH "D:\areas_v11"
```

## 2. Recompiling the Standalone Windows Binary
Whenever C# files under `src/HousingApplication.Web/` change:
1. If running as a background service, stop it first via `scripts\service\restart-service.bat` (press `Q` after stopping) so `FileOrganizer.Web.exe` is unlocked.
2. Run `scripts\build-windows.bat` (or `.\scripts\build-windows.ps1`), which publishes a self-contained single-file `win-x64` release directly into `dist\win-x64\`.
3. Start the server again via `scripts\run-windows.bat` or `scripts\service\restart-service.bat`.

## 3. Windows 24/7 Scheduled Task Service
All Windows service helpers live in `scripts\service\`:
- `install-service.bat`: Prompts for `areas_v11` and `organizer.db`, writes `config.paths.json`, configures Windows Firewall inbound TCP port `5000`, and registers `HousingApplicationService` under `NT AUTHORITY\SYSTEM` at startup.
- `restart-service.bat`: Cleanly stops `HousingApplicationService` + any lingering `FileOrganizer.Web` process and restarts it on confirmation.
- `uninstall-service.bat`: Stops and unregisters `HousingApplicationService`.
