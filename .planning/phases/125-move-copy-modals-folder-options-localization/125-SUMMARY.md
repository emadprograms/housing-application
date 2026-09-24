---
phase: 125
title: "Move & Copy Modals Folder & Options Localization"
status: completed
date: "2026-09-24"
requirements-completed:
  - MOVE-01
  - MOVE-02
  - MOVE-03
---

# Phase 125 Summary: Move & Copy Modals Folder & Options Localization

## Overview
Phase 125 localized standard folder names, optgroups, action triggers, and subtitles inside Move and Copy document modals (batch and single-document).

## Accomplishments
1. **Standard Category Folders Localization:** Standard folders inside both batch Move (`openBatchMoveModal`) and Copy (`openBatchCopyModal`) modals, as well as single document action modal (`populateFolderOptions` in `doc-manager.js`), now dynamically display localized names in the active language (`05 - Contracts & Leases` in English vs `05 - عقود` in Arabic) using `window.i18n.localizeCategory`, while keeping `opt.value` intact for seamless backend compatibility.
2. **Optgroup & Action Localization:** Standard folders optgroup (`Standard Folders` / `المجلدات القياسية`), custom folders optgroup (`Custom Folders` / `مجلدات مخصصة`), and new folder creation action (`+ Create New Folder...` / `+ إنشاء مجلد جديد...`) dynamically render in the active language.
3. **Subtitles & Toast Localization:** Subtitle copy and success toast notifications for moving and copying documents dynamically format according to the active language with document count and localized folder name interpolation.
4. **Action Modal Buttons Polish:** Submit button in `doc-manager.js` (`setDocModalMode`) localizes between `💾 Apply Changes` / `📄 Duplicate Document` in English and `💾 تطبيق التغييرات` / `📄 نسخ المستند` in Arabic.
5. **Zero Regression:** All 49 test suites (704 tests) pass 100% and static asset distribution has 0 diff.
