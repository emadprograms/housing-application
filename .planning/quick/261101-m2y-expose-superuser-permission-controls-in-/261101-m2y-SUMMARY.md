---
phase: quick-261101-m2y
plan: 01
subsystem: auth-rbac-ui
tags: [rbac, superuser, permissions, navbar, user-management, compatibility]
key-files:
  modified:
    - src/HousingApplication.Web/wwwroot/index.html
    - src/HousingApplication.Web/wwwroot/js/i18n.js
    - src/HousingApplication.Web/wwwroot/js/auth-manager.js
    - src/HousingApplication.Web/wwwroot/js/user-management.js
    - dist/win-x64/wwwroot/index.html
    - dist/win-x64/wwwroot/js/i18n.js
    - dist/win-x64/wwwroot/js/auth-manager.js
    - dist/win-x64/wwwroot/js/user-management.js
    - tests/web/components/user_management.test.js
completed: 2026-11-01
---

# Quick Task 261101-m2y Summary: Expose SuperUser Permission Controls in Top Navbar & Interactive Permission Checkboxes

## What Changed

1. **Direct Top-Navbar SuperUser Button (`#btn-navbar-user-management`)**:
   - Added a prominent amber **Users & Permissions (`إدارة المستخدمين والصلاحيات`)** button directly inside `#top-navbar-actions` right next to the user profile badge (in addition to `#btn-open-user-management` inside the profile dropdown `#user-profile-dropdown`).
   - Exclusively shown when signed in as the sole `SuperUser` (`Emad` initially) and automatically hidden for `Admin` and `Contributor` users.
   - Bumped cache-busting query string on `auth-manager.js`, `user-management.js`, `i18n.js`, and `app.js` to `?v=261101-05`.

2. **Explicit Per-User Interactive Permission Controls (`user-management.js` + `i18n.js`)**:
   - Added a dedicated **Permissions (`الصلاحيات`)** strip on every user row inside `#user-management-modal` so the Super User can inspect and toggle permissions directly without hunting for a role code:
     - **Read, Search & Upload Documents** (always active badge)
     - **Delete Records & Pages** (interactive `.perm-toggle-delete` checkbox on non-SuperUser rows)
     - **Storage & Database Settings** (interactive `.perm-toggle-settings` checkbox on non-SuperUser rows)
     - **User & Permission Management (Super User Only)** (amber badge on SuperUser row; locked badge on non-SuperUser rows with adjacent **Make Super User** ownership transfer button)
   - Synchronized permission checkbox toggles seamlessly with the underlying `Admin` / `Contributor` role tier via `PUT /api/users/{id}` (and dual `display_name` / `displayName` payload support for `SnakeCaseLower` JSON binding).

3. **Legacy Binary Resilience & Race-Free Session Check (`auth-manager.js` + `user-management.js`)**:
   - Updated `checkSession()` and `login()` to recognize both `is_super_user` / `can_manage_users` (snake_case from `Program.cs`) and `isSuperUser` / `canManageUsers`, while preserving caller-injected `currentUser` snapshots against in-flight session checks.
   - Added `housing_rbac_directory_v1` fallback when running against an older binary lacking `/api/users` (`404`/`405`), immediately promoting `Emad` to `SuperUser` and rendering the full interactive user/permission list alongside build instructions.

## Verification

- Synchronized `src/HousingApplication.Web/wwwroot/` -> `dist/win-x64/wwwroot/` (`diff -rq` clean) on top of `182c479`.
- Full Vitest suite: **56/56 test files (775/775 tests) passing**.
