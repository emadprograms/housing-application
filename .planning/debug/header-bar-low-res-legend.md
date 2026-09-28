---
status: resolved
trigger: "fix the header bar. the header bar doesn't compress properly for low resolution screens. the legened takes too much space."
created: 2026-09-28T09:31:00.000Z
updated: 2026-09-28T09:48:00.000Z
---

# Debug Session: header-bar-low-res-legend

## Symptoms
- **Expected behavior**: On lower resolution screens (tablets, small laptops 1024px-1366px, or resized windows), the header bar should compress gracefully without layout breakage or clipping. The tenure legend should be compact (compact dots/pills or shortened text) rather than taking up excessive horizontal space, and header items (search bar, titles, action buttons) should scale and compress smoothly.
- **Actual behavior**: The header bar doesn't compress properly on lower resolution screens. The tenure legend takes up too much horizontal space, causing elements in the header bar to collide, overflow, or distort the layout.
- **Error messages**: None (layout/CSS responsive compression issue).
- **Timeline**: Observed on lower resolution screens (1024px to 1366px or display scaling) and narrow viewports.
- **Reproduction**: View dashboard in area overview mode (where tenure legend is displayed) at lower resolutions (~1024px-1366px) or reduce window width; observe the header bar elements colliding/overflowing.

## Current Focus
- hypothesis: Resolved.
- test: Vitest full test suite (51 test files, 728 tests passing).
- expecting: All tests pass and header bar compresses responsively across all breakpoints.
- next_action: debug complete

## Evidence
- timestamp: 2026-09-28T09:31:00.000Z
  - evidence: User reported that the header bar doesn't compress properly for low resolution screens and the legend takes too much space. Prefers compacting the legend (compact dots/pills or shortened text) and graceful shrinking of header elements.
- timestamp: 2026-09-28T09:39:00.000Z
  - evidence: Inspected index.html and styles.css.
    1. `#top-navbar` right-side wrapper had `class="flex items-center gap-3.5 flex-shrink-0"`. Because of `flex-shrink-0`, the entire right half of the header refused to compress when available width shrunk.
    2. `#btn-search-trigger` had `class="w-60 sm:w-64 flex-shrink-0"`. Above 1024px, it stayed fixed at 256px wide. Only 768px-1024px had a max-width override, leaving 1024px-1366px completely unaddressed.
    3. `#grid-tenure-legend` had `flex-shrink-0` with 4 wide textual spans separated by pipe characters `|`, totaling ~260px wide with no compression rules.
    4. `#user-profile-btn` contained full user name and admin role badges without responsive hiding on compact viewports.
    5. At 1024px-1366px screen resolutions, with sidebar taking 288px (or more when resized), total navbar content exceeded available width by 200px-400px, causing the title to truncate to near-zero or navbar to overflow.

## Resolution
- **Root Cause**:
  1. Header actions wrapper had `flex-shrink-0` and static `gap-3.5` spacing, preventing the right side of the navbar from shrinking.
  2. Search trigger button was constrained to `w-60 sm:w-64` (240px-256px) and `flex-shrink-0` on screens >= 1025px, with no responsive scaling rules for 1024px-1366px.
  3. Tenure duration legend `#grid-tenure-legend` was rendered as a static ~260px container with full verbose labels and pipe dividers without adaptive compact variants or tooltips.
  4. User profile button displayed redundant full name and role text on compact viewports, consuming ~130px.
- **Fix Applied**:
  1. Updated `src/HousingApplication.Web/wwwroot/index.html`:
     - Added `#top-navbar-actions` container with responsive gaps (`gap-2 sm:gap-2.5 lg:gap-3.5 min-w-0`) and removed rigid `flex-shrink-0`.
     - Structured `#grid-tenure-legend` items with `.legend-text-full` (`< 5y`, `5–10y`, `> 10y`, `Vacant`) and `.legend-text-short` (`<5y`, `5–10y`, `>10y`, `Vac`) with tooltip `title` attributes on each item and the container.
     - Added `id="user-profile-details"` to profile text container to allow responsive concealment.
     - Made `#btn-search-trigger` responsive (`w-48 sm:w-56 md:w-60 lg:w-64 min-w-[110px] flex-shrink`).
  2. Updated `src/HousingApplication.Web/wwwroot/css/styles.css`:
     - Added base min-width and flex-shrink rules for `#top-navbar`, `#top-navbar-actions`, `#current-house-title`, and `#btn-search-trigger`.
     - Added `@media (max-width: 1366px)`: compact navbar padding, search trigger max-width 180px, compact legend padding/gap, hidden pipe dividers, and switched legend labels to `.legend-text-short`.
     - Added `@media (max-width: 1200px)`: hides `#user-profile-details` and scales search trigger max-width to 155px.
     - Added `@media (max-width: 1120px)`: transforms `#grid-tenure-legend` into a rounded 4-color dots pill (`border-radius: 9999px !important;` with hidden label text and active hover tooltips) and hides search `kbd` badge.
  3. Mirrored changes to `dist/win-x64/wwwroot/index.html`, `dist/win-x64/wwwroot/css/styles.css`, and updated precompressed `.gz` and `.br` assets.
  4. Created comprehensive test suite `tests/web/components/header_bar_low_res_compression.test.js` covering HTML structure, CSS media queries, and dynamic route transitions.
- **Verification**:
  - `npx vitest run tests/web/components/header_bar_low_res_compression.test.js` passed (11/11 tests).
  - `npx vitest run tests/web/components/unified_header.test.js tests/web/components/dark_mode_and_tablet.test.js tests/web/components/grid_view_options.test.js` passed (46/46 tests).
  - Full test suite `npm test` passed: 51 test files, 728 tests passing.

