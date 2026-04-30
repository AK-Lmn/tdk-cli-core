# Critical Assessment 7: Deprecated & Legacy Code Analysis

**Date:** 2026-05-01  
**Scope:** TDK CLI (`cli/src/` directory)  
**Objective:** Identify deprecated, legacy, and fallback code for potential removal

---

## Executive Summary

The TDK CLI codebase is **remarkably clean** with minimal deprecated or legacy code. After comprehensive analysis, the codebase shows:

- **0 @deprecated annotations** found
- **0 TODO/FIXME markers** requiring code removal
- **0 version-based feature flags**
- **0 polyfills or shims**
- **Legitimate fallback patterns** that serve operational purposes
- **2 test descriptions** labeled "legacy" that are actually alternative test approaches, not deprecated code

---

## Detailed Findings

### 1. Legacy Test Descriptions (FALSE POSITIVES)

**Location:** `cli/src/commands/__tests__/error-handling.test.ts`

**Lines 93 and 244:**
```typescript
it('should validate port is within valid range (legacy test format)', () => { ... });
it('should validate stack name format (legacy inline test)', () => { ... });
```

**Analysis:** These tests use the word "legacy" in their descriptions but are NOT deprecated code. They test alternative validation approaches:
- Line 93: Tests an inline `validatePort()` function with 1024-65535 range validation
- Line 244: Tests an inline `validateStackName()` function

**These are legitimate test patterns** demonstrating different validation approaches. The tests are active and provide value by showing alternative implementation styles.

**Recommendation:** NO ACTION REQUIRED. The "legacy" label in test names refers to testing style, not deprecated code.

---

### 2. Operational Fallback Patterns (LEGITIMATE - DO NOT REMOVE)

#### 2.1 Netstat Fallback in networks.ts
**Location:** Lines 180-191

```typescript
// lsof failed - try netstat as fallback for Linux systems
try {
  const netstatOutput = await execSafe('netstat', ['-tlnp'], { timeout: 3000 });
  if (netstatOutput.includes(`:${port}`)) {
    return 'running';
  }
} catch (netstatErr) {
  // Neither lsof nor netstat available - cannot determine port status
}
```

**Purpose:** Provides cross-platform compatibility. lsof is common on macOS, netstat on Linux.
**Confidence:** 10/10 - KEEP. This is legitimate cross-platform support.

#### 2.2 X10 Mouse Protocol Fallback in ui.tsx
**Location:** Lines 354-369

```typescript
// Fallback: Try X10 protocol (older terminals)
const x10Match = str.match(/\x1b\[M(.)(.)(.)/);
if (x10Match) {
  const btn = x10Match[1].charCodeAt(0) - 32;
  // ... mouse handling
}
```

**Purpose:** Supports older terminal emulators that use X10 mouse protocol instead of the newer SGR protocol.
**Confidence:** 10/10 - KEEP. Necessary for broad terminal compatibility.

#### 2.3 GitHub Registry Fallback in upgrade.ts
**Location:** Lines 109-125 and 138-155

```typescript
// npm registry failed (package may not exist or network issue) - try GitHub fallback
try {
  execSync('npm install -g github:tdk-landscape/tdk-cli', ...);
} catch (err) {
  spinner.fail(`Upgrade failed: ${err}`);
}
```

**Purpose:** Allows installation from GitHub when npm package isn't published yet (which appears to be the current state).
**Confidence:** 10/10 - KEEP. Critical for current installation workflow.

#### 2.4 Resource Type Fallback in services.ts
**Location:** Lines 293-303

```typescript
// Falls back to name-based heuristics only when config type is missing
const configType = resource.config?.appType;
let type: ResourceType = configType || 'backend';
if (!configType) {
  // Fallback heuristics based on resource name
  if (resource.name.includes('frontend')) {
    type = 'frontend';
  } else if (resource.name.includes('sdk') || resource.name.includes('lib') || resource.name.includes('infra')) {
    type = 'library';
  }
}
```

**Purpose:** Provides backward compatibility for service.json files that may not have the `appType` field.
**Confidence:** 10/10 - KEEP. Defensive programming for real-world usage.

---

### 3. Internal Helper Function

#### isNodeError Type Guard in services.ts
**Location:** Lines 23-25

```typescript
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
```

**Usage:** Used internally within services.ts (lines 50, 325, 352) to safely check for Node.js error codes.

**Analysis:** 
- Not exported (internal only)
- Used consistently for error code extraction
- Pattern is specific to Node.js filesystem errors

**Confidence:** 10/10 - KEEP. This is a proper type guard pattern, not deprecated code.

---

### 4. What Was NOT Found

The following patterns commonly associated with legacy code were **absent** from the codebase:

| Pattern | Count | Assessment |
|---------|-------|------------|
| @deprecated annotations | 0 | Clean API surface |
| TODO/FIXME markers | 0 | Well-maintained code |
| XXX/HACK comments | 0 | Production-quality code |
| Version checks (if version < X) | 0 | No conditional feature flags |
| Feature flags | 0 | No disabled features |
| Polyfills | 0 | Modern Node.js target |
| Shims | 0 | No compatibility layers |
| Migration code | 0 | No transition helpers |
| Backward compatibility exports | 0 | Clean public API |

---

## Recommendations

### High Confidence (9-10/10): NO CHANGES NEEDED

All "fallback" and "legacy" patterns found in this codebase are:
1. **Operational necessities** - Cross-platform compatibility
2. **User experience improvements** - Graceful degradation
3. **Defensive programming** - Handling edge cases

**No code should be removed** based on this assessment.

### Medium Confidence (6-8/10): CONSIDER ENHANCEMENTS

The following are NOT deprecated code, but could be enhanced:

1. **Test naming in error-handling.test.ts**
   - Current: Tests labeled "legacy" could confuse future maintainers
   - Suggestion: Rename to describe the pattern: "inline validation function" vs "utility function"
   - Impact: Low - cosmetic change

2. **isNodeError type guard**
   - Current: Private to services.ts
   - Suggestion: Consider moving to shared error utilities if other modules need similar checks
   - Impact: Low - refactoring opportunity

---

## Dependencies Analysis

Checked that no deprecated code paths have active dependencies:

| Function/Pattern | Used By | Can Remove? |
|------------------|---------|-------------|
| All fallback patterns | Active operational code | NO - needed for functionality |
| isNodeError | services.ts internal only | NO - actively used |
| Legacy test patterns | Test suite only | NO - active tests |

---

## Conclusion

**The TDK CLI codebase has NO deprecated or legacy code requiring removal.**

The codebase demonstrates excellent maintenance practices:
- Clean API design with no deprecated exports
- Proper use of fallback patterns for operational resilience
- No abandoned or dead code paths
- No version/feature flags that have become obsolete

The word "legacy" appears only in test descriptions as a label for alternative testing approaches, not as an indicator of deprecated functionality.

---

**Assessment Confidence:** 10/10  
**Action Required:** NONE  
**Code Changes Recommended:** 0
