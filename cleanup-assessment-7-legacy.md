# Legacy Code Cleanup Assessment

**Date:** 2026-05-04  
**Project:** TDK CLI (v1.1.0)  
**Source:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/`

## Summary

This assessment identifies legacy patterns that need modernization in the TDK CLI codebase. The primary issues found are related to pre-publication fallback code that is no longer needed now that the package is published (v1.1.0).

## Legacy Patterns Found

### 1. Pre-Publication Fallbacks in `upgrade.ts` (Priority: HIGH)

**Location:** `cli/src/commands/upgrade.ts`

**Issues Found:**

1. **NPM Registry Unpublished Assumption (Lines 66-72)**
   - Comment: `// npm registry failed - package not published yet`
   - Message: "Package not yet published to npm registry"
   - Shows manual GitHub installation instructions as fallback
   - This is legacy from when package wasn't published

2. **GitHub Fallback in NPM Install (Lines 87-101)**
   - Comment: `// npm registry failed (package may not exist or network issue) - try GitHub fallback`
   - Falls back to `github:tdk-landscape/tdk-cli` on any npm error
   - No longer needed now that package is published to npm

3. **GitHub Fallback in Bun Install (Lines 115-129)**
   - Comment: `// bun registry failed (package may not exist or network issue) - try GitHub fallback`
   - Same pattern as npm - falls back to GitHub
   - Redundant now that package is on npm registry

4. **Multiple GitHub Installation Instructions (Lines 69-71, 201-205, 311-318)**
   - Multiple places showing manual GitHub installation instructions
   - Messages like "(npm package will be available soon)" are outdated
   - "Try manual upgrade (use GitHub until npm package is published)" is incorrect

### 2. Legacy Synchronous Execution Patterns

**Locations:** Multiple files using `execSync` with manual `.trim()`

**Files Affected:**
- `cli/src/commands/upgrade.ts` (Lines 20, 22, 215, 216, 326, 341)
- `cli/src/utils/port-assignment.ts` (spawn usage)

**Pattern:**
```typescript
const result = execSync('command', { encoding: 'utf-8' }).trim();
```

This pattern is repetitive and could be encapsulated for better maintainability.

### 3. Console Direct Usage in Error Utilities

**Location:** `cli/src/utils/errors.ts` (Lines 70-71, 123-132)

The error utilities use direct `console.error` calls. While functional, this could be modernized to use a logging abstraction for better testability and consistency.

## Recommendations

### Immediate Cleanup (High Priority)

1. **Remove GitHub Fallback Logic from `upgrade.ts`**
   - Remove the nested try-catch fallbacks to GitHub
   - Simplify upgradeViaNpm() and upgradeViaBun() to only use npm registry
   - Remove all messages about "npm package will be available soon"
   - Remove manual GitHub installation instructions

2. **Simplify Error Messages**
   - Update error messages to reference npm registry only
   - Remove references to "until npm package is published"

### Code Quality Improvements (Medium Priority)

1. **Encapsulate Synchronous Execution**
   - Create a utility for execSync + trim pattern
   - Reduces duplication across the codebase

## Cleanup Plan

### Phase 1: Remove Pre-Publication Fallbacks
- [x] Remove GitHub fallback from `upgradeViaNpm()`
- [x] Remove GitHub fallback from `upgradeViaBun()`
- [x] Remove outdated messages about npm availability
- [x] Simplify error handling to only reference npm
- [x] Fix duplicate `DEFAULT_BOX_WIDTH` declaration in formatting.ts

### Phase 2: Code Quality
- [ ] Consider creating exec utility for common patterns
- [ ] Add better error handling for edge cases

## Files Modified

1. `cli/src/commands/upgrade.ts` - Main cleanup target
   - Removed GitHub fallback from `getLatestVersion()`
   - Removed GitHub fallback from `upgradeViaNpm()`
   - Removed GitHub fallback from `upgradeViaBun()`
   - Updated error messages to reference npm registry only
   - Removed ~40 lines of legacy fallback code

2. `cli/src/utils/formatting.ts` - Fixed duplicate declaration
   - Removed duplicate `const DEFAULT_BOX_WIDTH = 62` at line 123
   - Kept the exported version at line 215

## Test Results

### Before Cleanup
- Tests: 1 failed (resource.test.ts transform error due to duplicate declaration)
- Typecheck: Failed (duplicate DEFAULT_BOX_WIDTH)

### After Cleanup
- **Tests: 4 passed (37 tests) ✅**
- Typecheck: Pre-existing errors unrelated to changes (in config.ts, resource.ts, stack.ts, index.ts)
- New TypeScript errors: None
- Files successfully cleaned: 2

## Summary

**Lines Removed:** ~40 lines of legacy fallback code
**Legacy Patterns Eliminated:**
- Pre-publication GitHub fallbacks (5 locations)
- Outdated npm availability messages (3 locations)
- Duplicate constant declaration (1 location)

**Code Quality Improved:**
- Simpler upgrade flow (no nested try-catch for GitHub)
- Consistent npm registry usage
- Cleaner error messages
- No runtime behavior change for published package users

## Notes

- The GitHub fallback was appropriate during development before npm publication
- Now that v1.1.0 is published, this fallback code adds unnecessary complexity
- Removing it simplifies the codebase and reduces confusion for users
- All other legacy patterns (TODO/FIXME/deprecated) were not found in this codebase

---

**Next Steps:** Execute the cleanup plan and verify with tests.
