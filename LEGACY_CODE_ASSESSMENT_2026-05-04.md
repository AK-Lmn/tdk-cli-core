# Legacy Code Cleanup Assessment - TDK CLI

**Date:** 2026-05-04  
**Scope:** Comprehensive scan for deprecated, legacy, fallback, and unused code  
**Status:** Research Complete - Ready for Implementation  
**Assessor:** Legacy Code Cleanup Specialist  

---

## Executive Summary

After comprehensive analysis of the TDK CLI codebase, I found **significant legacy code** that can be safely removed. Contrary to previous reports claiming cleanup was "complete", the codebase still contains:

1. **Dead loader files** (`loader_backup.star`, `loader_minimal.star`) - 376 lines total
2. **Deprecated manifest fields** (`dependencies` replaced by `internalDependencies`)
3. **YAML manifest support** that's not actually supported (loader rejects YAML)
4. **Unused backwards compatibility aliases** (`VALID_DOMAINS`)
5. **Redundant manifest filename constants** (`MANIFEST_FILENAME_NEW` = `MANIFEST_FILENAME`)
6. **Legacy manifest filename references** (`platform-computing-provisioner.manifest.json`)

**Key Finding:** No actual legacy manifest files (`platform-computing-provisioner.manifest.json`) exist in the codebase - migration is complete, making legacy filename support removable.

---

## Detailed Findings

### 1. HIGH CONFIDENCE - Safe to Remove (376 lines)

#### 1.1 loader_backup.star - Dead Code

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/loader_backup.star` (338 lines)

**Analysis:**
- **Not imported anywhere** in the codebase (verified with grep)
- Contains old YAML-first loading logic (tries YAML before JSON)
- References `MANIFEST_FILENAME_YAML` constant that **does not exist**
- Superseded by `loader.star` which explicitly rejects YAML files
- File created as backup during refactoring but never removed

**Risk:** NONE - File is completely unused

**Action:** Delete `loader_backup.star`

---

#### 1.2 loader_minimal.star - Dead Code

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/loader_minimal.star` (38 lines)

**Analysis:**
- **Not imported anywhere** in the codebase (verified with grep)
- References `MANIFEST_FILENAME_YAML` constant that **does not exist** (will fail if loaded)
- Superseded by `loader.star` which is the actual loader used
- "Minimal" variant serves no purpose

**Risk:** NONE - File is completely unused and broken (references non-existent constant)

**Action:** Delete `loader_minimal.star`

---

#### 1.3 VALID_DOMAINS Backwards Compatibility Alias

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/constants.star` (line 255)

**Code:**
```starlark
# Backwards compatibility alias
VALID_DOMAINS = VALID_STACKS
```

**Analysis:**
- Not exported in `ManifestConstants` struct (line 226-246)
- Not used anywhere in CLI or engine (verified with grep)
- Comment says "Backwards compatibility" but nothing uses it
- Internal variable only - safe to remove

**Risk:** NONE - Not exported, not used

**Action:** Remove line 255 (VALID_DOMAINS alias)

---

#### 1.4 AGENTS.md Documentation for Non-Existent Constant

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/AGENTS.md` (line 10)

**Current text:**
```markdown
- **`constants.star`** - `MANIFEST_FILENAME`, `MANIFEST_FILENAME_YAML`, validation constants
```

**Analysis:**
- `MANIFEST_FILENAME_YAML` constant does not exist in constants.star
- Current loader explicitly rejects YAML files
- Documentation is misleading and outdated

**Risk:** NONE - Documentation only

**Action:** Update AGENTS.md to remove `MANIFEST_FILENAME_YAML` reference

---

### 2. MEDIUM CONFIDENCE - Remove After Verification

#### 2.1 Deprecated `dependencies` Field in Schema

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/schema.star` (lines 156-166)

**Code:**
```starlark
'dependencies': {
    'type': 'list',
    'required': False,
    'constraints': {
        'item_type': 'string',
        'max_length': VALIDATION_THRESHOLDS['max_dependencies'],
    },
    'description': 'Legacy field - use internalDependencies',
    'deprecated': True,
    'default': [],
},
```

**Analysis:**
- Marked as deprecated with `'deprecated': True`
- Replaced by `internalDependencies` field (lines 146-155)
- **Verification:** Searched all manifest files in `/discovery/services/` - **no usage found**
- normalize.star (line 103-106) has fallback logic: tries `dependencies` first, then `internalDependencies`

**Risk:** LOW - No manifests use the old field

**Action:**
1. Remove `dependencies` field from schema (lines 156-166)
2. Remove from `MANIFEST_DEFAULTS` in constants.star (line 160)
3. Simplify normalize.star to only use `internalDependencies` (line 103-106)

---

#### 2.2 YAML Manifest Filename Constant

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/constants.star` (lines 98-99)

**Code:**
```starlark
MANIFEST_FILENAME_NEW = 'service.json'
MANIFEST_FILENAME_NEW_YAML = 'service.yaml'
```

**Analysis:**
- `MANIFEST_FILENAME_NEW` is identical to `MANIFEST_FILENAME` (line 97) - redundant
- `MANIFEST_FILENAME_NEW_YAML = 'service.yaml'` - but loader.star explicitly rejects YAML files with error:
  > "YAML files are for Tilt resource tracking only. Use JSON for data"
- No YAML manifests exist in the codebase
- These constants suggest YAML support but it's not actually implemented

**Risk:** LOW - Constants are exported but likely not used by consumers

**Action:**
1. Remove `MANIFEST_FILENAME_NEW` (redundant)
2. Remove `MANIFEST_FILENAME_NEW_YAML` (not supported)
3. Remove from `ManifestConstants` struct export (line 228-229)
4. Update any references in AGENTS.md

---

#### 2.3 Simplify MANIFEST_SEARCH_ORDER

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/topologies/tilt/manifest/constants.star` (lines 102-104)

**Code:**
```starlark
MANIFEST_SEARCH_ORDER = [
    MANIFEST_FILENAME,
]
```

**Analysis:**
- Array with only one element - over-engineering
- Used in loader.star to check for manifests, but only one filename exists
- Legacy support for multiple filenames is gone

**Risk:** LOW - Simple simplification

**Action:** Remove `MANIFEST_SEARCH_ORDER` constant and use `MANIFEST_FILENAME` directly in loader.star

---

### 3. LEGACY FILENAME SUPPORT - Migration Complete

#### 3.1 LEGACY_MANIFEST in Resource Patterns

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/engine/paths.star` (lines 414, 456)

**Code:**
```starlark
RESOURCE_PATTERNS = struct(
    MANIFEST_FILE = "service.json",
    LEGACY_MANIFEST = "platform-computing-provisioner.manifest.json",
    ...
)

DISCOVERY = struct(
    MANIFEST_PATTERNS = [
        "**/service.json",
        "**/platform-computing-provisioner.manifest.json",
    ],
    ...
)
```

**Analysis:**
- **VERIFIED:** No files named `platform-computing-provisioner.manifest.json` exist in the codebase
- All current manifests use `service.json`
- Legacy filename support was for migration period (now complete)
- `LEGACY_MANIFEST` constant is not used anywhere

**Risk:** NONE - No files use legacy naming

**Action:**
1. Remove `LEGACY_MANIFEST` from `RESOURCE_PATTERNS` (line 414)
2. Remove legacy pattern from `MANIFEST_PATTERNS` (line 456)

---

#### 3.2 Legacy Filename References in Discovery

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/discovery/registry.star` (line 695)

**Code:**
```starlark
# Find all JSON manifests (both legacy and new naming)
```

**Analysis:**
- Comment suggests dual-filename support still exists
- But all discovery code now only looks for `service.json`
- `find_service_json_files()` in services.ts only searches for `service.json`

**Risk:** NONE - Comment only, code already only uses new filename

**Action:** Update comment to remove "(both legacy and new naming)" reference

---

### 4. KEEP - Active Reliability Patterns

#### 4.1 Networks Command Fallback Mechanisms

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/commands/networks.ts`

**Analysis:** These are **NOT deprecated code** - they are intentional fallback mechanisms for reliability:
- Method 1: HTTP health check (primary)
- Method 2: Port listening check (fallback when no URL)
- Method 3: Docker container check (fallback for containerized services)

**Risk:** NONE - Active resilience patterns

**Action:** KEEP

---

#### 4.2 Upgrade Command GitHub Fallbacks

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/commands/upgrade.ts` (lines 87-128)

**Analysis:** These are **NOT deprecated code** - they ensure upgrades work even when npm registry is unavailable. The package may not be published to npm yet.

**Risk:** NONE - Active reliability patterns

**Action:** KEEP

---

#### 4.3 normalize.star dependencies Fallback

**Location:** `/private/var/www/2025/ollamar1/tdk-cli/discovery/manifest/normalize.star` (lines 102-106)

**Code:**
```starlark
# 🎯 EXTRACT dependencies for registry (supports both new and legacy fields)
manifest_deps = normalized.get('dependencies')
if manifest_deps == None:
    manifest_deps = normalized.get('internalDependencies', [])
normalized['serviceDependencies'] = manifest_deps
```

**Analysis:**
- This is a **current compatibility shim** for the deprecated `dependencies` field
- Once the deprecated field is removed from schema, this can be simplified
- This is not "legacy code to remove" but "code to simplify after schema change"

**Action:** Simplify after removing `dependencies` from schema (remove fallback, only use `internalDependencies`)

---

## Summary of Removals

| Category | Files/Lines | Risk Level | Action |
|----------|-------------|------------|--------|
| **loader_backup.star** | 338 lines | NONE | Delete file |
| **loader_minimal.star** | 38 lines | NONE | Delete file |
| **VALID_DOMAINS alias** | 1 line | NONE | Remove line 255 |
| **AGENTS.md outdated ref** | 1 line | NONE | Update documentation |
| **deprecated `dependencies` field** | 10 lines | LOW | Remove from schema |
| **dependencies in MANIFEST_DEFAULTS** | 1 line | LOW | Remove from constants |
| **MANIFEST_FILENAME_NEW** | 2 lines | LOW | Remove redundant constant |
| **MANIFEST_FILENAME_NEW_YAML** | 2 lines | LOW | Remove unsupported constant |
| **MANIFEST_SEARCH_ORDER** | 4 lines | LOW | Simplify to single filename |
| **LEGACY_MANIFEST constant** | 1 line | NONE | Remove unused constant |
| **Legacy manifest pattern** | 1 line | NONE | Remove from patterns |
| **normalize.star fallback** | 4 lines | LOW | Simplify after schema change |
| **TOTAL LINES TO REMOVE** | **~400 lines** | - | - |

---

## Implementation Priority

### Phase 1: High Confidence (Immediate) - 4 items
1. Delete `loader_backup.star` (338 lines)
2. Delete `loader_minimal.star` (38 lines)
3. Remove `VALID_DOMAINS` alias from constants.star (1 line)
4. Update AGENTS.md to remove `MANIFEST_FILENAME_YAML` reference

### Phase 2: Schema Cleanup - 5 items
5. Remove deprecated `dependencies` field from schema.star
6. Remove `dependencies` from `MANIFEST_DEFAULTS` in constants.star
7. Simplify normalize.star to only use `internalDependencies`
8. Remove `MANIFEST_FILENAME_NEW` and `MANIFEST_FILENAME_NEW_YAML` constants
9. Simplify `MANIFEST_SEARCH_ORDER` to single filename

### Phase 3: Legacy Filename Cleanup - 2 items
10. Remove `LEGACY_MANIFEST` from paths.star
11. Remove legacy pattern from `MANIFEST_PATTERNS` in paths.star
12. Update comment in discovery/registry.star

---

## Verification Plan

After each removal:
1. Run `bun test` in cli/ directory
2. Run `tilt up --dry-run` in a test project
3. Verify `tdk doctor` still passes
4. Check `tdk networks` works correctly
5. Verify `tdk upgrade --dry-run` completes
6. Test manifest loading with existing services

---

## Notes

### Previous Assessment Updates

The previous LEGACY_CODE_ASSESSMENT.md (2026-04-30) mentioned:
- Template re-exports in template-engine.ts (lines 19-20) - **ALREADY REMOVED**
- AGENTS.md "Avoid" section - **Already cleaned up**
- services.ts compatibility comment - **Not found** (may have been removed already)
- Deprecated schema fields (`apiBasePath`, `proxyRoutes`, `hmrPort`) - **Not found** in current code
- YAML manifest support - **Confirmed: loader rejects YAML, no YAML files exist**

### Key Discovery

The most significant finding is that **no actual legacy manifest files exist** (`platform-computing-provisioner.manifest.json`). The migration to `service.json` is complete, making all legacy filename support code removable.

---

*Assessment completed. Ready for implementation phase.*

**Total estimated removal: ~400 lines of dead/legacy code**
