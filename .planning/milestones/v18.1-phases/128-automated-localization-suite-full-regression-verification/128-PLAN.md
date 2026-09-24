# Phase 128: Automated Localization Suite & Full Regression Verification - Plan

**Status:** Planned  
**Requirements:** `TEST-01`, `TEST-02`

## Execution Steps

### Step 1: Create Dedicated Component Test File
Create `tests/web/components/localization_edge_cases.test.js`:
- Test 1: Category folder translation mapping for all 13 standard folders (`window.i18n.localizeCategory`).
- Test 2: Move/Copy modal standard and custom folder options in English and Arabic.
- Test 3: Segmented navigation tab labels in House and Tenant view modes and dynamic update on `languageChanged`.
- Test 4: Batch Move/Copy tenant option labels (`formatBatchTenantLabel`) for residents and applicants across English and Arabic.
- Test 5: Top navbar stats badge formatting (`formatCategoriesStatsBadge`, timeline stats, and house profile stats) across English and Arabic.
- Test 6: Single doc action modal mode buttons (`Apply Changes` / `Duplicate Document`) and custom folder options.

### Step 2: Run Component Tests & Full Suite
- Execute `npx vitest run tests/web/components/localization_edge_cases.test.js`.
- Execute full test suite `npx vitest run` across all 50 test files.
- Verify 100% pass rate.

### Step 3: Distribution Verification & State Completion
- Verify 0 MD5 differences between `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/`.
- Update `.planning/REQUIREMENTS.md` with all requirements `[x]` Complete.
- Update `.planning/STATE.md` with milestone v18.1 100% complete.
- Create `128-SUMMARY.md` and `128-VERIFICATION.md`.
