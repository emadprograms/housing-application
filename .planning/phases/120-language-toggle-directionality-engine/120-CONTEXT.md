# Phase 120: Language Toggle & Directionality Engine - Context

**Gathered:** 2026-09-24  
**Status:** Ready for planning  
**Mode:** Autonomous / Discretion

<domain>
## Phase Boundary

Phase 120 implements the foundational localization and directionality infrastructure:
1. `i18n.js` client localization engine providing `window.i18n` with dictionary support for Arabic (`ar`) and English (`en`), reactive updates, and DOM auto-binding via `data-i18n` attributes.
2. Prominent header language toggle button (`#lang-toggle-btn`) in `#top-navbar` with globe icon and indicator (`EN` / `عربي`).
3. Directionality switching (`dir="rtl"` for Arabic, `dir="ltr"` for English) on `document.documentElement` with early head script prevention of layout flashes.
4. Persistence of active language in `localStorage` (`app_language`).
</domain>

<decisions>
## Implementation Decisions

### 1. Dedicated `i18n.js` Module
- Store translations in a clean dictionary object `i18n.translations = { ar: {...}, en: {...} }`.
- Provide helper methods: `getLanguage()`, `setLanguage(lang)`, `t(key, fallback)`, `apply(container)`.
- Fire a custom window event `languageChanged` with `{ lang, dir }` on toggle.

### 2. Header Toggle Placement & Style
- Placed in `#top-navbar` action triggers alongside shortcuts trigger (`#btn-shortcuts-trigger`) and theme toggle (`#btn-theme-toggle`).
- Compact, elegant pill button matching existing UI iconography with a globe icon and clear indicator badge (`EN` / `عربي`).
- Accessible `aria-label` dynamically updated.

### 3. Flash-Free Initial Direction & Language
- Add early inline script in `<head>` that reads `localStorage.getItem('app_language') || 'ar'` and sets `document.documentElement.lang` and `document.documentElement.dir` synchronously before DOM renders.
- Default to `ar` (Arabic) if no preference is stored.

### 4. Directional Styling & Layout
- Ensure Tailwind utility classes and custom CSS cleanly handle both RTL and LTR without hardcoded physical margin breaks.
- Chevron icons and back navigation buttons flip direction based on `[dir="rtl"]` vs `[dir="ltr"]`.
</decisions>

<code_context>
## Existing Code Insights
- `index.html` already loads Tailwind, Lucide icons, and has an early inline script for theme (`localStorage.getItem('theme')`).
- `#top-navbar` has buttons `#sidebar-toggle-btn`, `#back-to-grid-btn`, `#btn-search-trigger`, `#btn-shortcuts-trigger`, `#btn-theme-toggle`, `#btn-ingest-trigger`, and `#user-profile-btn`.
- `tests/web/components/` has unit tests for header, navbar, theme manager, shortcuts, etc.
</code_context>

<specifics>
## Specific Requirements
- LANG-01: Header toggle button `#lang-toggle-btn`.
- LANG-02: `localStorage` persistence under `'app_language'`.
- LANG-03: Dynamic `dir` (`rtl`/`ltr`) and `lang` (`ar`/`en`) switching.
</specifics>
