# Phase 123 Plan: Modals, Actions, Ingestion Station & System Messages Localization

**Phase:** 123  
**Goal:** Localize all dialog modals, actions, the Ingestion Station, and system toast notifications so users never encounter Arabic-only or intermixed bilingual dialogs in English mode.  
**Requirements:** TRNS-03, TRNS-04  
**Status:** In Progress  

## Execution Tasks

### Task 1: Expand Translation Dictionaries in `i18n.js`
- Add complete sets of English and Arabic translations for:
  - House settings & editing (`modal.house_settings`, `modal.house_number`, `modal.notes`, `modal.danger_zone`, `modal.delete_house_confirm`, etc.)
  - Tenant management table (`tenant.name`, `tenant.type`, `tenant.resident`, `tenant.applicant`, `tenant.start_date`, `tenant.end_date`, `tenant.actions`, etc.)
  - Ingestion Station (`ingest.title`, `ingest.single_mode`, `ingest.broadcast_mode`, `ingest.batch_mode`, `ingest.drop_prompt`, `ingest.process_batch`, `ingest.queue_file`, `ingest.queue_house`, `ingest.queue_tenant`, `ingest.queue_cat`, `ingest.queue_date`, etc.)
  - Modals & Actions: Document action menu, date change, merge, batch operations, delete confirmations, and copy/move dialogs.
  - System toasts: deletion success/error, move success/error, copy success/error, batch processing completed, etc.

### Task 2: Refactor HTML Modals in `index.html`
- Clean all remaining bilingual strings in `#export-archive-modal`, `#house-settings-modal`, `#ingest-modal`, `#change-doc-date-modal`, `#batch-delete-modal`, and `#merge-docs-modal`.
- Add `data-i18n`, `data-i18n-title`, and `data-i18n-placeholder` attributes across all modal static structures.
- Ensure directionality responds dynamically when modals are opened.

### Task 3: Refactor `tenant-manager.js`
- Localize tenant type options (`Resident` vs `مقيم`, `Applicant` vs `متقدم`).
- Localize house deletion confirmation dialogs, restriction notices, and toasts.
- Strip all intermixed bilingual strings (`•`, `/`) from tenant options and button titles.

### Task 4: Refactor `ingest-station.js`
- Localize mode tabs (`Single Document`, `Broadcast Notice`, `House Batch`).
- Localize dropzone messages, queue table columns, tenant auto-select labels, category pickers, and upload progress status.
- Localize completion toasts and validation error alerts.

### Task 5: Refactor `doc-manager.js`, `doc-viewer.js`, and `theme-manager.js`
- Clean remaining bilingual titles and labels (`doc-viewer.js` peek buttons, fullscreen, etc.).
- Localize date change modal titles, input placeholders, and save buttons.
- Localize document deletion modals and toasts.

### Task 6: Author Automated Component Tests
- Create `tests/web/components/modals_ingest_system_i18n.test.js` validating:
  - English and Arabic modes for House Settings Modal and Tenant Editor.
  - Ingest Station tab labels, queue table headers, and dropzone prompts.
  - Document Action dropdowns and confirmation modals.
  - Zero intermixed bilingual strings across all modals and toasts.

### Task 7: Parity Sync & Verification
- Synchronize all modified files to `dist/win-x64/wwwroot/`.
- Run full test suite with Vitest to guarantee zero regressions.
