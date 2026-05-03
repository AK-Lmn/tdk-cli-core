# DRY Assessment Report - TDK CLI Codebase
**Date:** 2026-05-03  
**Scope:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/**/*.ts`  
**Assessor:** Code Deduplication Specialist

---

## Executive Summary

Found **11 distinct duplication patterns** across the TDK CLI codebase. Most violations are in command action patterns, console output formatting, and error handling. All identified duplications are **low-hanging fruit** that can be consolidated without architectural changes.

---

## High Severity Duplications

### 1. Cancelled Message Pattern
**Severity:** High  
**Confidence:** High  
**Files:** 4 occurrences

**Duplicate Code:**
```typescript
console.log(chalk.yellow('Cancelled.'));
```

**Locations:**
- `commands/resource.ts:484`
- `commands/upgrade.ts:295`
- `commands/stack.ts:103`
- `commands/project.ts:127`

**Why Violates DRY:**
Same exact string and formatting pattern used when user cancels an operation. Should be a shared utility for consistency and easier localization.

**Recommended Fix:**
Add to `src/utils/formatting.ts`:
```typescript
export function showCancelled(message?: string): void {
  console.log(chalk.yellow(message || 'Cancelled.'));
}
```

---

### 2. Error Display + Exit Pattern
**Severity:** High  
**Confidence:** High  
**Files:** 18+ occurrences

**Duplicate Pattern:**
```typescript
console.error(chalk.red(`Error: ${message}`));
process.exit(1);
```

**Key Locations:**
- `commands/resource.ts:364-365`, `444-447`, `451-452`, `456-458`, `465-467`
- `commands/project.ts:137-138`, `91`
- `commands/config.ts:188-189`
- `commands/upgrade.ts:210`, `253`, `330`
- `commands/completion.ts:246-247`
- `commands/up.ts:24-31`

**Why Violates DRY:**
Every command handles errors the same way but with slight variations. This creates inconsistency in error formatting and exit codes.

**Recommended Fix:**
Use existing `TdkError` class in `utils/errors.ts` or add helper:
```typescript
export function showErrorAndExit(message: string, exitCode: number = 1): never {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(exitCode);
}
```

---

### 3. "All X are Y" Success Messages
**Severity:** Medium  
**Confidence:** High  
**Files:** 4 occurrences

**Duplicate Code:**
```typescript
console.log(chalk.green('All resources are assigned to a stack!'));
console.log(chalk.green('All resources are already assigned to a stack!'));
```

**Locations:**
- `commands/resources.ts:37`
- `commands/stack.ts:43`
- `commands/resources.ts:37`

**Why Violates DRY:**
Nearly identical messages for the same semantic concept (all items in a category satisfy a condition).

**Recommended Fix:**
Add to `src/utils/formatting.ts`:
```typescript
export function showAllSatisfyCondition(items: string, condition: string): void {
  console.log(chalk.green(`All ${items} are ${condition}!`));
}
```

---

### 4. Command Action Wrapper Pattern
**Severity:** Medium  
**Confidence:** High  
**Files:** 12 occurrences

**Duplicate Pattern:**
```typescript
.action(async (options) => {
  await runCommand(async () => {
    // command implementation
  });
});
```

**Locations:**
- `commands/resource.ts:345`
- `commands/stack.ts:15`
- `commands/project.ts:59`
- `commands/resources.ts:14`
- `commands/stacks.ts:13`
- `commands/projects.ts:14`
- `commands/status.ts:15`
- `commands/config.ts` (5 subcommands)

**Why Violates DRY:**
Every command uses the same wrapper pattern. Could be abstracted into a helper that combines command registration with error handling.

**Recommended Fix:**
Create a command factory:
```typescript
export function createCommand(name: string, description: string, action: () => Promise<void>): Command {
  return new Command(name)
    .description(description)
    .action(async () => {
      await runCommand(action);
    });
}
```

---

### 5. Header Display Pattern
**Severity:** Medium  
**Confidence:** High  
**Files:** 15+ occurrences

**Duplicate Pattern:**
```typescript
console.log(chalk.blue('TDK Resource Creation\n'));
console.log(chalk.blue('TDK Stack Management\n'));
console.log(chalk.blue('TDK Project Configuration\n'));
```

**Locations:**
- `commands/resource.ts:348`
- `commands/stack.ts:18`
- `commands/project.ts:64`, `95`, `148`, `225`, `230`
- `commands/config.ts:22`, `105`, `113`, `126`, `156`
- `commands/status.ts:18`
- `commands/stacks.ts:26`, `42`
- `commands/resources.ts:42`
- `commands/projects.ts:17`

**Why Violates DRY:**
Same pattern with only the noun changing. Creates visual inconsistency if one deviates.

**Recommended Fix:**
Add to `src/utils/formatting.ts`:
```typescript
export function showCommandHeader(title: string): void {
  console.log(chalk.blue(`TDK ${title}\n`));
}
```

---

## Medium Severity Duplications

### 6. Verbose Logging Pattern
**Severity:** Medium  
**Confidence:** Medium  
**Files:** 20+ occurrences

**Duplicate Pattern:**
```typescript
console.log(chalk.gray(`Found ${formatCount(count, 'item')} in ${context}`));
console.log(chalk.gray(`  - ${name}`));
```

**Why Violates DRY:**
Verbose/detail output follows same pattern across commands. Could use a shared verbose logger.

**Recommended Fix:**
Extend existing `logVerbose` or create:
```typescript
export function logDetail(message: string): void {
  console.log(chalk.gray(message));
}
```

---

### 7. Resource Discovery Call Pattern
**Severity:** Low  
**Confidence:** High  
**Files:** 13 occurrences

**Duplicate Pattern:**
```typescript
const allResources = discoverResources();
```

**Locations:** Nearly every command file

**Why Violates DRY:**
While not strictly duplicate code, many commands repeat the same discovery pattern. Could benefit from a cached/validated wrapper.

**Note:** This is borderline acceptable since it's the primary API. Not recommended to consolidate unless adding caching.

---

### 8. Project Root Validation
**Severity:** Low  
**Confidence:** High  
**Files:** 11 occurrences

**Duplicate Pattern:**
```typescript
const projectRoot = requireProjectRoot();
// or
requireProjectRoot();
```

**Locations:** Most command files

**Why Violates DRY:**
Same validation repeated. Some commands don't use the return value but call it anyway for side effects.

**Note:** This is acceptable as it's the entry guard pattern. No action needed.

---

## Low Severity Duplications

### 9. Next Steps Output Pattern
**Severity:** Low  
**Confidence:** Medium  
**Files:** 5+ occurrences

**Example in `resource.ts:524-527`:**
```typescript
console.log(chalk.gray(`\nLocation: ${fullPath}`));
console.log(chalk.gray(`\nNext steps:`));
console.log(chalk.gray(`  cd ${resourcePath}`));
```

**Why Low Severity:**
Each command has context-specific next steps. Consolidation would reduce clarity.

**Recommendation:** No action - keep context-specific.

---

### 10. Config File Existence Check Pattern
**Severity:** Low  
**Confidence:** Medium  
**Files:** `doctor.ts`, `projects.ts`

**Duplicate Code:**
```typescript
const defaultsPath = resolve(process.cwd(), "TILT_RESOURCE_DEFAULTS.star");
const techStackPath = resolve(process.cwd(), "TILT_TECH_STACK.star");
const defaultsExists = existsSync(defaultsPath);
const techStackExists = existsSync(techStackPath);
```

**Locations:**
- `commands/doctor.ts:67-72`
- `commands/projects.ts:23-27`

**Why Low Severity:**
Only 2 occurrences and context differs slightly.

**Recommendation:** No action - acceptable duplication.

---

### 11. Tilt Check Wrapper
**Severity:** Low  
**Confidence:** High  
**Files:** 2 occurrences

**Duplicate Pattern:**
```typescript
await withTiltCheck(async () => {
  // command logic
});
```

**Locations:**
- `commands/up.ts:18`
- `commands/down.ts:12`

**Why Low Severity:**
Only 2 occurrences and they correctly use the shared utility. Pattern is already consolidated.

**Recommendation:** No action - already using shared abstraction.

---

## Implementation Priority

### Phase 1: High Confidence, High Impact
1. ✅ Cancelled message utility
2. ✅ Error display + exit helper  
3. ✅ Header display utility
4. ✅ "All X are Y" message utility

### Phase 2: Medium Confidence
5. Command factory (requires more design)
6. Verbose logging helper

### Phase 3: Low Priority
7. No changes recommended for low-severity items

---

## Files to Modify

### New Utilities (in `utils/formatting.ts`):
- `showCancelled()` - for cancellation messages
- `showCommandHeader()` - for command headers
- `showAllSatisfyCondition()` - for "all items satisfy" messages

### New Utilities (in `utils/errors.ts`):
- `showErrorAndExit()` - for error + exit pattern

### Command Files Requiring Updates:
- `commands/resource.ts` - use new utilities
- `commands/upgrade.ts` - use new utilities
- `commands/stack.ts` - use new utilities
- `commands/project.ts` - use new utilities
- `commands/config.ts` - use new utilities
- `commands/resources.ts` - use new utilities

---

## Success Criteria

- [ ] Assessment document created (this file)
- [ ] All high-confidence duplications consolidated
- [ ] Project builds successfully (`cd cli && bun run build`)
- [ ] No test regressions (`cd cli && bun test`)
- [ ] No behavioral changes (pure refactor)

---

## Estimated Impact

- **Lines Removed:** ~50-80 lines of duplicate code
- **Files Modified:** 8 files
- **New Utilities:** 4 functions
- **Risk Level:** Low (all changes are pure refactor)

---

*Generated by Code Deduplication Specialist - 2026-05-03*
