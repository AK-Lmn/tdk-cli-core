# TDK CLI Code Quality Assessment: DRY Violations

**Assessment Date:** 2025-05-01  
**Scope:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/**/*.ts`, `cli/src/**/*.tsx`  
**Focus:** Duplicate code patterns, consolidation opportunities

---

## Executive Summary

The TDK CLI codebase has **moderate DRY violations** with several high-confidence consolidation opportunities. The most significant duplications involve error handling patterns, command action wrappers, and status display logic. **Estimated complexity reduction: 15-20%** with targeted consolidations.

---

## High-Confidence Consolidations (Recommended for Implementation)

### 1. Error Message Extraction Utility ⭐ HIGH CONFIDENCE

**Locations Found:**
- `services.ts` lines 69-71, 137-139, 282-283, 344-347, 371-374
- `up.ts` line 80
- `down.ts` implicit in catch block
- `tilt.ts` lines 73-75
- `upgrade.ts` multiple locations (lines 39, 58, 71, 112, 142, 205, 270, etc.)
- `networks.ts` lines 69, 91-93, 182-183, 191-193, 212-214, 270, etc.

**Pattern:**
```typescript
const errorMessage = err instanceof Error ? err.message : String(err);
console.warn(`Warning: ... ${errorMessage}`);
```

**Consolidation Target:** `utils/errors.ts`

**Function:**
```typescript
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
```

**Complexity Reduction:** HIGH - Eliminates ~15+ inline ternary expressions  
**Risk:** LOW - Pure function, no behavioral change  
**Lines Saved:** ~30-40 lines

---

### 2. Verbose Logging Utility ⭐ HIGH CONFIDENCE

**Locations Found:**
- `up.ts` lines 79-81
- `tilt.ts` lines 73-75
- `upgrade.ts` lines 38-40, 58, 71, 111-113, 141-143, 205-207, 269, 398-400
- `networks.ts` lines 67-70, 90-93, 181-183, 191-193, 211-214, 270, 347-349

**Pattern:**
```typescript
if (process.env.TDK_VERBOSE) {
  console.warn(chalk.gray(`...: ${err instanceof Error ? err.message : String(err)}`));
}
```

**Consolidation Target:** `utils/errors.ts`

**Function:**
```typescript
export function logVerbose(message: string, err?: unknown): void {
  if (process.env.TDK_VERBOSE) {
    const errMsg = err ? `: ${getErrorMessage(err)}` : '';
    console.warn(chalk.gray(`${message}${errMsg}`));
  }
}
```

**Complexity Reduction:** HIGH - Eliminates repetitive environment checks  
**Risk:** LOW - Simple utility function  
**Lines Saved:** ~40-50 lines

---

### 3. Status Display Consolidation ⭐ HIGH CONFIDENCE

**Locations Found:**
- `networks.ts` lines 315-318 (inline status symbol logic)
- `formatting.ts` already has `getStatusColor()` and `getStatusIcon()`

**Pattern in networks.ts:**
```typescript
const statusSymbol = service.status === 'running' ? '✓' :
                    service.status === 'stopped' ? '✗' : '?';
const statusEmoji = service.status === 'running' ? chalk.green(statusSymbol) :
                    service.status === 'stopped' ? chalk.red(statusSymbol) : chalk.gray(statusSymbol);
```

**Consolidation:** Use existing `formatting.ts` utilities

**Change:**
```typescript
import { getStatusColor, getStatusIcon } from '../utils/formatting.js';
const statusColor = getStatusColor(service.status);
const statusSymbol = getStatusIcon(service.status);
const statusEmoji = chalk[statusColor](statusSymbol);
```

**Complexity Reduction:** MEDIUM - Consolidates duplicate logic  
**Risk:** LOW - Uses existing proven utilities  
**Lines Saved:** ~8 lines

---

### 4. Project Root Validation Pattern ⭐ HIGH CONFIDENCE

**Locations Found:**
- `stacks.ts` line 20-21 (implicit via discoverResources throwing)
- `resources.ts` line 21: `requireProjectRoot()`
- `projects.ts` line 21: `requireProjectRoot()`
- `up.ts` - uses `isTiltAvailable()` and error handling
- `down.ts` - uses `isTiltAvailable()` and error handling
- `stack.ts` lines 20-21: `requireProjectRoot()`
- `resource.ts` line 333: `requireProjectRoot()`
- `project.ts` - already has project root handling
- `config.ts` - multiple subcommands use `requireProjectRoot()`
- `status.ts` - no explicit check
- `ui.tsx` lines 854: `requireProjectRoot()`

**Consolidation:** Pattern is already consolidated via `requireProjectRoot()` in `errors.ts`. Some commands don't use it consistently.

**Recommendation:** Ensure all commands that need project context use `requireProjectRoot()` consistently.

---

### 5. Empty State Message Helper ⭐ MEDIUM-HIGH CONFIDENCE

**Locations Found:**
- `stacks.ts` lines 23-29
- `resources.ts` lines 25-29
- `networks.ts` lines 261-269
- `projects.ts` - similar pattern but different output

**Pattern:**
```typescript
if (resources.length === 0) {
  console.log(chalk.yellow('No resources found.'));
  console.log(chalk.gray('\nTo create a resource:'));
  console.log(chalk.gray('  tdk resource <name>'));
  return;
}
```

**Consolidation Target:** `utils/formatting.ts`

**Function:**
```typescript
export function showEmptyState(
  itemType: 'resources' | 'stacks' | 'services',
  createCommand: string
): void {
  const messages: Record<string, { singular: string; command: string }> = {
    resources: { singular: 'resource', command: 'tdk resource <name>' },
    stacks: { singular: 'stack', command: 'tdk stack <stack-name>' },
    services: { singular: 'service', command: 'tdk resource <name>' },
  };
  
  const config = messages[itemType];
  console.log(chalk.yellow(`No ${config.singular}s found.`));
  console.log(chalk.gray(`\nTo create a ${config.singular}:`));
  console.log(chalk.gray(`  ${config.command}`));
}
```

**Complexity Reduction:** MEDIUM - Reduces repetitive console output patterns  
**Risk:** LOW - Simple output helper  
**Lines Saved:** ~15-20 lines

---

### 6. Port Range Configuration Duplication ⭐ MEDIUM CONFIDENCE

**Locations Found:**
- `constants.ts` lines 41-45: `PORT_RANGES`
- `platform-standards.ts` lines 50-85: `PORTS` with more detail

**Issue:** Two sources of truth for port allocation. `constants.ts` version is used by `resource.ts`, `platform-standards.ts` is used by template engine.

**Consolidation:** Use `platform-standards.ts` as single source of truth, re-export from `constants.ts` for backward compatibility.

**Complexity Reduction:** HIGH - Single source of truth  
**Risk:** LOW - Type-compatible structures  
**Lines Saved:** ~10 lines (but more importantly, eliminates sync issues)

---

## Medium-Confidence Consolidations (Evaluate Carefully)

### 7. Command Action Wrapper Pattern

**Locations Found:** All command files use:
```typescript
.action(async (options) => {
  await runCommand(async () => {
    // command logic
  });
});
```

**Assessment:** This is a **necessary pattern** for consistency. Wrapping further may obscure the action flow. **NOT RECOMMENDED** for consolidation.

---

### 8. Package.json Reading Pattern

**Locations Found:**
- `version.ts` lines 10
- `upgrade.ts` lines 66-67

**Pattern:**
```typescript
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));
```

**Assessment:** Only 2 occurrences, context differs. **LOW PRIORITY**.

---

### 9. Editor Command Execution Pattern

**Locations Found:**
- `config.ts` lines 163-176

**Assessment:** Only 1 location. No consolidation needed.

---

### 10. Path Validation Logic

**Locations Found:**
- `resource.ts` lines 430-443

**Assessment:** Only 1 significant location. Security-critical logic should remain explicit. **NOT RECOMMENDED** for abstraction.

---

## Low-Confidence / Not Recommended

### 11. Type Guard Duplication

**Locations Found:**
- `services.ts` lines 23-25: `isNodeError()`
- `template-engine.ts` lines 211-261: `isProjectConfig()`

**Assessment:** These are domain-specific type guards with different purposes. Keep separate for clarity.

---

### 12. Template Generation Patterns

**Locations Found:**
- `resource.ts` has multiple template functions

**Assessment:** These are resource-specific templates. Consolidating would reduce clarity. **NOT RECOMMENDED**.

---

## Risk Assessment Summary

| Consolidation | Complexity Reduction | Risk Level | Recommendation |
|--------------|----------------------|------------|----------------|
| Error message utility | HIGH | LOW | ✅ IMPLEMENT |
| Verbose logging utility | HIGH | LOW | ✅ IMPLEMENT |
| Status display consolidation | MEDIUM | LOW | ✅ IMPLEMENT |
| Empty state helper | MEDIUM | LOW | ✅ IMPLEMENT |
| Port ranges consolidation | HIGH | LOW | ✅ IMPLEMENT |
| Command action wrapper | LOW | MEDIUM | ❌ SKIP |
| Path validation | MEDIUM | MEDIUM | ❌ SKIP |
| Template functions | LOW | HIGH | ❌ SKIP |

---

## Implementation Priority

1. **Immediate (High ROI):**
   - `getErrorMessage()` utility
   - `logVerbose()` utility
   - Port ranges single source of truth

2. **Next Sprint:**
   - Status display consolidation
   - Empty state helper

3. **Future:**
   - Evaluate command patterns after above changes

---

## Files to Modify

### High Priority Changes:
1. `cli/src/utils/errors.ts` - Add utilities
2. `cli/src/utils/formatting.ts` - Enhance status functions, add empty state helper
3. `cli/src/utils/constants.ts` - Re-export port ranges from platform-standards
4. `cli/src/commands/networks.ts` - Use consolidated status functions
5. `cli/src/commands/up.ts` - Use logVerbose utility
6. `cli/src/commands/upgrade.ts` - Use logVerbose utility
7. `cli/src/commands/networks.ts` - Use logVerbose utility
8. `cli/src/utils/tilt.ts` - Use logVerbose utility
9. `cli/src/utils/services.ts` - Use getErrorMessage utility

---

## Testing Strategy

All consolidations are pure function extractions with no behavioral changes. Existing tests in:
- `cli/src/commands/__tests__/error-handling.test.ts`
- `cli/src/commands/__tests__/resource.test.ts`
- `cli/src/commands/__tests__/project.test.ts`
- `cli/src/commands/__tests__/config.test.ts`

Should pass without modification. Run `bun test` to verify.

---

*Assessment generated by Code Quality Agent - DRY Consolidation Mode*
