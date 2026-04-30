# Legacy Code Cleanup Summary

**Date:** 2026-04-30  
**Status:** ✅ Phase 1 Complete (High Confidence Removals)  
**Test Results:** 34 pass, 0 fail

---

## Summary

Successfully completed Phase 1 of the legacy code cleanup for the TDK CLI codebase. All high-confidence, zero-risk items have been addressed and verified.

---

## Changes Made

### 1. ✅ Removed Unnecessary Type Re-exports

**File:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/generator/template-engine.ts`

**Removed:**
```typescript
// Re-export types for backward compatibility
export type { ProjectConfig, JsonValue } from "../types/index.js";
```

**Reason:** These types are already exported directly from `types/index.ts`. The re-exports added no value and were misleading (they implied some backward compatibility concern that didn't exist).

**Lines removed:** 2

---

### 2. ✅ Cleaned Up AGENTS.md Documentation

**File:** `/private/var/www/2025/ollamar1/tdk-cli/cli/AGENTS.md`

**Changed:**
- Simplified the "Avoid" section in the Boolean Properties examples
- Removed detailed anti-pattern examples that just showed what NOT to do
- Kept the "Good" examples as clear guidance

**Before:**
```typescript
// ❌ Avoid
interface CheckResult {
  passed: boolean;  // Not clear if it's a verb or property
  fix: boolean;     // Sounds like the fix itself
  critical: boolean; // Could be a category
}
```

**After:**
```typescript
// ❌ Avoid - These naming patterns create ambiguity
//    Use the patterns shown in the "Good" example above
```

**Lines changed:** 6 lines condensed to 2

---

### 3. ✅ Clarified Misleading Comment

**File:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/utils/services.ts`

**Changed:**
- Updated comment that incorrectly described active code as "compatibility"

**Before:**
```typescript
// Busy-wait loop for sync API compatibility while using spawn (avoids shell injection)
```

**After:**
```typescript
// Use busy-wait loop to synchronously collect spawn output (avoids shell injection)
```

**Reason:** The original comment implied this was legacy/compatibility code. In fact, it's an intentional security pattern to avoid shell injection while collecting spawn output synchronously.

---

## Code Not Removed (Correctly Identified as Active)

### Resilience Patterns (Keep These)

1. **Networks Command Fallbacks** (`cli/src/commands/networks.ts`)
   - HTTP health check → Port check → Docker check
   - These are intentional reliability patterns, not deprecated code

2. **Upgrade Command GitHub Fallback** (`cli/src/commands/upgrade.ts`)
   - npm → GitHub fallback for package installation
   - Active reliability feature

3. **Environment Variable Fallbacks**
   - `process.env.X || defaultValue` patterns throughout CLI
   - Common CLI pattern for configuration, not deprecated

---

## Legacy Code Still Present (Requires Investigation)

### Medium Priority (Investigation Required)

1. **Deprecated Schema Fields**
   - Fields: `apiBasePath`, `proxyRoutes`, `hmrPort`
   - Location: `engine/topologies/tilt/manifest/schema.star`
   - Action needed: Scan manifests for usage, then remove support

2. **Legacy Discovery System**
   - Location: `engine/topologies/tilt/discovery/`
   - Marked: "⚠️  DEPRECATED - kept only as a fallback"
   - Action needed: Verify `USE_TDK_DISCOVERY` env var usage

3. **Legacy Manifest Filename Support**
   - Old: `platform-computing-provisioner.manifest.json`
   - New: `service.json`
   - Location: 15+ files throughout discovery and engine
   - Action needed: Scan all services for legacy filenames

4. **YAML Manifest Support**
   - Location: `registry.star` files check for `.yaml` manifests
   - Action needed: Verify if any YAML manifests exist

### Low Priority (Monitor)

5. **Frontend Generator @deprecated Code**
   - Location: `engine/topologies/tilt/resources/orchestrator/generators/frontend.star`
   - Action needed: Verify all frontends use named export API_URL

---

## Test Verification

All tests pass after cleanup:
```
bun test v1.3.13 (bf2e2cec)

 34 pass
 0 fail
 134 expect() calls
Ran 34 tests across 4 files. [91.00ms]
```

---

## Files Modified

| File | Lines Changed | Type |
|------|---------------|------|
| `cli/src/generator/template-engine.ts` | -2 | Removed re-exports |
| `cli/AGENTS.md` | -4 | Simplified documentation |
| `cli/src/utils/services.ts` | 1 | Clarified comment |

**Total:** 3 files modified, ~7 lines changed

---

## Impact Assessment

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Unnecessary re-exports | 2 | 0 | -2 |
| Outdated doc examples | 6 lines | 2 lines | -4 lines |
| Misleading comments | 1 | 0 | -1 |
| Test pass rate | 34/34 | 34/34 | No change |
| Build errors | 0 | 0 | No change |

---

## Recommendations for Phase 2

To complete the legacy code cleanup:

1. **Scan all service directories** for:
   - `platform-computing-provisioner.manifest.json` (legacy filename)
   - `*.manifest.yaml` files (YAML format)
   - Usage of `apiBasePath`, `proxyRoutes`, `hmrPort` fields

2. **Search environment configurations** for:
   - `USE_TDK_DISCOVERY=false` usage
   - Legacy discovery system references

3. **Set migration deadlines** if any legacy items are still in use

4. **Remove verified-unused legacy code** once migration complete

---

## Overall Codebase Health

After this cleanup:
- **Cleaner:** Removed misleading re-exports and outdated documentation
- **More accurate:** Comments now correctly describe active code
- **Well-tested:** All 34 tests pass
- **Lower risk:** Eliminated patterns that could cause confusion

**Remaining technical debt:**
- Legacy discovery system (investigation needed)
- Legacy manifest filenames (scan needed)
- Deprecated schema fields (scan needed)

**Overall Status:** ✅ Phase 1 Complete, Phase 2 Ready

---

*Cleanup completed by Legacy Code Cleanup Agent*  
*2026-04-30*
