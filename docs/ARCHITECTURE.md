# Architecture Overview

## 1. Runtime Stack
- **Backend (`src/HousingApplication.Web/`)**: ASP.NET Core Minimal APIs (`net9.0` on Windows, `net8.0` cross-platform), `Microsoft.Data.Sqlite` + `Dapper` data access, and `PdfSharpCore` for physical PDF splitting, merging, page extraction, deletion, reordering, and rotation.
- **Database (`organizer.db`)**: Relational SQLite database storing `areas`, `houses`, `tenants`, `batches`, `documents`, `pages`, and RBAC `users` / session state.
- **Physical Archive (`AREAS_ROOT_PATH`)**: Per-house directory tree (`<Area>/<House>/vault/` and `<Area>/<House>/batches/`) synchronized transactionally with SQLite records.
- **Frontend (`src/HousingApplication.Web/wwwroot/` & `dist/win-x64/wwwroot/`)**: Modular vanilla ES6 components (`sidebar.js`, `area-grid.js`, `house-profile.js`, `categories-view.js`, `timeline-view.js`, `doc-viewer.js`, `doc-page-editor.js`, `merge-manager.js`, `ingest-station.js`, `tenant-manager.js`, `auth-manager.js`, `i18n.js`, `theme-manager.js`) bundled with offline `PDF.js` and WebAssembly `Tesseract.js`.

## 2. Core Data Invariants
- **Document-Driven Tenancy Boundaries**:
  - Tenant and house start dates are always derived from `MIN(documents.primary_date)` across visible dated documents (`NULL` when zero documents exist).
  - Vacated resident end dates are derived from `MAX(documents.primary_date)`.
- **Role-Based Access Control (RBAC)**:
  - **Admin** users have full read, upload, edit, and destructive delete permissions (areas, houses, documents, pages).
  - **Contributor** users have read, upload, and organization access while all destructive delete endpoints (`403 Forbidden`) and UI triggers are strictly restricted.
- **Asset Mirroring**:
  - `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/` are kept 1:1 identical so standalone deployments serve the exact same static bundle as `dotnet run`.
