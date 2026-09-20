---
status: resolved
trigger: "install gsd-core first https://github.com/open-gsd/gsd-core for antigravity and do it using the /gsd-debug framework. update tests. commit and push changes when you are done."
created: 2026-09-20
updated: 2026-09-20
---

## Current Focus
- status: resolved
- hypothesis: "Installing gsd-core for Antigravity requires configuring workspace customizations in .agents/ and global customizations in ~/.gemini/antigravity-ide via @opengsd/gsd-core. Test suite required CRLF-resilient CSS assertion in touch_and_mobile_interactions.test.js."
- next_action: "Verification complete, commit and push changes to origin/main."

## Symptoms
1. **Expected behavior**: GSD Core (open-gsd/gsd-core) installed for Antigravity with all 71 skills, hooks, and agents available; all tests passing across web test suites.
2. **Actual behavior**: GSD Core needed installation and verification for Antigravity. A pre-existing test in `touch_and_mobile_interactions.test.js` failed due to strict `\n` line ending expectations on Windows CRLF files.
3. **Error messages**: `AssertionError: expected '...' to include '#document-list-panel {\n    overflow: hidden !important;\n}'`
4. **Reproduction**: Run `npx vitest run tests/web/components/touch_and_mobile_interactions.test.js` on Windows.

## Root Cause
1. `touch_and_mobile_interactions.test.js` used an exact substring `.toContain('#document-list-panel {\n    overflow: hidden !important;\n}')` which fails on Windows when files are checked out with CRLF (`\r\n`).
2. `.agents/` was previously listed in `.gitignore`, preventing project-level Antigravity skills from being tracked and versioned in git.

## Solution & Implementation
1. **Installed GSD Core for Antigravity**:
   - Installed locally: `npx @opengsd/gsd-core --antigravity --local` (71 skills, agents, hooks, manifest into `.agents/`).
   - Installed globally: `npx @opengsd/gsd-core --antigravity --global` into `~/.gemini/antigravity-ide`.
2. **Updated Tests**:
   - Updated `tests/web/components/touch_and_mobile_interactions.test.js` to use a line-ending agnostic regex pattern:
     `expect(css).toMatch(/#document-list-panel\s*\{\s*overflow:\s*hidden\s*!important;\s*\}/);`
   - Verified that all 23 tests in `touch_and_mobile_interactions.test.js` pass.
3. **Updated .gitignore**:
   - Allowed `.agents/` to be tracked in version control while excluding transient staging artifacts (`.agents/.gsd-staging/` and `.agents/.gsd-profile`).

## Verification
- **Test Suite**: `npx vitest run tests/web/components/touch_and_mobile_interactions.test.js` passed (23/23 tests passed).
- **GSD Verification**: `npx @opengsd/gsd-core --antigravity --local` verified clean installation with 71 skills.
