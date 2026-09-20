# Debug Session: Login Inputs Invisible Text & Duplicate Password Eye

**Status:** fixing
**Trigger:** "I can't type anything into the username and password fields. and there are two eyes thingy in the password field."
**Created:** 2026-09-20
**Updated:** 2026-09-20

---

## 1. Symptoms & Initial Observations
- **Symptom 1:** User cannot see anything being typed into `#login-username` or `#login-password`. Keys are pressed, but the fields appear unresponsive or blank.
- **Symptom 2:** The password field displays two eye icons simultaneously.

---

## 2. Root Cause Analysis
1. **Invisible Text (White on White):**
   - In `styles.css` (line 146):
     ```css
     html:not(.dark) input:not([type="checkbox"]):not([type="radio"]) {
         background-color: #ffffff;
         border-color: #e2e8f0;
     }
     ```
   - In light mode (`html:not(.dark)`), this rule forced `background-color: #ffffff` on all inputs throughout the DOM.
   - However, `#login-screen` is a dark-themed open canvas, and the login inputs carried Tailwind's `text-white` (`#ffffff`) class.
   - As a result, the input background became solid white while the typed text was solid white (`#ffffff` on `#ffffff`), rendering all typed characters and password dots completely invisible to the user.
2. **Duplicate Eye Icons in Password Field:**
   - Microsoft Edge (and Windows Chromium browsers) automatically injects a native password reveal button pseudo-element (`::-ms-reveal`) on all `<input type="password">` elements.
   - Concurrently, our custom `#btn-toggle-password` SVG button was rendered in the same right-aligned position inside the password container.
   - Both the native Edge eye and the custom SVG eye were displayed side by side.

---

## 3. Resolution Plan
1. **Explicit Login Input Styling in `styles.css`:**
   - Defined dedicated rules for `#login-screen input[type="text"]` and `#login-screen input[type="password"]` with:
     - `background-color: rgba(255, 255, 255, 0.08) !important;`
     - `color: #ffffff !important;`
     - `-webkit-text-fill-color: #ffffff !important;`
     - `caret-color: #38bdf8 !important;`
     - `border-color: rgba(255, 255, 255, 0.2) !important;`
   - This guarantees crisp, high-contrast, fully visible white text and a bright cyan cursor regardless of whether the global document is in light or dark mode.
2. **Suppress Edge Native `::-ms-reveal`:**
   - Added `input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; width: 0 !important; height: 0 !important; }` to eliminate Edge's duplicate eye icon.
3. **Dual-Asset Synchronization & Testing:**
   - Mirrored changes to `dist/win-x64/wwwroot/`.
   - Verified with Vitest test suite (`12/12` tests passed).

---

## 4. Resolution & Verification
- **Status:** resolved
- **Verification:**
  - In light mode, `#login-screen` inputs now retain their dark translucent background (`rgba(255, 255, 255, 0.08)`) with crystal clear white text (`#ffffff`) and bright cyan cursor (`#38bdf8`), resolving the white-on-white invisible text issue.
  - In Microsoft Edge, `::-ms-reveal` is hidden via CSS, leaving only the custom SVG eye button for password visibility toggling.
  - All 12 tests in `auth_manager.test.js` passed.

