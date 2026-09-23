---
status: in-progress
id: 260921-d6n
slug: convert-the-transparent-ministry-logo-in
date: 2026-09-21
description: Convert the transparent ministry logo into an icon (ICO and PNG formats) and link as app/favicon
---

# Quick Plan: Convert Transparent Ministry Logo into Icon

## Objective
Convert `logo.png` (the transparent 474x474 ministry logo) into a high-quality, multi-resolution Windows `.ico` icon file and web favicons, deploy them to both `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/`, configure `index.html` to link them, set `<ApplicationIcon>` in `HousingApplication.Web.csproj`, and verify with automated tests.

## Key Deliverables
1. **Multi-Resolution `.ico` Generation**:
   - Create `favicon.ico` and `app.ico` containing 16x16, 32x32, 48x48, 64x64, 128x128, and 256x256 resolutions with 32-bit ARGB alpha transparency preserved.
   - Deploy to:
     - `src/HousingApplication.Web/wwwroot/favicon.ico`
     - `dist/win-x64/wwwroot/favicon.ico`
     - `src/HousingApplication.Web/wwwroot/pictures/favicon.ico`
     - `dist/win-x64/wwwroot/pictures/favicon.ico`
     - Root `app.ico` and `favicon.ico`
2. **Standard PNG Favicons**:
   - Generate `favicon-32x32.png`, `favicon-16x16.png`, and `apple-touch-icon.png` in `wwwroot/pictures/` and `wwwroot/`.
3. **HTML & Project Linking**:
   - Update `<head>` in `src/HousingApplication.Web/wwwroot/index.html` and `dist/win-x64/wwwroot/index.html` to declare the favicon tags.
   - Update `src/HousingApplication.Web/HousingApplication.Web.csproj` to reference `<ApplicationIcon>wwwroot\favicon.ico</ApplicationIcon>`.
4. **Verification**:
   - Automated tests in `tests/web/components/auth_manager.test.js` asserting favicon links and file presence.
   - Run Vitest test suite.
