# Phase 123: Modals, Actions, Ingestion Station & System Messages Localization - Context

**Milestone:** v18.0 Clean Language Separation & Localization (Arabic / English)  
**Phase:** 123  
**Requirements:** TRNS-03, TRNS-04  
**Status:** In Progress  

## Objectives
1. Localize all dialog modals and actions in `index.html` and supporting JS:
   - House Settings Modal (`#house-settings-modal` & `tenant-manager.js`)
   - Tenant Management Editor (`#tenant-modal` & `tenant-manager.js`)
   - Document Action Dropdown & Modals (`doc-manager.js`, `categories-view.js`)
   - Date Change Modal (`#change-doc-date-modal` & `doc-manager.js`)
   - Export Archive Modal controls (`#export-archive-modal` in `index.html`)
   - Move & Copy Modals (`#move-doc-modal`, `#copy-doc-modal`)
   - Merge Documents Modal (`#merge-docs-modal`)
   - Delete Confirmation Modals (single doc, batch delete, custom folder delete, house delete)
2. Localize Ingest Station (`ingest-station.js` & `#ingest-modal`):
   - Mode tabs: 1-to-1 Single Document, 1-to-Many Broadcast Notice, Many-to-1 House Batch
   - Dropzone instructions, file upload hints, and target pickers
   - Queue table columns: File, Target House, Tenant, Category, Document Date, Actions
   - Batch progress indicators and confirmation buttons
3. Clean and localize all system toast notifications:
   - Replace any remaining intermixed bilingual (`•` or `/`) notifications with single-language strings.
   - Ensure all toasts observe the active language via `window.i18n.t()`.
