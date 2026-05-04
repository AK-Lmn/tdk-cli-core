# Legacy Code Cleanup Report - TDK CLI

**Date:** 2026-05-04  
**Status:** COMPLETE  
**Total Lines Removed:** ~400 lines

---

## Summary

Comprehensive legacy code cleanup of the TDK CLI codebase has been completed. All high-confidence and medium-confidence legacy items identified in the assessment have been removed or simplified.

**All 37 tests pass** confirming no regressions were introduced.

---

## Removals Made

### 1. DELETED FILES (376 lines)

| File | Lines | Reason |
|------|-------|--------|
| `engine/topologies/tilt/manifest/loader_backup.star` | 338 | Not imported anywhere, dead code |
| `engine/topologies/tilt/manifest/loader_minimal.star` | 38 | Not imported anywhere, broken (references non-existent constant) |

### 2. REMOVED CONSTANTS & ALIASES

| Location | Lines | Item Removed | Reason |
|----------|-------|--------------|--------|
| `engine/topologies/tilt/manifest/constants.star:255` | 1 | `VALID_DOMAINS` alias | Not exported, not used |
| `engine/topologies/tilt/manifest/constants.star:98` | 1 | `MANIFEST_FILENAME_NEW` | Redundant (same as `MANIFEST_FILENAME`) |
| `engine/topologies/tilt/manifest/constants.star:99` | 1 | `MANIFEST_FILENAME_NEW_YAML` | Not supported (loader rejects YAML) |
| `engine/topologies/tilt/manifest/constants.star:102-104` | 3 | `MANIFEST_SEARCH_ORDER` | Over-engineering (only had 1 item) |
| `engine/topologies/tilt/manifest/constants.star:160` | 1 | `dependencies` from `MANIFEST_DEFAULTS` | Field deprecated |
| `engine/paths.star:414` | 1 | `LEGACY_MANIFEST` constant | Migration complete, no legacy files exist |
| `engine/paths.star:456` | 1 | Legacy pattern in `MANIFEST_PATTERNS` | Migration complete |

### 3. REMOVED FROM SCHEMA

| Location | Lines | Item Removed | Reason |
|----------|-------|--------------|--------|
| `engine/topologies/tilt/manifest/schema.star:156-166` | 11 | `dependencies` field definition | Deprecated, replaced by `internalDependencies` |

### 4. SIMPLIFIED CODE

| Location | Lines Changed | Description |
|----------|---------------|-------------|
| `discovery/manifest/normalize.star:102-106` | 4 → 1 | Removed fallback logic for deprecated `dependencies` field, now only uses `internalDependencies` |
| `engine/topologies/tilt/manifest/loader.star:207` | Updated | `get_manifest_search_order()` now returns `[MANIFEST_FILENAME]` directly |

### 5. DOCUMENTATION UPDATES

| Location | Change |
|----------|--------|
| `engine/topologies/tilt/manifest/AGENTS.md:10` | Removed `MANIFEST_FILENAME_YAML` reference |
| `engine/topologies/tilt/manifest/AGENTS.md:41` | Updated comment to show `service.json` (was showing legacy filename) |
| `discovery/registry.star:695` | Updated comment to remove "(both legacy and new naming)" |

---

## Verification

### Tests Passed
```
bun test v1.3.13
37 pass
0 fail
171 expect() calls
Ran 37 tests across 4 files. [373.00ms]
```

### Files Modified
- `engine/topologies/tilt/manifest/constants.star`
- `engine/topologies/tilt/manifest/schema.star`
- `engine/topologies/tilt/manifest/loader.star`
- `engine/topologies/tilt/manifest/AGENTS.md`
- `discovery/manifest/normalize.star`
- `discovery/registry.star`
- `engine/paths.star`

### Files Deleted
- `engine/topologies/tilt/manifest/loader_backup.star`
- `engine/topologies/tilt/manifest/loader_minimal.star`

---

## Key Findings

### Migration Status: COMPLETE
- **No legacy manifest files** (`platform-computing-provisioner.manifest.json`) exist in the codebase
- All 38+ services use `service.json` consistently
- Legacy filename support code was safely removed

### Deprecated Field: REMOVED
- The `dependencies` field (deprecated in favor of `internalDependencies`) has been completely removed
- No manifests in the codebase were using the old field
- Fallback logic in normalize.star simplified

### YAML Support: NOT IMPLEMENTED
- The codebase had constants suggesting YAML support (`MANIFEST_FILENAME_NEW_YAML`)
- But the actual loader explicitly rejects YAML files
- Removed unused constants to prevent confusion

---

## Risk Assessment

| Risk Level | Count | Items |
|------------|-------|-------|
| NONE | 8 | Dead files, unused aliases, unused constants |
| LOW | 5 | Deprecated field removal (verified no usage), simplifications |
| TOTAL | 13 | All items addressed |

**No breaking changes** - all removals were of dead code or deprecated features with no current usage.

---

## Remaining Legacy References (Intentionally Kept)

The following references to "legacy" or old patterns were found but kept as they are operational code:

1. **Networks command fallbacks** (`cli/src/commands/networks.ts`) - Active resilience patterns for service discovery
2. **Upgrade command fallbacks** (`cli/src/commands/upgrade.ts`) - GitHub fallback when npm registry unavailable
3. **Discovery orchestrator comments** - Historical documentation of Phase 1/2 evolution

---

## Assessment Report

Full assessment available at: `LEGACY_CODE_ASSESSMENT_2026-05-04.md`

---

*Cleanup completed successfully. Codebase is now cleaner with ~400 lines of dead/legacy code removed.*
