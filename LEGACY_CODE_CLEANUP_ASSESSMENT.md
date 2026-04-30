# Legacy Code Cleanup - Critical Assessment

**Date:** 2026-04-30
**Scope:** Comprehensive analysis of deprecated, legacy, and fallback code
**Status:** Assessment Complete - Ready for Implementation

---

## Executive Summary

After thorough analysis of the TDK CLI codebase, I've identified legacy code patterns across multiple categories. The codebase has significant legacy infrastructure that appears to be unused but still maintained.

---

## Category 1: HIGH CONFIDENCE - Safe to Remove

### 1.1 Deprecated Schema Fields (apiBasePath, proxyRoutes, hmrPort)

**Locations:**
- `engine/topologies/tilt/manifest/schema.star` (lines 267-287)
- `engine/topologies/tilt/manifest/parser.star` (lines 68-73)
- `engine/topologies/tilt/manifest/constants.star` (lines 161-167)
- `engine/topologies/tilt/generators/vite/frontend.star` (lines 58, 67-68)
- `discovery/manifest/loading.star` (lines 275-276)
- `engine/schemas/manifest-schema.json` and `engine/schemas/service-schema.json`

**Analysis:**
- Fields are marked as deprecated in the schema with `deprecated: True`
- Parser generates warnings when these fields are encountered
- Code still provides fallback defaults for these fields
- **VERIFIED:** No actual manifest files in the codebase use these fields
- The frontend generator uses them as fallbacks but all modern manifests use `traefik.pathPrefix` instead

**Risk:** NONE - Fields are not used in any manifests

**Action:** Remove support for these deprecated fields:
1. Remove from schema.star
2. Remove from parser.star warning logic
3. Remove from constants.star defaults
4. Update frontend.star to use modern patterns only
5. Remove from JSON schemas

---

### 1.2 USE_TDK_DISCOVERY Environment Variable References

**Locations:**
- `engine/topologies/tilt/discovery/registry.star` (line 6)
- `engine/topologies/tilt/discovery/discovery_orchestrator.star` (line 4)
- `engine/topologies/tilt/discovery/constants.star` (line 6)

**Analysis:**
- Comments state these files are "kept only as a fallback when USE_TDK_DISCOVERY=false"
- **VERIFIED:** No actual environment variable check exists in the codebase
- The primary discovery system in `/discovery/` is always used
- The deprecated system in `/engine/topologies/tilt/discovery/` is never invoked

**Risk:** NONE - Environment variable is never checked, deprecated system is unreachable code

**Action:** Update deprecation notices to reflect actual status (the system is unused, not just deprecated)

---

### 1.3 @deprecated JSDoc in Frontend Generator

**Location:** `engine/topologies/tilt/resources/orchestrator/generators/frontend.star` (line 111)

**Analysis:**
- Generated code includes `@deprecated` JSDoc for default export
- Pattern: `export default API_URL` is deprecated in favor of named export `export const API_URL`
- **VERIFIED:** All generated code still includes the deprecated default export
- This creates technical debt in generated artifacts

**Risk:** LOW - Changes generated code pattern, may affect consumers using default import

**Action:** Remove the default export from the template, keeping only named exports

---

## Category 2: MEDIUM CONFIDENCE - Investigation Required

### 2.1 Legacy Discovery System (engine/topologies/tilt/discovery/)

**Files:** 15+ files in the directory
- `registry.star` (930 lines)
- `discovery_orchestrator.star` (230+ lines)
- `constants.star` (76 lines)
- `config.star`, `libraries.star`, `loading.star`, etc.

**Analysis:**
- Entire directory is marked as deprecated
- Contains duplicate functionality to the primary `/discovery/` system
- **VERIFIED:** No active usage found - the entrypoint.star uses the primary discovery system
- Estimated 2000+ lines of dead code

**Risk:** MEDIUM - Code is unused but deletion is large scope

**Action:** After verification, delete the entire directory

---

### 2.2 Legacy Manifest Filename Support

**Pattern:** Dual support for:
- New: `service.json`
- Legacy: `platform-computing-provisioner.manifest.json`

**Locations:**
- `engine/topologies/tilt/manifest/constants.star` (lines 97-108)
- `engine/topologies/tilt/manifest/loader.star` (lines 117, 156)
- `discovery/manifest/loading.star` (lines 86, 101)
- `discovery/registry.star` (lines 720-727)

**Analysis:**
- Code searches for both filenames, issues deprecation warning for legacy
- **VERIFIED:** All 2 manifest files found use `service.json` (new name)
- No legacy filenames found in the codebase
- Deprecation warnings are being printed unnecessarily

**Risk:** MEDIUM - May break external projects using old filename

**Action:** Remove legacy filename support, keep only `service.json`

---

### 2.3 YAML Manifest Support

**Locations:**
- `engine/topologies/tilt/manifest/constants.star` (lines 99, 103)
- `engine/topologies/tilt/manifest/loader.star` (line 63)
- `discovery/registry.star` (lines 720-740)

**Analysis:**
- Constants define YAML manifest filenames
- Loader explicitly rejects YAML with error message
- Discovery has code to find and load YAML files
- **VERIFIED:** No YAML manifest files exist in the codebase
- YAML loading appears to be dead code

**Risk:** MEDIUM - May be intended for future Tilt integration

**Action:** Remove YAML support code (not used, rejected by loader anyway)

---

## Category 3: LOW CONFIDENCE - Keep for Now

### 3.1 Legacy Field Migration Warnings

**Location:** `engine/topologies/tilt/manifest/parser.star` (lines 75-79)

**Analysis:**
- Warns about legacy `dependencies` field vs `internalDependencies`
- Serves as migration guidance for manifest authors
- Low maintenance cost

**Risk:** NONE - Low cost, provides value

**Action:** KEEP

---

### 3.2 Resilience Fallback Patterns

**Locations:**
- `cli/src/commands/networks.ts` (health check fallbacks)
- `cli/src/commands/upgrade.ts` (npm → GitHub fallback)

**Analysis:**
- These are intentional reliability patterns, not deprecated code
- Each fallback serves a specific resilience purpose

**Risk:** NONE - Active reliability features

**Action:** KEEP

---

## Implementation Priority

### Phase 1: High Confidence (Immediate) - 5 items
1. Remove deprecated schema fields (apiBasePath, proxyRoutes, hmrPort)
2. Remove deprecated field default values from constants.star
3. Update frontend.star to stop using deprecated field fallbacks
4. Update parser.star to remove deprecated field warnings
5. Remove @deprecated default export from frontend generator

### Phase 2: Medium Confidence (After Verification) - 3 items
1. Remove entire `engine/topologies/tilt/discovery/` directory (~2000 lines)
2. Remove legacy manifest filename support (platform-computing-provisioner.manifest.json)
3. Remove YAML manifest support code

---

## Risk Assessment Summary

| Category | Count | Lines | Risk Level | Priority |
|----------|-------|-------|------------|----------|
| Deprecated schema fields | 3 | ~50 | NONE | HIGH |
| Unreachable discovery system | 1 | ~2000 | MEDIUM | MEDIUM |
| Legacy filename support | 2 | ~30 | MEDIUM | MEDIUM |
| YAML support | 3 | ~40 | MEDIUM | LOW |
| Active resilience patterns | 2 | ~100 | NONE | KEEP |

---

## Verification Plan

After each removal:
1. Run `bun test` in cli/ directory
2. Run `tilt up --dry-run` in a test project
3. Verify `tdk doctor` still passes
4. Check `tdk networks` works correctly

---

*Assessment completed. Ready for implementation phase.*
