# Defensive Programming Critical Assessment

## Executive Summary

**Error Handling Health Score: 7/10**

The TDK CLI codebase has generally reasonable error handling with clear patterns for external system interactions. However, several defensive coding patterns hide errors or mask problems that should propagate. The majority of issues are in network/service status checking where errors are logged verbosely but silently swallowed.

**Key Findings:**
- 21 try-catch blocks analyzed across 5 files
- 6 instances of error-swallowing with `logVerbose()` 
- 1 instance of promise resolution instead of rejection (hiding spawn errors)
- Several defensive fallbacks using `??` that could mask configuration issues
- Most error handling is actually APPROPRIATE for CLI tooling (external system checks)

---

## Defensive Pattern Inventory

### 1. Empty/Minimal Catch Blocks (Category: Keep - Mostly Appropriate)

| File | Line | Pattern | Assessment |
|------|------|---------|------------|
| `commands/doctor.ts:23-32` | 23 | `catch (err: unknown) { return { didPass: false, ... } }` | ✅ **KEEP** - This is expected behavior for diagnostic checks. The error itself isn't needed; the failure state is the information. |
| `commands/networks.ts:70-73` | 70 | `catch (err: unknown) { logVerbose(..., err); }` | ⚠️ **REVIEW** - Docker scan failure silently ignored. Domain detection falls back to 'localhost'. |
| `commands/networks.ts:147-151` | 147 | `catch (err: unknown) { logVerbose(..., err); return 'stopped'; }` | ⚠️ **REVIEW** - HTTP check failure returns 'stopped'. Could be network issue, not service stopped. |
| `commands/networks.ts:158-161` | 158 | `catch (err: unknown) { logVerbose(..., err); }` | ⚠️ **REVIEW** - Port check fails silently, falls through to Docker check. |
| `commands/networks.ts:175-178` | 175 | `catch (err: unknown) { logVerbose(..., err); }` | ⚠️ **REVIEW** - Docker check fails silently, returns 'stopped'. |
| `commands/upgrade.ts:44-47` | 44 | `catch (err: unknown) { logVerbose(..., err); return { method: 'unknown' }; }` | 🔴 **REFACTOR** - Installation detection failure returns 'unknown' instead of throwing. Caller handles 'unknown' but this masks real issues. |
| `commands/upgrade.ts:64-72` | 64 | `catch (err: unknown) { spinner.warn(...); return null; }` | ✅ **KEEP** - npm registry check failure is expected (package not published). User-friendly fallback. |
| `commands/upgrade.ts:85-100` | 85 | `catch (err: unknown) { logVerbose(..., err); try { ... } catch { ... } }` | ✅ **KEEP** - Nested try-catch for fallback upgrade path (npm → GitHub). Appropriate resilience. |
| `commands/upgrade.ts:113-127` | 113 | Same pattern as npm | ✅ **KEEP** - bun → GitHub fallback is appropriate. |
| `commands/upgrade.ts:177-180` | 177 | `catch (err: unknown) { spinner.fail(...); return false; }` | ✅ **KEEP** - Git upgrade failure is properly reported to user via spinner. |
| `commands/upgrade.ts:233-237` | 233 | `catch (err: unknown) { console.warn(...); logVerbose(..., err); latestVersion = 'latest'; }` | ✅ **KEEP** - Git remote check failure continues with generic 'latest' version. Appropriate for UX. |
| `commands/upgrade.ts:358-370` | 358 | `catch (err: unknown) { verifySpinner.warn(...); ... }` | ✅ **KEEP** - Verification failure shows warning and helpful recovery steps. Good UX pattern. |
| `utils/errors.ts:74-82` | 74 | `try { return await action(); } catch (err) { ... handleCommandError(err); }` | ✅ **KEEP** - Top-level command wrapper that properly exits process. Correct pattern. |

### 2. Silent Error Swallowing via logVerbose (Category: Refactor)

**Issue:** `logVerbose()` only logs when `TDK_VERBOSE` environment variable is set. In production usage, errors are completely invisible.

**Pattern Found:**
```typescript
catch (err: unknown) {
  // Docker not running or no Traefik containers - domains set remains empty
  logVerbose('Docker not available for Traefik label scan', err);
}
```

**Impact:**
- User sees empty domain list with no explanation
- Actual Docker errors (permissions, corrupted daemon) are hidden
- Silent failures make debugging difficult

**Recommendation:** Replace `logVerbose()` with `console.warn()` for operational issues, or use structured error handling that surfaces meaningful messages.

### 3. Promise Resolution Instead of Rejection (Category: Refactor)

**File:** `utils/tilt.ts:72-81`

**Current Code:**
```typescript
child.on('error', (err) => {
  if (options.verbose) {
    console.error('Failed to spawn tilt:', err);
  }
  resolve({
    exitCode: 1,
    stdout,
    stderr: stderr || err.message
  });
});
```

**Issue:** Spawn errors (tilt not installed, permissions issues) resolve instead of reject. The caller gets a "successful" result with exitCode 1. This is defensive coding that hides the real problem.

**Impact:**
- `isTiltAvailable()` correctly returns `false` (exitCode !== 0)
- But actual error reason is lost
- Callers can't distinguish between "tilt not found" vs "tilt execution failed"

**Recommendation:** Reject the promise with a structured error, or at least include the error type in the result.

### 4. Defensive Fallbacks with ?? (Category: Review)

**Pattern:** Using nullish coalescing for default values may mask missing configuration.

| File | Line | Pattern | Assessment |
|------|------|---------|------------|
| `utils/paths.ts:54` | 54 | `String(pkg.name ?? '@tdk/cli')` | ✅ **KEEP** - Fallback for CLI name is reasonable |
| `utils/paths.ts:55` | 55 | `String(pkg.version ?? '0.0.0')` | ✅ **KEEP** - Version fallback is reasonable |
| `utils/services.ts:233` | 233 | `dependencies: resource.config?.internalDependencies ?? []` | ✅ **KEEP** - Empty array is valid default for missing deps |
| `commands/resource.ts:342` | 342 | `showErrorAndExit(validation.error ?? 'Invalid resource name')` | ✅ **KEEP** - Error message fallback is reasonable |
| `commands/config.ts:189` | 189 | `showErrorAndExit(validation.error ?? 'Invalid service')` | ✅ **KEEP** - Error message fallback is reasonable |
| `utils/tilt.ts:66` | 66 | `exitCode: code ?? 0` | 🔴 **BUG** - `null` exit code becomes `0` (success). Should be `1` or reject. |

### 5. Template Code with Defensive Patterns (Category: Keep - Not CLI Code)

**File:** `commands/resource.ts:264-285`

The worker template code includes try-catch blocks:
```typescript
while (true) {
  try {
    const jobs = await fetchJobs();
    // ...
  } catch (error: unknown) {
    console.error('[Worker] Error in main loop:', error);
    // Wait before retrying to avoid tight error loops
    await new Promise(resolve => setTimeout(resolve, CONFIG.pollIntervalMs));
  }
}
```

**Assessment:** ✅ **KEEP** - This is template code generated for user services, not the CLI itself. The defensive patterns are appropriate for long-running workers.

---

## Categorization Summary

### Keep (Appropriate Error Handling)
- `doctor.ts` - All diagnostic checks (expected pattern)
- `upgrade.ts` - npm/bun/GitHub fallbacks (resilience pattern)
- `upgrade.ts` - User-facing error messages with recovery steps
- `errors.ts` - Top-level command wrapper (correct pattern)
- Template code in `resource.ts` (user service patterns)

### Remove/Refactor (Error Hiding)
- `utils/tilt.ts:66` - `code ?? 0` should be `code ?? 1` (null exit code = failure)
- `utils/tilt.ts:72-81` - Should reject on spawn error, not resolve

### Review (Case-by-Case)
- `networks.ts` - Multiple `logVerbose()` catch blocks hide operational issues
  - Line 70: Docker/Traefik scan failure
  - Line 147: HTTP health check failure  
  - Line 158: Port check failure
  - Line 175: Docker container check failure

---

## Specific Issues with Recommendations

### Issue 1: Null Exit Code Treated as Success
**File:** `cli/src/utils/tilt.ts:66`
**Severity:** 🔴 High
```typescript
// BEFORE
exitCode: code ?? 0,  // null exit code = success? Wrong!

// AFTER  
exitCode: code ?? 1,  // null exit code = unknown failure
```

### Issue 2: Spawn Errors Resolved Instead of Rejected
**File:** `cli/src/utils/tilt.ts:72-81`
**Severity:** 🔴 High
```typescript
// BEFORE
child.on('error', (err) => {
  if (options.verbose) {
    console.error('Failed to spawn tilt:', err);
  }
  resolve({ exitCode: 1, stdout, stderr: stderr || err.message });
});

// AFTER
child.on('error', (err) => {
  reject(new Error(`Failed to spawn tilt: ${err.message}`));
});
```

### Issue 3: Silent Docker Errors in Domain Detection
**File:** `cli/src/commands/networks.ts:70-73`
**Severity:** 🟡 Medium
```typescript
// BEFORE
catch (err: unknown) {
  // Docker not running or no Traefik containers - domains set remains empty
  logVerbose('Docker not available for Traefik label scan', err);
}

// AFTER - Option A: Warn user
catch (err: unknown) {
  console.warn(chalk.yellow('⚠️ Could not scan Traefik domains (Docker unavailable)'));
  logVerbose('Docker scan error details', err);
}
```

### Issue 4: Silent Service Status Check Failures
**File:** `cli/src/commands/networks.ts:147-151`, `158-161`, `175-178`
**Severity:** 🟡 Medium

All three service status checks log errors verbosely but silently return 'stopped' or continue. This makes troubleshooting network/service issues difficult.

**Recommendation:** Replace `logVerbose()` with `console.warn()` for operational failures, or accumulate errors and display a summary.

### Issue 5: Installation Detection Returns 'unknown' on Error
**File:** `cli/src/commands/upgrade.ts:44-47`
**Severity:** 🟡 Medium
```typescript
// BEFORE
catch (err: unknown) {
  logVerbose('Installation detection failed', err);
  return { method: 'unknown' };
}

// AFTER
catch (err: unknown) {
  console.warn(chalk.yellow('⚠️ Could not detect installation method'));
  logVerbose('Installation detection error', err);
  return { method: 'unknown' };
}
```

---

## Implementation Priority

### High Confidence (Safe to Change)
1. **Issue 1** (`tilt.ts:66`) - `code ?? 0` → `code ?? 1` - Clear bug fix
2. **Issue 2** (`tilt.ts:72-81`) - Reject on spawn error - Proper error propagation

### Medium Confidence (Review Recommended)
3. **Issue 3-5** - Change `logVerbose()` to `console.warn()` in catch blocks - Improves visibility without breaking functionality

### Keep As-Is
- All doctor.ts error handling (diagnostic pattern)
- All upgrade.ts fallback handling (resilience pattern)
- All template code in resource.ts (not CLI code)
- All validation fallbacks using `??` (reasonable defaults)

---

## Testing Strategy

After changes:
1. Run `npm run typecheck` to verify TypeScript
2. Run `npm test` to ensure tests pass
3. Manual test: `tdk doctor` should still work
4. Manual test: `tdk networks` with Docker stopped should show warnings
5. Manual test: `tdk up` with tilt not installed should fail properly

---

## Conclusion

The TDK CLI has solid error handling for a CLI tool. Most defensive patterns are appropriate for the domain (external system checks, user-friendly fallbacks). The main issues are:

1. **Bug:** Null exit code treated as success in tilt.ts
2. **Anti-pattern:** Promise resolution hiding spawn errors  
3. **UX issue:** Silent failures only visible with TDK_VERBOSE=1

The recommended changes improve error visibility without compromising the CLI's resilience.

---

**Assessment Date:** 2026-05-04  
**Assessor:** Code Quality Specialist  
**Files Analyzed:** 32 TypeScript source files  
**Try-Catch Blocks Found:** 21  
**Defensive Patterns Flagged:** 5
