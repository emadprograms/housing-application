# Quick Task: 260923-cqe-document-driven-past-tenant-end-date
# Document-Driven End Date for Past Tenants & Zero Manual Date Entry

## Objective
Transition past residents' (`is_resident = 1`, not `Present`) `EndDate` to be 100% document-driven (derived automatically from the tenant's latest document `MAX(primary_date)`), eliminating manual user entry for both start and end dates in the House Settings modal while preserving full consistency across the backend data access layer, REST API endpoints, and web UI.

## Context & Key Rules
1. **Symmetry:**
   - `StartDate` = Earliest document date (`MIN(primary_date)`) or `تلقائي (عند أول رفع)`.
   - `EndDate` =
     - For Current Resident (`Present`): `null` / `حالي • Present`.
     - For Past Resident (`!Present`): Latest document date (`MAX(primary_date)`) or `تلقائي (عند الرفع)`.
     - For Applicant (`is_resident = 0`): `null` / `N/A (لم يسكن)`.
2. **Natural Overlap:** Past tenants' end dates may naturally overlap with subsequent tenants (e.g. late clearance/settlement documents arriving after move-out). No artificial capping.
3. **Single Document:** If a tenant has only 1 document, its date is both `StartDate` and `EndDate`.
4. **No Manual Date Entry:** The End Date input field in the House Settings modal becomes a read-only badge/input reflecting the document-derived date or current status.

## Tasks
1. **Backend (`FileOrganizerRepository.cs`)**:
   - In `GetTenantsAsync`, `GetHouseProfileAsync`, `GetTreeAsync`, `GetHousesAsync`, and `BulkUpdateTenantsAsync`:
     - Calculate past resident `EndDate` strictly from `LastDocDate` (`MAX(primary_date)`).
     - For active resident (`Present`), `EndDate` remains `null`.
     - For applicants (`is_resident = 0`), `EndDate` remains `null`.
2. **Frontend UI (`tenant-manager.js` and `index.html`)**:
   - Update `tenant-manager.js` to render `.tenant-end-input` as read-only, matching `.tenant-start-input`.
   - When `Present` is checked, display `حالي • Present` (or empty with disabled/present styling).
   - When `Present` is unchecked, display the tenant's last document date (`lastDocArrival` or `تلقائي (عند الرفع)`).
   - When `Applicant` is selected, display `N/A (لم يسكن)`.
   - Update header tooltips and descriptions in `index.html`.
3. **Automated Verification**:
   - Run backend `RepositoryTests` to verify document-driven past tenant dates.
   - Run frontend `vitest` tests to verify modal interactions and DOM structures.
   - Add new tests confirming that uploading/updating documents updates the past tenant's end date.
