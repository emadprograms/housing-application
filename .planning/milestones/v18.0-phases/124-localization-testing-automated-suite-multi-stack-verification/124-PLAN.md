# Phase 124 Plan: Localization Testing, Automated Suite & Multi-Stack Verification

**Phase:** 124  
**Goal:** Verify the entire multi-stack housing application (ASP.NET Core backend + Web frontend + SQLite DB) with all unit, component, and regression tests, guaranteeing zero intermixing and 100% test pass rate, then archive Milestone v18.0.  
**Requirements:** LANG-01, LANG-02, LANG-03, CLEAN-01, CLEAN-02, CLEAN-03, TRNS-01, TRNS-02, TRNS-03, TRNS-04  
**Status:** In Progress  

## Tasks

### Task 1: Comprehensive Frontend Test Run
- Execute all test suites across `tests/web/components/` with Vitest.
- Verify zero failures, zero regressions, and full coverage of new i18n features.

### Task 2: Backend .NET Core Test Run
- Execute `dotnet test` on `src/HousingApplication.Web.Tests/`.
- Ensure all backend API endpoints, SQLite repositories, and PDF generation tests pass cleanly.

### Task 3: Complete Static Intermix Audit
- Run exhaustive grep audits across `src/HousingApplication.Web/wwwroot/` for any legacy bilingual strings or unlocalized static texts.
- Guarantee that all UI elements switch cleanly between pure Arabic and pure English via `#lang-toggle-btn`.

### Task 4: Distribution Mirroring Audit
- Ensure `dist/win-x64/wwwroot/` has 100% parity with `src/HousingApplication.Web/wwwroot/`.

### Task 5: Milestone Summary & Documentation
- Document Phase 124 Verification (`124-VERIFICATION.md`) and Summary (`124-SUMMARY.md`).
- Update `ROADMAP.md` and `STATE.md` to complete Milestone v18.0.
