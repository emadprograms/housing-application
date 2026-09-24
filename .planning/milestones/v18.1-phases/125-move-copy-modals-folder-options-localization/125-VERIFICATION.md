---
phase: 125
title: "Move & Copy Modals Folder & Options Localization"
status: passed
date: "2026-09-24"
coverage:
  MOVE-01: passed
  MOVE-02: passed
  MOVE-03: passed
---

# Phase 125 Verification: Move & Copy Modals Folder & Options Localization

## Verification Checklist

| Requirement | Description | Status | Evidence |
|-------------|-------------|:------:|----------|
| **MOVE-01** | User opening Move Document modal (single or batch) sees standard category folder options translated according to active language | Passed | `openBatchMoveModal` formats `opt.textContent = window.i18n ? window.i18n.localizeCategory(formatted) : formatted;` |
| **MOVE-02** | User opening Copy Document modal (single or batch) sees standard category folder options translated according to active language | Passed | `openBatchCopyModal` formats `opt.textContent = window.i18n ? window.i18n.localizeCategory(formatted) : formatted;` |
| **MOVE-03** | Optgroup labels, action options, and subtitles dynamically render in the active language without hardcoded English or Arabic | Passed | `batch.standard_folders`, `batch.custom_folders`, `batch.create_new_folder`, and single/batch subtitles integrated in `i18n.js` and `categories-view.js` |

## Test Verification
- All 49 Vitest test suites passed (704/704 tests).
- 0 hash differences between `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/`.
