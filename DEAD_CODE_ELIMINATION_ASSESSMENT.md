# Dead Code Elimination Assessment - TDK CLI

**Date:** 2026-04-30  
**Analyst:** Dead Code Elimination Specialist  
**Scope:** cli/ directory (TypeScript source files)

---

## Executive Summary

Fresh analysis using **knip v6.9.0** and manual code review identified **9 dead code items** requiring attention:
- 5 unused type exports (knip findings)
- 1 unused function (manual discovery)
- 3 undefined function references (TypeScript errors)

**Risk Profile:** All findings are **LOW RISK** - safe to remove without functional impact.

---

## Knip Findings (5 items)

### 1. TooltipProps (Unused Type Re-export)
- **File:** `src/components/index.ts:13`
- **Issue:** Type is re-exported but never imported from this module
- **Usage Pattern:** Internal components import directly from `../types/index.js`
- **Assessment:** Safe to remove - no external consumers
- **Risk:** LOW

### 2. ProjectConfig (Unused Type Re-export)
- **File:** `src/generator/template-engine.ts:20`
- **Issue:** Type is re-exported but consumers import from `types/index.ts` directly
- **Usage Pattern:** Used internally within file; external files use direct import
- **Assessment:** Safe to remove re-export
- **Risk:** LOW

### 3. JsonValue (Unused Type Re-export)
- **File:** `src/generator/template-engine.ts:20`
- **Issue:** Same pattern as ProjectConfig
- **Assessment:** Safe to remove re-export
- **Risk:** LOW

### 4. JsonArray (Unused Type Definition)
- **File:** `src/types/index.ts:112`
- **Issue:** Only used internally to define JsonValue, never imported externally
- **Assessment:** Remove export keyword, keep internal usage
- **Risk:** LOW

### 5. JsonObject (Unused Type Definition)
- **File:** `src/types/index.ts:117`
- **Issue:** Same pattern as JsonArray
- **Assessment:** Remove export keyword, keep internal usage
- **Risk:** LOW

---

## Manual Findings (4 items)

### 6. withErrorHandling (Unused Function)
- **File:** `src/utils/errors.ts:199-232`
- **Issue:** Function defined but never called anywhere
- **Evidence:**
  - grep shows only definition, no invocations
  - `runCommand()` function uses `handleCommandError()` instead
- **Assessment:** Safe to remove - completely dead code
- **Risk:** LOW

### 7. checkBun (Undefined Function Reference)
- **File:** `src/commands/doctor.ts:103`
- **Issue:** Referenced in checks array but function doesn't exist
- **TypeScript Error:** `Cannot find name 'checkBun'`
- **Assessment:** Remove from checks array
- **Risk:** LOW - Fixes broken code

### 8. checkPorts (Undefined Function Reference)
- **File:** `src/commands/doctor.ts:105`
- **Issue:** Referenced but function doesn't exist
- **TypeScript Error:** `Cannot find name 'checkPorts'`
- **Assessment:** Remove from checks array
- **Risk:** LOW - Fixes broken code

### 9. checkTiltfile (Undefined Function Reference)
- **File:** `src/commands/doctor.ts:106`
- **Issue:** Referenced but function doesn't exist (typo - should be `checkTilt`?)
- **TypeScript Error:** `Cannot find name 'checkTiltfile'`
- **Assessment:** Remove from checks array
- **Risk:** LOW - Fixes broken code

---

## Dependencies Analysis

All package.json dependencies verified as actively used:
- Runtime dependencies: All referenced in source code
- Dev dependencies: knip, typescript, vitest all used

**Result:** No unused dependencies to remove.

---

## Implementation Plan

### High Confidence (Immediate Removal)
1. Remove `TooltipProps` re-export from `components/index.ts`
2. Remove `ProjectConfig` and `JsonValue` re-exports from `template-engine.ts`
3. Make `JsonArray` and `JsonObject` internal types (remove `export` keyword)
4. Remove unused `withErrorHandling` function from `errors.ts`
5. Remove undefined function references from doctor.ts checks array

### Verification Steps
1. Run knip after changes → should report 0 unused exports
2. Run TypeScript typecheck → should pass without errors
3. Run test suite → all tests should pass

---

## Risk Summary

| Item | Risk Level | Mitigation |
|------|------------|------------|
| TooltipProps removal | LOW | No external imports found |
| ProjectConfig removal | LOW | Internal re-export only |
| JsonValue removal | LOW | Internal re-export only |
| JsonArray unexport | LOW | Used only internally |
| JsonObject unexport | LOW | Used only internally |
| withErrorHandling removal | LOW | Never called |
| checkBun removal | LOW | Fixes broken reference |
| checkPorts removal | LOW | Fixes broken reference |
| checkTiltfile removal | LOW | Fixes broken reference |

---

## Files to Modify

1. `cli/src/components/index.ts` - Remove TooltipProps export
2. `cli/src/generator/template-engine.ts` - Remove type re-exports
3. `cli/src/types/index.ts` - Unexport JsonArray/JsonObject
4. `cli/src/utils/errors.ts` - Remove withErrorHandling function
5. `cli/src/commands/doctor.ts` - Remove undefined function references

**Total Lines to Remove:** ~45 lines
**Expected Impact:** Cleaner codebase, fixed TypeScript errors
