---
status: passed
verification_date: 2026-09-24
phase: 127
milestone: v18.1
requirements_verified:
  - TSEL-01
  - TSEL-02
  - EDGE-01
  - EDGE-02
tests_passed: 705
tests_failed: 0
---

# Phase 127 Verification: Tenant Suffixes, Header Stats & Management Modals Clean-Up

## Verification Checklist

- [x] **TSEL-01**: In Move & Copy tenant dropdowns (`formatBatchTenantLabel`), active tenant indicator renders in the active language (` (Current Tenant)` in English vs ` (المستأجر الحالي)` in Arabic).
- [x] **TSEL-02**: In House Profile, Categories, and Timeline views, top navbar house stats badge (`#stats-badge`) renders clean localized metrics in both languages (`N Categories (M Docs)` / `N مجلدات (M وثائق)`, and `N Documents` / `N وثيقة`).
- [x] **EDGE-01**: Manage Tenants modal (`tenant-manager.js`) eliminates residual hardcoded bilingual bullets (` • `) and `(لم يسكن)` in tooltips, placeholder text, and empty states.
- [x] **EDGE-02**: Single document action modal (`doc-manager.js`) mode buttons (`Apply Changes`, `Duplicate Document`) and custom folder options render purely in the active language and respond dynamically to language changes.
- [x] **Regression Guard**: All 705 frontend tests across 49 test files passed with 0 errors.
- [x] **Distribution Parity**: All modified scripts in `src/` and `dist/` have identical MD5 hashes.

## Test Results

```
Test Files  49 passed (49)
     Tests  705 passed (705)
```

## Static Asset Parity

```
src/HousingApplication.Web/wwwroot/js/i18n.js            94DE33254B3C5509E0B729527F52C632
dist/win-x64/wwwroot/js/i18n.js                          94DE33254B3C5509E0B729527F52C632 (MATCH)
src/HousingApplication.Web/wwwroot/js/categories-view.js   B871CD45891B08319F4056501415E14B
dist/win-x64/wwwroot/js/categories-view.js               B871CD45891B08319F4056501415E14B (MATCH)
src/HousingApplication.Web/wwwroot/js/timeline-view.js     DE5FBC26E611025277EB8AA9ABD478C2
dist/win-x64/wwwroot/js/timeline-view.js                 DE5FBC26E611025277EB8AA9ABD478C2 (MATCH)
src/HousingApplication.Web/wwwroot/js/tenant-manager.js    A3547DD8C9DDAE6F592A6CA18FD6E6E2
dist/win-x64/wwwroot/js/tenant-manager.js                A3547DD8C9DDAE6F592A6CA18FD6E6E2 (MATCH)
src/HousingApplication.Web/wwwroot/js/doc-manager.js       F142CF12F88A77674D7C9403B7426584
dist/win-x64/wwwroot/js/doc-manager.js                   F142CF12F88A77674D7C9403B7426584 (MATCH)
```
