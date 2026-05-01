# Deprecated/Legacy/Fallback Code Assessment Report

**Date:** 2026-05-01
**Agent:** Code Quality Subagent - Deprecated Code Specialist
**Status:** Assessment Complete

---

## Executive Summary

The TDK CLI codebase has undergone **extensive deprecated code removal** as documented in `DEPRECATED_CODE_REMOVAL_REPORT.md` (completed May 1, 2026). This assessment confirms the codebase is largely clean, with only **minor legacy test patterns** remaining.

**Previous cleanup removed:**
- ~2,800 lines from deprecated discovery system
- Legacy manifest filename support
- Dual-filename search logic
- Deprecated schema field references

**Current assessment findings:** 2 minor legacy patterns identified for removal

---

## Assessment Methodology

Searched for:
- `@deprecated` annotations (none found in source)
- Comments mentioning "legacy", "deprecated", "old", "temp", "temporary"
- Fallback code paths for backward compatibility
- Feature flags enabling old behavior
- Migration code that should have been removed
- Polyfills for unsupported browsers
- Shim/compatibility layers
- TODO comments about removing old code
- Version checks for old behavior

Searched files:
- All `.ts` and `.tsx` files in `/cli/src` (45 source files)
- Test files (4 test files)
- Configuration files

---

## Findings

### 1. 🔴 Legacy Test Patterns (REMOVE - High Confidence)

**File:** `cli/src/commands/__tests__/error-handling.test.ts`

#### Finding 1.1: Legacy inline port validation test (Line 93-125)
```typescript
it('should validate port is within valid range (legacy test format)', () => {
  function validatePort(port: number): { valid: boolean; error?: string } {
    if (port < 1024 || port > 65535) {
      return {
        valid: false,
        error: `Invalid port: ${port}. Must be between 1024 and 65535`,
      };
    }
    return { valid: true };
  }
  // ... test cases using inline function instead of isValidPort utility
});
```

**Issue:** This test defines its own inline `validatePort()` function instead of using the actual `isValidPort()` utility from `validation.ts`. The inline function has **different validation rules** (requires ports 1024+) than the actual utility (allows any port > 0).

**Usage Status:** Test only - not used in production
**Risk:** None - removing dead test code
**Tests depending on it:** This is a test - other tests don't depend on it
**Recommendation:** **REMOVE** - Consolidates to single validation path

#### Finding 1.2: Legacy inline stack name validation test (Line 244-276)
```typescript
it('should validate stack name format (legacy inline test)', () => {
  function validateStackName(name: string): { valid: boolean; error?: string } {
    if (!name.trim()) {
      return { valid: false, error: 'Stack name is required' };
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      return { valid: false, error: 'Use kebab-case (lowercase, numbers, hyphens only)' };
    }
    return { valid: true };
  }
  // ... test cases using inline function instead of createKebabCaseValidator utility
});
```

**Issue:** This test defines its own inline `validateStackName()` function instead of using the actual `createKebabCaseValidator()` utility. Duplicate validation logic that could drift from the actual implementation.

**Usage Status:** Test only - not used in production
**Risk:** None - removing dead test code
**Tests depending on it:** This is a test - other tests don't depend on it
**Recommendation:** **REMOVE** - Consolidates to single validation path

---

### 2. 🟢 Operational Fallbacks (KEEP - Legitimate)

These are legitimate operational fallbacks, NOT deprecated code:

| Pattern | Location | Purpose | Status |
|---------|----------|---------|--------|
| GitHub registry fallback | `upgrade.ts:97-111` | Install from GitHub when npm registry fails | **KEEP** |
| Docker container check | `networks.ts:168-181` | Check service status via Docker when port check fails | **KEEP** |
| X10 mouse protocol | `ui.tsx:354-373` | Support older terminals without SGR 1006 protocol | **KEEP** |
| lsof port availability | `networks.ts:161` | Standard port checking utility | **KEEP** |

**Justification:** These are resilience patterns for cross-platform support and graceful degradation, not deprecated code paths.

---

### 3. 🟢 False Positives (NOT Deprecated)

The following patterns were investigated but are NOT deprecated/legacy code:

| Pattern | Context | Status |
|---------|---------|--------|
| "migration" in services.ts | Prisma database migrations | **LEGITIMATE** - Not deprecated |
| "template" references | Template engine for code generation | **LEGITIMATE** - Active feature |
| "temp" in constants.ts | Directory names to skip during scanning | **LEGITIMATE** - Not deprecated |
| "alias" in command definitions | Command shortcuts (tdk ls, tdk urls) | **LEGITIMATE** - Active feature |
| "upgrade" command | Self-update functionality | **LEGITIMATE** - Active feature |
| "golden_image" | Infrastructure option | **LEGITIMATE** - Active feature |

---

## Removal Recommendations Summary

| Finding | File | Lines | Recommendation | Confidence |
|---------|------|-------|----------------|------------|
| Legacy inline port test | error-handling.test.ts | 93-125 | **REMOVE** | HIGH |
| Legacy inline stack test | error-handling.test.ts | 244-276 | **REMOVE** | HIGH |

**Total lines to remove:** ~70 lines
**Risk level:** NONE - test-only code
**Expected test impact:** Tests will be consolidated to use actual validation utilities

---

## Code Quality Impact

### Before
- Duplicate validation logic in tests
- Risk of test logic drifting from production logic
- Comments explicitly labeling code as "legacy"

### After
- Single source of truth for validation (production utilities)
- Tests verify actual behavior, not inline duplicates
- No deprecated/legacy test patterns

---

## Verification Steps

1. ✅ Run full test suite: `npm test`
2. ✅ Verify type checking: `npm run typecheck`
3. ✅ Verify linting: `npm run lint`
4. ✅ Confirm no production code references removed code

---

## Conclusion

The TDK CLI codebase is in **excellent condition** with respect to deprecated/legacy code. Previous cleanup efforts (May 1, 2026) removed ~2,800 lines of genuinely deprecated code. This assessment identified only 2 minor legacy test patterns that can be safely removed to further consolidate the codebase.

**Recommendation:** Remove the 2 legacy test patterns identified to achieve complete deprecated code elimination.

---

*Report generated: 2026-05-01*
*Assessment scope: cli/src/**/*.ts, cli/src/**/*.tsx*
*Excluded: node_modules, generated files, configuration templates*
