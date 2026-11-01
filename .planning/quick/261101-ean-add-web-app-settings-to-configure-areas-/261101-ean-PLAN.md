---
phase: quick-261101-ean
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/HousingApplication.Web/Models/DTOs.cs
  - src/HousingApplication.Web/Data/SqliteDbConnectionFactory.cs
  - src/HousingApplication.Web/Data/StoragePathSettingsService.cs
  - src/HousingApplication.Web/Data/FileOrganizerRepository.cs
  - src/HousingApplication.Web/Program.cs
  - scripts/service/install-service.ps1
  - src/HousingApplication.Web/wwwroot/index.html
  - src/HousingApplication.Web/wwwroot/js/i18n.js
  - src/HousingApplication.Web/wwwroot/js/auth-manager.js
  - src/HousingApplication.Web/wwwroot/js/db-inspector.js
  - src/HousingApplication.Web/wwwroot/js/storage-settings.js
  - src/HousingApplication.Web/wwwroot/js/app.js
  - dist/win-x64/wwwroot/index.html
  - dist/win-x64/wwwroot/js/i18n.js
  - dist/win-x64/wwwroot/js/auth-manager.js
  - dist/win-x64/wwwroot/js/db-inspector.js
  - dist/win-x64/wwwroot/js/storage-settings.js
  - dist/win-x64/wwwroot/js/app.js
  - tests/HousingApplication.Tests/ApiEndpointTests.cs
  - tests/web/components/storage_settings.test.js
autonomous: true
requirements:
  - QCK-63
must_haves:
  truths:
    - "Admin users can view, browse, validate, and hot-swap AREAS_ROOT_PATH and ORGANIZER_DB_PATH directly from the Web App without restarting the server."
    - "Contributor accounts are blocked from reading, browsing, or changing server storage paths (403 Forbidden on backend + hidden UI controls)."
    - "Updated paths immediately apply to live SQLite queries, tree browsing, PDF serving, and document ingestion, and persist atomically to config.paths.json across restarts."
    - "Existing xUnit ApiTestFixture in-memory overrides remain completely isolated from any local config.paths.json file."
    - "All navbar/modal strings strictly obey single-language AR/EN separation rules verified by clean_language_shell.test.js."
  artifacts:
    - path: "src/HousingApplication.Web/Data/StoragePathSettingsService.cs"
      provides: "Thread-safe runtime + persistent storage path resolution, validation, server directory browsing, and live SQLite hot-swapping"
    - path: "src/HousingApplication.Web/wwwroot/js/storage-settings.js"
      provides: "Admin Storage & Database Settings modal controller with server folder/.db browser, dry-run validation, and live archive reload"
    - path: "tests/web/components/storage_settings.test.js"
      provides: "Vitest coverage for Storage & Database Settings UI, RBAC, i18n, browser navigation, validation, hot-swap, and 405 fallback"
---

<objective>
Enable Administrators to inspect, browse, validate, and dynamically change the `areas` archive folder path (`AREAS_ROOT_PATH`) and SQLite database path (`ORGANIZER_DB_PATH` / `organizer.db`) directly inside the Web Application, with immediate live hot-swapping and persistent storage in `config.paths.json`.

Purpose: Eliminate manual script editing, CLI flags, or Windows Task Scheduler re-registration whenever an administrator moves an archive between drives (e.g., `C:\` to `D:\areas_v11` or external/NAS storage) or switches between archive snapshots.
Output: Thread-safe C# `StoragePathSettingsService` + hot-swappable `SqliteDbConnectionFactory`, Admin-only `/api/settings/*` endpoints, bilingual Storage & Database Settings modal with server directory browser, synced `dist/win-x64/wwwroot/` assets, and xUnit + Vitest tests.
</objective>

<context>
@.planning/STATE.md
@src/HousingApplication.Web/Program.cs
@src/HousingApplication.Web/Data/SqliteDbConnectionFactory.cs
@src/HousingApplication.Web/Data/FileOrganizerRepository.cs
@src/HousingApplication.Web/wwwroot/index.html
@src/HousingApplication.Web/wwwroot/js/i18n.js
@tests/HousingApplication.Tests/ApiEndpointTests.cs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement hot-swappable StoragePathSettingsService, SqliteDbConnectionFactory.UpdateDatabasePath, and Admin /api/settings endpoints</name>
  <files>
    src/HousingApplication.Web/Models/DTOs.cs,
    src/HousingApplication.Web/Data/SqliteDbConnectionFactory.cs,
    src/HousingApplication.Web/Data/StoragePathSettingsService.cs,
    src/HousingApplication.Web/Data/FileOrganizerRepository.cs,
    src/HousingApplication.Web/Program.cs,
    scripts/service/install-service.ps1
  </files>
  <action>
    1. Add DTOs in `DTOs.cs` (`StoragePathsResponseDto`, `UpdateStoragePathsRequestDto`, `ValidateStoragePathsResponseDto`, `BrowseEntryDto`, `BrowsePathsResponseDto`).
    2. Upgrade `ISqliteDbConnectionFactory` / `SqliteDbConnectionFactory` with thread-safe `UpdateDatabasePath(string newDbPath, bool createParentDirectory = true)` that updates `DatabasePath` & `_connectionString` under lock and calls `SqliteConnection.ClearAllPools()` when switching database files so Windows file handles on the old DB are immediately released. Support `AppContext.BaseDirectory`-relative fallback when relative DB paths do not exist in CWD.
    3. Create `IStoragePathSettingsService` / `StoragePathSettingsService`:
       - Honor `MemoryConfigurationProvider` overrides first so `ApiTestFixture` stays 100% isolated during `dotnet test`.
       - Otherwise load `config.paths.json` on startup ahead of `appsettings.json` / stale CLI args and synchronize `ISqliteDbConnectionFactory`.
       - Strip surrounding quotes (`"D:\areas_v11"` -> `D:\areas_v11`) and auto-append `organizer.db` if `organizer_db_path` points to a directory.
       - Provide `ValidatePathsAsync` (checking folder existence, area count, SQLite 16-byte magic header, and read-only table counts), `UpdatePathsAsync` (optional creation of missing folder/DB, live DB switch + `EnsureSchemaAsync()`, atomic `config.paths.json` write), and `BrowseServerFilesystem` (drives/roots + subdirectories + `.db` files).
    4. Inject optional `IStoragePathSettingsService?` into `FileOrganizerRepository` (centralizing all 10 `AREAS_ROOT_PATH` fallbacks) and wire `ResolveAreasRoot` in `Program.cs` to `IStoragePathSettingsService`.
    5. Register Admin-only (`IsRestrictedFromDelete` -> `403`) endpoints in `Program.cs`:
       - `GET /api/settings/paths`
       - `POST /api/settings/paths/validate`
       - `PUT /api/settings/paths`
       - `GET /api/settings/browse`
    6. Update `scripts/service/install-service.ps1` so the Scheduled Task relies on `config.paths.json` rather than passing static `--ORGANIZER_DB_PATH` / `--AREAS_ROOT_PATH` CLI arguments.
  </action>
  <verify>Inspect all C# types, nullability, DI constructor compatibility with existing unit tests (`RepositoryTests`, `HouseNumberSearchTests`, `ApiEndpointTests`), and PowerShell syntax.</verify>
  <done>All backend endpoints, hot-swap plumbing, repository path resolution, and persistence to `config.paths.json` are implemented cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Build bilingual Admin Storage & Database Settings modal with server directory browser and sync dist/win-x64/wwwroot</name>
  <files>
    src/HousingApplication.Web/wwwroot/index.html,
    src/HousingApplication.Web/wwwroot/js/i18n.js,
    src/HousingApplication.Web/wwwroot/js/auth-manager.js,
    src/HousingApplication.Web/wwwroot/js/db-inspector.js,
    src/HousingApplication.Web/wwwroot/js/storage-settings.js,
    src/HousingApplication.Web/wwwroot/js/app.js,
    dist/win-x64/wwwroot/*
  </files>
  <action>
    1. Add complete single-language Arabic (`ar`) and English (`en`) translation keys under `storage_settings.*` in `i18n.js` (zero bilingual `" / "` pairs).
    2. Add Admin-only trigger buttons:
       - `#btn-open-storage-settings` inside `#user-profile-dropdown` in `index.html` (single-language `data-i18n`, hidden when `authManager.isContributor()`).
       - `#db-change-paths-btn` in `#database-inspector-panel` header next to `#db-path-badge` (hidden when `authManager.isContributor()`).
    3. Add `#storage-settings-modal` in `index.html` and `js/storage-settings.js`:
       - Active path status cards, `areas_root_path` & `organizer_db_path` inputs (`dir="ltr"`), 1-click `<Areas>/organizer.db` helper, `create_if_missing` toggle, inline server drive/folder/`.db` browser, `Verify Paths` preview panel, `Save & Apply` live reload (`window.loadTree()` + `loadDbInspector()`), and graceful `404`/`405` outdated-binary guidance (`scripts\build-windows.bat`).
    4. Sync `src/HousingApplication.Web/wwwroot/` to `dist/win-x64/wwwroot/`.
  </action>
  <verify>`diff -rq src/HousingApplication.Web/wwwroot dist/win-x64/wwwroot` outputs zero differences.</verify>
  <done>Admin Storage & Database Settings modal works seamlessly in Arabic (RTL) and English (LTR) with full dark-mode and RBAC support.</done>
</task>

<task type="auto">
  <name>Task 3: Add xUnit API tests and Vitest component tests and verify full test suite</name>
  <files>
    tests/HousingApplication.Tests/ApiEndpointTests.cs,
    tests/web/components/storage_settings.test.js
  </files>
  <action>
    1. Add xUnit integration tests in `ApiEndpointTests.cs` for `GET /api/settings/paths`, `POST /api/settings/paths/validate`, `PUT /api/settings/paths` (verifying live hot-swap + isolated `STORAGE_SETTINGS_FILE_PATH` persistence), `GET /api/settings/browse`, and Contributor `403` enforcement.
    2. Add Vitest tests in `tests/web/components/storage_settings.test.js` covering RBAC visibility, `clean_language_shell` compliance, path auto-fill, server folder/`.db` browsing, dry-run validation, live save & tree reload, and `405` precompiled-binary warning handling.
    3. Run `npx vitest run` across the entire frontend suite.
  </action>
  <verify>`npx vitest run` passes 100% of test files including `clean_language_shell.test.js` and `storage_settings.test.js`.</verify>
  <done>All tests pass and `.agents/` remains untouched.</done>
</task>

</tasks>
