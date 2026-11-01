---
quick_id: "261101-8gl"
slug: "document-driven-start-date-for-houses-an"
date: "2026-11-01"
status: complete
---

# Quick Task Summary: Document-Driven Start Date for Houses & Tenants and Remove Add-House Start Date Option

## Overview
Enforced across the entire backend and frontend that the start date of any house or tenant is **strictly** derived from the earliest date (`MIN(primary_date)`) of the documents entered for it (remaining `null` / automatic until the first document is entered), and completely removed the manual Start Date option from the Create House (`#add-house-modal`) workflow.

## Key Changes Implemented

1. **Removed Start Date Option from Create House Flow (`index.html`, `area-grid.js`, `Program.cs`, `FileOrganizerRepository.cs`)**:
   - Removed `#add-house-tenant-date-input` and its `<label>` from `#add-house-modal` in `index.html`.
   - Removed today's-date auto-initialization in `openAddHouseModal()` and date reading in `handleAddHouseSubmit()` (`area-grid.js`), always sending `start_date: null` when creating a house.
   - Updated `POST /api/areas/{areaId}/houses` (`Program.cs`) and `CreateHouseAsync` (`FileOrganizerRepository.cs`) to always insert `start_date = NULL` for newly created houses' initial tenants until a document is entered.

2. **Strict `MIN(primary_date)` Synchronization Across All Document Lifecycle Operations (`FileOrganizerRepository.cs`, `DTOs.cs`)**:
   - Added `SyncTenantStartDateAsync(conn, tx, tenantId)` to keep `tenants.start_date` synchronized to `SELECT MIN(primary_date) FROM documents WHERE tenant_id = @TenantId AND is_timeline_visible = 1 AND primary_date IS NOT NULL AND primary_date != ''`, clearing `start_date` to `NULL` when zero visible dated documents remain.
   - Wired `SyncTenantStartDateAsync` into `AddManualDocumentAsync`, `UpdateDocumentAsync`, `DeleteDocumentAsync`, `BatchDeleteDocumentsAsync`, `BatchMoveDocumentsAsync`, `ExtractPagesAsync`, `DeletePagesAsync`, and `MergeDocumentsAsync`.
   - Added `FirstDocDate` (`first_doc_date`) to `TenantDto` (`GetTenantsAsync`) and updated `BulkUpdateTenantsAsync` to enforce `minDocDate` priority (plus post-reallocation start-date synchronization) symmetrically with `maxDocDate`.

3. **Frontend Resolution & Static Mode Parity (`tenant-manager.js`, `house-profile.js`, `dist/win-x64/wwwroot/*`)**:
   - Added `resolveFirstDocDate` in `tenant-manager.js` so House Settings rows and save payloads always prioritize `first_doc_date` / `MIN(primary_date)` over stale manual values while displaying `تلقائي (عند أول رفع)` / `Auto (on first upload)` when no documents exist.
   - Replaced the hardcoded `'2020-01-01'` fallback in `house-profile.js` static mode with `tenantMinDates[kt.name] || kt.start_date || null`.
   - Mirrored all updated `wwwroot` assets into `dist/win-x64/wwwroot/` with 100% parity.

4. **Automated Verification**:
   - Added `CreateHouseAndDocumentLifecycle_StartDateIsAlwaysFirstDocumentDate_AndResetsWhenEmpty` in `RepositoryTests.cs` and null-`StartDate` verification in `ApiEndpointTests.cs`.
   - Updated `tests/web/components/add_house.test.js` and `tests/web/components/house_settings_modal.test.js` (`53/53` Vitest suites, `754/754` tests passing).

## Commits
- `5443681`: `feat(quick-261101-8gl): sync house and tenant start_date strictly to earliest document date`
- `eacb581`: `feat(quick-261101-8gl): remove start date option from Add House modal and enforce first-document start date in UI`
- `e1480ed`: `test(quick-261101-8gl): verify Add House modal omits start date and House Settings enforces first-doc start date`

## Files Modified
- `src/HousingApplication.Web/Models/DTOs.cs`
- `src/HousingApplication.Web/Data/FileOrganizerRepository.cs`
- `src/HousingApplication.Web/Program.cs`
- `src/HousingApplication.Web/wwwroot/index.html`
- `src/HousingApplication.Web/wwwroot/js/area-grid.js`
- `src/HousingApplication.Web/wwwroot/js/tenant-manager.js`
- `src/HousingApplication.Web/wwwroot/js/house-profile.js`
- `dist/win-x64/wwwroot/index.html`
- `dist/win-x64/wwwroot/js/area-grid.js`
- `dist/win-x64/wwwroot/js/tenant-manager.js`
- `dist/win-x64/wwwroot/js/house-profile.js`
- `tests/HousingApplication.Tests/RepositoryTests.cs`
- `tests/HousingApplication.Tests/ApiEndpointTests.cs`
- `tests/web/components/add_house.test.js`
- `tests/web/components/house_settings_modal.test.js`
