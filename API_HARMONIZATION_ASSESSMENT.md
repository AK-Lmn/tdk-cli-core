# API Harmonization Critical Assessment

## Agent #11: The API Harmonizer
## Date: 2025-01-30
## Scope: TDK CLI Internal APIs

---

## EXECUTIVE SUMMARY

The TDK CLI codebase exhibits moderate API inconsistency despite good structural organization. The inconsistencies are primarily in naming conventions, error handling patterns, and function signatures. These issues cause cognitive overhead for developers but do not affect runtime functionality.

**Overall Inconsistency Score: 6.5/10** (10 = perfectly consistent)

---

## 1. NAMING INCONSISTENCIES CATALOG

### 1.1 Function/Variable Naming Convention Drift

| Location | Current | Convention | Issue |
|----------|---------|------------|-------|
| `errors.ts:15` | `TdkError` | PascalCase | ✓ Correct (class) |
| `errors.ts:43` | `Errors` | PascalCase | ⚠️ Inconsistent (object, not class) |
| `validation.ts:13` | `KEBAB_CASE_REGEX` | UPPER_SNAKE_CASE | ✓ Correct (constant) |
| `services.ts:233` | `CACHE_TTL` | UPPER_SNAKE_CASE | ✓ Correct (constant) |
| `constants.ts:12` | `MASTER_CONFIG_FILES` | UPPER_SNAKE_CASE | ✓ Correct (constant) |
| `services.ts:227` | `MetadataCache` | PascalCase | ⚠️ Interface but not exported |
| `tilt.ts:17` | `isPortAvailable` | camelCase | ✓ Correct (function) |

**Finding:** Mixed conventions for factory objects. `Errors` (factory) uses PascalCase while typical factory objects should use camelCase (`errorFactories`).

### 1.2 Interface/Type Naming Inconsistencies

| Type | Location | Naming | Assessment |
|------|----------|--------|------------|
| `DiscoveredResource` | `types.ts:11` | PascalCase, descriptive | ✓ Excellent |
| `DiscoveredStack` | `types.ts:71` | PascalCase, descriptive | ✓ Excellent |
| `ResourceConfig` | `types.ts:40` | PascalCase, descriptive | ✓ Excellent |
| `TiltCommandResult` | `types.ts:96` | PascalCase, prefixed | ⚠️ "Result" suffix inconsistent |
| `CLIOptions` | `types.ts:88` | PascalCase, suffixed | ⚠️ "Options" suffix used inconsistently |
| `ResourceMetadata` | `types.ts:145` | PascalCase, descriptive | ✓ Excellent |
| `StackMetadata` | `types.ts:181` | PascalCase, descriptive | ✓ Excellent |
| `CheckResult` | `doctor.ts:7` | PascalCase, suffixed | ⚠️ Inconsistent with main types |
| `TabId` | `TabBar.tsx:10` | PascalCase, short | ⚠️ Abbreviation inconsistent |

**Finding:** Type suffixes are inconsistent. Some use `*Result`, some `*Options`, some `*Metadata`, and some no suffix.

### 1.3 Boolean Property Naming Inconsistencies

| Property | Location | Pattern | Issue |
|----------|----------|---------|-------|
| `hasDockerfile` | `types.ts:161` | has* prefix | ✓ Correct |
| `hasTiltfile` | `types.ts:163` | has* prefix | ✓ Correct |
| `hasDockerCompose` | `types.ts:165` | has* prefix | ✓ Correct |
| `passed` | `doctor.ts:9` | past tense verb | ⚠️ Inconsistent (should be `isPassing` or `didPass`) |
| `enabled` | `types.ts:55` | adjective | ⚠️ No prefix, inconsistent |
| `available` | `types.ts:219` | adjective | ⚠️ No prefix, inconsistent |
| `verbose` | multiple | adjective | ⚠️ No prefix, but widely used |

**Finding:** Boolean naming is fragmented. Platform standard prefers `is-*`, `has-*`, `can-*` prefixes for booleans.

---

## 2. RESPONSE SHAPE VARIATIONS

### 2.1 Validation Result Patterns

```typescript
// Pattern A: Validation result with optional error (validation.ts)
{ valid: boolean; error?: string }

// Pattern B: Result with success boolean (doctor.ts)
{ passed: boolean; message: string; fix?: string }

// Pattern C: Command result (types.ts)
{ exitCode: number; stdout: string; stderr: string }
```

**Finding:** Three different result patterns for similar concepts. Should unify to a standard `Result<T, E>` pattern.

### 2.2 Error Handling Patterns

```typescript
// Pattern A: TdkError class (errors.ts)
class TdkError extends Error {
  suggestions: string[];
  exitCode: number;
}

// Pattern B: Error factories (errors.ts)
const Errors = {
  notInProject: () => new TdkError(...)
};

// Pattern C: Inline try-catch with process.exit (doctor.ts)
try {
  execSync(...);
} catch {
  return { passed: false, ... };
}
```

**Finding:** Error handling is fragmented. `doctor.ts` uses its own pattern different from the rest of the codebase.

---

## 3. PARAMETER CONVENTION DRIFT

### 3.1 Optional Parameter Patterns

```typescript
// Pattern A: Trailing optional with default (consistent)
function findServiceJsonFiles(dir: string, maxDepth: number = 5, currentDepth: number = 0): string[]

// Pattern B: Options object pattern (good)
function runTilt(command: string, args: string[] = [], options: { verbose?: boolean; inheritStdio?: boolean } = {}): Promise<TiltCommandResult>

// Pattern C: Inline optional without defaults (needs improvement)
function getStatusColor(status: string): string  // No return type documentation
```

### 3.2 Function Signature Ordering Inconsistencies

```typescript
// services.ts - data first, options last
export function discoverResources(): DiscoveredResource[]

// tilt.ts - data first, options last (good)
export function runTilt(command: string, args: string[] = [], options: {...} = {}): Promise<TiltCommandResult>

// validation.ts - consistent ordering
export function validateResourceName(name: string): { valid: boolean; error?: string }
```

**Finding:** Parameter ordering is generally consistent (data first, options last), but options object patterns vary.

---

## 4. ERROR HANDLING FRAGMENTATION

### 4.1 Error Throwing vs Returning

| File | Pattern | Throws? | Returns Error? |
|------|---------|---------|----------------|
| `errors.ts` | TdkError class | Yes | No |
| `doctor.ts` | CheckResult | No | Yes |
| `services.ts` | throw new Error | Yes | No |
| `tilt.ts` | return { exitCode, ... } | No | Yes (via result) |

**Finding:** Mixed error handling philosophies. Some functions throw, others return error states.

### 4.2 Error Type Inconsistencies

```typescript
// Native Error
throw new Error('Could not find project root...');

// TdkError (custom)
throw new TdkError('Not in a TDK project directory', [...suggestions]);

// CheckResult (not an error)
return { passed: false, message: 'Docker is not running', fix: '...' };
```

---

## 5. EXPORT PATTERN INCONSISTENCIES

### 5.1 Export Styles

```typescript
// Named exports (preferred)
export function discoverResources(): DiscoveredResource[]

// Const exports with Command objects
export const resourceCommand = new Command('resource')...

// Class exports
export class TemplateEngine { ... }

// Type exports
export type { TabId } from './TabBar.js';

// Wildcard exports (inconsistent visibility)
export * from './types/index.js';
```

**Finding:** Mix of export styles. The wildcard exports in `index.ts` expose internal structure.

---

## 6. RECOMMENDED UNIFIED CONVENTIONS

### 6.1 Naming Standards (High Priority)

| Category | Convention | Example |
|----------|------------|---------|
| Functions | camelCase | `discoverResources()` |
| Variables | camelCase | `const resourceCount` |
| Constants | UPPER_SNAKE_CASE | `const CACHE_TTL = 5000` |
| Types/Interfaces | PascalCase, descriptive | `DiscoveredResource` |
| Classes | PascalCase | `TdkError`, `TemplateEngine` |
| Enums | PascalCase | `ResourceStatus` |
| Boolean properties | is/has/can prefix | `isEnabled`, `hasDockerfile` |
| Factory objects | camelCase | `errorFactories` |

### 6.2 Error Handling Standard (High Priority)

**Recommendation:** Use TdkError for all error conditions that should stop execution.

```typescript
// Standard error result for validation
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Standard command result
interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: TdkError | Error;
}
```

### 6.3 Function Signature Standard (Medium Priority)

```typescript
// Pattern: data parameters first, options object last
defaults: Required<Options> = {}): ReturnType
```

### 6.4 Response Shape Standard (Medium Priority)

Unify validation results to single pattern:

```typescript
interface Result<T, E = string> {
  success: boolean;
  data?: T;
  error?: E;
}
```

---

## 7. PRIORITY RANKING

### 7.1 High Confidence / High Impact (Fix First)

1. **Boolean property naming** (`passed` → `isPassing` or `didPass`)
   - Affects: `doctor.ts:9`
   - Impact: Low breaking risk, improves clarity

2. **Factory object naming** (`Errors` → `errorFactories`)
   - Affects: `errors.ts:43`
   - Impact: Internal only, no breaking change

3. **Standardize validation result types**
   - Affects: `validation.ts`, `doctor.ts`
   - Impact: Internal consistency improvement

### 7.2 High Confidence / Medium Impact

4. **Unify error handling in doctor.ts**
   - Affects: `doctor.ts` (all check functions)
   - Impact: Improves consistency with rest of codebase

5. **Standardize export patterns**
   - Affects: `index.ts`, component exports
   - Impact: Cleaner public API surface

### 7.3 Medium Confidence / Lower Impact

6. **Type suffix standardization** (`*Result`, `*Options`, `*Metadata`)
   - Affects: Multiple type definitions
   - Impact: Large refactoring effort, breaking changes

7. **Rename TabId to TabIdentifier**
   - Affects: `TabBar.tsx`
   - Impact: Low value, high churn

---

## 8. INCONSISTENCIES NOT TO FIX (And Why)

### 8.1 Public API Stability

| Item | Reason |
|------|--------|
| `TiltCommandResult` | Exported in public API, changing would break consumers |
| `CLIOptions` | Part of public types, used by external integrations |
| All command exports | Public CLI interface - must remain stable |

### 8.2 Low Value Changes

| Item | Reason |
|------|--------|
| `TabId` → `TabIdentifier` | Abbreviation is clear, high churn for little value |
| `CheckResult` type | Internal type only, changing provides minimal benefit |
| `verbose` property | Widely used convention, changing is high risk |

---

## 9. IMPLEMENTATION PLAN

### Phase 1: Internal Consistency (High Confidence)
1. Rename `passed` → `didPass` in CheckResult
2. Rename `Errors` → `errorFactories`  
3. Standardize validation result types
4. Fix doctor.ts error handling to use TdkError

### Phase 2: Export Cleanup
1. Explicit exports in `index.ts` instead of wildcards
2. Organize component exports consistently

### Phase 3: Documentation
1. Add API conventions to AGENTS.md
2. Document error handling patterns

---

## APPENDIX: Full API Surface Analysis

### Exported Functions (Public API)

From `index.ts`:
- `discoverResources()` ✓ camelCase, consistent
- `discoverStacks()` ✓ camelCase, consistent  
- `getAllStacks()` ✓ camelCase, consistent
- `getResourcesForStack()` ✓ camelCase, consistent
- `stackExists()` ✓ camelCase, consistent
- `findProjectRoot()` ✓ camelCase, consistent
- `clearMetadataCache()` ✓ camelCase, consistent
- `getResourceMetadata()` ✓ camelCase, consistent
- `discoverAutogeneratedFiles()` ✓ camelCase, consistent
- `getStackMetadata()` ✓ camelCase, consistent
- `getTiltResourceStatus()` ✓ camelCase, consistent
- `isPortAvailable()` ✓ camelCase, consistent
- `findAvailablePort()` ✓ camelCase, consistent
- `runTilt()` ✓ camelCase, consistent
- `isTiltAvailable()` ✓ camelCase, consistent
- `getTiltfilePath()` ✓ camelCase, consistent
- `buildTiltUpArgs()` ✓ camelCase, consistent
- `buildTiltDownArgs()` ✓ camelCase, consistent

All exported functions follow camelCase convention ✓

### Exported Types (Public API)

All exported types follow PascalCase convention ✓

### Type-Safety Assessment: 9/10

- All functions have explicit return types
- All public interfaces are fully typed
- No `any` types in public API
- Consistent use of optional properties with `?`
