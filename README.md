# Housing Application

A responsive bilingual (Arabic / English) web application built on **ASP.NET Core** and **SQLite** for managing residential areas, house tenancy registers, compliance checklists, and vaulted PDF document archives.

---

## Repository Structure

```text
housing-application/
├── src/
│   └── HousingApplication.Web/       # ASP.NET Core web server, SQLite repository & wwwroot UI
├── tests/
│   ├── HousingApplication.Tests/     # .NET xUnit backend & API integration tests
│   └── web/                          # Vitest + jsdom frontend component test suites
├── dist/
│   └── win-x64/                      # Self-contained Windows x64 executable & mirrored wwwroot
├── scripts/
│   ├── run-windows.bat / .ps1        # Launch web server on Windows (.NET SDK or standalone .exe)
│   ├── build-windows.bat / .ps1      # Compile & publish standalone dist/win-x64/FileOrganizer.Web.exe
│   ├── run-mac.sh                    # Launch web server on macOS / Linux
│   ├── export_web.cjs                # Node.js static archive exporter
│   ├── service/                      # Windows 24/7 Scheduled Task service scripts (install/restart/uninstall)
│   └── legacy/                       # Archived Python v5–v11 batch/migration scripts & sample configs
├── docs/
│   ├── ARCHITECTURE.md               # System architecture, database schema & frontend design
│   ├── DEPLOYMENT.md                 # Windows standalone, LAN/Tailscale & 24/7 service setup
│   └── legacy/                       # Historical Python v5.3 CLI documentation
├── HousingApplication.sln            # Visual Studio / .NET solution
├── package.json                      # Frontend test & helper scripts
└── vitest.config.js                  # Vitest configuration
```

---

## Quick Start

### Windows (Interactive Console)
Double-click `scripts\run-windows.bat` or run from PowerShell:
```powershell
.\scripts\run-windows.ps1
```
The launcher automatically detects `..\areas_v11\organizer.db` (or `config.paths.json` / `D:\areas_v11`) and serves the application on `http://localhost:5000` (plus LAN / Tailscale IPv4 addresses). If the .NET SDK is not installed, it automatically runs `dist\win-x64\FileOrganizer.Web.exe`.

### Windows (24/7 Background Service)
Use the Administrator scripts in `scripts\service\`:
- **`scripts\service\install-service.bat`** — Configures paths (`config.paths.json`), opens Windows Firewall port `5000`, and registers a boot-time Scheduled Task (`HousingApplicationService`).
- **`scripts\service\restart-service.bat`** — Stops the service (unlocking files for updates/recompilation) and restarts it.
- **`scripts\service\uninstall-service.bat`** — Stops and removes the background service.

### macOS / Linux
```bash
./scripts/run-mac.sh
```

---

## Building the Windows Standalone Binary

After modifying C# backend code (`src/HousingApplication.Web/`), recompile `dist/win-x64/FileOrganizer.Web.exe` by running:
```powershell
.\scripts\build-windows.ps1
```
*(Or double-click `scripts\build-windows.bat`.)*

---

## Key Capabilities

- **Area & House Management**: Create/delete residential areas and houses with automatic folder scaffolding (`batches/` & `vault/`) and RBAC delete protection (Admin vs. Contributor accounts).
- **Document-Driven Tenancy Dates**: Start dates (`MIN(primary_date)`) and vacated tenant end dates (`MAX(primary_date)`) are automatically derived and synchronized from uploaded documents.
- **Compliance & File Integrity**: Tracks the 5 mandatory tenancy categories per active resident with instant filters and preset 1-click upload shortcuts.
- **Interactive PDF Vault Tools**: Merge multiple documents with visual thumbnails, split/extract/delete/reorder/rotate pages (`PdfSharpCore`), and run 100% offline client-side Arabic-to-English OCR translation (`Tesseract.js` WASM).
- **Dark Mode, RTL/LTR Localization & Touch Support**: Full light/dark themes, clean single-language Arabic/English switching, and tablet press-and-hold drag-and-drop.

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+B` / `⌘B` | Collapse or expand navigation sidebar |
| `Ctrl+K` / `⌘K` | Global Spotlight Search (areas, houses, tenants, documents) |
| `Ctrl+I` / `⌘I` | Open Document Upload / Ingest Station |
| `Space` | Quick Look document preview |
| `Shift+D` | Toggle Dark / Light theme |
| `Ctrl +` / `Ctrl -` / `Ctrl 0` | Zoom cards in Merge & Page Editor modals |
| `?` | Keyboard Shortcuts guide |
| `Esc` | Dismiss active modals, menus, or previews |

---

## Testing

```bash
# Frontend component tests (Vitest + jsdom)
npm test

# Backend repository & API integration tests (.NET xUnit)
dotnet test HousingApplication.sln
```
