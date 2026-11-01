---
phase: quick-261101-keu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/HousingApplication.Web/Common/PasswordHasher.cs
  - src/HousingApplication.Web/Models/User.cs
  - src/HousingApplication.Web/Models/DTOs.cs
  - src/HousingApplication.Web/Data/DatabaseInitializer.cs
  - src/HousingApplication.Web/Data/IFileOrganizerRepository.cs
  - src/HousingApplication.Web/Data/FileOrganizerRepository.cs
  - src/HousingApplication.Web/Program.cs
  - src/HousingApplication.Web/wwwroot/index.html
  - src/HousingApplication.Web/wwwroot/js/i18n.js
  - src/HousingApplication.Web/wwwroot/js/auth-manager.js
  - src/HousingApplication.Web/wwwroot/js/user-management.js
  - src/HousingApplication.Web/wwwroot/js/app.js
  - dist/win-x64/wwwroot/*
  - tests/HousingApplication.Tests/AuthAndRbacTests.cs
  - tests/web/components/user_management.test.js
autonomous: true
requirements:
  - QCK-64
must_haves:
  truths:
    - "Exactly one active SuperUser exists in the database at all times, enforced by SQLite partial unique index idx_users_single_superuser and startup migration."
    - "SuperUser has full operational access PLUS exclusive access to add/remove users, change user roles (Admin <-> Regular User/Contributor), reset passwords, and atomically transfer SuperUser ownership."
    - "Admin users retain full operational access (including delete & storage settings) but receive 403 Forbidden on all /api/users/* management endpoints and do not see the User Management UI."
    - "Regular Users (Contributor) retain read & upload access only and cannot delete records, change storage paths, or manage users."
    - "Cookie sessions validate against live SQLite user state via OnValidatePrincipal so role changes and user removals take effect immediately without stale privileges."
  artifacts:
    - path: "src/HousingApplication.Web/Data/DatabaseInitializer.cs"
      provides: "has_custom_password column migration, EnsureSuperUserInvariant migration, and idx_users_single_superuser partial unique index"
    - path: "src/HousingApplication.Web/wwwroot/js/user-management.js"
      provides: "SuperUser-only User & Role Management modal controller (create, role toggle, password reset, SuperUser transfer, delete)"
    - path: "tests/web/components/user_management.test.js"
      provides: "Vitest coverage for 3-tier RBAC, SuperUser exclusivity, user CRUD, role switching, crown transfer, and i18n"
---

<objective>
Implement a strict 3-tier RBAC model (`SuperUser` -> `Admin` -> `Contributor` / Regular User) with a database-enforced single-SuperUser invariant and full in-app User & Permission Management.

Purpose: Give the single system owner (`SuperUser`, initially `Emad` with atomic transfer support) complete in-app control over adding/removing accounts, switching users between `Admin` and `Regular User`, and resetting passwords—while ensuring regular `Admin` accounts have full operational archive access without being able to escalate or alter user permissions.
Output: SQLite partial unique index + startup migration, live cookie re-validation, `/api/users/*` SuperUser-only endpoints, bilingual `#user-management-modal`, synced `dist/win-x64/wwwroot/`, and xUnit + Vitest suites.
</objective>

<context>
@.planning/STATE.md
@src/HousingApplication.Web/Data/DatabaseInitializer.cs
@src/HousingApplication.Web/Models/User.cs
@src/HousingApplication.Web/Program.cs
@src/HousingApplication.Web/wwwroot/js/auth-manager.js
@tests/HousingApplication.Tests/AuthAndRbacTests.cs
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enforce single-SuperUser schema invariant, user CRUD repository methods, live cookie validation, and /api/users endpoints</name>
  <files>
    src/HousingApplication.Web/Common/PasswordHasher.cs,
    src/HousingApplication.Web/Models/User.cs,
    src/HousingApplication.Web/Models/DTOs.cs,
    src/HousingApplication.Web/Data/DatabaseInitializer.cs,
    src/HousingApplication.Web/Data/IFileOrganizerRepository.cs,
    src/HousingApplication.Web/Data/FileOrganizerRepository.cs,
    src/HousingApplication.Web/Program.cs
  </files>
  <action>
    1. Update `PasswordHasher.VerifyPassword` with `bool allowLegacyShortcuts = true` so pre-seeded accounts (`has_custom_password = 0`) preserve existing login convenience while newly created or password-updated accounts (`has_custom_password = 1`) strictly verify PBKDF2-SHA256 hashes.
    2. Update `User` (`HasCustomPassword`) and `UserDto` (`IsSuperUser`, `CanManageUsers`, `CanDelete` true for both `SuperUser` and `Admin`), and add request DTOs (`CreateUserRequestDto`, `UpdateUserRequestDto`).
    3. Update `DatabaseInitializer`:
       - Add `has_custom_password INTEGER NOT NULL DEFAULT 0` to `users` schema and `ALTER TABLE` migration.
       - Seed `Emad` as `SuperUser`, `Bubshait`/`Ehtezaz`/`Mustafa` as `Admin`, and the 6 regular users as `Contributor`.
       - Run `EnsureSuperUserInvariant` / `EnsureSuperUserInvariantAsync` to migrate existing DBs (promoting `Emad` or lowest-ID active `Admin` if zero `SuperUser`s exist, deduplicating if >1) and create `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_superuser ON users(role) WHERE role = 'SuperUser' AND is_active = 1;`.
    4. Implement `CreateUserAsync`, `UpdateUserAsync`, `DeleteUserAsync`, and atomic `TransferSuperUserAsync` on `IFileOrganizerRepository` / `FileOrganizerRepository`.
    5. Add `CookieAuthenticationEvents.OnValidatePrincipal` in `Program.cs` for instant session revocation/role refresh, update RBAC helpers (`IsRestrictedFromDelete`, `IsSuperUserAsync`), and mount SuperUser-gated `/api/users` (`GET`, `POST`, `PUT /{id}`, `DELETE /{id}`, `POST /{id}/transfer-superuser`).
  </action>
  <verify>Inspect SQLite transaction order in `TransferSuperUserAsync` (demote before promote under `idx_users_single_superuser`), DTO serialization, and nullability.</verify>
  <done>Backend enforces cardinality=1 `SuperUser`, live session sync, and `403 Forbidden` for `Admin` and `Contributor` on all `/api/users/*` management routes.</done>
</task>

<task type="auto">
  <name>Task 2: Build bilingual SuperUser-only User & Role Management modal and update AuthManager 3-tier role badges</name>
  <files>
    src/HousingApplication.Web/wwwroot/index.html,
    src/HousingApplication.Web/wwwroot/js/i18n.js,
    src/HousingApplication.Web/wwwroot/js/auth-manager.js,
    src/HousingApplication.Web/wwwroot/js/user-management.js,
    src/HousingApplication.Web/wwwroot/js/app.js,
    dist/win-x64/wwwroot/*
  </files>
  <action>
    1. Add single-language `ar` and `en` keys in `i18n.js` for `SuperUser` role badges (`common.superuser`, `auth.superuser_desc`, `common.regular_user`) and `user_mgmt.*` modal strings.
    2. Upgrade `auth-manager.js` to recognize `'SuperUser'` (`isSuperUser()`, `canManageUsers()`, `isAdmin()` returning true for `'SuperUser'` & `'Admin'`), render distinct Crown/SuperUser profile badges & descriptions, and hide `#btn-open-user-management` for everyone except `SuperUser`.
    3. Add `#btn-open-user-management` in `#user-profile-dropdown` and `#user-management-modal` in `index.html`, plus `js/user-management.js` supporting Add User, inline Role Change (`Admin` <-> `Regular User`), Reset Password, Transfer Super User (with self-demotion confirmation & immediate session refresh), Remove User, and `405` outdated-binary notice.
    4. Sync `src/HousingApplication.Web/wwwroot/` to `dist/win-x64/wwwroot/`.
  </action>
  <verify>`diff -rq src/HousingApplication.Web/wwwroot dist/win-x64/wwwroot` outputs zero differences and `clean_language_shell.test.js` passes.</verify>
  <done>SuperUser sees and operates the User & Role Management modal in AR/EN; Admins and Regular Users do not see user-permission controls.</done>
</task>

<task type="auto">
  <name>Task 3: Update xUnit AuthAndRbacTests and add comprehensive Vitest user_management.test.js suite</name>
  <files>
    tests/HousingApplication.Tests/AuthAndRbacTests.cs,
    tests/web/components/user_management.test.js
  </files>
  <action>
    1. Update `AuthAndRbacTests.cs` for `Emad` (`SuperUser`, `CanDelete = true`, `CanManageUsers = true`) and add xUnit integration tests verifying:
       - Single `SuperUser` invariant on seeding
       - `Admin` (`Bubshait`) and `Contributor` (`Nawaf`) both receive `403 Forbidden` on `GET/POST/PUT/DELETE /api/users`
       - `SuperUser` (`Emad`) can create a user with custom password (rejecting legacy shortcut passwords), change roles (`Contributor` -> `Admin`), delete users (while blocking self/SuperUser deletion), and atomically transfer `SuperUser` to `Bubshait` (leaving `Emad` as `Admin` and `Bubshait` as the sole `SuperUser`).
    2. Create `tests/web/components/user_management.test.js` testing 3-tier visibility (`SuperUser` vs `Admin` vs `Contributor`), AR/EN localization, user creation, role switching, password reset, SuperUser crown transfer, user deletion, and `wwwroot` parity.
    3. Run full `npx vitest run` suite.
  </action>
  <verify>100% of Vitest test suites pass with zero regressions.</verify>
  <done>All backend and frontend tests are complete and green.</done>
</task>

</tasks>
