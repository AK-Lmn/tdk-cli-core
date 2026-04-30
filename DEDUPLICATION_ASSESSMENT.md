# TDK CLI Code Deduplication Assessment

## Executive Summary

After analyzing the TDK CLI codebase, I've identified **8 areas of significant duplication** that warrant consolidation. The codebase is well-structured overall, but several patterns are repeated across commands that could be centralized for better maintainability.

---

## Areas of Significant Duplication Found

### 1. **Error Handling Patterns** 🔴 HIGH PRIORITY
**Location:** Across all command files
**Issue:** 
- Multiple files use raw `console.error(chalk.red(...))` + `process.exit(1)` instead of `TdkError` class
- `requireProjectRoot()` exists but isn't used consistently (used in ~50% of commands)
- `runCommand()` wrapper is used in some places but not others

**Evidence:**
- 54 instances of `process.exit()` across files
- `up.ts`, `down.ts`, `networks.ts` manually check for project root instead of using `requireProjectRoot()`
- Error message formatting is inconsistent

**Risk if Consolidated:** LOW - The `TdkError` class and helpers are already tested

---

### 2. **Color/Formatting Duplication** 🟡 MEDIUM PRIORITY
**Location:** All command files
**Issue:**
- 203 instances of `chalk.*` color calls
- Success/error/heading patterns repeated everywhere
- Status colors defined in `formatting.ts` but also inline in many places

**Evidence:**
```typescript
// Repeated pattern in many files:
console.log(chalk.green('✓ ...'));
console.log(chalk.red('Error: ...'));
console.log(chalk.blue('Heading...'));
```

**Risk if Consolidated:** LOW - Cosmetic changes only

---

### 3. **File List Duplication in Template Engine** 🟢 LOW COMPLEXITY
**Location:** `generator/template-engine.ts`
**Issue:**
- File list defined in `constants.ts` as `MASTER_CONFIG_FILES` and `ALL_GENERATED_FILES`
- Same list hardcoded in `generateMasterConfigs()` (lines 273-279)
- Same list hardcoded in `verifyMasterConfigs()` (lines 301-307)

**Evidence:**
```typescript
// constants.ts
export const MASTER_CONFIG_FILES = ['tilt.config.json', 'TILT_TECH_STACK.star', ...];
export const ALL_GENERATED_FILES = [...MASTER_CONFIG_FILES, 'Tiltfile'];

// template-engine.ts - duplicated in 2 functions
const allGeneratedFiles = ["tilt.config.json", "TILT_TECH_STACK.star", ...];
```

**Risk if Consolidated:** NONE - Pure constant extraction

---

### 4. **String Sanitization Functions** 🟡 MEDIUM PRIORITY
**Location:** `services.ts` and `networks.ts`
**Issue:**
- `sanitizeResourceName()` in services.ts (line 446)
- `sanitizeServiceName()` in networks.ts (line 59)
- Both do similar character filtering but with different implementations

**Evidence:**
```typescript
// services.ts
function sanitizeResourceName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
}

// networks.ts  
function sanitizeServiceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '_').substring(0, 100);
}
```

**Risk if Consolidated:** LOW - Simple utility function

---

### 5. **Port Validation Duplication** 🟢 LOW COMPLEXITY
**Location:** `validation.ts` and `networks.ts`
**Issue:**
- `validatePort()` exists in validation.ts (lines 124-138)
- `validatePort()` also defined in networks.ts (lines 52-54) with different logic

**Evidence:**
```typescript
// validation.ts - comprehensive validation
export function validatePort(port: number, allowZero: boolean = false): { valid: boolean; error?: string }

// networks.ts - simple check
function validatePort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}
```

**Risk if Consolidated:** LOW - Well-tested validation logic

---

### 6. **Tilt Availability Checking** 🟡 MEDIUM PRIORITY
**Location:** `tilt.ts`, `up.ts`, `down.ts`, `status.ts`
**Issue:**
- `isTiltAvailable()` exists in `tilt.ts` and is used in some places
- But error handling for "tilt not found" is duplicated in `up.ts` and `down.ts`

**Evidence:**
```typescript
// up.ts lines 26-30
if (!await isTiltAvailable()) {
  console.error(chalk.red('Error: tilt CLI not found...'));
  process.exit(1);
}

// down.ts lines 19-22 - same pattern
```

**Risk if Consolidated:** LOW - Simple error factory call

---

### 7. **Project Root Discovery Error Handling** 🟡 MEDIUM PRIORITY
**Location:** `networks.ts`, `project.ts`
**Issue:**
- `requireProjectRoot()` exists in errors.ts but isn't used in all commands
- Some commands manually check and exit with duplicated error messages

**Risk if Consolidated:** LOW - Standardized error message

---

### 8. **Docker Command Execution** 🟡 MEDIUM PRIORITY
**Location:** `doctor.ts`, `networks.ts`
**Issue:**
- `execSafe()` function in networks.ts provides safe spawn wrapper
- `doctor.ts` uses `execSync` directly without wrapper
- Both handle similar command execution patterns

**Risk if Consolidated:** MEDIUM - Need to ensure same behavior

---

## Complexity Analysis

| Area | Worth Consolidating? | Abstraction Overhead |
|------|---------------------|---------------------|
| Error handling patterns | ✅ YES | Low - existing utilities |
| Color/formatting | ⚠️ PARTIAL | Medium - too abstract = hard to customize |
| File list duplication | ✅ YES | None - pure constants |
| String sanitization | ✅ YES | Low - simple utility |
| Port validation | ✅ YES | Low - clear single purpose |
| Tilt availability | ✅ YES | Low - use existing error factory |
| Project root errors | ✅ YES | Low - use existing helper |
| Docker execution | ❌ NO | High - different use cases |

---

## Risk Assessment

### What Could Break If Consolidated:

1. **HIGH RISK:** None identified
2. **MEDIUM RISK:** 
   - Docker command consolidation might change error handling behavior
   - Over-abstracting color formatting might reduce flexibility
3. **LOW RISK:**
   - All other consolidations are straightforward extractions

### Risk Mitigation:
- All changes are type-safe (TypeScript)
- Existing tests cover most affected code paths
- Changes are mechanical (moving code, not rewriting logic)

---

## Priority Ranking

### HIGH CONFIDENCE (Implement First):
1. ✅ Extract file list constants in template-engine.ts
2. ✅ Consolidate string sanitization into validation.ts
3. ✅ Remove duplicate port validation in networks.ts
4. ✅ Use requireProjectRoot() in networks.ts
5. ✅ Add tiltNotInstalled error factory usage

### MEDIUM CONFIDENCE (Implement Second):
6. ⚠️ Standardize some error handling patterns (selective)
7. ⚠️ Create common output helpers for common patterns

### LOW CONFIDENCE (Do NOT Implement):
8. ❌ Consolidate all chalk usage (would reduce flexibility)
9. ❌ Consolidate Docker execution (different needs)

---

## Implementation Plan

### Phase 1: High Confidence Changes
- Extract shared constants
- Consolidate validation utilities
- Use existing error helpers consistently

### Phase 2: Medium Confidence Changes  
- Add standardized output helpers for common patterns
- Selectively replace error handling

### Phase 3: Testing
- Run full test suite
- Verify all commands work correctly

---

## Areas NOT to Change (and Why)

1. **Chalk Usage:** Too much variety needed; abstraction would reduce flexibility
2. **Docker Command Execution:** Different commands have different needs (timeouts, parsing, etc.)
3. **Command-Specific Logic:** Each command has unique UX requirements
4. **Test Files:** Keep tests as-is to ensure no behavioral changes

---

*Assessment completed: 2025-04-30*
*Files analyzed: 31 TypeScript files*
*Duplication instances found: 54 process.exit, 203 chalk calls, 8 repeated patterns*
