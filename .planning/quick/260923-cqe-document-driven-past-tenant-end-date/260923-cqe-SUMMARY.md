---
quick_id: "260923-cqe"
slug: "document-driven-past-tenant-end-date"
date: "2026-09-23"
status: complete
---

# Quick Task Summary: Document-Driven End Date for Past Tenants & Zero Manual Date Entry

## Overview
Transformed past residents' (`is_resident = 1`, not `Present`) `EndDate` to be 100% document-driven (derived automatically from the tenant's latest document `MAX(primary_date)`), eliminating manual user entry for both start and end dates in the House Settings modal.

## Key Changes Implemented

1. **Backend Data Layer (`FileOrganizerRepository.cs`)**:
   - `GetTreeAsync`: Updated `effectiveLatestEnd` and `effectiveEndDate` to strictly prioritize `t.LastDocDate` (`MAX(primary_date)`).
   - `GetHousesAsync`: Updated subtitle end-year calculation to prioritize `latest.LastDocDate`.
   - `GetHouseProfileAsync`: Configured `effectiveEnd` to dynamically resolve to `t.LastDocDate` for past residents while remaining `null` for active residents and applicants.
   - `GetTenantsAsync`: Prioritized `t.LastDocDate` for past residents (`is_resident = 1` and `!IsPresent`), ensuring that whenever new documents are uploaded or dates change, the end date updates dynamically.
   - `BulkUpdateTenantsAsync`: Prioritized `maxDocDate` from document records when resolving `eDate` for past residents, setting `null` for active residents and applicants.

2. **Frontend UI (`tenant-manager.js` and `index.html`)**:
   - Replaced `<input type="date">` for `.tenant-end-input` with a clean, read-only `<input type="text" readonly>` matching `.tenant-start-input`.
   - Displays `حالي / Present` (or disabled/empty) when `Present` is checked.
   - Displays the document-derived date (`lastDocArrival` or `تلقائي (عند الرفع)`) when `Present` is unchecked.
   - Displays `N/A (لم يسكن)` when `Applicant` is selected.
   - Updated the column header tooltip in `index.html` and input titles in `tenant-manager.js` to state: *"End date is always selected as the last document and is auto if there is no document"*.
   - Sanitized payload generation in `saveTenantsAndReallocate` to prevent sending placeholder text as date values.

3. **Automated Verification**:
   - Added unit test `PastTenant_WhenNewDocumentUploaded_EndDateAutomaticallyUpdatesToLatestDocumentDate` in `RepositoryTests.cs` verifying automatic end date progression upon uploading later documents and natural tenure overlap.
   - Added unit test in `house_settings_modal.test.js` verifying that `.tenant-end-input` is read-only and requires zero manual user entry.
   - All 60 backend `RepositoryTests` passed with 0 failures.
   - All 49 frontend Vitest tests across `house_settings_modal.test.js`, `applicant_workflow.test.js`, `batch_operations.test.js`, and `house_profile.test.js` passed with 0 failures.

## Files Modified
- `src/HousingApplication.Web/Data/FileOrganizerRepository.cs`
- `src/HousingApplication.Web/wwwroot/js/tenant-manager.js`
- `src/HousingApplication.Web/wwwroot/index.html`
- `tests/HousingApplication.Tests/RepositoryTests.cs`
- `tests/web/components/house_settings_modal.test.js`
