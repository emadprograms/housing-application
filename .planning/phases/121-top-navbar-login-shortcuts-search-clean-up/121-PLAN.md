# Phase 121: Top Navbar, Login, Shortcuts & Search Clean-Up - Plan

**Phase:** 121  
**Goal:** Strip all intermixed bilingual strings from top navigation, user profile badge/dropdown, login screen, search palette, and shortcut helper modals.  
**Requirements:** CLEAN-01, CLEAN-02, CLEAN-03  
**Status:** In Progress  

## Execution Plan

### Task 1: Clean-up `index.html` Markup
- In `#top-navbar`:
  - Replace bilingual titles (e.g. `• تبديل الشريط الجانبي`, `/ دليل اختصارات`, `/ تفعيل الوضع الداكن`, `• User Profile & Permissions`).
  - Add `data-i18n`, `data-i18n-title`, `data-i18n-aria` attributes to navbar buttons, view options, and controls.
  - Localize User Profile dropdown menu: `#btn-switch-user` and `#btn-logout` labels without bullet separator.
- In `#login-screen`:
  - Brand subtitle with `data-i18n="login.subtitle"`.
  - Form labels and inputs with `data-i18n` and `data-i18n-placeholder`.
- In `#keyboard-shortcuts-modal`:
  - Remove mixed Arabic/English labels in shortcut tables, replacing with clean `data-i18n` tags.

### Task 2: Clean-up `auth-manager.js`
- In `updateNavbarProfile()`:
  - Replace `صلاحيات كاملة • Full Access` with localized single-language strings (`Full Access` in EN, `صلاحيات كاملة` in AR).
  - Replace `قراءة ورفع فقط • Read & Upload` with localized single-language strings (`Read & Upload` in EN, `قراءة ورفع فقط` in AR).
  - Replace `مدير نظام • Admin` and `موظف • Contributor` with localized single-language role badges.
  - Update descriptions and logout toast messages to be single-language.
- Listen to `languageChanged` event to re-render navbar profile on language toggle.

### Task 3: Clean-up `command-palette.js` & `keyboard-shortcuts.js`
- In `command-palette.js`:
  - Replace `Toggle ... Mode / الوضع ...` command title with pure localized title.
  - Group section titles (Commands, Houses, Tenants, Documents) localized via `window.i18n.t()`.
  - Empty state messages localized via `window.i18n.t()`.

### Task 4: Expand Dictionary in `i18n.js`
- Add any missing keys for shortcuts, search sections, and auth profile details.

### Task 5: Component Tests for Clean Language Separation
- Author `tests/web/components/clean_language_shell.test.js`:
  - Test that top navbar and buttons contain no intermixed slash (` / `) or bullet (` • `) language pairs.
  - Test that login screen renders cleanly in English and Arabic.
  - Test that user profile badge and dropdown render purely in the active language.
  - Test that command palette sections use active language.

### Task 6: Parity Sync & Verification
- Mirror files to `dist/win-x64/wwwroot/`.
- Run Vitest suite to ensure all tests pass cleanly.
