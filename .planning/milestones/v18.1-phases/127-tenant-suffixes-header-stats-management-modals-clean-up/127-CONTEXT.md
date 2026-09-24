# Phase 127: Tenant Suffixes, Header Stats & Management Modals Clean-Up - Context

**Gathered:** 2026-09-24  
**Status:** Ready for planning  
**Mode:** Autonomous (user discretion granted for UI consistency and localization edge cases)

<domain>
## Phase Boundary

Resolve active tenant indicator formatting in Move/Copy dropdowns (`formatBatchTenantLabel`), top navbar house stats badge bilingual bullet / label polish in Categories and Timeline views, Manage Tenants modal tooltips and placeholders, and Single Document Action modal mode buttons and custom folder options.

### Requirements Covered
- **TSEL-01**: In Move & Copy tenant dropdowns (`formatBatchTenantLabel`), active tenant indicator renders in the active language (` (Current Tenant)` in English vs ` (المستأجر الحالي)` in Arabic).
- **TSEL-02**: In House Profile view, the top navbar house stats badge (`#stats-badge`) renders clean localized metrics in both languages (`N Tenants • M Documents` in English vs `N مستأجرين • M وثائق` in Arabic) without hardcoded English words.
- **EDGE-01**: Manage Tenants modal (`tenant-manager.js`) eliminates residual hardcoded bilingual bullets (` • `) and `(لم يسكن)` in tooltips, placeholder text, and empty states.
- **EDGE-02**: Single document action modal (`doc-manager.js`) mode buttons (`Apply Changes`, `Duplicate Document`) and custom folder options render purely in the active language.

</domain>

<decisions>
## Implementation Decisions

### 1. Tenant Dropdown Suffixes (`categories-view.js`)
- Update `formatBatchTenantLabel(t)` to dynamically consult `window.i18n`.
- In English:
  - Active tenant suffix: ` (Current Tenant)`.
  - Applicant suffix: `📋 ${name} (Applicant - Did not reside)`.
- In Arabic:
  - Active tenant suffix: ` (المستأجر الحالي)`.
  - Applicant suffix: `📋 ${name} (متقدم - لم يسكن)`.
- When `window.i18n` is undefined (unmocked test suites): preserve exact legacy strings (` (المستأجر الحالي)` and `(متقدم - لم يسكن)`).

### 2. Top Navbar Stats Badge Localization (`house-profile.js`, `categories-view.js`, `timeline-view.js`)
- Ensure `#stats-badge` renders localized count strings across all 3 view modes:
  - House Profile: `${residents} Tenants · ${totalDocs} Documents` vs `${residents} مستأجرين · ${totalDocs} وثيقة`.
  - Categories View: `${count} Categories (${totalDocs} Docs)` vs `${count} مجلدات (${totalDocs} وثيقة)`.
  - Timeline View: `${count} Documents` vs `${count} وثيقة`.

### 3. Manage Tenants Modal Tooltips & Placeholders (`tenant-manager.js`)
- Ensure all tooltips and row titles query `window.i18n.t` when available.
- Clean up fallback strings to remove bilingual ` • ` stacked text.
- Localize placeholder on tenant name (`Tenant Name` vs `اسم المستأجر`), present checkbox title (`Present` vs `حالي`), and delete button title (`Delete Tenant` vs `حذف المستأجر`).

### 4. Single Document Action Modal (`doc-manager.js`)
- Add `languageChanged` event listener to `doc-manager.js` to refresh modal mode submit text and category folder labels when modal is active.
- Ensure mode buttons (`Move` / `Copy`) and submit buttons (`Apply Changes` / `Duplicate Document`) use `i18n.t`.

</decisions>

<code_context>
## Existing Code Insights
- `src/HousingApplication.Web/wwwroot/js/categories-view.js`: lines 605-622 define `formatBatchTenantLabel`.
- `src/HousingApplication.Web/wwwroot/js/tenant-manager.js`: lines 220-270 construct tenant rows with tooltips and placeholders.
- `src/HousingApplication.Web/wwwroot/js/doc-manager.js`: lines 803-863 manage modal mode and folder options.
- `src/HousingApplication.Web/wwwroot/js/i18n.js`: provides centralized dictionary and translations.
</code_context>

<specifics>
## Specific Ideas
- Maintain 100% Vitest pass rate with zero regressions across existing test files.
- Ensure exact 1:1 MD5 parity between `src/` and `dist/`.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
