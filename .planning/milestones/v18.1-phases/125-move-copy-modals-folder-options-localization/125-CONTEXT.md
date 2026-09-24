# Phase 125 Context: Move & Copy Modals Folder & Options Localization

## Phase Overview
- **Phase Number:** 125
- **Goal:** Localize standard category folder options, optgroups, action triggers, and subtitles inside Move and Copy document modals (batch and single-document).
- **Requirements Covered:**
  - `MOVE-01`: User opening Move Document modal (single or batch) sees standard category folder options translated according to active language (e.g. `05 - Contracts` in English vs `05 - عقود` in Arabic) while preserving underlying category mapping and compatibility.
  - `MOVE-02`: User opening Copy Document modal (single or batch) sees standard category folder options translated according to active language.
  - `MOVE-03`: Move and Copy modal optgroup labels (`Standard Folders`, `Custom Folders`), action options (`+ Create New Folder...`), and modal subtitles dynamically render in the active language without hardcoded English or Arabic strings.

## Target Areas
1. `src/HousingApplication.Web/wwwroot/js/categories-view.js`:
   - `openBatchMoveModal`:
     - Standard folder options textContent formatted using `window.i18n.localizeCategory(formatted)` (keeping `opt.value` intact).
     - Optgroup labels (`Standard Folders` vs `المجلدات القياسية`, `Custom Folders` vs `مجلدات مخصصة`).
     - Subtitle localization (pure English or pure Arabic).
     - New folder option (`+ Create New Folder...` vs `+ إنشاء مجلد جديد...`).
     - Success toast message localization.
   - `openBatchCopyModal`:
     - Identical localization for Copy modal folder options, optgroup labels, subtitles, and success toast.
2. `src/HousingApplication.Web/wwwroot/js/doc-manager.js`:
   - `populateFolderOptions`:
     - Standard folder options textContent localized via `window.i18n.localizeCategory`.
     - New folder option textContent localized.
   - `setDocModalMode`:
     - Submit button text localized (`Apply Changes` / `Duplicate Document` vs Arabic).
3. `src/HousingApplication.Web/wwwroot/js/i18n.js`:
   - Ensure dictionary keys for Move/Copy modal subtitles, optgroup labels, and actions exist in both Arabic and English dictionaries.
