# Phase 126: House Profile Tabs & Router Navigation Dynamic Localization - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning
**Mode:** Autonomous (user discretion granted for UI consistency and localization edge cases)

<domain>
## Phase Boundary

Address navigation tab dynamic localization in house and tenant drill-down views (`#tab-categories-label`, `#tab-timeline-label`, `#tab-back-to-tenants`), header breadcrumb/back-button localization, and dynamic re-rendering on language switch via `languageChanged` event subscription.

### Requirements Covered
- **TAB-01**: In house view, the first segmented tab dynamically displays pure localized text (`Tenants` / `سجل المستأجرين`) and the adjacent timeline tab displays pure localized text (`House Timeline` / `التسلسل الزمني للمنزل`), eliminating side-by-side language intermixing.
- **TAB-02**: In tenant drill-down view, the segmented tabs dynamically display pure localized text (`Folders` / `المجلدات` and `Tenant Timeline` / `التسلسل الزمني للمستأجر`).
- **TAB-03**: Router navigation subscribes to the `languageChanged` event so tab titles, tooltips, and header breadcrumbs immediately re-render in the active language when toggled while viewing a house or tenant without requiring a page reload.

</domain>

<decisions>
## Implementation Decisions

### 1. Unified Dynamic Label Formatter (`updateNavTabLabels`)
- Extract tab labeling logic in `router.js` into a dedicated function `updateNavTabLabels(tenantName)`.
- Inspect whether `window.i18n` is active:
  - When `window.i18n` is defined:
    - Active Language `ar`:
      - House mode (no tenant): Tab 1 = `سجل المستأجرين`, Tab 2 = `التسلسل الزمني للمنزل`.
      - Tenant mode (has tenant): Tab 1 = `المجلدات`, Tab 2 = `التسلسل الزمني للمستأجر`.
    - Active Language `en`:
      - House mode (no tenant): Tab 1 = `Tenants`, Tab 2 = `House Timeline`.
      - Tenant mode (has tenant): Tab 1 = `Folders`, Tab 2 = `Tenant Timeline`.
  - When `window.i18n` is undefined (mocked test environments without i18n script):
    - Fallback retains legacy behavior (`tenantName ? 'Folders' : 'سجل المستأجرين'` and `tenantName ? 'Tenant Timeline' : 'House Timeline'`) ensuring 100% backward compatibility for existing unmocked Vitest suites.

### 2. Event Subscription & Lifecycle
- In `router.js`, register `window.addEventListener('languageChanged', () => updateNavTabLabels());`.
- In `selectHouse()`, invoke `updateNavTabLabels(tenantName)`.
- Update `#tab-back-to-tenants` title tooltip (`الرجوع إلى سجل المستأجرين` vs `Back to Tenant Register`).
- Update `#back-to-grid-btn` label (`منازل ${area}` vs `${area} Houses`).
- Expose `window.updateNavTabLabels` for automated testing.

### 3. Translation Dictionary Additions (`i18n.js`)
- Add dictionary keys under `tabs.*` in both Arabic and English dictionaries:
  - `tabs.tenants`: `'سجل المستأجرين'` / `'Tenants'`
  - `tabs.folders`: `'المجلدات'` / `'Folders'`
  - `tabs.house_timeline`: `'التسلسل الزمني للمنزل'` / `'House Timeline'`
  - `tabs.tenant_timeline`: `'التسلسل الزمني للمستأجر'` / `'Tenant Timeline'`
  - `tabs.back_to_tenants`: `'الرجوع إلى سجل المستأجرين'` / `'Back to Tenant Register'`
  - `tabs.back_to_houses`: `'منازل {area}'` / `'{area} Houses'`

</decisions>

<code_context>
## Existing Code Insights

- `src/HousingApplication.Web/wwwroot/js/router.js`:
  - Lines 232-250 currently hardcode `catText = tenantName ? 'Folders' : 'سجل المستأجرين'` and `timelineText = tenantName ? 'Tenant Timeline' : 'House Timeline'`.
  - Lines 296-304 hardcode `backToGridBtn.innerHTML = ... <span>${gridLabel}</span>` with `${areaId} Houses`.
- `tests/web/components/tab_labels.test.js`:
  - Exercises `router.js` in a JSDOM environment where `window.i18n` is not loaded.
  - Expects `سجل المستأجرين` and `House Timeline` in default unconfigured mode.
- `src/HousingApplication.Web/wwwroot/index.html`:
  - Contains `#tab-categories-label`, `#tab-timeline-label`, `#tab-back-to-tenants`, `#back-to-grid-btn`.

</code_context>

<specifics>
## Specific Ideas

1. Ensure zero visual flicker when toggling language while on house or tenant view.
2. Synchronize changes to `dist/win-x64/wwwroot/` with 0 MD5 diffs.
3. Keep all 704+ Vitest tests passing.

</specifics>

<deferred>
## Deferred Ideas
None for this phase.
</deferred>
