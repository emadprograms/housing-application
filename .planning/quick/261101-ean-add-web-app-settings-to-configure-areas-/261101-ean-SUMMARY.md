---
phase: quick-261101-ean
plan: 01
subsystem: storage-configuration
tags: [settings, sqlite, hot-swap, rbac, i18n, storage-paths]
requires: []
provides:
  - "Admin-only Web App UI & API to inspect, browse, validate, and hot-swap AREAS_ROOT_PATH and ORGANIZER_DB_PATH"
  - "Persistent config.paths.json synchronization across server and Windows 24/7 Scheduled Task restarts"
  - "Thread-safe live SQLite database connection factory switching with automatic pool release"
affects:
  - src/HousingApplication.Web/Data/SqliteDbConnectionFactory.cs
  - src/HousingApplication.Web/Data/StoragePathSettingsService.cs
  - src/HousingApplication.Web/Data/FileOrganizerRepository.cs
  - src/HousingApplication.Web/Program.cs
  - src/HousingApplication.Web/wwwroot/js/storage-settings.js
tech-stack:
  added: []
  patterns:
    - "Thread-safe runtime storage path override with MemoryConfigurationProvider test isolation"
    - "Server-side directory and .db browser paired with dry-run SQLite magic-header verification"
key-files:
  created:
    - src/HousingApplication.Web/Data/StoragePathSettingsService.cs
    - src/HousingApplication.Web/wwwroot/js/storage-settings.js
    - dist/win-x64/wwwroot/js/storage-settings.js
    - tests/web/components/storage_settings.test.js
  modified:
    - src/HousingApplication.Web/Models/DTOs.cs
    - src/HousingApplication.Web/Data/SqliteDbConnectionFactory.cs
    - src/HousingApplication.Web/Data/FileOrganizerRepository.cs
    - src/HousingApplication.Web/Program.cs
    - scripts/service/install-service.ps1
    - src/HousingApplication.Web/wwwroot/index.html
    - src/HousingApplication.Web/wwwroot/js/i18n.js
    - src/HousingApplication.Web/wwwroot/js/auth-manager.js
    - src/HousingApplication.Web/wwwroot/js/db-inspector.js
    - src/HousingApplication.Web/wwwroot/js/app.js
    - tests/HousingApplication.Tests/ApiEndpointTests.cs
decisions:
  - "Paired explicit server path inputs with an Admin-only server-side directory/.db browser (/api/settings/browse) because HTML <input type='file'> strips server paths (C:\\fakepath) and browses client devices rather than the host server."
  - "Defaulted create_if_missing to false so path typos when switching to an existing archive fail fast instead of silently initializing an empty SQLite database."
  - "Detected MemoryConfigurationProvider in StoragePathSettingsService so xUnit ApiTestFixture tests remain 100% isolated from any developer config.paths.json."
metrics:
  duration: "14m"
  completed_date: "2026-11-01"
  tasks: 3
  files: 20
---

# Quick Task 261101-ean: Web App Storage & Database Path Settings Summary

Implemented end-to-end Admin-only configuration inside the Web Application to view, browse, validate, and hot-swap both the `areas` archive root folder (`AREAS_ROOT_PATH`) and SQLite database file (`ORGANIZER_DB_PATH` / `organizer.db`) live without restarting the server, persisting changes atomically to `config.paths.json`.

## Commits

- `81aa5ce` — `feat(quick-261101-ean): add hot-swappable StoragePathSettingsService and /api/settings endpoints`
- `a8b2ca1` — `feat(quick-261101-ean): add Admin Storage & Database Paths modal and server directory browser`
- `621f7ea` — `test(quick-261101-ean): add xUnit and Vitest coverage for storage path configuration`

## Verification

- `npx vitest run`: **55/55 test files passed (766/766 tests)**, including `storage_settings.test.js` and `clean_language_shell.test.js`.
- `diff -rq src/HousingApplication.Web/wwwroot dist/win-x64/wwwroot`: Byte-for-byte parity verified.
- Note on Windows standalone `.exe`: Recompile `dist/win-x64/FileOrganizer.Web.exe` once on Windows via `scripts\build-windows.bat` so the standalone binary serves the new `/api/settings/*` endpoints (when running via `dotnet run`, they are active immediately).
