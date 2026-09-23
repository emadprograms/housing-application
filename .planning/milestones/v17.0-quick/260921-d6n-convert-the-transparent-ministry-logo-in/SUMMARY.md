---
status: complete
id: 260921-d6n
slug: convert-the-transparent-ministry-logo-in
date: 2026-09-21
description: Convert the transparent ministry logo into an icon (ICO and PNG formats) and link as app/favicon
---

# Quick Task Summary: Convert Transparent Ministry Logo into Icon

## Executed Work
- **Multi-Resolution Windows `.ico` Creation**:
  - Resampled the 474x474 32-bit ARGB `logo.png` into 6 standard resolutions: 16x16, 32x32, 48x48, 64x64, 128x128, and 256x256.
  - Packed all 6 frames into a binary `.ico` file preserving full 32-bit alpha transparency.
  - Deployed `favicon.ico` and `app.ico` to:
    - Root `favicon.ico` and `app.ico`
    - `src/HousingApplication.Web/wwwroot/favicon.ico`
    - `dist/win-x64/wwwroot/favicon.ico`
    - `src/HousingApplication.Web/wwwroot/pictures/favicon.ico`
    - `dist/win-x64/wwwroot/pictures/favicon.ico`
- **Standalone Web PNG Icons**:
  - Deployed `favicon.png`, `apple-touch-icon.png`, and size-specific PNGs (`pictures/favicon-32x32.png`, `pictures/favicon-16x16.png`) across both `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/`.
- **HTML & C# Project Configuration**:
  - Linked the favicon tags in `<head>` of `index.html` across both `src/` and `dist/win-x64/`:
    - `<link rel="icon" type="image/x-icon" href="favicon.ico">`
    - `<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">`
    - `<link rel="icon" type="image/png" sizes="32x32" href="pictures/favicon-32x32.png">`
    - `<link rel="icon" type="image/png" sizes="16x16" href="pictures/favicon-16x16.png">`
    - `<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">`
  - Added `<ApplicationIcon>wwwroot\favicon.ico</ApplicationIcon>` to `src/HousingApplication.Web/HousingApplication.Web.csproj`.
- **Automated Verification**:
  - Added automated test in `tests/web/components/auth_manager.test.js` validating:
    - HTML link tags in `index.html`.
    - Physical presence of `favicon.ico`.
    - Binary header validation (magic bytes `0x00, 0x00, 0x01, 0x00`).
    - Multi-resolution count verification (6 embedded image entries).
  - All 20 Vitest tests passed.
