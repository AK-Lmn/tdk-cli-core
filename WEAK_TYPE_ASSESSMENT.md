# TypeScript Weak Type Assessment Report

**Project:** TDK CLI  
**Date:** 2026-04-30  
**Assessor:** TypeScript Type Safety Specialist

---

## Executive Summary

This assessment identified **8 weak type patterns** across the TDK CLI codebase. Of these:
- **4 are high-confidence fixes** (recommended for immediate implementation)
- **4 are legitimate uses** of `unknown` with proper type guards
- **0 require manual review** (all cases are well-understood)

The codebase demonstrates **good type safety practices** overall, with proper use of `unknown` for JSON parsing and runtime validation.

---

## Weak Types Found

### 1. HIGH PRIORITY: `Function` Type in `help.ts`

**Location:** `cli/src/commands/help.ts:74`

```typescript
// CURRENT (weak)
function formatCommand(name: string, desc: string, alias: string, color: Function): string
```

**Issue:** The `Function` type accepts any function signature, providing no type safety for:
- Parameter types
- Return type
- `this` context

**Recommended Fix:**
```typescript
// STRONG (specific)
function formatCommand(
  name: string,
  desc: string,
  alias: string,
  color: (text: string) => string
): string
```

**Risk:** **LOW** - The `color` parameter is always a chalk color function (e.g., `chalk.blue`, `chalk.cyan`).

**Justification:** All call sites pass chalk color functions which have the signature `(text: string) => string`.

---

### 2. MEDIUM PRIORITY: Error Type Assertions in `services.ts`

**Locations:**
- `cli/src/utils/services.ts:63`
- `cli/src/utils/services.ts:332`
- `cli/src/utils/services.ts:359`

```typescript
// CURRENT (type assertion)
const errorCode = err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
```

**Issue:** Using `as` to assert `Error` is a `NodeJS.ErrnoException` is unsafe. The `instanceof` check only validates `Error`, not `NodeJS.ErrnoException`.

**Recommended Fix:**
```typescript
// STRONG (type guard)
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}

// Usage
const errorCode = isNodeError(err) ? err.code : undefined;
```

**Risk:** **LOW** - The `code` property is commonly available on Node.js errors.

**Justification:** A type guard provides runtime validation and compile-time safety.

---

### 3. LOW PRIORITY: Type Assertion After Type Guard in `template-engine.ts`

**Location:** `cli/src/generator/template-engine.ts:236`

```typescript
// CURRENT
const parsed: unknown = JSON.parse(jsonContent);
if (!parsed || typeof parsed !== "object") {
  throw new Error(`Invalid project.json: expected object, got ${typeof parsed}`);
}
const config = parsed as ProjectConfig;  // Type assertion after validation
```

**Issue:** While validated as an object, the `as ProjectConfig` assertion doesn't validate the required fields.

**Note:** This is already followed by field-level validation, so the risk is low. The pattern is acceptable as-is.

**Risk:** **LOW** - Field-level validation follows immediately.

**Justification:** The subsequent field checks ensure type safety at runtime. This is a legitimate use of type assertion.

---

### 4. LOW PRIORITY: Indexed Access Type Assertions in `config.ts`

**Locations:**
- `cli/src/commands/config.ts:201`
- `cli/src/commands/config.ts:226`

```typescript
// CURRENT
config.optional_infra[service as keyof typeof config.optional_infra] = true;
```

**Issue:** The `service` parameter is already validated to be a member of `OPTIONAL_INFRA_SERVICES`, so the type assertion is technically redundant.

**Recommended Fix:**
```typescript
// STRONG (use validated type)
const infraConfig = config.optional_infra;
const key = service as keyof typeof infraConfig;
infraConfig[key] = true;
```

Or better, since validation already happened, the assertion is safe and could be simplified by improving the type of `optional_infra`.

**Risk:** **VERY LOW** - Service is validated before use.

**Justification:** The validation ensures `service` is a valid key before the assertion.

---

## Legitimate Uses (No Changes Needed)

### `unknown` Type for JSON Parsing

**Locations:**
- `cli/src/utils/services.ts:92` - `const parsed: unknown = JSON.parse(content);`
- `cli/src/generator/template-engine.ts:229` - `const parsed: unknown = JSON.parse(jsonContent);`

**Status:** ✅ **CORRECT USAGE**

`JSON.parse()` returns `any` by default. Explicitly typing as `unknown` and following with type guards is the **recommended pattern**.

### `unknown` Type for Validation Functions

**Locations:**
- `cli/src/utils/services.ts:79` - `function isValidResourceConfig(value: unknown)`
- `cli/src/commands/__tests__/error-handling.test.ts:115` - `function validateManifest(manifest: unknown)`

**Status:** ✅ **CORRECT USAGE**

Type guards should accept `unknown` to validate data from external sources.

### `unknown` Type for Template Content

**Locations:**
- `cli/src/commands/resource.ts:251` - `async function processJob(job: unknown)`
- `cli/src/commands/__tests__/resource.test.ts:254` - Template string with `job: unknown`

**Status:** ✅ **CORRECT USAGE**

Worker job processors accept `unknown` because job content varies by implementation.

---

## Type Assertions Analysis

### Safe Type Assertions (Keep As-Is)

These type assertions are **safe and appropriate**:

1. **`as const` assertions** on constant arrays:
   - `cli/src/utils/constants.ts` - All `as const` assertions enable proper literal typing
   - `cli/src/generator/template-engine.ts:219` - `ALL_GENERATED_FILES` as const

2. **Narrowing after validation**:
   - `cli/src/utils/validation.ts:68` - `service as typeof OPTIONAL_INFRA_SERVICES[number]`
   - `cli/src/utils/services.ts:73` - `name as typeof SKIP_DIRECTORIES[number]`
   - `cli/src/commands/resource.ts:457` - `resourceType as keyof typeof PORT_RANGES`

3. **Safe string literal unions**:
   - `cli/src/utils/services.ts:491, 494` - Status string narrowing with array checks

### Template Engine Type Assertion

**Location:** `cli/src/generator/template-engine.ts:114`

```typescript
const starlarkHelper = Handlebars.helpers.starlark as (v: JsonValue) => Handlebars.SafeString;
```

**Status:** ⚠️ **ACCEPTABLE** - Handlebars helpers are dynamically registered, so a type assertion is necessary. The signature matches the registration.

---

## Risk Assessment Matrix

| Location | Weak Type | Risk Level | Recommended Action |
|----------|-----------|------------|-------------------|
| `help.ts:74` | `Function` | LOW | Replace with `(text: string) => string` |
| `services.ts:63` | `as NodeJS.ErrnoException` | LOW | Add type guard function |
| `services.ts:332` | `as NodeJS.ErrnoException` | LOW | Add type guard function |
| `services.ts:359` | `as NodeJS.ErrnoException` | LOW | Add type guard function |
| `template-engine.ts:236` | `as ProjectConfig` | VERY LOW | Keep (field validation follows) |
| `config.ts:201` | `as keyof typeof...` | VERY LOW | Keep (validation precedes) |
| `config.ts:226` | `as keyof typeof...` | VERY LOW | Keep (validation precedes) |

---

## Implementation Recommendations

### Immediate (High Confidence)

1. **Fix `Function` type in `help.ts`**
   - Change `color: Function` to `color: (text: string) => string`
   - No runtime impact, only compile-time improvement

2. **Add type guard for Node.js errors in `services.ts`**
   - Create `isNodeError()` function
   - Replace 3 type assertions with type guard calls
   - Improves both runtime safety and code clarity

### Optional (Low Priority)

3. **Simplify `config.ts` type assertions**
   - Use a helper variable to reduce repetition
   - Low impact but improves readability

---

## Conclusion

The TDK CLI codebase demonstrates **strong type safety practices** with appropriate use of:
- `unknown` for external data
- Type guards for validation
- `as const` for literal types
- Minimal necessary type assertions

The recommended changes are **low-risk, high-confidence** improvements that enhance type safety without changing runtime behavior.

---

**Next Steps:**
1. Implement high-confidence fixes
2. Run `tsc --noEmit` to verify no type errors
3. Run test suite to ensure no regressions
