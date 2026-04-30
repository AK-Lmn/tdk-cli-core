# Error Handling Assessment Report
## TDK CLI Defensive Programming Review

**Date:** 2025-01-30
**Scope:** All try-catch blocks and error handling patterns in cli/src

---

## Executive Summary

**Total try-catch patterns found:** 41 across 12 files
**High-confidence removals:** 1
**Borderline cases:** 5
**Legitimate error handling:** 35

The codebase demonstrates generally good error handling practices with most try-catch blocks serving legitimate purposes for I/O operations, network calls, and external command execution. Only one high-confidence removal was identified.

---

## Pattern Categories

### 1. LEGITIMATE Error Handling (35 patterns)

These patterns correctly handle expected failure scenarios and should be preserved.

#### A. Filesystem/IO Operations (12 patterns)
**Files:** `services.ts`, `completion.ts`, `template-engine.ts`, `stack.ts`

- **Pattern:** Catching ENOENT, EACCES when reading files/directories
- **Example:** `services.ts:62-67` - Silently skips directories that can't be read (permission denied, deleted during traversal)
- **Rationale:** These are exploratory operations where partial success is acceptable

#### B. Network/External API Calls (8 patterns)
**Files:** `upgrade.ts`, `networks.ts`

- **Pattern:** HTTP requests, npm registry checks, service health checks
- **Example:** `upgrade.ts:76-92` - Falls back gracefully when npm registry unavailable
- **Rationale:** Network failures are expected and should degrade gracefully

#### C. External Command Execution (10 patterns)
**Files:** `doctor.ts`, `up.ts`, `networks.ts`, `upgrade.ts`

- **Pattern:** execSync/spawn calls to docker, tilt, bun, git, lsof
- **Example:** `doctor.ts:16-31` - Checks if docker is running (failure = not running)
- **Rationale:** Exit codes are part of the expected API; failure is data, not error

#### D. Centralized Error Wrappers (2 patterns)
**Files:** `errors.ts`

- **Pattern:** `withErrorHandling()`, `runCommand()`
- **Rationale:** These are architectural patterns that provide consistent error formatting and exit codes

#### E. Parsing/Validation with Continuation (3 patterns)
**Files:** `services.ts`

- **Pattern:** Try to parse individual resources, continue on failure
- **Example:** `services.ts:129-135` - Warns about invalid service.json but continues discovery
- **Rationale:** One bad config shouldn't prevent discovering others

---

### 2. BORDERLINE Cases (5 patterns)

These require judgment calls. They swallow errors but may have reasonable justification.

#### A. `upgrade.ts:24-59` - `detectInstallation()`
```typescript
try {
  // ... detection logic
} catch {
  return { method: 'unknown' };
}
```
**Assessment:** Returns 'unknown' when detection fails. Could be more transparent by logging warnings.
**Recommendation:** LOW priority - Add debug logging but keep behavior

#### B. `upgrade.ts:63-70` - `getCurrentVersion()`
```typescript
try {
  // ... read package.json
} catch {
  return 'unknown';
}
```
**Assessment:** Returns 'unknown' when can't read own package.json. This should probably never fail.
**Recommendation:** LOW priority - Consider letting it throw (should be caught by caller)

#### C. `networks.ts:67-78` - `getBaseDomain()` config read
```typescript
try {
  const projectConfig = readProjectConfig(projectRoot);
  // ...
} catch {
  // Ignore - config might not exist or be readable
}
```
**Assessment:** Comment explains intent but falls back silently.
**Recommendation:** LOW priority - This is exploratory; behavior is acceptable

#### D. `networks.ts:82-97` - Docker domain extraction
```typescript
try {
  const traefikLabels = execSync(...);
  // ...
} catch {
  // Ignore - docker might not be running
}
```
**Assessment:** Same pattern as above for docker command.
**Recommendation:** LOW priority - Acceptable for optional discovery

#### E. `project.ts:88-99` - Config check error handling
```typescript
try {
  const projectConfig = readProjectConfig(projectRoot);
  // ...
} catch (err) {
  console.log(chalk.yellow('⚠️  Project configuration out of sync'));
  console.log(chalk.gray(`   Error: ${err instanceof Error ? err.message : String(err)}`));
  console.log(chalk.gray('\nRun `tdk project` to regenerate.'));
  process.exit(1);
}
```
**Assessment:** Actually handles error properly with logging and exit. Not a problem.
**Reassessment:** This is LEGITIMATE - was miscategorized initially

---

### 3. HIGH CONFIDENCE Removals (1 pattern)

#### A. `ui.tsx:900-913` - Redundant outer try-catch
```typescript
.action(async () => {
  try {
    const tiltAvailable = await isTiltAvailable();
    if (!tiltAvailable) {
      errorFactories.tiltNotInstalled().display();
      process.exit(1);
    }

    requireProjectRoot();
    render(<TUIApp />);

  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
})
```

**Problem:** 
1. The entire action is already wrapped by `runCommand()` which handles errors consistently
2. The catch block provides inferior error formatting (no chalk, no suggestions) compared to `runCommand()`
3. This try-catch masks the specific error context

**Risk Assessment:**
- **Confidence:** HIGH
- **Risk:** LOW - `runCommand()` provides identical exit behavior with better formatting
- **Impact:** Removing this will give users better error messages via `handleCommandError()`

**Fix:** Remove the try-catch block entirely and let `runCommand()` handle errors

---

## Additional Findings

### Non-Try-Catch Error Handling

#### 1. `resource.ts:308` - Script pattern in module file
```typescript
main().catch(console.error);
```
**Assessment:** This appears to be a leftover script pattern. The file exports `resourceCommand`, so `main()` shouldn't exist or be called.
**Action:** Verify if this is dead code and remove if so.

#### 2. `bin/tdk.js:11` - Entry point error handling
```typescript
import(cliPath).catch((err) => {
  console.error('Failed to start TDK:', err);
  process.exit(1);
});
```
**Assessment:** LEGITIMATE - This is the top-level entry point and should catch startup failures.

---

## Recommendations Summary

### High Priority (Implement Now)
1. **Remove redundant try-catch in `ui.tsx`** - Use `runCommand()` wrapper consistently

### Low Priority (Consider for Future)
1. **Add debug logging to `detectInstallation()`** - Help users understand why detection failed
2. **Review `getCurrentVersion()`** - Consider if this should ever fail silently

### No Action Required
- All filesystem traversal error handling (keeps working with partial data)
- All external command execution error handling (failure is expected signal)
- All network request error handling (graceful degradation is correct)
- All centralized error wrappers (architecturally sound)

---

## Risk Matrix

| File | Line | Current Pattern | Risk if Removed | Confidence |
|------|------|-----------------|-----------------|------------|
| ui.tsx | 900-913 | Redundant try-catch | LOW (runCommand handles it) | HIGH |
| upgrade.ts | 24-59 | Returns 'unknown' on catch | LOW-MEDIUM (diagnostics lost) | LOW |
| upgrade.ts | 63-70 | Returns 'unknown' on catch | LOW (rare failure case) | LOW |
| networks.ts | 67-78 | Silent ignore | LOW (exploratory read) | LOW |
| networks.ts | 82-97 | Silent ignore | LOW (exploratory read) | LOW |

---

## Implementation Notes

The only high-confidence change is removing the redundant try-catch in `ui.tsx`. All other patterns either:
1. Handle legitimate I/O/network failures where error is expected
2. Provide graceful degradation for optional features
3. Follow established architectural patterns (`runCommand`, `withErrorHandling`)

Removing the wrong try-catch blocks would actually harm reliability by crashing the CLI when encountering:
- Corrupted individual service.json files (should warn, not crash)
- Services temporarily down during health checks
- Optional features not being installed (docker, tilt not running)

The codebase demonstrates mature defensive programming practices overall.
