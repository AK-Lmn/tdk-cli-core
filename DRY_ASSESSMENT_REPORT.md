# DRY (Don't Repeat Yourself) Assessment Report
## TDK CLI Codebase Analysis

**Date:** 2026-04-30  
**Scope:** Full CLI codebase (cli/src/)  
**Focus:** Code duplication, similar patterns, and consolidation opportunities

---

## Executive Summary

The TDK CLI codebase has **moderate DRY violations** with several clear consolidation opportunities. The overall architecture is well-structured, but there are notable instances of copy-paste code, particularly in:

1. **Test files** - Significant duplication of validation logic
2. **Formatting utilities** - Recently consolidated (good!)
3. **Error handling patterns** - Some repetition in status checking
4. **Template patterns in tests** - Highly redundant test structures

---

## Findings by Category

### 🔴 HIGH CONFIDENCE (Consolidate Immediately)

#### 1. Test File Duplication - Template Pattern Tests
**Location:** `cli/src/commands/__tests__/project.test.ts` (lines 53-102)
**Issue:** Extensive duplication of template pattern validation tests.

```typescript
// Duplicated pattern (appears 3+ times)
const expectedPatterns = {
  resourceDefaults: ['BASE_PORT_FRONTEND', 'BASE_PORT_BACKEND', ...],
  techStack: ['BUNDLER', 'RUNTIME', ...],
  // ... same patterns repeated
};
```

**Impact:** ~50 lines of redundant test code. Makes tests harder to maintain.

**Recommendation:** Extract shared test utilities for template validation.
**Risk:** LOW - Test-only change, no production impact.

---

#### 2. Resource/Stack/Project Test Structure Duplication
**Location:** All `*.test.ts` files
**Issue:** Common validation patterns repeated:

```typescript
// In error-handling.test.ts (lines 178-211)
function validateStackName(name: string): { valid: boolean; error?: string }

// Similar to validation.ts's createKebabCaseValidator but inline
```

**Impact:** ~30 lines per test file of duplicated validation logic.

**Recommendation:** Import actual validation functions from source in tests.
**Risk:** LOW - Test-only change, improves test reliability.

---

#### 3. Pluralization Logic
**Location:** 
- `cli/src/utils/formatting.ts` (lines 3-5) ✅ Already extracted
- `cli/src/commands/projects.ts` (line 57) - Inline ternary
- `cli/src/commands/stacks.ts` (line 64) - Inline ternary

```typescript
// In projects.ts:
console.log(chalk.yellow(`  ⚠ Unassigned: ${withoutStack} resource${withoutStack === 1 ? '' : 's'}`));
```

**Impact:** 3 instances of inline pluralization instead of using `formatCount()`.

**Recommendation:** Replace all inline pluralization with `formatCount()` utility.
**Risk:** LOW - Pure refactoring, well-tested utility.

---

#### 4. Stack Emoji Mapping
**Location:** `cli/src/commands/networks.ts` (lines 377-398)
**Issue:** Emoji mapping is inline and could be reused.

```typescript
function getStackEmoji(stackName: string): string {
  const emojiMap: Record<string, string> = {
    'identity': '🔐',
    'order': '📅',
    // ... 8+ entries
  };
  // ... logic
}
```

**Impact:** ~22 lines of inline mapping that could be shared.

**Recommendation:** Extract to `utils/constants.ts` as `STACK_EMOJIS`.
**Risk:** LOW - Data extraction, no logic change.

---

### 🟡 MEDIUM CONFIDENCE (Consider Consolidating)

#### 5. Console Output Patterns
**Location:** Multiple command files
**Issue:** Similar success/error message patterns:

```typescript
// Pattern seen in multiple files:
console.log(chalk.green(`✓ Created: ${file}`));
console.log(chalk.red(`✗ ${file} (missing)`));
console.log(chalk.yellow(`⚠ ${message}`));
```

**Impact:** ~20 instances across command files.

**Recommendation:** Consider lightweight output helper functions.
**Risk:** MEDIUM - Could over-abstract simple console output.

---

#### 6. File Existence Check Pattern
**Location:** 
- `cli/src/commands/project.ts` (lines 79-107)
- `cli/src/commands/projects.ts` (lines 28-45)
- `cli/src/generator/template-engine.ts` (lines 313-328)

**Issue:** Similar file existence + reporting logic:

```typescript
const exists = existsSync(path);
if (exists) {
  console.log(chalk.green(`  ✓ ${file}`));
} else {
  console.log(chalk.red(`  ✗ ${file} (missing)`));
}
```

**Impact:** ~15 lines repeated 3+ times.

**Recommendation:** Create a `checkFileStatus()` utility.
**Risk:** MEDIUM - Adds abstraction for simple pattern.

---

#### 7. Error Warning Pattern in services.ts
**Location:** `cli/src/utils/services.ts` (lines 70-75, 346-351, 372-377)
**Issue:** Repeated error code checking pattern:

```typescript
const errorCode = isNodeError(err) ? err.code : undefined;
if (errorCode !== 'ENOENT') {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.warn(`Warning: ... ${errorMessage}`);
}
```

**Impact:** ~8 lines repeated 3 times.

**Recommendation:** Extract `warnIfNotMissing()` helper.
**Risk:** LOW - Simple utility extraction.

---

### 🟢 LOW CONFIDENCE (Keep As-Is)

#### 8. Command Action Wrappers
**Location:** All command files use `.action(async (options) => { ... })`
**Issue:** Similar structure but each command has unique needs.

**Recommendation:** KEEP AS-IS. The consistency is good, abstraction would add complexity.

---

#### 9. Import Patterns
**Location:** All files import from `../utils/*.js`, `../types/index.js`
**Issue:** Similar import blocks but this is normal/healthy.

**Recommendation:** KEEP AS-IS. No consolidation needed.

---

#### 10. Type Guards
**Location:** `cli/src/utils/services.ts` (lines 87-91, 246-266)
**Issue:** Type guards are single-purpose by design.

**Recommendation:** KEEP AS-IS. Type guards should stay close to their usage.

---

## Previously Consolidated (Good Examples!)

### ✅ Box Drawing Utilities
**Status:** CONSOLIDATED  
**Location:** `cli/src/utils/formatting.ts` (lines 45-84)  
**Previous:** `cli/src/commands/networks.ts` had inline `line()`, `center()`, `pad()` functions.

### ✅ Status Colors and Icons
**Status:** CONSOLIDATED  
**Location:** `cli/src/utils/formatting.ts` (lines 86-117)  
**Previous:** Status color logic was scattered.

---

## Priority Implementation Roadmap

### Phase 1: High Confidence (Immediate)
1. **Fix pluralization in projects.ts, stacks.ts** - 5 min
2. **Extract STACK_EMOJIS to constants** - 10 min
3. **Consolidate test validation logic** - 20 min

### Phase 2: Medium Confidence (Next Sprint)
4. **File existence check utility** - 15 min
5. **Error warning helper in services.ts** - 10 min

### Phase 3: Low Confidence (Evaluate)
6. **Console output abstraction** - Only if patterns grow

---

## Estimated Impact

| Metric | Current | After Phase 1 | After Phase 2 |
|--------|---------|---------------|---------------|
| Lines of Duplication | ~200 | ~100 | ~50 |
| Maintenance Points | 15 | 10 | 7 |
| Test Reliability | Good | Better | Best |

---

## Risk Assessment Summary

| Change | Risk Level | Testing Strategy |
|--------|------------|------------------|
| Pluralization fixes | LOW | Existing tests pass |
| STACK_EMOJIS extraction | LOW | Visual verification |
| Test consolidation | LOW | Tests validate tests |
| File check utility | MEDIUM | Unit tests + manual |
| Error helper | LOW | Existing tests pass |

**Overall Risk: LOW to MEDIUM**  
All changes are refactoring with no behavioral changes expected.

---

## Files to Modify (Phase 1)

1. `cli/src/commands/projects.ts` - Use formatCount()
2. `cli/src/commands/stacks.ts` - Use formatCount()
3. `cli/src/utils/constants.ts` - Add STACK_EMOJIS
4. `cli/src/commands/networks.ts` - Import STACK_EMOJIS
5. `cli/src/commands/__tests__/error-handling.test.ts` - Use actual validators
6. `cli/src/commands/__tests__/project.test.ts` - Consolidate pattern tests

---

*Report generated by Code Quality Agent - DRY Specialist*
