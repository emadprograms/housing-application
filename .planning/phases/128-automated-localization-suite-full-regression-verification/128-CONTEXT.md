# Phase 128: Automated Localization Suite & Full Regression Verification - Context

**Gathered:** 2026-09-24  
**Status:** Ready for planning  
**Mode:** Autonomous (user discretion granted for UI consistency and localization edge cases)

<domain>
## Phase Boundary

Build a dedicated automated component test suite (`tests/web/components/localization_edge_cases.test.js`) verifying all features delivered in Milestone v18.1:
1. Move & Copy modal folder translation, optgroup labeling, subtitle interpolation, and action button modes in Arabic and English.
2. Segmented navigation tab label formatting (`updateNavTabLabels`) for house view (`Tenants` / `House Timeline` vs `سجل المستأجرين` / `التسلسل الزمني للمنزل`) and tenant view (`Folders` / `Tenant Timeline` vs `المجلدات` / `التسلسل الزمني للمستأجر`), including reactive `languageChanged` event handling.
3. Move/Copy tenant option formatting (`formatBatchTenantLabel`) for active residents (`(Current Tenant)` vs `(المستأجر الحالي)`) and applicants (`(Applicant - Did not reside)` vs `(متقدم - لم يسكن)`).
4. Top navbar stats badge formatting (`formatCategoriesStatsBadge`, timeline stats, and house profile stats).
5. Full regression execution across the entire test suite (all 50 test files, 715+ tests, 100% green).
6. 1:1 distribution synchronization and 0 MD5 hash differences.

### Requirements Covered
- **TEST-01**: Automated unit and component tests verify that Move/Copy modal folder names, tab labels, tenant suffixes, and navbar stats dynamically re-render on language toggle in both Arabic and English modes.
- **TEST-02**: Full test suite remains 100% green with zero regressions across all frontend and backend tests, with 1:1 distribution synchronization between `src/` and `dist/`.

</domain>

<decisions>
## Implementation Decisions

### 1. Dedicated Test File (`localization_edge_cases.test.js`)
Create a focused, clean Vitest test file in `tests/web/components/localization_edge_cases.test.js` using JSDOM environment, loading `i18n.js` and verifying:
- Modal folder dropdown rendering across Arabic and English.
- Segmented tabs dynamic updates on route selection and `languageChanged` events.
- Tenant dropdown formatting (`formatBatchTenantLabel`) for residents and applicants.
- Stats badge formatting in Categories, Timeline, and House Profile.
- Mode buttons (`Apply Changes` / `Duplicate Document`) and custom folder options.

### 2. Full Regression Run
Execute full Vitest suite to verify zero regressions across all 50 test files.

### 3. Static Asset Parity
Confirm 0 MD5 diffs across all distribution files in `dist/win-x64/wwwroot/` against `src/HousingApplication.Web/wwwroot/`.

</decisions>

<code_context>
## Existing Code Insights
- `src/HousingApplication.Web/wwwroot/js/i18n.js`
- `src/HousingApplication.Web/wwwroot/js/router.js`
- `src/HousingApplication.Web/wwwroot/js/categories-view.js`
- `src/HousingApplication.Web/wwwroot/js/doc-manager.js`
- `src/HousingApplication.Web/wwwroot/js/timeline-view.js`
- `src/HousingApplication.Web/wwwroot/js/tenant-manager.js`
- `src/HousingApplication.Web/wwwroot/js/house-profile.js`
</code_context>

<specifics>
## Specific Ideas
- Clean, fast, deterministic tests without arbitrary timeouts.
- Explicit assertions on both English and Arabic rendering outputs.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
