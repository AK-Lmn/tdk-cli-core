# Legacy Code Cleanup Assessment

**Date:** 2026-04-30  
**Scope:** Full codebase scan for deprecated, legacy, and fallback code  
**Status:** Research Complete - Ready for Implementation

---

## Executive Summary

After comprehensive analysis of the TDK CLI codebase, I found **significant legacy code** that needs cleanup. Contrary to previous reports claiming the cleanup was "complete", the codebase still contains:

1. **Active legacy discovery system** marked as deprecated but still present
2. **Legacy manifest filename support** (`platform-computing-provisioner.manifest.json`) throughout the engine
3. **Deprecated schema fields** (`apiBasePath`, `proxyRoutes`, `hmrPort`) still being parsed
4. **Compatibility aliases** that have been superseded by modern implementations
5. **YAML manifest support** that may be unused
6. **Documentation** that describes already-refactored patterns

---

## Detailed Findings

### 1. HIGH CONFIDENCE - Safe to Remove

#### 1.1 Template Re-exports for "Backward Compatibility"

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/generator/template-engine.ts`

**Code (lines 19-20):**
```typescript
// Re-export types for backward compatibility
export type { ProjectConfig, JsonValue } from "../types/index.js";
```

**Analysis:**
- These types are already exported from `types/index.ts`
- This re-export serves no purpose since consumers can import directly from types
- No unique functionality added

**Risk:** NONE - These are pure type re-exports

**Action:** Remove lines 19-20

---

#### 1.2 AGENTS.md "Deprecated Patterns" Section Still Exists

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/AGENTS.md` lines 43-49

**Analysis:**
- The "Avoid" section shows old patterns (wildcard exports, `passed` property)
- These patterns have already been refactored
- The documentation just describes what NOT to do
- The file still contains this guidance

**Risk:** NONE - Documentation only

**Action:** Remove or consolidate the "Avoid" examples section (lines 43-49)

---

#### 1.3 Comments in CLI Referring to "Compatibility"

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/utils/services.ts` line 436

**Code:**
```typescript
// Busy-wait loop for sync API compatibility while using spawn (avoids shell injection)
```

**Analysis:**
- This is a legitimate implementation pattern, not a deprecated code path
- The comment is misleading - this is active code, not legacy compatibility

**Risk:** NONE - This is active code, comment should be clarified

**Action:** Update comment to describe actual purpose, not "compatibility"

---

### 2. MEDIUM CONFIDENCE - Investigation Required

#### 2.1 Deprecated Schema Fields Still Parsed

**Locations:**
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/schema.star` (defines fields)
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/parser.star` line with `deprecated_fields`
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/constants.star` (defines default values)
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/generators/vite/frontend.star` (uses fields)

**Fields:** `apiBasePath`, `proxyRoutes`, `hmrPort`

**Analysis:**
- Parser generates warnings when these fields are used
- But code still processes them (see frontend.star generator)
- Need to verify no active manifests use these fields

**Risk:** MEDIUM - May break manifests using deprecated fields

**Action:**
1. Search all manifests for usage of these fields
2. If none found, remove support
3. If found, migrate manifests first

---

#### 2.2 Legacy Discovery System Still Present

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/discovery/`

**Files affected:**
- `registry.star` - explicitly marked "⚠️  DEPRECATED" in header
- `discovery_orchestrator.star` - marked deprecated
- `constants.star` - marked deprecated
- `manifest/loading.star` - deprecated but still used

**Analysis:**
- Comments state these are "kept only as a fallback when USE_TDK_DISCOVERY=false"
- The primary discovery system is now in `/discovery/` directory
- Need to verify `USE_TDK_DISCOVERY` environment variable is no longer used

**Risk:** MEDIUM - May break environments using old discovery

**Action:**
1. Search codebase for `USE_TDK_DISCOVERY` usage
2. If not used, remove entire `engine/topologies/tilt/discovery/` directory
3. If used, deprecate and set migration deadline

---

#### 2.3 Legacy Manifest Filename Still Supported

**Pattern:** Dual support for filenames
- New: `service.json`
- Legacy: `platform-computing-provisioner.manifest.json`

**Locations (15+ files):**
- `/private/var/www/2025/ollamar1/tdk-cli/discovery/manifest/loading.star` (lines 86, 101)
- `/private/var/www/2025/ollamar1/tdk-cli/discovery/registry.star` (lines 720-727)
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/discovery/manifest/loading.star` (lines 101, 415-418)
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/discovery/registry.star` (lines 816-823)
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/loader.star` (line 117, 156, 166)
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/constants.star` (line 97-99)

**Analysis:**
- Deprecation warnings printed when legacy filenames used
- Dual-filename code adds complexity
- Synthesis-by-default reduces need for manifests anyway
- Migration likely complete but unverified

**Risk:** MEDIUM - May break projects using old filenames

**Action:**
1. Scan all services for legacy manifest filenames
2. If migration complete, remove legacy support
3. If not complete, set migration deadline

---

### 3. LOW CONFIDENCE - Keep (Active Resilience Patterns)

#### 3.1 Networks Command Status Check Fallbacks

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/commands/networks.ts` lines 185-234

**Analysis:** These are **NOT deprecated code** - they are intentional fallback mechanisms for reliability. Each method handles different scenarios:
- Method 1: HTTP health check (primary)
- Method 2: Port listening check (fallback when no URL)
- Method 3: Docker container check (fallback for containerized services)

**Risk:** NONE - Active resilience patterns

**Action:** KEEP

---

#### 3.2 Upgrade Command GitHub Fallbacks

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/commands/upgrade.ts` lines 94-148

**Analysis:** These are **NOT deprecated code** - they ensure upgrades work even when npm registry is unavailable. The package may not be published to npm yet.

**Risk:** NONE - Active reliability patterns

**Action:** KEEP

---

#### 3.3 YAML Manifest Support

**Pattern:** Support for `.yaml` manifest files

**Locations:**
- `/private/var/www/2025/ollamar1/tdk-cli/discovery/registry.star` line 720
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/discovery/registry.star` line 816
- `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/constants.star` line 99

**Analysis:**
- All current manifests appear to use `.json` format
- YAML support may be unused
- Need to scan all manifests to confirm

**Risk:** MEDIUM - Need to verify no YAML manifests exist

**Action:**
1. Scan all service directories for `.yaml` manifests
2. If none found, remove YAML support code
3. If found, keep support

---

### 4. INVESTIGATION REQUIRED - Dead Code?

#### 4.1 `USE_TDK_DISCOVERY` Environment Variable

**Pattern:** Feature flag for discovery system selection

**Analysis:**
- Referenced in comments as the switch between old/new discovery
- Need to verify if this is actively used anywhere

**Risk:** MEDIUM - Unknown usage patterns

**Action:** Search codebase for actual env var usage

---

#### 4.2 Frontend Generator @deprecated Code Path

**Location:** `engine/topologies/tilt/resources/orchestrator/generators/frontend.star` line 111

**Text mentioned in reports:** `@deprecated Use named export API_URL instead`

**Analysis:**
- Related to how frontend resources access API URLs
- Need to verify code has been updated to use named export
- If migration complete, remove deprecated code path

**Risk:** LOW - Need to verify no generated code uses old pattern

**Action:**
1. Check frontend.star generator code
2. Verify all frontends use named export
3. Remove deprecated code path if complete

---

## Risk Summary

| Category | Count | Risk Level | Action |
|----------|-------|------------|--------|
| Type re-exports | 1 | NONE | Remove |
| Documentation | 1 | NONE | Remove outdated examples |
| Comments | 1 | NONE | Clarify misleading comment |
| Deprecated schema fields | 3 | MEDIUM | Investigate usage |
| Legacy discovery system | 15+ files | MEDIUM | Investigate `USE_TDK_DISCOVERY` |
| Legacy manifest filenames | 15+ files | MEDIUM | Scan for usage |
| YAML manifest support | 3+ files | MEDIUM | Scan for usage |
| Active resilience | 3 | NONE | Keep |

---

## Implementation Priority

### Phase 1: High Confidence (Immediate) - 3 items
1. Remove template-engine.ts re-exports (lines 19-20)
2. Clean up AGENTS.md "Avoid" section (lines 43-49)
3. Clarify services.ts comment (line 436)

### Phase 2: Investigation Required - 4 items
4. Scan manifests for deprecated field usage (`apiBasePath`, `proxyRoutes`, `hmrPort`)
5. Search for `USE_TDK_DISCOVERY` environment variable usage
6. Scan for legacy manifest filenames (`platform-computing-provisioner.manifest.json`)
7. Scan for YAML manifest files

### Phase 3: Planned Deprecation - 2 items
8. Set migration deadline for legacy manifest filenames (if still in use)
9. Add telemetry to legacy discovery system (if still used)

---

## Test Verification Plan

After each removal:
1. Run `bun test` in cli/ directory
2. Run `tilt up --dry-run` in a test project
3. Verify `tdk doctor` still passes
4. Check `tdk networks` works correctly
5. Verify `tdk upgrade --dry-run` completes

---

*Assessment completed. Ready for implementation phase.*
