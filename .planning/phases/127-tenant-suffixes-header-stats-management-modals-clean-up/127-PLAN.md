# Phase 127: Tenant Suffixes, Header Stats & Management Modals Clean-Up - Plan

**Status:** Planned  
**Requirements:** `TSEL-01`, `TSEL-02`, `EDGE-01`, `EDGE-02`

## Execution Steps

### Step 1: Update i18n Dictionary (`i18n.js`)
- In `i18n.js`, ensure:
  - `profile.current_tenant_suffix`: `(المستأجر الحالي)` in AR, `(Current Tenant)` in EN.
  - `profile.applicant_label_suffix`: `(متقدم - لم يسكن)` in AR, `(Applicant - Did not reside)` in EN.
  - Add `getCurrentLanguage` alias on `i18n` object.

### Step 2: Localize Tenant Dropdown Formatting (`categories-view.js`)
- In `formatBatchTenantLabel(t)`:
  - If `window.i18n` is active:
    - In EN mode, append ` (Current Tenant)` for active residents, or `📋 ${name} (Applicant - Did not reside)` for applicants.
    - In AR mode, append ` (المستأجر الحالي)` for active residents, or `📋 ${name} (متقدم - لم يسكن)` for applicants.
  - If `window.i18n` is undefined (legacy mock tests), retain `' (المستأجر الحالي)'` and `'(متقدم - لم يسكن)'`.

### Step 3: Polish Navbar Stats Badge Across All Views
- In `categories-view.js`:
  - When updating `statsBadge.textContent`, inspect `window.i18n`. If active and language is `'ar'`, render `${activeCats.length} مجلدات (${totalDocs} وثيقة)`.
- In `timeline-view.js`:
  - When updating `statsBadge.textContent`, inspect `window.i18n`. If active and language is `'ar'`, render `${displayTimeline.length} وثيقة`.

### Step 4: Clean Up Manage Tenants Modal & Doc Manager
- In `tenant-manager.js`:
  - Use `tApi.t` for tenant name input placeholder (`Tenant Name` / `اسم المستأجر`), present checkbox title (`Present` / `حالي`), and delete button title (`Delete Tenant` / `حذف المستأجر`).
- In `doc-manager.js`:
  - Attach `languageChanged` listener so if the single document action modal is open, its mode button and submit text are refreshed immediately.

### Step 5: Verify, Parity Sync & Testing
- Run test suites for applicant workflow, batch operations, and house profile.
- Synchronize all modified files to `dist/win-x64/wwwroot/js/`.
- Verify 0 MD5 diffs.
- Run full Vitest suite to maintain 100% green.
