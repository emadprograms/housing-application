---
quick_id: "261101-cvl"
slug: "organize-repository-structure-and-clean-"
date: "2026-11-01"
status: complete
---

# Quick Task Summary: Pull Remote Changes, Clean Up Root Directory, and Organize Repository

## Overview
Pulled commit `17b9be7` (`chore: configure relative areas_v11 paths, recompile win-x64 binary, and ignore .agents`) from `origin/arena/766d1ff2-housing-application` and reorganized the repository so the root directory contains only standard top-level directories (`src/`, `tests/`, `dist/`, `scripts/`, `docs/`) and build/test manifests (`HousingApplication.sln`, `package.json`, `package-lock.json`, `vitest.config.js`, `README.md`).

## Key Changes Implemented

1. **Root Clutter Removed (`git rm`)**:
   - Deleted `scratch_test.html` (193-byte unreferenced scratch file).
   - Deleted root `app.ico`, `favicon.ico`, and `logo.png` (verified SHA-256 byte-identical duplicates of `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/`).

2. **Organized `scripts/` Hierarchy (`scripts/`, `scripts/service/`, `scripts/legacy/`)**:
   - Moved `run-windows.bat`, `run-windows.ps1`, and `run-mac.sh` into `scripts/` and added `scripts/build-windows.bat` / `scripts/build-windows.ps1` for 1-click `win-x64` recompilation.
   - Updated `$RepoRoot` (`Join-Path $PSScriptRoot ".."`) in `scripts/run-windows.ps1` and `REPO_ROOT` in `scripts/run-mac.sh`, preserving 100% of `17b9be7`'s `..\areas_v11` sibling path discovery.
   - Moved `install-service.{bat,ps1}`, `restart-service.{bat,ps1}`, and `uninstall-service.{bat,ps1}` into `scripts/service/` with `$RepoRoot = Join-Path $PSScriptRoot "..\.."` and sibling `..\areas_v11` default detection.
   - Archived the 20 historical Python v5–v11 batch/migration scripts under `scripts/legacy/` and the 4 legacy config templates (`.env.example`, `config.mac.yaml`, `config.sample.yaml`, `custom_config.yaml`) under `scripts/legacy/config/` with `scripts/legacy/README.md`.

3. **Organized `docs/`, `README.md`, and `package.json`**:
   - Archived the 8 legacy Python v5.3 `.lnk` CLI docs into `docs/legacy/` and wrote current ASP.NET Core documentation (`README.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`).
   - Updated `package.json` scripts (`start:win`, `start:mac`, `start:net`, `build:win`) and repository URLs.

4. **Verification**:
   - Added `tests/web/components/repo_structure.test.js` enforcing root directory cleanliness and script `$RepoRoot` anchors.
   - All `54/54` Vitest test files (`757/757` tests) pass with `0` failures and `0` `.agents/` Git changes.

## Commits
- `8366d64`: `refactor(quick-261101-cvl): declutter root directory and organize scripts and legacy utilities`
- `67dd4e1`: `docs(quick-261101-cvl): update README, package.json scripts, and current .NET architecture/deployment docs`
- `dd428d5`: `test(quick-261101-cvl): add repository root hygiene and script organization regression tests`
