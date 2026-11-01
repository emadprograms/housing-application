---
phase: quick-261101-cvl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - package.json
  - scripts/run-windows.bat
  - scripts/run-windows.ps1
  - scripts/run-mac.sh
  - scripts/build-windows.bat
  - scripts/build-windows.ps1
  - scripts/service/install-service.bat
  - scripts/service/install-service.ps1
  - scripts/service/restart-service.bat
  - scripts/service/restart-service.ps1
  - scripts/service/uninstall-service.bat
  - scripts/service/uninstall-service.ps1
  - scripts/legacy/README.md
  - scripts/legacy/config/.env.example
  - scripts/legacy/config/config.mac.yaml
  - scripts/legacy/config/config.sample.yaml
  - scripts/legacy/config/custom_config.yaml
  - docs/ARCHITECTURE.md
  - docs/DEPLOYMENT.md
autonomous: true
---

# Quick Task: 261101-cvl-organize-repository-structure-and-clean-
# Pull Remote Changes, Clean Up Cluttered Root Directory, and Organize Repository

## Objective
Pull the latest remote commit (`17b9be7`) on `arena/766d1ff2-housing-application` and reorganize the repository so the root directory contains only standard top-level folders (`src/`, `tests/`, `dist/`, `scripts/`, `docs/`) and build/test manifests (`HousingApplication.sln`, `package.json`, `package-lock.json`, `vitest.config.js`, `README.md`), while preserving 100% runtime, service, build, and test compatibility.

## Context & Key Rules
1. **Preserve Commit `17b9be7` Relative Path Logic**:
   - All relocated PowerShell and shell scripts (`scripts/run-windows.ps1`, `scripts/run-mac.sh`, `scripts/service/*.ps1`) must compute `$RepoRoot` (`..` or `..\..` from `$PSScriptRoot`) so `..\areas_v11\organizer.db`, `config.paths.json`, `src\HousingApplication.Web`, and `dist\win-x64\FileOrganizer.Web.exe` resolve identically to before.
2. **Eliminate Root Clutter Without Data Loss**:
   - Remove `scratch_test.html` (throwaway scratchpad) and root `app.ico`, `favicon.ico`, `logo.png` (verified SHA-256 byte-identical duplicates of `src/HousingApplication.Web/wwwroot/` and `dist/win-x64/wwwroot/`).
   - Group active launchers/builders in `scripts/`, Windows 24/7 Scheduled Task scripts in `scripts/service/`, and archived Python v5–v11 scripts + `.yaml`/`.env.example` configs in `scripts/legacy/`.
   - Archive outdated Python v5.3 `.lnk` docs into `docs/legacy/` and provide accurate .NET `README.md`, `docs/ARCHITECTURE.md`, and `docs/DEPLOYMENT.md`.
3. **Git Hygiene**:
   - Keep `.agents/` completely untouched in Git (`0` `.agents/` changes committed; do not `git rm --cached .agents` so local clones retain `.agents/` on pull).

## Tasks
1. **Clean Root Duplicates & Organize `scripts/` Hierarchy**:
   - Remove `scratch_test.html`, `app.ico`, `favicon.ico`, and `logo.png` from root.
   - Move `run-windows.{bat,ps1}` and `run-mac.sh` to `scripts/`, add `scripts/build-windows.{bat,ps1}`, and update `$RepoRoot` / `REPO_ROOT` paths.
   - Move `install-service.{bat,ps1}`, `restart-service.{bat,ps1}`, and `uninstall-service.{bat,ps1}` to `scripts/service/` and update `$RepoRoot` paths (including `..\areas_v11` default discovery in `install-service.ps1`).
   - Move `scripts/*.py` to `scripts/legacy/` and `.env.example`, `config.mac.yaml`, `config.sample.yaml`, `custom_config.yaml` to `scripts/legacy/config/` with `scripts/legacy/README.md`.
2. **Organize `docs/`, `README.md`, and `package.json`**:
   - Move legacy Python v5.3 docs from `docs/*.md` to `docs/legacy/`.
   - Write current .NET 8/9 `README.md`, `docs/ARCHITECTURE.md`, and `docs/DEPLOYMENT.md`.
   - Update `package.json` scripts (`start:win`, `start:mac`, `start:net`, `build:win`) and metadata.
3. **Verification**:
   - Verify root directory layout, `wwwroot` parity (`diff -rq`), `.agents` untouched, and full Vitest suite (`53/53` files passing), plus add a repository-structure & script-path verification test.
