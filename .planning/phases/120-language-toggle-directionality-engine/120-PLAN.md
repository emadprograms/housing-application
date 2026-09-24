# Phase 120: Language Toggle & Directionality Engine - Plan

**Phase:** 120  
**Goal:** Implement client-side i18n module with localStorage persistence, a prominent header toggle button in `#top-navbar`, and dynamic document directionality (`dir="rtl"` vs `dir="ltr"`).  
**Requirements:** LANG-01, LANG-02, LANG-03  
**Status:** In Progress  

## Execution Plan

### Task 1: Create `i18n.js` Engine & Dictionary Foundation
- Path: `src/HousingApplication.Web/wwwroot/js/i18n.js`
- Create `window.i18n` with:
  - Supported languages: `['ar', 'en']`, default `ar`.
  - Storage key: `'app_language'`.
  - Methods: `init()`, `getLanguage()`, `setLanguage(lang)`, `toggleLanguage()`, `t(key, fallback)`, `apply(root)`, `onLanguageChange(listener)`.
  - Baseline dictionary containing core keys (navigation, navbar, common actions, toggle labels).
  - Synchronous document element update: `document.documentElement.lang = lang` and `document.documentElement.dir = (lang === 'ar' ? 'rtl' : 'ltr')`.
  - Custom event dispatch: `window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang, dir } }))`.

### Task 2: Update `index.html` with Header Toggle Button & Head Script
- Path: `src/HousingApplication.Web/wwwroot/index.html`
- In `<head>`: Add inline early script to immediately set `dir` and `lang` from `localStorage.getItem('app_language') || 'ar'` to prevent layout flash.
- In `#top-navbar`: Add `#lang-toggle-btn` button with a globe SVG icon and text indicator (`EN` when in Arabic mode, `عربي` when in English mode).
- In `<scripts>` list: Include `js/i18n.js` before `app.js`.

### Task 3: Hook Toggle Event in `app.js` / `i18n.js`
- Connect `#lang-toggle-btn` click event to `window.i18n.toggleLanguage()`.
- Ensure toggle immediately updates the button label, document direction, and re-applies translations to DOM.

### Task 4: RTL/LTR Directional CSS Enhancements
- Path: `src/HousingApplication.Web/wwwroot/css/styles.css`
- Ensure smooth directional transitions and correct flip for directional chevrons/icons when `dir="rtl"` vs `dir="ltr"`.

### Task 5: Unit Tests for Language Toggle & Directionality
- Path: `tests/web/components/i18n_toggle.test.js`
- Test cases:
  1. Default language is `'ar'` and document direction is `'rtl'`.
  2. Toggle switches language to `'en'`, changes direction to `'ltr'`, and updates `localStorage`.
  3. Toggle switches back to `'ar'` and restores `'rtl'`.
  4. `i18n.t(key)` returns correct string for active language and falls back gracefully.
  5. `i18n.apply()` updates `data-i18n` and `data-i18n-title` attributes in DOM elements.
  6. `#lang-toggle-btn` renders in `#top-navbar` and triggers language switch.

## Verification
- Run `npm test` to ensure new tests pass and no existing tests regress.
