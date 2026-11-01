---
quick_id: "261101-6bf"
slug: "delete-area-and-delete-house-ui"
date: "2026-11-01"
status: complete
---

# Quick Task Summary: Delete Area and Discoverable Delete House UI

## Overview
Implemented full end-to-end **Delete Area** support (transactional C# backend cascade + `DELETE /api/areas/{areaId}` endpoint + Admin-only sidebar & Area Overview header triggers + typed confirmation modal) and surfaced **Delete House** directly on Area Grid house cards and in the House panel header so Admins can delete houses in one click without digging into the House Settings modal's Danger Zone.

## Key Changes Implemented

1. **Backend Data Layer & API (`IFileOrganizerRepository.cs`, `FileOrganizerRepository.cs`, `Program.cs`)**:
   - `DeleteAreaAsync`: Validates area name, resolves canonical `areas.id` (with case-insensitive lookup fallback), transactionally deletes all child `pages`, `documents`, `batches`, `tenants`, and `houses` belonging to the area before deleting from `areas`, and safely deletes `<AreasRoot>/<areaId>` on disk after strict `Path.GetFullPath` containment verification.
   - `DELETE /api/areas/{areaId}`: Enforces `IsRestrictedFromDelete(httpContext)` (`403 Forbidden` for Contributor accounts), returns `400 BadRequest` on blank/invalid IDs, `404 NotFound` when missing, and `200 OK` on success.

2. **Delete Area UI (`index.html`, `styles.css`, `i18n.js`, `api.js`, `sidebar.js`, `area-grid.js`, `router.js`)**:
   - Added `#delete-area-modal` with house-count warning banner, bilingual (`ar`/`en`) localization, dark-mode CSS parity, and mandatory typed confirmation phrase (`delete <areaName>`).
   - Added Admin-only `.area-delete-btn` on each sidebar area row (`e.stopPropagation()`) and `#btn-delete-area-header` in `#top-navbar` during Area Overview mode.
   - Post-deletion cleanly reloads `/api/tree`, falls back to the next remaining area when deleting the active area, or resets to `#welcome-panel` and empty-sidebar `+ Add New Area` state when the last area is removed.

3. **Discoverable Delete House Entry Points (`index.html`, `area-grid.js`, `tenant-manager.js`, `router.js`)**:
   - Added Admin-only `.house-card-delete-btn` on every `.house-card` in the Area Grid (`e.stopPropagation()` so clicking trash never opens the house) and `#btn-delete-house-quick` in `#document-list-panel` header beside Export & House Settings.
   - Upgraded `openDeleteHouseModal(areaOverride, houseOverride)` to accept explicit `(area, house)` targets while safely ignoring DOM `Event` objects, and updated `executeDeleteHouse()` to cleanly close `#document-list-panel` and `#resizer-2` when returning to the Area Grid.
   - Synchronized all modified assets into `dist/win-x64/wwwroot/` with 100% parity.

4. **Automated Verification**:
   - Added `DeleteArea_DeletesAreaHousesDocumentsAndDirectory_AndEnforcesAdminRbac` in `tests/HousingApplication.Tests/ApiEndpointTests.cs`.
   - Added `tests/web/components/delete_area_and_house_ui.test.js` (8 tests) verifying Delete Area modal/API, Delete House card & header triggers, RBAC Contributor hiding/blocking, `auth:user-changed` live toggling, dark-mode CSS rules, and `ar`/`en` translations.
   - All 53 frontend Vitest test files (`752/752` tests) passed with 0 failures.

## Commits
- `b67e2bd`: `feat(quick-261101-6bf): add DeleteAreaAsync and DELETE /api/areas/{areaId} endpoint`
- `7ecda29`: `feat(quick-261101-6bf): add Delete Area UI and discoverable Delete House entry points`
- `e9d72e5`: `test(quick-261101-6bf): add Vitest suite for Delete Area and discoverable Delete House UI`

## Files Modified
- `src/HousingApplication.Web/Data/IFileOrganizerRepository.cs`
- `src/HousingApplication.Web/Data/FileOrganizerRepository.cs`
- `src/HousingApplication.Web/Program.cs`
- `src/HousingApplication.Web/wwwroot/index.html`
- `src/HousingApplication.Web/wwwroot/css/styles.css`
- `src/HousingApplication.Web/wwwroot/js/api.js`
- `src/HousingApplication.Web/wwwroot/js/i18n.js`
- `src/HousingApplication.Web/wwwroot/js/sidebar.js`
- `src/HousingApplication.Web/wwwroot/js/area-grid.js`
- `src/HousingApplication.Web/wwwroot/js/tenant-manager.js`
- `src/HousingApplication.Web/wwwroot/js/router.js`
- `dist/win-x64/wwwroot/*`
- `tests/HousingApplication.Tests/ApiEndpointTests.cs`
- `tests/web/components/delete_area_and_house_ui.test.js`
