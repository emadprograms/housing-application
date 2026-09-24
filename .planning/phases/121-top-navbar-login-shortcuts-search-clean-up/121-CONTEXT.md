# Phase 121: Top Navbar, Login, Shortcuts & Search Clean-Up - Context

**Gathered:** 2026-09-24  
**Status:** Ready for planning  
**Mode:** Autonomous / Discretion

<domain>
## Phase Boundary

Phase 121 eliminates all intermixed bilingual strings across the top-level application shell:
1. Top Navbar: buttons, titles, tooltips, and badges.
2. User Profile: badge, role indicator, dropdown menu, and action buttons.
3. Login Screen: brand subtitle, form labels, inputs, and submit button.
4. Shortcuts Helper Modal: header, shortcut action descriptions, and close button.
5. Command Palette (Spotlight ⌘K): trigger, input placeholder, search section headers, and empty state.
</domain>

<decisions>
## Implementation Decisions

### 1. Zero Mixed Strings in UI
- Replace all mixed patterns like `Title • عنوان`, `Word / كلمة`, `Text (نص)` with single-language tokens mapped to `window.i18n.t()`.
- Top navbar tooltips display pure English in EN mode and pure Arabic in AR mode.

### 2. User Profile Role Display
- When `ar`: Role badge displays `صلاحيات كاملة` (Admin) or `قراءة ورفع فقط` (Contributor). Dropdown displays `مدير النظام` or `محرر ومراجع`.
- When `en`: Role badge displays `Full Access` (Admin) or `Read & Upload` (Contributor). Dropdown displays `System Administrator` or `Contributor & Reviewer`.

### 3. Login Screen Localization
- All login screen labels, placeholders, errors, and submit buttons bind to `data-i18n`.
- Brand subtitle switches between `نظام إدارة الوثائق السكنية` (Arabic) and `Housing Digital Archive Management` (English).

### 4. Search & Shortcuts Localization
- Shortcuts modal renders localized shortcut explanations in both languages.
- Command palette sections render `Houses` / `منازل`, `Tenants` / `مستأجرون`, `Documents` / `وثائق`.
</decisions>

<code_context>
## Existing Code Insights
- `index.html` contains the markup for `#top-navbar`, `#login-screen`, `#user-profile-dropdown`, `#shortcuts-modal`, `#command-palette-modal`.
- `auth-manager.js` contains `updateNavbarProfile()`.
- `command-palette.js` contains `renderGroupedResults()` and section creation.
- `keyboard-shortcuts.js` handles shortcut modal interactions.
</code_context>

<specifics>
## Specific Requirements
- CLEAN-01: Pure language top navigation, user profile, and triggers.
- CLEAN-02: Pure language login screen and brand elements.
- CLEAN-03: Pure language keyboard shortcuts modal and command palette.
</specifics>
