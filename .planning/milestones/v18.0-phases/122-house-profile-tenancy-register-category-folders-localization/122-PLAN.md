# Phase 122 Plan: House Profile, Tenancy Register & Category Folders English Localization

**Phase:** 122  
**Goal:** Introduce complete English translations for the House Profile, Tenancy Register, and Category Folders so users never see Arabic-only elements in English mode.  
**Requirements:** TRNS-01, TRNS-02  
**Status:** In Progress  

## Execution Tasks

### Task 1: Expand Translation Dictionary in `i18n.js`
- Ensure complete coverage for all 13 standard category names in `ar` and `en`.
- Add dictionary keys for:
  - Tenancy register headers: `profile.tenants`, `profile.applicants`, `profile.loading_register`, `profile.error_loading_register`
  - Tenancy statuses: `profile.current_tenant`, `profile.vacated_tenant`, `profile.pending_applicant`
  - Tenure duration formatters: `profile.lease_started`, `profile.lease_ongoing`, `profile.years_count`, `profile.year_single`, `profile.years_two`, `profile.under_year`, `profile.from_year_to`
  - Compliance audit: `profile.compliance_title`, `profile.compliance_vacant_desc`, `profile.compliance_complete`, `profile.compliance_incomplete`, `profile.compliance_show`, `profile.compliance_hide`, `profile.compliance_available`, `profile.compliance_upload`
  - Stats badges: `profile.stats_tenants`, `profile.stats_applicants`, `profile.stats_docs`
  - Category view dropzone hints: `folder.dropzone_hint` (`Drag and drop files here` vs `اسحب وأفلت الملفات هنا`)
  - Alerts: `folder.delete_restricted`, `folder.select_two_to_merge`

### Task 2: Refactor `house-profile.js`
- Replace hardcoded Arabic status labels (`حالي`, `سابق`, `📋 متقدم (لم يسكن)`) with dynamic localized labels using `window.i18n.t()`.
- Add English duration string generation (`duration_str_en` alongside `duration_str_ar`) and select the appropriate one based on `window.i18n.getLanguage()`.
- Localize stats badge count string (`X Tenants · Y Applicants · Z Documents` vs `${residents.length} مستأجرين · ${applicants.length} طلبات تخصيص · ${totalDocs} وثيقة`).
- Localize compliance banner title, status, buttons, and vacant notices.
- Update `#export-archive-modal` tenant select options to single-language (`All Records` vs `كامل السجل`).

### Task 3: Refactor `categories-view.js` & `timeline-view.js`
- Localize standard category names dynamically: when displaying category folders in English mode, show `01 - Basic Master Data`, `02 - Personal & Identity Data`, etc.
- In `timeline-view.js`, localize applicant badge tooltip and tenant labels.
- Remove all intermixed strings (e.g. `اسحب وأفلت الملفات هنا • Drag and drop files here`) replacing with active-language single strings.
- Localize Contributor deletion restriction toast and merge validation alert.

### Task 4: Author Component Tests
- Create `tests/web/components/house_profile_categories_i18n.test.js`:
  - Test that in English mode, tenancy register sections, cards, duration formatters, and status badges render purely in English.
  - Test that in Arabic mode, tenancy register sections, cards, duration formatters, and status badges render purely in Arabic.
  - Test that standard category names translate dynamically between English and Arabic.
  - Test that dropzones and alerts contain zero intermixed bilingual bullets or slashes.

### Task 5: Parity Sync & Verification
- Synchronize all changes to `dist/win-x64/wwwroot/`.
- Run full test suite with Vitest to guarantee zero regressions.
