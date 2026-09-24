# Phase 126: House Profile Tabs & Router Navigation Dynamic Localization - Plan

**Status:** Planned  
**Requirements:** `TAB-01`, `TAB-02`, `TAB-03`

## Execution Steps

### Step 1: Update i18n Dictionaries (`i18n.js`)
- Add `tabs.*` translation keys to Arabic (`ar`) and English (`en`) dictionaries:
  - `tabs.tenants`: `سجل المستأجرين` (AR) / `Tenants` (EN)
  - `tabs.folders`: `المجلدات` (AR) / `Folders` (EN)
  - `tabs.house_timeline`: `التسلسل الزمني للمنزل` (AR) / `House Timeline` (EN)
  - `tabs.tenant_timeline`: `التسلسل الزمني للمستأجر` (AR) / `Tenant Timeline` (EN)
  - `tabs.back_to_tenants`: `الرجوع إلى سجل المستأجرين` (AR) / `Back to Tenant Register` (EN)
  - `tabs.back_to_houses`: `منازل {area}` (AR) / `{area} Houses` (EN)

### Step 2: Implement Dynamic Nav Tab Updates in `router.js`
- Create `updateNavTabLabels(tenantName)` in `router.js`.
- Integrate `window.i18n.t` when `window.i18n` is present, falling back to legacy strings when `window.i18n` is not defined (for mock test compatibility).
- Call `updateNavTabLabels(tenantName)` inside `selectHouse()`.
- Listen for `languageChanged` event:
  ```javascript
  window.addEventListener('languageChanged', function() {
      updateNavTabLabels();
  });
  ```
- Localize `#back-to-grid-btn` and `#tab-back-to-tenants` title.
- Export `updateNavTabLabels` on `window` and `module.exports`.

### Step 3: Verify and Sync
- Run `tests/web/components/tab_labels.test.js` to ensure backward compatibility.
- Run full Vitest suite to verify zero regressions.
- Synchronize `router.js` and `i18n.js` to `dist/win-x64/wwwroot/js/`.
- Verify 0 MD5 diffs between `src/` and `dist/`.

## Verification Criteria
- [ ] `TAB-01`: House view tabs render `سجل المستأجرين` / `التسلسل الزمني للمنزل` in Arabic and `Tenants` / `House Timeline` in English.
- [ ] `TAB-02`: Tenant view tabs render `المجلدات` / `التسلسل الزمني للمستأجر` in Arabic and `Folders` / `Tenant Timeline` in English.
- [ ] `TAB-03`: Toggling language updates tabs immediately via `languageChanged` event without reloading.
- [ ] 100% Vitest pass rate maintained.
- [ ] 0 diffs between `src/` and `dist/`.
