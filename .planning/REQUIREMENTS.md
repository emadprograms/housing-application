# Requirements: Housing Application

**Defined:** 2026-09-24  
**Core Value:** A high-performance document management system and web dashboard for housing digital archives, delivering clean language separation with a dedicated header toggle, full English and Arabic localizations, and zero intermixed bilingual text.

## Milestone v18.0 Requirements

Requirements for Milestone v18.0: Clean Language Separation & Localization (Arabic / English).

### Language Switcher & Directionality Engine (LANG)

- [x] **LANG-01**: User can toggle between Arabic (`ar`) and English (`en`) via a dedicated, intuitive button (`#lang-toggle-btn`) in the top navigation bar (`#top-navbar`) displaying the language indicator (`EN` / `عربي`).
- [x] **LANG-02**: Active language preference is persisted across browser refreshes and sessions in `localStorage` (`app_language`), defaulting cleanly to Arabic.
- [x] **LANG-03**: Switching language dynamically updates the document directionality (`dir="rtl"` for Arabic, `dir="ltr"` for English) and the `lang` attribute on `<html>`, adjusting flex ordering, text alignment, and icon chevron orientations.

### Elimination of Intermixed Bilingual Strings (CLEAN)

- [x] **CLEAN-01**: Top navigation bar, search palette trigger, theme button, shortcuts helper, upload trigger, and user profile badge/dropdown eliminate intermixed text (e.g. `الصلاحيات • Permissions`, `تبديل • Switch`, `خروج • Logout`, `Toggle sidebar • تبديل الشريط الجانبي`), rendering purely in the active language.
- [x] **CLEAN-02**: Login screen and brand displays present pure English or pure Arabic without mixed subtitles or dual-language labels.
- [x] **CLEAN-03**: Keyboard shortcuts modal, Spotlight command palette (`⌘K`), and view options filter dropdown render purely in the selected language without slash-separated or bullet-separated bilingual strings.

### English Localization for Arabic-Only Components (TRNS)

- [x] **TRNS-01**: House Profile tenancy register provides full English translations for all sections, headers, statuses, tenure duration counters, and navigation (`Tenancy Register`, `Tenants`, `Applicants`, `Active Tenant`, `Past Tenants`, `Vacated`, `Present`, `Back to House Register`, `Digital Archive Profile`).
- [x] **TRNS-02**: Category folders and document categories provide standardized English translations (e.g., `01 - Identity & Personal Documents`, `02 - Lease Contracts`, `03 - Clearances & Evictions`, `04 - Receipts & Payment Vouchers`, `05 - Correspondence & Notices`, `06 - Maintenance & Repairs`, `07 - Ownership & Title Deeds`, `08 - Other Documents`) alongside their Arabic originals.
- [ ] **TRNS-03**: Modals and action dialogs (House Settings, Tenant Management, Document Actions dropdown/modal, Date Change, Export Archive, Merge Documents, Delete Confirmations) render complete English translations when English is active.
- [ ] **TRNS-04**: Ingest Station workflows (Single Document, Broadcast Notice, House Batch), drag-and-drop dropzones, file queue tables, and system toast notifications render purely in the active language.

### Localization Testing & Regression Guard (TEST)

- [ ] **TEST-01**: Comprehensive automated tests verify language toggle behavior, `localStorage` persistence, DOM directionality switches (`dir` attribute), and dictionary lookup completeness for all UI strings.
- [ ] **TEST-02**: All existing frontend Vitest tests (45 test files, 667 tests) and backend suites remain 100% passing with zero regressions in either Arabic or English mode.

## v2 Requirements

Deferred to future releases.

### Multi-Language Expansion

- **MULTI-01**: Support for third language (e.g. Urdu or French) in the i18n translation dictionary.
- **MULTI-02**: Automatic browser language detection fallback (`navigator.language`).

## Out of Scope

Explicitly excluded to protect milestone focus.

| Feature | Reason |
|---------|--------|
| Server-side database content translation | User-uploaded document scans, PDFs, and person names in the database remain in their original recorded script. |
| Third languages beyond Arabic and English | The core operational staff exclusively uses Arabic and English; additional languages add unnecessary overhead. |
| Backend API localized error messages | Backend returns standard machine-readable JSON status codes and errors; frontend translates messages locally. |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LANG-01 | Phase 120 | Complete |
| LANG-02 | Phase 120 | Complete |
| LANG-03 | Phase 120 | Complete |
| CLEAN-01 | Phase 121 | Complete |
| CLEAN-02 | Phase 121 | Complete |
| CLEAN-03 | Phase 121 | Complete |
| TRNS-01 | Phase 122 | Complete |
| TRNS-02 | Phase 122 | Complete |
| TRNS-03 | Phase 123 | Pending |
| TRNS-04 | Phase 123 | Pending |
| TEST-01 | Phase 124 | Pending |
| TEST-02 | Phase 124 | Pending |

**Coverage:**
- v18.0 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-24*
*Last updated: 2026-09-24 for v18.0 milestone*
