# Deprecated/Legacy/Fallback Code Assessment

**Date:** 2026-04-30  
**Analyzer:** TDK CLI Code Cleanup Agent  
**Scope:** Full codebase scan for deprecated, legacy, and fallback code

---

## Executive Summary

After comprehensive analysis of the TDK CLI codebase, I found a **relatively clean codebase** with minimal deprecated code. The project has been well-maintained through recent refactoring efforts (domain→stack migration, service→resource migration). Most "deprecated" markers are actually:
- **Active resilience patterns** (fallback methods for reliability)
- **Intentional backward compatibility** (legacy manifest filename support)
- **Documentation-only** deprecated pattern references

---

## 1. HIGH CONFIDENCE - Safe to Remove

### 1.1 `engine/spec.master.pre-migration` (BACKUP FILE)
- **Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/spec.master.pre-migration`
- **Size:** ~698 lines
- **Type:** Migration backup file
- **Analysis:** This is a pre-migration backup of the spec.master file. The migration has been completed successfully and this file serves no active purpose. It is not referenced anywhere in the codebase.
- **Risk:** **NONE** - Pure cleanup
- **Action:** DELETE

### 1.2 Deprecated Pattern Documentation (AGENTS.md)
- **Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/AGENTS.md` lines 389-405
- **Type:** Documentation of already-refactored patterns
- **Analysis:** This section documents 4 deprecated patterns (wildcard exports, `Errors` factory, `passed` property, generic `Error`). These patterns have already been refactored out of the codebase. The documentation itself is now clutter.
- **Risk:** **NONE** - Documentation only
- **Action:** REMOVE the deprecated patterns section

### 1.3 Compatibility Alias Function (Template)
- **Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/templates/TILT_RESOURCE_DEFAULTS.star.hbs` lines 121-124
- **Code:**
  ```starlark
  # Alias for TDK engine compatibility
  def get_default_port(resource_type, domain_index=0, resource_index=0):
      """Alias for get_resource_port for TDK engine compatibility."""
      return get_resource_port(resource_type, domain_index, resource_index)
  ```
- **Type:** Function alias for backward compatibility
- **Analysis:** The comment indicates this is for "TDK engine compatibility" but:
  1. The engine has been updated to use `get_resource_port` (the canonical name)
  2. The alias uses old terminology (`domain_index` instead of `stack_index`)
  3. The alias duplicates functionality without adding value
- **Risk:** **LOW** - Need to verify no active code uses `get_default_port`
- **Action:** REMOVE after verifying no references exist

---

## 2. MEDIUM CONFIDENCE - KEEP (With Monitoring)

### 2.1 Legacy Discovery System (`engine/topologies/tilt/discovery/`)
- **Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/discovery/`
- **Files:** 15+ Starlark files
- **Type:** Feature-flagged fallback system
- **Analysis:** 
  - Marked as deprecated with clear comments
  - Kept as fallback when `USE_TDK_DISCOVERY=false`
  - Comments state: "kept only as a fallback"
  - Primary discovery system is in `/discovery/` directory
- **Risk:** **MEDIUM** - Unknown if any environments still use `USE_TDK_DISCOVERY=false`
- **Action:** KEEP for now, add telemetry to determine usage

### 2.2 Legacy Manifest Filename Support
- **Pattern:** Dual-filename support across multiple files
- **Legacy name:** `platform-computing-provisioner.manifest.json`
- **New name:** `service.json`
- **Locations:**
  - `discovery/manifest/loading.star` (lines 86, 397-400)
  - `discovery/registry.star` (lines 720-727)
  - `engine/topologies/tilt/discovery/manifest/loading.star` (lines 101, 415-418)
  - `engine/topologies/tilt/discovery/registry.star` (lines 816-823)
- **Type:** Backward compatibility during migration
- **Analysis:** 
  - Clear deprecation warnings are printed when legacy filenames are used
  - Migration from old to new filenames is likely complete but unverified
  - Synthesis-by-default reduces need for explicit manifests anyway
- **Risk:** **MEDIUM** - May break projects that haven't migrated manifests
- **Action:** KEEP for now, add deprecation warning with migration deadline

---

## 3. LOW CONFIDENCE - KEEP (Active Resilience Patterns)

### 3.1 Networks Command Status Check Fallbacks
- **Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/commands/networks.ts`
- **Lines:** 198-234
- **Methods:**
  1. HTTP health check (primary)
  2. Port listening check (fallback)
  3. Docker container check (fallback)
- **Type:** Active resilience pattern
- **Analysis:** These are **NOT deprecated code** - they are intentional fallback mechanisms for reliability. Each method handles different scenarios (network vs localhost vs containerized).
- **Risk:** **NONE** - Active feature, not deprecated
- **Action:** KEEP

### 3.2 Upgrade Command GitHub Fallbacks
- **Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/commands/upgrade.ts`
- **Lines:** 94-148
- **Pattern:** npm registry → GitHub fallback
- **Type:** Active reliability pattern
- **Analysis:** These are **NOT deprecated code** - they ensure upgrades work even when npm registry is unavailable. The package may not be published to npm yet.
- **Risk:** **NONE** - Active feature, not deprecated
- **Action:** KEEP

### 3.3 Environment Variable Fallbacks
- **Pattern:** `process.env.TDK_PROJECT_ROOT` with fallback to current directory
- **Locations:** Multiple files across the codebase
- **Type:** Configuration fallback
- **Analysis:** These are **NOT deprecated code** - they provide sensible defaults when environment variables aren't set. Common pattern for CLI tools.
- **Risk:** **NONE** - Active feature, not deprecated
- **Action:** KEEP

---

## 4. OBSOLETE WORKAROUNDS - Investigation Required

### 4.1 Deprecated Schema Fields
- **Location:** `engine/topologies/tilt/manifest/schema.star`
- **Fields:** `apiBasePath`, `proxyRoutes`, `hmrPort`
- **Type:** Deprecated manifest fields
- **Analysis:** 
  - Schema marks these as deprecated
  - Parser generates warnings when they're used
  - Need to verify no active manifests use these fields
- **Risk:** **LOW-MEDIUM** - Need to check production manifests
- **Action:** VERIFY no usage, then remove support

### 4.2 @deprecated JSDoc in Frontend Generator
- **Location:** `engine/topologies/tilt/resources/orchestrator/generators/frontend.star` line 111
- **Text:** `@deprecated Use named export API_URL instead`
- **Type:** Code-level deprecation marker
- **Analysis:** 
  - Related to how frontend resources access API URLs
  - Need to verify code has been updated to use named export
- **Risk:** **LOW** - Need to verify no generated code uses old pattern
- **Action:** VERIFY, then remove deprecated code path

---

## 5. DEAD CODE PATHS - Investigation Required

### 5.1 YAML Manifest Support
- **Pattern:** `.yaml` manifest file support
- **Locations:** 
  - Multiple registry.star files check for `.yaml` manifests
- **Analysis:** 
  - All current manifests appear to use `.json` format
  - YAML support may be unused
- **Risk:** **MEDIUM** - Need to verify no YAML manifests exist
- **Action:** SCAN all manifests, remove YAML support if unused

### 5.2 `USE_TDK_DISCOVERY` Environment Variable
- **Pattern:** Feature flag for discovery system selection
- **Analysis:** 
  - Referenced in comments as the switch between old/new discovery
  - Need to verify if this is actively used anywhere
- **Risk:** **MEDIUM** - Unknown usage patterns
- **Action:** SEARCH codebase for actual env var usage

---

## Risk Summary

| Category | Count | Risk Level | Action |
|----------|-------|------------|--------|
| Backup files | 1 | NONE | Remove |
| Documentation | 1 | NONE | Remove |
| Compatibility aliases | 1 | LOW | Verify & Remove |
| Legacy systems | 2 | MEDIUM | Monitor & Plan |
| Active resilience | 3 | NONE | Keep |
| Deprecated fields | 2 | LOW-MEDIUM | Verify & Remove |
| Potentially dead code | 2 | MEDIUM | Investigate |

---

## Implementation Priority

### Phase 1: High Confidence (Immediate)
1. ✅ Remove `spec.master.pre-migration`
2. ✅ Clean up AGENTS.md deprecated patterns section
3. ✅ Remove `get_default_port` alias (after verification)

### Phase 2: Investigation Required
4. ⏳ Verify `USE_TDK_DISCOVERY` usage
5. ⏳ Scan for YAML manifest usage
6. ⏳ Verify deprecated schema field usage
7. ⏳ Verify `get_default_port` references

### Phase 3: Planned Deprecation
8. ⏳ Set migration deadline for legacy manifest filenames
9. ⏳ Add telemetry to legacy discovery system
10. ⏳ Schedule removal of confirmed-unused systems

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
