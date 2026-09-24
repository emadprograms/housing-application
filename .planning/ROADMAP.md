# Roadmap: Housing Application

## Milestones

- 🟡 **v18.0 Clean Language Separation & Localization (Arabic / English)** — Phases 120-124 (in progress)
- ✅ **v17.0 User Authentication, Roles & Permissions** — Phases 116-119 (shipped 2026-09-17)
- ✅ **v16.1 Document-Anchored Tenancy Dates & Minimalist Register** — Phase 115 (shipped 2026-09-14)
- ✅ **v16.0 Settings Streamlining & Applicant Alignment** — Phase 114 (shipped 2026-09-13)
- ✅ **v15.0 Decoupled .NET Core Architecture & Non-Residing Applicants Archive** — Phases 109-113 (shipped 2026-09-13)
- ✅ **v14.0 Power-User Operations & Portfolio Expansion** — Phases 105-108 (shipped 2026-09-12)
- ✅ **v13.0 Decoupled Monorepo Architecture & Native ASP.NET Core Web Server** — Phases 101-104 (shipped 2026-09-09)
- ✅ **v12.0 Unified Document Ingestion System** — Phases 97-100 (shipped 2026-09-09)
- ✅ **v11.0 Database Backend & Clean Storage Architecture** — Phases 92-96 (shipped 2026-09-09)
- ✅ **v10.0 Area Grid Overview & Tenure Visualization** — Phases 88-91 (shipped 2026-09-06)
- ✅ **v9.0 Hierarchical Web Dashboard** — Phases 84-87.1 (shipped 2026-09-06)
- ✅ **v8.0 Web-Based File Viewer** — Phases 81-83 (shipped 2026-09-02)

## Phases

### 🟡 v18.0 Clean Language Separation & Localization (Arabic / English)

- [x] Phase 120: Language Toggle & Directionality Engine (1/1 plans) — completed 2026-09-24
- [ ] Phase 121: Top Navbar, Login, Shortcuts & Search Clean-Up (0/1 plans)
- [ ] Phase 122: House Profile, Tenancy Register & Category Folders English Localization (0/1 plans)
- [ ] Phase 123: Modals, Actions, Ingestion Station & System Messages Localization (0/1 plans)
- [ ] Phase 124: Localization Testing, Automated Suite & Multi-Stack Verification (0/1 plans)

#### Phase 120: Language Toggle & Directionality Engine
**Goal:** Implement client-side i18n module with localStorage persistence, a prominent header toggle button in `#top-navbar`, and dynamic document directionality (`dir="rtl"` vs `dir="ltr"`).
**Requirements:** LANG-01, LANG-02, LANG-03
**Success Criteria:**
1. A dedicated `#lang-toggle-btn` button appears in `#top-navbar` showing the language toggle indicator (`EN` / `عربي`).
2. Clicking the toggle changes language between Arabic and English, persisting choice in `localStorage.getItem('app_language')`.
3. Document root direction snaps between `rtl` and `ltr` (`document.documentElement.dir`) with appropriate layout mirroring.

#### Phase 121: Top Navbar, Login, Shortcuts & Search Clean-Up
**Goal:** Strip all intermixed bilingual strings from top navigation, user profile badge/dropdown, login screen, search palette, and shortcut helper modals.
**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria:**
1. Top navbar elements, view dropdowns, search trigger, and tooltips display pure English in EN mode and pure Arabic in AR mode without slash-delimited or bullet-separated bilingual strings.
2. Login screen and brand title present pure English or pure Arabic without mixed subtitles.
3. User profile badge and role dropdown display single-language titles and descriptions (`Admin` / `مدير النظام`, `Contributor` / `محرر`).

#### Phase 122: House Profile, Tenancy Register & Category Folders English Localization
**Goal:** Introduce complete English translations for the House Profile, Tenancy Register, and Category Folders so users never see Arabic-only elements in English mode.
**Requirements:** TRNS-01, TRNS-02
**Success Criteria:**
1. House Profile tenancy register displays fully localized English labels for `Tenants`, `Applicants`, tenure duration, active status badges, and back navigation in English mode.
2. Category folders render standardized English names (e.g. `01 - Identity & Personal Documents`, `02 - Lease Contracts`, etc.) in English mode and Arabic in Arabic mode.

#### Phase 123: Modals, Actions, Ingestion Station & System Messages Localization
**Goal:** Localize all dialog modals (House Settings, Tenant Management, Document Actions, Date Change, Export Archive, Merge Documents, Delete Confirmations), Ingestion Station workflows, and system toast notifications.
**Requirements:** TRNS-03, TRNS-04
**Success Criteria:**
1. House Settings, Tenant Management, Export Archive, Merge, and Delete modals render purely in the selected language.
2. Ingest Station drag-and-drop dropzones, tables, and buttons render in pure English in English mode.
3. Error messages, confirmation alerts, and toast notifications reflect the active language.

#### Phase 124: Localization Testing, Automated Suite & Multi-Stack Verification
**Goal:** Author automated unit and component tests for localization and verify that all existing 667+ tests pass with zero regressions.
**Requirements:** TEST-01, TEST-02
**Success Criteria:**
1. New automated Vitest tests verify language switching, direction toggling, dictionary lookups, and DOM rendering.
2. All 45 test files (667+ tests) pass cleanly with zero failures or regressions.

<details>
<summary>✅ v17.0 User Authentication, Roles & Permissions (Phases 116-119) — SHIPPED 2026-09-17</summary>

See [.planning/milestones/v17.0-ROADMAP.md](milestones/v17.0-ROADMAP.md) for full phase details.

- [x] Phase 116: User Data Model, Password Security & Auth API (1/1 plans) — completed 2026-09-17
- [x] Phase 117: Login Screen, Session Management & Navbar User Profile (1/1 plans) — completed 2026-09-17
- [x] Phase 118: Permission-Aware UI Enforcement & Zero-Delete Guards (1/1 plans) — completed 2026-09-17
- [x] Phase 119: Comprehensive Multi-Stack Verification & Milestone Audit (1/1 plans) — completed 2026-09-17

</details>

<details>
<summary>✅ v16.1 Document-Anchored Tenancy Dates & Minimalist Register (Phase 115) — SHIPPED 2026-09-14</summary>

See [.planning/milestones/v16.1-ROADMAP.md](milestones/v16.1-ROADMAP.md) for full phase details.

- [x] Phase 115: Document-Anchored Tenancy Dates & Minimalist Register (1/1 plans) — completed 2026-09-14

</details>

<details>
<summary>✅ v16.0 Settings Streamlining & Applicant Alignment (Phase 114) — SHIPPED 2026-09-13</summary>

See [.planning/milestones/v16.0-ROADMAP.md](milestones/v16.0-ROADMAP.md) for full phase details.

- [x] Phase 114: Settings Modal Simplification & Applicant Clean-Up (1/1 plans) — completed 2026-09-13

</details>

<details>
<summary>✅ v15.0 Decoupled .NET Core Architecture & Non-Residing Applicants Archive (Phases 109-113) — SHIPPED 2026-09-13</summary>

See [.planning/milestones/v15.0-ROADMAP.md](milestones/v15.0-ROADMAP.md) for full phase details.

- [x] Phase 109: Pure .NET Core Architecture & Python Elimination (1/1 plans) — completed 2026-09-13
- [x] Phase 110: Database Schema & Vacancy Guardrails for Applicants (1/1 plans) — completed 2026-09-13
- [x] Phase 111: Segregated Tenancy & Applicant Register UI (1/1 plans) — completed 2026-09-13
- [x] Phase 112: House Settings Modal & Ingestion Badging (1/1 plans) — completed 2026-09-13
- [x] Phase 113: End-to-End Test Suite Verification & Milestone Audit (1/1 plans) — completed 2026-09-13

</details>

<details>
<summary>✅ v14.0 Power-User Operations & Portfolio Expansion (Phases 105-108) — SHIPPED 2026-09-12</summary>

See [.planning/milestones/v14.0-ROADMAP.md](milestones/v14.0-ROADMAP.md) for full phase details.

- [x] Phase 105: House Archive ZIP Export Pipeline (FastAPI, ASP.NET Core & UI Button) (1/1 plans) — completed 2026-09-10
- [x] Phase 106: Multi-Select Batch Document Operations (Batch Move, Batch Delete & Selection Bar) (1/1 plans) — completed 2026-09-10
- [x] Phase 107: Portfolio Expansion ("+ Add House" Modal & Backend House Registration) (1/1 plans) — completed 2026-09-10
- [x] Phase 108: Keyboard Shortcuts Helper Modal (`?`) & Comprehensive Milestone Verification / Audit (1/1 plans) — completed 2026-09-10
- [x] Quick Refinements QCK-01 through QCK-42 — completed 2026-09-12

</details>

<details>
<summary>✅ v13.0 Decoupled Monorepo Architecture & Native ASP.NET Core Web Server (Phases 101-104) — SHIPPED 2026-09-09</summary>

See [.planning/milestones/v13.0-ROADMAP.md](milestones/v13.0-ROADMAP.md) for full phase details.

- [x] Phase 101: Architecture & Monorepo Restructuring Research (1/1 plan) — completed 2026-09-09
- [x] Phase 102: ASP.NET Core Data Layer & Repository (Dapper + SQLite WAL) (1/1 plan) — completed 2026-09-09
- [x] Phase 103: ASP.NET Core Minimal API Endpoints & Static Serving (1/1 plan) — completed 2026-09-09
- [x] Phase 104: Parity Verification, Windows Single-File Build & Milestone Audit (1/1 plan) — completed 2026-09-09

</details>

<details>
<summary>✅ v12.0 Unified Document Ingestion System (Phases 97-100) — SHIPPED 2026-09-09</summary>

See [.planning/milestones/v12.0-ROADMAP.md](milestones/v12.0-ROADMAP.md) for full phase details.

- [x] Phase 97: Ingest Engine Core (Manual Ingest Pipeline & Page Inheritance) (1/1 plan) — completed 2026-09-09
- [x] Phase 98: FastAPI Ingest API Endpoints (POST /api/ingest & POST /api/ingest/preview-ai) (1/1 plan) — completed 2026-09-09
- [x] Phase 99: Ingest Station Web UI (Navbar Trigger, Dropzone & Ingest Drawer) (1/1 plan) — completed 2026-09-09
- [x] Phase 100: Comprehensive Automated Testing & End-to-End Verification (1/1 plan) — completed 2026-09-09

</details>

<details>
<summary>✅ v11.0 Database Backend & Clean Storage Architecture (Phases 92-96) — SHIPPED 2026-09-09</summary>

See [.planning/milestones/v11.0-ROADMAP.md](milestones/v11.0-ROADMAP.md) for full phase details.

- [x] Phase 92: Database Layer & Relational Schema (1/1 plan) — completed 2026-09-08
- [x] Phase 93: Legacy Data Migration & Storage Restructuring (1/1 plan) — completed 2026-09-08
- [x] Phase 94: Ingestion Pipeline Redesign (1/1 plan) — completed 2026-09-08
- [x] Phase 95: FastAPI High-Performance Backend (1/1 plan) — completed 2026-09-08
- [x] Phase 96: E2E Verification & UI Parity (1/1 plan) — completed 2026-09-08

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|---|---|---|---|---|
| 120. Language Toggle & Directionality Engine | v18.0 | 1/1 | Complete | 2026-09-24 |
| 121. Top Navbar, Login, Shortcuts & Search Clean-Up | v18.0 | 0/1 | In Progress | — |
| 122. House Profile, Tenancy Register & Category Folders English Localization | v18.0 | 0/1 | Planned | — |
| 123. Modals, Actions, Ingestion Station & System Messages Localization | v18.0 | 0/1 | Planned | — |
| 124. Localization Testing, Automated Suite & Multi-Stack Verification | v18.0 | 0/1 | Planned | — |
| 109. Pure .NET Core Architecture & Python Elimination | v15.0 | 1/1 | Complete | 2026-09-13 |
| 110. Database Schema & Vacancy Guardrails for Applicants | v15.0 | 1/1 | Complete | 2026-09-13 |
| 111. Segregated Tenancy & Applicant Register UI | v15.0 | 1/1 | Complete | 2026-09-13 |
| 112. House Settings Modal & Ingestion Badging | v15.0 | 1/1 | Complete | 2026-09-13 |
| 113. End-to-End Test Suite Verification & Milestone Audit | v15.0 | 1/1 | Complete | 2026-09-13 |
| 114. Settings Modal Simplification & Applicant Clean-Up | v16.0 | 1/1 | Complete | 2026-09-13 |
| 115. Document-Anchored Tenancy Dates & Minimalist Register | v16.1 | 1/1 | Complete | 2026-09-14 |
| 116. User Data Model, Password Security & Auth API | v17.0 | 1/1 | Complete | 2026-09-17 |
| 117. Login Screen, Session Management & Navbar User Profile | v17.0 | 1/1 | Complete | 2026-09-17 |
| 118. Permission-Aware UI Enforcement & Zero-Delete Guards | v17.0 | 1/1 | Complete | 2026-09-17 |
| 119. Comprehensive Multi-Stack Verification & Milestone Audit | v17.0 | 1/1 | Complete | 2026-09-17 |
