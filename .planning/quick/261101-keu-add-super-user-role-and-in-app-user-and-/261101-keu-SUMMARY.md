---
phase: quick
plan: 261101-keu
subsystem: auth-rbac-user-management
tags: [rbac, superuser, user-management, sqlite-invariants, cookie-auth, i18n]
requires:
  - 261101-ean
provides:
  - 3-tier RBAC hierarchy (strictly 1 SuperUser, Admin, Contributor/Regular User)
  - SQLite partial unique index enforcing single active SuperUser (idx_users_single_superuser)
  - Live session validation/revocation via CookieAuthenticationEvents.OnValidatePrincipal
  - SuperUser-only /api/users CRUD and atomic /api/users/{id}/transfer-superuser endpoints
  - Bilingual in-app User & Role Management modal (user-management.js)
affects:
  - src/HousingApplication.Web/Data/DatabaseInitializer.cs
  - src/HousingApplication.Web/Data/FileOrganizerRepository.cs
  - src/HousingApplication.Web/Program.cs
  - src/HousingApplication.Web/wwwroot/js/auth-manager.js
  - src/HousingApplication.Web/wwwroot/js/user-management.js
  - src/HousingApplication.Web/wwwroot/index.html
tech-stack:
  added: []
  patterns:
    - SQLite partial unique index (WHERE role = 'SuperUser' AND is_active = 1)
    - CookieAuthenticationEvents.OnValidatePrincipal live DB principal validation
    - Demote-then-promote transactional ownership transfer
key-files:
  created:
    - src/HousingApplication.Web/wwwroot/js/user-management.js
    - dist/win-x64/wwwroot/js/user-management.js
    - tests/web/components/user_management.test.js
  modified:
    - src/HousingApplication.Web/Common/PasswordHasher.cs
    - src/HousingApplication.Web/Models/User.cs
    - src/HousingApplication.Web/Data/DatabaseInitializer.cs
    - src/HousingApplication.Web/Data/IFileOrganizerRepository.cs
    - src/HousingApplication.Web/Data/FileOrganizerRepository.cs
    - src/HousingApplication.Web/Program.cs
    - src/HousingApplication.Web/wwwroot/js/auth-manager.js
    - src/HousingApplication.Web/wwwroot/js/i18n.js
    - src/HousingApplication.Web/wwwroot/js/app.js
    - src/HousingApplication.Web/wwwroot/index.html
    - tests/HousingApplication.Tests/AuthAndRbacTests.cs
decisions:
  - Enforced the single-SuperUser invariant at both the SQLite engine level (partial unique index idx_users_single_superuser) and repository transaction level (demoting current SuperUser to Admin prior to promoting target user).
  - Validated cookie principals live against SQLite in OnValidatePrincipal so role demotions or account deletions take effect on the very next request without waiting for 7-day cookie expiry.
  - Added has_custom_password column so newly created or password-reset accounts strictly enforce PBKDF2-SHA256 verification without legacy password123/123456 shortcuts, while preserving backward compatibility for unedited seeded accounts.
  - Seeded DefaultUsers only when the users table is empty (COUNT == 0) so deleted seeded accounts are never resurrected on server restart.
metrics:
  duration: ~25m
  completed: 2026-11-01
---

# Quick Task 261101-keu: Add Super User Role and In-App User & Permission Management Summary

## What Was Built

1. **3-Tier Role Hierarchy & Database Invariants (`DatabaseInitializer.cs`, `User.cs`, `PasswordHasher.cs`)**
   - Upgraded RBAC from a static 2-role hardcoded seed (`Admin` / `Contributor`) to a dynamic 3-tier model:
     - **Tier 1 — `SuperUser` (strictly 1 in system, initially `Emad`):** Full archive/delete/settings access plus exclusive access to User & Role Management.
     - **Tier 2 — `Admin` (`Bubshait`, `Ehtezaz`, `Mustafa`, or promoted accounts):** Full archive, upload, edit, delete, and storage path settings access; **zero** access (`403 Forbidden` + hidden UI) to user/permission management.
     - **Tier 3 — `Contributor` / Regular User:** Read, search, and upload documents only; blocked from deletions, storage settings, and user management.
   - Added `has_custom_password INTEGER NOT NULL DEFAULT 0` migration and `CREATE UNIQUE INDEX idx_users_single_superuser ON users(role) WHERE role = 'SuperUser' AND is_active = 1;` partial unique index, plus automatic migration promoting `Emad` on existing databases with zero `SuperUser` rows.
   - Updated `EnsureUsersSeeded` to seed default accounts only when `COUNT(1) == 0`, preventing deleted default users from reappearing on restart.

2. **Live Session Enforcement & `/api/users` Endpoints (`FileOrganizerRepository.cs`, `Program.cs`)**
   - Added `CookieAuthenticationEvents.OnValidatePrincipal` to verify active sessions against SQLite on each request, immediately revoking deleted accounts and refreshing modified role claims (`ClaimTypes.Role`).
   - Hardened `IsRestrictedFromDelete` so `X-User` fallback lookups verify the live database role rather than trusting client-supplied `X-User-Role` headers.
   - Implemented `SuperUser`-only endpoints (`CheckSuperUserAccessAsync`):
     - `GET /api/users`
     - `POST /api/users` (assignable roles: `Admin` or `Contributor`, `has_custom_password = 1`)
     - `PUT /api/users/{id}` (toggle `Admin` <-> `Contributor`, update display name, reset password)
     - `DELETE /api/users/{id}` (blocks deleting the `SuperUser` or oneself)
     - `POST /api/users/{id}/transfer-superuser` (atomic transaction demoting current `SuperUser` to `Admin`, promoting target to `SuperUser`, and re-signing caller's cookie as `Admin`)

3. **Bilingual User & Role Management UI (`user-management.js`, `auth-manager.js`, `i18n.js`, `index.html`)**
   - Added `#btn-open-user-management` inside `#user-profile-dropdown` (visible **exclusively** when `authManager.canManageUsers()` is true) and `#user-management-modal` with a 3-tier permission overview, Add User form, inline `Admin` / `Regular User` role selector, inline password reset, `Make Super User` ownership transfer with immediate UI downgrade to `Admin`, and account removal confirmation.
   - Added complete single-language Arabic (`ar`) and English (`en`) translations across `i18n.js` with 100% parity synced to `dist/win-x64/wwwroot/`.

## Verification

- **Frontend / Vitest (`npx vitest run`):** All **56 test files (774 / 774 tests)** passed, including 8 new tests in `tests/web/components/user_management.test.js`, 20 in `auth_manager.test.js`, 13 in `rbac_ui_enforcement.test.js`, and 10 in `clean_language_shell.test.js`.
- **Backend / xUnit (`tests/HousingApplication.Tests/AuthAndRbacTests.cs`):** Updated and expanded with tests covering single-`SuperUser` seeding, SQLite partial unique index enforcement & legacy migration, custom-password shortcut rejection, `Admin`/`Contributor` `403` enforcement on `/api/users/*`, `SuperUser` CRUD + live cookie role sync/revocation, and atomic `SuperUser` ownership transfer.

## Commits

- `c3edc6d`: `docs(quick-261101-keu): plan 3-tier SuperUser RBAC and in-app user management`
- `0a2cad3`: `feat(quick-261101-keu): implement 3-tier SuperUser RBAC, single-SuperUser DB invariant, and /api/users CRUD`
- `02762d9`: `feat(quick-261101-keu): build SuperUser-only User & Role Management modal and bilingual UI`
- `84e388b`: `test(quick-261101-keu): add xUnit and Vitest suites for 3-tier SuperUser RBAC and user management`
