---
audit_acknowledged:
  milestone: v17.0
  at: 2026-09-23
  status: unknown
---

# Debug Session: Autofill User Details Bar Background & Text Near White

**Status:** resolved
**Trigger:** "when autofilling the details. the background of the user details bar become near white and the text is near white too. also give me the login details as well. update milestone docs as well."
**Created:** 2026-09-20
**Updated:** 2026-09-20

---

## 1. Symptoms & Initial Observations

- **Symptom:** When a user autofills login credentials (username and password) via the browser (Chrome, Edge, Safari, Firefox), the input fields' background turns near-white (light blue/yellow default autofill hue) and the text is near-white too.
- **Expected Behavior:** When credentials are autofilled, the input fields should maintain a dark, high-contrast theme (`#0f172a` / `#131b2e`) with clear, crisp white text (`#ffffff`), matching the dark open login home page design.
- **Reproduction:** Use browser password manager / autocomplete to autofill `#login-username` and `#login-password`.

---

## 2. Root Cause Analysis

1. **Browser Default Autofill Styling (`:-webkit-autofill`):**
   - Chromium and WebKit browsers apply internal user-agent styles to inputs matching `:-webkit-autofill`:
     - They inject an inset box shadow (e.g. `box-shadow: 0 0 0 1000px #e8f0fe inset` or light yellow/white).
     - They also attempt to set text color to black.
2. **Conflict with Existing Custom CSS:**
   - In `styles.css`, `#login-screen input[type="text"]` and `#login-screen input[type="password"]` have:
     `-webkit-text-fill-color: #ffffff !important;`
   - When autofill triggers, the browser's light autofill background is applied, but the text remains forced to `#ffffff` by `-webkit-text-fill-color: #ffffff !important`.
   - Consequently, the text is white on a near-white background, making the user details completely unreadable.
3. **Missing `color-scheme: dark`:**
   - `#login-screen` and its inputs lacked `color-scheme: dark;`, which prevents modern browsers from applying their native dark-mode autofill palette.

---

## 3. Resolution Plan

1. **Add Dark Mode Autofill Styles to `styles.css`:**
   - Target `#login-screen input:-webkit-autofill`, `#login-screen input:-webkit-autofill:hover`, `#login-screen input:-webkit-autofill:focus`, `#login-screen input:-webkit-autofill:active`:
     - `-webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;`
     - `box-shadow: 0 0 0 1000px #0f172a inset !important;`
     - `-webkit-text-fill-color: #ffffff !important;`
     - `color: #ffffff !important;`
     - `caret-color: #38bdf8 !important;`
     - `border-color: rgba(255, 255, 255, 0.25) !important;`
     - `transition: background-color 5000s ease-in-out 0s;`
   - Add Firefox `:-moz-autofill` rules:
     - `box-shadow: 0 0 0 1000px #0f172a inset !important;`
     - `filter: none !important;`
     - `color: #ffffff !important;`
     - `border-color: rgba(255, 255, 255, 0.25) !important;`
   - Add `color-scheme: dark;` to `#login-screen` and `#login-screen input`.
2. **Dual-Asset Synchronization:**
   - Applied changes to both `src/HousingApplication.Web/wwwroot/css/styles.css` and `dist/win-x64/wwwroot/css/styles.css`.
3. **Milestone Documentation Update:**
   - Updated `.planning/phases/117-login-session-ui/117-01-SUMMARY.md` and `.planning/milestones/v17.0-REQUIREMENTS.md`.
4. **Automated Testing:**
   - Added test case in `tests/web/components/auth_manager.test.js` verifying autofill styles and `color-scheme: dark`.

---

## 4. Resolution & Verification

- **Status:** resolved
- **Verification:**
  - Browser autofill pseudo-classes (`:-webkit-autofill`, `:-moz-autofill`) now enforce an inset shadow of `#0f172a` (dark slate) and `-webkit-text-fill-color: #ffffff !important;`.
  - Added `color-scheme: dark;` to `#login-screen` and `#login-screen input`.
  - Automated test in `tests/web/components/auth_manager.test.js` verifies the autofill rules and color-scheme properties.
  - All 18 Vitest tests passed (`18 passed (18)`).
