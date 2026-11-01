import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');

describe('Repository Root Hygiene & Script Organization (Quick 261101-cvl)', () => {
  it('keeps the repository root free of loose launcher scripts, duplicate icons, legacy configs, and scratch files', () => {
    const allowedRootEntries = new Set([
      '.DS_Store',
      '.agents',
      '.git',
      '.gitattributes',
      '.gitignore',
      '.idea',
      '.planning',
      '.vscode',
      'HousingApplication.sln',
      'README.md',
      'areas',
      'areas_v11',
      'config.paths.json',
      'dist',
      'docs',
      'node_modules',
      'organizer.db',
      'package-lock.json',
      'package.json',
      'scripts',
      'src',
      'tests',
      'vitest.config.js',
    ]);

    const actualEntries = fs.readdirSync(REPO_ROOT);
    const unexpected = actualEntries.filter((entry) => !allowedRootEntries.has(entry));
    expect(unexpected).toEqual([]);
  });

  it('organizes operational scripts under scripts/ and service scripts under scripts/service/ with valid RepoRoot anchors', () => {
    const runWinPs1 = fs.readFileSync(path.join(REPO_ROOT, 'scripts/run-windows.ps1'), 'utf8');
    const buildWinPs1 = fs.readFileSync(path.join(REPO_ROOT, 'scripts/build-windows.ps1'), 'utf8');
    const runMacSh = fs.readFileSync(path.join(REPO_ROOT, 'scripts/run-mac.sh'), 'utf8');
    const installSvcPs1 = fs.readFileSync(path.join(REPO_ROOT, 'scripts/service/install-service.ps1'), 'utf8');
    const restartSvcPs1 = fs.readFileSync(path.join(REPO_ROOT, 'scripts/service/restart-service.ps1'), 'utf8');

    expect(runWinPs1).toContain('Join-Path $PSScriptRoot ".."');
    expect(runWinPs1).toContain('$RepoRoot\\..\\areas_v11\\organizer.db');
    expect(buildWinPs1).toContain('Join-Path $PSScriptRoot ".."');
    expect(runMacSh).toContain('REPO_ROOT=');
    expect(installSvcPs1).toContain('Join-Path $PSScriptRoot "..\\.."');
    expect(restartSvcPs1).toContain('Join-Path $PSScriptRoot "..\\.."');

    expect(fs.existsSync(path.join(REPO_ROOT, 'scripts/run-windows.bat'))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, 'scripts/build-windows.bat'))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, 'scripts/service/install-service.bat'))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, 'scripts/service/restart-service.bat'))).toBe(true);
    expect(fs.existsSync(path.join(REPO_ROOT, 'scripts/service/uninstall-service.bat'))).toBe(true);
  });

  it('keeps package.json script paths aligned with scripts/ directory', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['start:win']).toContain('./scripts/run-windows.ps1');
    expect(pkg.scripts['start:mac']).toBe('./scripts/run-mac.sh');
    expect(pkg.scripts['build:win']).toContain('./scripts/build-windows.ps1');
  });
});
