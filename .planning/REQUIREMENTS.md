# Requirements: Housing Application

**Defined:** 2026-09-24  
**Core Value:** A high-performance document management system and web dashboard for housing digital archives, delivering clean language separation with a dedicated header toggle, full English and Arabic localizations, and zero intermixed bilingual text.

## Milestone v18.1 Requirements

Requirements for Milestone v18.1: UI & Localization Consistency Polish.

### Move & Copy Modals Localization (MOVE)

- [x] **MOVE-01**: User opening Move Document modal (single or batch) sees standard category folder options translated according to the active language (e.g. `05 - Contracts` in English vs `05 - عقود` in Arabic) while preserving underlying category mapping and compatibility.
- [x] **MOVE-02**: User opening Copy Document modal (single or batch) sees standard category folder options translated according to the active language.
- [x] **MOVE-03**: Move and Copy modal optgroup labels (`Standard Folders`, `Custom Folders`), action options (`+ Create New Folder...`), and modal subtitles dynamically render in the active language without hardcoded English or Arabic strings.

### House Profile Tabs & Navigation Localization (TAB)

- [ ] **TAB-01**: In house view, the first segmented tab dynamically displays pure localized text (`Tenants` / `سجل المستأجرين`) and the adjacent timeline tab displays pure localized text (`House Timeline` / `التسلسل الزمني للمنزل`), eliminating side-by-side language intermixing.
- [ ] **TAB-02**: In tenant drill-down view, the segmented tabs dynamically display pure localized text (`Folders` / `المجلدات` and `Tenant Timeline` / `التسلسل الزمني للمستأجر`).
- [ ] **TAB-03**: Router navigation subscribes to the `languageChanged` event so tab titles, tooltips, and header breadcrumbs immediately re-render in the active language when toggled while viewing a house or tenant without requiring a page reload.

### Tenant Selectors & Header Stats Polish (TSEL)

- [ ] **TSEL-01**: In Move & Copy tenant dropdowns (`formatBatchTenantLabel`), active tenant indicator renders in the active language (` (Current Tenant)` in English vs ` (المستأجر الحالي)` in Arabic).
- [ ] **TSEL-02**: In House Profile view, the top navbar house stats badge (`#stats-badge`) renders clean localized metrics in both languages (`N Tenants • M Documents` in English vs `N مستأجرين • M وثائق` in Arabic) without hardcoded English words.

### Management Modals & Edge Strings Clean-up (EDGE)

- [ ] **EDGE-01**: Manage Tenants modal (`tenant-manager.js`) eliminates residual hardcoded bilingual bullets (` • `) and `(لم يسكن)` in tooltips, placeholder text, and empty states.
- [ ] **EDGE-02**: Single document action modal (`doc-manager.js`) mode buttons (`Apply Changes`, `Duplicate Document`) and custom folder options render purely in the active language.

### Automated Verification & Regression Guard (TEST)

- [ ] **TEST-01**: Automated unit and component tests verify that Move/Copy modal folder names, tab labels, tenant suffixes, and navbar stats dynamically re-render on language toggle in both Arabic and English modes.
- [ ] **TEST-02**: Full test suite remains 100% green with zero regressions across all frontend and backend tests, with 1:1 distribution synchronization between `src/` and `dist/`.

## v2 Requirements

Deferred to future releases.

### Multi-Language Expansion

- **MULTI-01**: Support for third language (e.g. Urdu or French) in the i18n translation dictionary.
- **MULTI-02**: Dynamic custom folder translation alias system for user-created non-standard categories.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOVE-01 | Phase 125 | Complete |
| MOVE-02 | Phase 125 | Complete |
| MOVE-03 | Phase 125 | Complete |
| TAB-01 | Phase 126 | Pending |
| TAB-02 | Phase 126 | Pending |
| TAB-03 | Phase 126 | Pending |
| TSEL-01 | Phase 127 | Pending |
| TSEL-02 | Phase 127 | Pending |
| EDGE-01 | Phase 127 | Pending |
| EDGE-02 | Phase 127 | Pending |
| TEST-01 | Phase 128 | Pending |
| TEST-02 | Phase 128 | Pending |
