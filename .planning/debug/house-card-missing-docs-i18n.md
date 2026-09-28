---
status: resolved
trigger: "the notifications about the missing documents in the house card at the bottom is still in arabic. It needs to be in english when the selected translation is english and arabic when arabic is selected."
created: 2026-09-28T09:55:00.000Z
updated: 2026-09-28T10:06:00.000Z
---

# Debug Session: house-card-missing-docs-i18n

## Symptoms
- **Expected behavior**: When the app language is set to English, the missing documents notification banner at the bottom of the house card (`.missing-docs-strip`) should display in English: `⚠️ Missing: Personal Details, Allotment Order...` with English tooltips. When Arabic is selected, it should display in Arabic: `⚠️ ناقص: بيانات شخصية، أمر تخصيص...` with Arabic tooltips.
- **Actual behavior**: The missing documents notification banner at the bottom of the house card always displays in Arabic (`⚠️ ناقص:` and Arabic category names `c.label` joined by Arabic comma `، `), even when English is selected.
- **Error messages**: None (hardcoded strings / missing i18n localization).
- **Timeline**: Observed when viewing area houses grid in English language mode.
- **Reproduction**: Set app language to English, open any area overview where houses have missing documents. Inspect the card warning strip at the bottom of the house card.

## Current Focus
- hypothesis: In `src/HousingApplication.Web/wwwroot/js/area-grid.js`, `missingWarningHtml` and `integrityBadgeHtml` hardcode Arabic strings `⚠️ ناقص:`, `c.label`, Arabic comma delimiter `، `, and Arabic tooltip titles without checking whether the active language is English (`window.i18n.getLanguage() === 'en'`), and `area-grid.js` does not re-render upon `languageChanged` events.
- test: Inspect `area-grid.js`, verify `computeHouseIntegrity` category localization, update missing warning strip and badges to check active language, add a `languageChanged` event listener to re-render the grid, and write unit/component tests for both Arabic and English modes.
- expecting: When English is selected, the missing documents warning displays in English; when Arabic is selected, it displays in Arabic.
- next_action: Verified and complete.

## Evidence
- timestamp: 2026-09-28T09:55:00.000Z
  - evidence: User reported that the notifications about missing documents in the house card at the bottom are still in Arabic when English translation is selected.
- timestamp: 2026-09-28T10:00:00.000Z
  - evidence: In `src/HousingApplication.Web/wwwroot/js/area-grid.js` lines 1000-1033, `missingWarningHtml` and `integrityBadgeHtml` exclusively hardcode `⚠️ ناقص:`, `c.label`, Arabic comma `، `, and Arabic tooltips (`وثائق ناقصة:`, `منزل شاغر`, `الملف مكتمل:`). They do not check `window.i18n.getLanguage() === 'en'`.
  - evidence: `MANDATORY_INTEGRITY_CATEGORIES` already defines `labelEn` for all 5 mandatory categories: 'Personal Details', 'Allotment Order', 'Key Handover', 'Contracts', 'Rent Deduction'.
  - evidence: `area-grid.js` does not register a `languageChanged` event listener to re-render the active area grid when language is toggled.

## Eliminated
- Eliminated hypothesis that category counts or integrity computation lacked English names; `MANDATORY_INTEGRITY_CATEGORIES` already includes `labelEn` on all entries.

## Resolution
- **Root Cause**:
  1. In `area-grid.js`, `missingWarningHtml` and `integrityBadgeHtml` directly hardcoded Arabic strings (`⚠️ ناقص:`, `c.label`, Arabic comma delimiter `، `, and Arabic tooltips `وثائق ناقصة: ...`, `منزل شاغر`, `الملف مكتمل: 5/5 وثائق إلزامية متوفرة`) without consulting `window.i18n.getLanguage()`.
  2. `area-grid.js` lacked a `languageChanged` event listener, so toggling the language while viewing an area grid did not trigger a re-render of the house cards.
- **Fix Applied**:
  1. Updated `area-grid.js` to inspect `window.i18n.getLanguage() === 'en'`:
     - When English is active (`isEn`):
       - Missing documents banner displays `⚠️ Missing:` with `c.labelEn` separated by `, ` and title `Missing documents: ...`.
       - Vacant badge renders `Vacant` with title `Vacant house`.
       - Complete badge renders `5/5` with title `File complete: 5/5 mandatory documents present`.
       - Incomplete badge renders `${integrity.presentCount}/5` with title `Missing documents: ...`.
     - When Arabic is active (`isAr` / default):
       - Missing documents banner displays `⚠️ ناقص:` with `c.label` separated by `، ` and title `وثائق ناقصة: ...`.
       - Vacant badge renders `شاغر` with title `منزل شاغر`.
       - Complete badge renders `5/5` with title `الملف مكتمل: 5/5 وثائق إلزامية متوفرة`.
       - Incomplete badge renders `${integrity.presentCount}/5` with title `وثائق ناقصة: ...`.
  2. Registered a `languageChanged` window event listener in `area-grid.js` that checks if `areaGridPanel` is active and re-invokes `renderAreaGrid(currentAreaNode)` dynamically.
  3. Added `grid.missing_prefix`, `grid.missing_title`, `grid.complete_title`, `grid.vacant_badge`, and `grid.vacant_title` keys to `i18n.js` in both `ar` and `en` dictionaries.
  4. Dual-mirrored updates to `dist/win-x64/wwwroot/js/area-grid.js` and `dist/win-x64/wwwroot/js/i18n.js`, and regenerated precompressed `.gz` and `.br` assets.
  5. Added unit tests in `tests/web/components/tenant_file_integrity.test.js` validating English rendering, Arabic rendering, and dynamic switching on `languageChanged`.
- **Verification**:
  - `npx vitest run tests/web/components/tenant_file_integrity.test.js`: 32/32 tests passed.
  - `npx vitest run tests/web/components/area_grid_card.test.js`: 13/13 tests passed.
  - `npm test`: Full test suite executed with 51 test files and 731 tests passing.


