# Error Handling Cleanup - Implementation Summary

**Date:** 2025-01-30
**Scope:** TDK CLI defensive programming improvements

---

## Changes Made

### 1. `cli/src/commands/upgrade.ts`

#### Change A: Improved readlink error documentation (Line 35-39)
**Before:**
```typescript
} catch {
  // readlink failed, not a symlink
}
```

**After:**
```typescript
} catch {
  // readlink -f fails when the path is not a symlink (e.g., direct binary from npm/bun global install)
  // This is expected behavior for non-git installations - safe to ignore
  // Git detection will fall through to directory-based detection below
}
```

**Rationale:** The original comment stated what happened, not why it was safe. The improved comment explains the expected failure mode and why it doesn't affect correctness.

---

#### Change B: Added verbose logging to npm upgrade fallback (Line 100-105)
**Before:**
```typescript
} catch {
  // Fall back to GitHub
  spinner.text = 'npm registry failed, trying GitHub...';
  try {
```

**After:**
```typescript
} catch (err) {
  // npm registry failed (package may not exist or network issue) - try GitHub fallback
  spinner.text = 'npm registry failed, trying GitHub...';
  if (process.env.TDK_VERBOSE) {
    console.warn(chalk.gray(`npm registry error: ${err instanceof Error ? err.message : String(err)}`));
  }
  try {
```

**Rationale:** Empty catch blocks hide diagnostic information. The error is now logged when `TDK_VERBOSE` is set, aiding troubleshooting while maintaining clean output for normal usage.

---

#### Change C: Added verbose logging to bun upgrade fallback (Line 130-135)
**Before:**
```typescript
} catch {
  // Fall back to GitHub
  spinner.text = 'npm registry failed, trying GitHub...';
  try {
```

**After:**
```typescript
} catch (err) {
  // bun registry failed (package may not exist or network issue) - try GitHub fallback
  spinner.text = 'bun registry failed, trying GitHub...';
  if (process.env.TDK_VERBOSE) {
    console.warn(chalk.gray(`bun registry error: ${err instanceof Error ? err.message : String(err)}`));
  }
  try {
```

**Rationale:** Same as Change B - provides diagnostic information for troubleshooting upgrade failures.

---

#### Change D: Added warning for bun link failures (Line 194-200)
**Before:**
```typescript
} catch {
  // Link might fail if already linked, that's ok
}
```

**After:**
```typescript
} catch (err) {
  // bun link --force may fail for various reasons (already linked, permission issues, etc.)
  // Log warning for diagnostic purposes but don't fail - the upgrade may still work
  console.warn(chalk.yellow('⚠️  Warning: bun link --force failed after git upgrade'));
  console.warn(chalk.gray(`   Error: ${err instanceof Error ? err.message : String(err)}`));
  console.warn(chalk.gray('   The upgrade may have partially succeeded. Verify with: tdk version'));
}
```

**Rationale:** The original comment incorrectly assumed the only failure mode was "already linked". In reality, `bun link` can fail for permission issues, corrupted link states, or other reasons. Users should be warned of potential partial upgrades.

---

#### Change E: Added verbose logging for version verification (Line 388-392)
**Before:**
```typescript
} catch {
  verifySpinner.warn('Could not verify new version');
```

**After:**
```typescript
} catch (err) {
  verifySpinner.warn('Could not verify new version');
  if (process.env.TDK_VERBOSE) {
    console.error(chalk.gray(`Verification error: ${err instanceof Error ? err.message : String(err)}`));
  }
```

**Rationale:** Version verification can fail for various reasons (PATH issues, shell configuration, etc.). The error is now logged in verbose mode to help diagnose post-upgrade issues.

---

### 2. `cli/src/commands/up.ts`

#### Change: Improved killall error documentation (Line 75-79)
**Before:**
```typescript
} catch {
  // Ignore errors from killall (e.g., no processes to kill)
}
```

**After:**
```typescript
} catch {
  // killall tilt fails when no tilt processes are running - this is expected
  // The shell command includes `|| true` to ensure exit code 0, but catch
  // handles edge cases. Safe to ignore as the goal (no tilt running) is achieved.
}
```

**Rationale:** The original comment was accurate but brief. The expanded comment explains why the error is expected (no processes = goal achieved) and notes the defensive shell command structure.

---

## Verification

- ✅ `bun run build` - Compiles successfully
- ✅ `bun test` - All 34 tests pass
- ✅ No breaking changes to public API
- ✅ All error handling remains defensive
- ✅ Diagnostic information now available via `TDK_VERBOSE`

---

## Error Handling Philosophy Applied

1. **Empty catches must explain WHY** - Every catch block that doesn't re-throw must explain why the error is safe to ignore
2. **Silent failures are bugs** - Diagnostic information should be available even if not displayed by default
3. **Comments are not excuses** - Comments should explain intent and safety, not just describe what happened
4. **Defensive, not hidden** - Errors are still caught (defensive), but not hidden (transparent)

---

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `cli/src/commands/upgrade.ts` | 5 improvements | +19 lines |
| `cli/src/commands/up.ts` | 1 improvement | +2 lines |
| **Total** | **6 improvements** | **+21 lines** |

---

## No-Go Areas (Intentionally Unchanged)

The following patterns were identified but intentionally NOT changed:

1. **`doctor.ts` feature detection** - Returns structured results; correct pattern
2. **`services.ts` filesystem operations** - Logs warnings appropriately; correct pattern
3. **`networks.ts` nested catches** - Handles different failure modes; readable structure
4. **`template-engine.ts` verification** - Aggregates errors correctly

These files already follow good defensive programming practices.
