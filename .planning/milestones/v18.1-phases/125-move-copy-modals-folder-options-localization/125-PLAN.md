# Phase 125 Plan: Move & Copy Modals Folder & Options Localization

## Plan Overview
- **Phase:** 125
- **Goal:** Localize standard folder names, optgroups, action triggers, and subtitles inside Move and Copy document modals (batch and single-document).
- **Requirements:** `MOVE-01`, `MOVE-02`, `MOVE-03`

## Steps

### Step 1: Add Dictionary Keys to `i18n.js`
- Add keys for Move and Copy modal optgroups:
  - `folder.standard_folders`: `المجلدات القياسية` (ar) / `Standard Folders` (en)
  - `folder.custom_folders`: `مجلدات مخصصة` (ar) / `Custom Folders` (en)
  - `folder.create_new_folder`: `+ إنشاء مجلد جديد...` (ar) / `+ Create New Folder...` (en)
  - `folder.move_single_subtitle`: `نقل "{name}" إلى مجلد تصنيف محدد.` (ar) / `Move "{name}" to a target category folder.` (en)
  - `folder.move_batch_subtitle`: `نقل {count} مستندات إلى مجلد تصنيف محدد.` (ar) / `Move {count} documents to a target category folder.` (en)
  - `folder.copy_single_subtitle`: `نسخ "{name}" إلى مجلد تصنيف محدد.` (ar) / `Copy "{name}" to a target category folder.` (en)
  - `folder.copy_batch_subtitle`: `نسخ {count} مستندات إلى مجلد تصنيف محدد.` (ar) / `Copy {count} documents to a target category folder.` (en)
  - `doc_action.apply_changes`: `💾 تطبيق التعديلات` (ar) / `💾 Apply Changes` (en)
  - `doc_action.duplicate_doc`: `📄 نسخ المستند` (ar) / `📄 Duplicate Document` (en)

### Step 2: Update `categories-view.js`
- In `openBatchMoveModal`:
  - Format `stdOptGroup.label` using `window.i18n.t('folder.standard_folders')`.
  - Format `opt.textContent = window.i18n ? window.i18n.localizeCategory(formatted) : formatted;` while setting `opt.value = formatted;`.
  - Format `custGroup.label` using `window.i18n.t('folder.custom_folders')`.
  - Format `newOpt.textContent` using `window.i18n.t('folder.create_new_folder')`.
  - Format subtitle cleanly using `window.i18n.t(...)` interpolations.
- In `openBatchCopyModal`:
  - Apply the exact same localization logic.
- In `handleBatchMoveSubmit` and `handleBatchCopySubmit`:
  - Ensure success toast notifications render cleanly in the active language.

### Step 3: Update `doc-manager.js`
- In `populateFolderOptions`:
  - Localize standard folder options with `window.i18n.localizeCategory(f)` while preserving `opt.value = f`.
  - Localize new folder option with `window.i18n.t('folder.create_new_folder')`.
- In `setDocModalMode`:
  - Localize `docModalSubmitText` using `window.i18n.t('doc_action.apply_changes')` and `window.i18n.t('doc_action.duplicate_doc')`.

### Step 4: Verification & Synchronization
- Run frontend Vitest tests.
- Synchronize modified files to `dist/win-x64/wwwroot/`.
- Verify zero static asset diff.
