# Dead Code Removal Assessment - TDK CLI

## Executive Summary

Analysis completed using knip v6.9.0. Found **6 unused exports** in the CLI package, all with high confidence for removal. No unused dependencies found. All flagged items are legitimate dead code.

---

## Detailed Findings

### Unused Exports (6 items)

#### 1. ALL_GENERATED_FILES
- **File**: `src/utils/constants.ts:22:14`
- **Verification**: This constant is defined but never imported anywhere.
- **Critical Finding**: A duplicate local version exists in `src/generator/template-engine.ts:213-219` which is actually used.
- **Assessment**: Safe to remove - the local copy in template-engine.ts serves the purpose.
- **Risk**: **LOW** - Truly unused, duplicate exists elsewhere.

#### 2. KEBAB_CASE_REGEX
- **File**: `src/utils/validation.ts:13:14`
- **Verification**: Only used internally within validation.ts by `isKebabCase()` function.
- **Assessment**: Should be unexported (made internal) since it's only used within the same file.
- **Risk**: **LOW** - Purely internal implementation detail.

#### 3. isKebabCase
- **File**: `src/utils/validation.ts:21:17`
- **Verification**: Used internally by `validateResourceName()`, `createKebabCaseValidator()`, and `validateStackName()` within validation.ts.
- **Not imported** by any external file.
- **Assessment**: Should be unexported (made internal) since it's only used within the same file.
- **Risk**: **LOW** - Internal utility function, not part of public API.

#### 4. validateStackName
- **File**: `src/utils/validation.ts:72:17`
- **Verification**: Never imported or used anywhere in the codebase.
- **Note**: The test file `src/commands/__tests__/error-handling.test.ts` has its own local function with the same name - it does not import this one.
- **Assessment**: Safe to remove - completely unused.
- **Risk**: **LOW** - Zero external usage.

#### 5. validateResourceType
- **File**: `src/utils/validation.ts:91:17`
- **Verification**: Never imported or used anywhere in the codebase.
- **Note**: The test file has its own local implementation.
- **Assessment**: Safe to remove - completely unused.
- **Risk**: **LOW** - Zero external usage.

#### 6. validatePort
- **File**: `src/utils/validation.ts:124:17`
- **Verification**: Never imported or used anywhere.
- **Note**: `src/commands/networks.ts` has its own local `validatePort()` function (different signature - returns boolean instead of object).
- **Note**: Test file has its own local implementation.
- **Assessment**: Safe to remove - completely unused.
- **Risk**: **LOW** - Zero external usage, different implementations exist where needed.

---

## Dependencies Analysis

All dependencies in `package.json` are actively used:

| Dependency | Usage Location | Status |
|------------|----------------|--------|
| chalk | 17 files | ✅ Used |
| commander | 18 files | ✅ Used |
| handlebars | template-engine.ts | ✅ Used |
| ink | 7 UI components | ✅ Used |
| ink-select-input | ui.tsx | ✅ Used |
| inquirer | resource.ts, project.ts, stack.ts, upgrade.ts | ✅ Used |
| ora | upgrade.ts | ✅ Used |
| react | 9 files | ✅ Used |
| @types/react | Type support | ✅ Used |
| @types/inquirer | Type support | ✅ Used |
| @types/node | Type support | ✅ Used |

**Result**: No unused dependencies to remove.

---

## False Positives

None identified. All knip findings are legitimate unused exports.

---

## Risk Assessment Matrix

| Item | Risk Level | Reason |
|------|------------|--------|
| ALL_GENERATED_FILES | LOW | Duplicate exists in template-engine.ts |
| KEBAB_CASE_REGEX | LOW | Internal only, not part of public API |
| isKebabCase | LOW | Internal only, not part of public API |
| validateStackName | LOW | Zero usage anywhere |
| validateResourceType | LOW | Zero usage anywhere |
| validatePort | LOW | Zero usage, local variants exist |

---

## Implementation Plan

### Phase 1: Remove Unused Exports (constants.ts)
1. Remove `ALL_GENERATED_FILES` export from `src/utils/constants.ts`

### Phase 2: Clean Up validation.ts
1. Remove `export` keyword from `KEBAB_CASE_REGEX` (make it a module-level constant)
2. Remove `export` keyword from `isKebabCase` (make it internal)
3. Remove `validateStackName` function entirely
4. Remove `validateResourceType` function entirely
5. Remove `validatePort` function entirely

### Phase 3: Verify
1. Run TypeScript compiler to ensure no type errors
2. Run tests to ensure nothing breaks
3. Run knip again to confirm all issues resolved

---

## Post-Removal Verification

After implementing all removals:
- Knip should report 0 unused exports
- TypeScript compilation should succeed
- All tests should pass
- No runtime behavior changes expected

