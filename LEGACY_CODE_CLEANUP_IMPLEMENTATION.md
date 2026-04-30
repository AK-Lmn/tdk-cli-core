# Legacy Code Cleanup - Implementation Report

**Date:** 2026-04-30  
**Status:** ✅ Phase 1 Complete (High Confidence Removals)  
**Test Results:** 34 pass, 0 fail

---

## Summary

Successfully implemented Phase 1 of the legacy code cleanup. Removed deprecated schema fields, updated code to use modern patterns, and clarified deprecation notices for unreachable code.

---

## Changes Made

### 1. ✅ Removed Deprecated Schema Fields (apiBasePath, proxyRoutes, hmrPort)

**Files Modified:**

#### 1.1 `engine/topologies/tilt/manifest/schema.star`
**Removed:** Lines 267-287 - Deprecated field definitions
```starlark
# REMOVED: Legacy/Deprecated Fields section
- 'hmrPort': {...}
- 'proxyRoutes': {...}
- 'apiBasePath': {...}
```

#### 1.2 `engine/topologies/tilt/manifest/constants.star`
**Removed:** Lines 161, 166-167 - Default values for deprecated fields
```starlark
# REMOVED from MANIFEST_DEFAULTS:
- 'apiBasePath': '/api'
- 'hmrPort': None
- 'proxyRoutes': []
```

#### 1.3 `engine/topologies/tilt/manifest/parser.star`
**Removed:** Lines 68-73 - Deprecated field warning logic
```starlark
# REMOVED:
- deprecated_fields = ['apiBasePath', 'proxyRoutes', 'hmrPort']
- for field in deprecated_fields: ...
```

#### 1.4 `engine/topologies/tilt/generators/vite/frontend.star`
**Changed:** Lines 58, 67-70 - Updated to use modern patterns
```starlark
# BEFORE:
hmr_port = manifest.get('hmrPort', port + 1000)
api_base_path = manifest.get('apiBasePath', '/api')
proxy_routes = manifest.get('proxyRoutes', [])
proxy_config = generate_proxy_block(api_base_path, backend_port, proxy_routes, stack)

# AFTER:
hmr_port = port + 1000  # Always computed
traefik_config = manifest.get('traefik', {})
api_base_path = traefik_config.get('pathPrefix', '/api')
proxy_config = generate_proxy_block(api_base_path, backend_port, [], stack)
```

#### 1.5 `discovery/manifest/loading.star`
**Removed:** Lines 275-276 - hmrPort computation
```starlark
# REMOVED:
- if result.get('hmrPort') == None and app_type == 'frontend':
-     result['hmrPort'] = result['port'] + 1000
```

#### 1.6 `engine/topologies/tilt/discovery/manifest/loading.star`
**Removed:** Lines 296-298 - hmrPort computation
```starlark
# REMOVED:
- if result.get('hmrPort') == None and app_type == 'frontend':
-     result['hmrPort'] = result['port'] + 1000
```

---

### 2. ✅ Removed @deprecated Default Export from Frontend Generator

**File:** `engine/topologies/tilt/resources/orchestrator/generators/frontend.star`

#### 2.1 Removed deprecated default export from env.ts template
**Removed:** Lines 109-113
```typescript
// REMOVED from generated env.ts:
/**
 * Default export for convenience
 * @deprecated Use named export API_URL instead
 */
export default API_URL;
```

#### 2.2 Updated api-index.ts to not re-export default
**Changed:** Line 141-142
```typescript
// BEFORE:
export { apiClient, default } from './api-client';
export { API_URL, default as API_URL_DEFAULT } from './env';

// AFTER:
export { apiClient } from './api-client';
export { API_URL } from './env';
```

---

### 3. ✅ Updated Deprecation Notices for Unreachable Code

Updated deprecation notices to clarify that the `USE_TDK_DISCOVERY` environment variable is never checked, making this code truly unreachable:

**Files Updated:**
1. `engine/topologies/tilt/discovery/registry.star` (lines 2-9)
2. `engine/topologies/tilt/discovery/discovery_orchestrator.star` (lines 1-6)
3. `engine/topologies/tilt/discovery/constants.star` (lines 1-8)
4. `engine/topologies/tilt/discovery/manifest/constants.star` (lines 1-10)

**Changed from:**
```
It is kept only as a fallback when USE_TDK_DISCOVERY=false.
```

**Changed to:**
```
It was kept as a fallback when USE_TDK_DISCOVERY=false, but this env var
is never checked. The code is unreachable and should be removed.
```

---

## Lines Changed Summary

| File | Lines Removed | Lines Changed | Type |
|------|---------------|---------------|------|
| `engine/topologies/tilt/manifest/schema.star` | 21 | 0 | Removed deprecated field defs |
| `engine/topologies/tilt/manifest/constants.star` | 3 | 0 | Removed default values |
| `engine/topologies/tilt/manifest/parser.star` | 6 | 0 | Removed warning logic |
| `engine/topologies/tilt/generators/vite/frontend.star` | 0 | 7 | Modern patterns |
| `engine/topologies/tilt/resources/orchestrator/generators/frontend.star` | 8 | 4 | Clean exports |
| `discovery/manifest/loading.star` | 3 | 0 | Removed computation |
| `engine/topologies/tilt/discovery/manifest/loading.star` | 3 | 0 | Removed computation |
| `engine/topologies/tilt/discovery/registry.star` | 0 | 2 | Updated notice |
| `engine/topologies/tilt/discovery/discovery_orchestrator.star` | 0 | 2 | Updated notice |
| `engine/topologies/tilt/discovery/constants.star` | 0 | 2 | Updated notice |
| `engine/topologies/tilt/discovery/manifest/constants.star` | 0 | 3 | Updated notice |

**Total:** 44 lines removed, 20 lines changed across 11 files

---

## Verification

All tests pass after cleanup:
```
bun test v1.3.13 (bf2e2cec)

 34 pass
 0 fail
 134 expect() calls
Ran 34 tests across 4 files. [184.00ms]
```

---

## Impact Assessment

### Positive Impacts
1. **Cleaner schema:** No deprecated fields cluttering the manifest schema
2. **Simpler defaults:** MANIFEST_DEFAULTS only contains active fields
3. **Cleaner generated code:** No deprecated default exports in env.ts
4. **Clearer deprecation status:** Notices now accurately describe unreachable code
5. **Modern patterns:** Frontend generator uses `traefik.pathPrefix` instead of deprecated `apiBasePath`

### Risk Assessment
| Change | Risk Level | Verification |
|--------|------------|--------------|
| Schema field removal | NONE | No manifests used these fields |
| Parser warning removal | NONE | Warnings were informational only |
| Frontend generator | LOW | Uses modern pattern with fallback |
| Default export removal | LOW | May affect imports using default |
| Deprecation notice updates | NONE | Documentation only |

---

## Remaining Legacy Code (Phase 2 Candidates)

### High Priority (Next Phase)
1. **Deprecated discovery system directory** (`engine/topologies/tilt/discovery/`)
   - ~2000 lines of unreachable code
   - No usage found in codebase
   - Safe to delete after verification

### Medium Priority
2. **Legacy manifest filename support**
   - `platform-computing-provisioner.manifest.json` support
   - All manifests use `service.json` now
   - Can remove dual-filename logic

3. **YAML manifest support**
   - Constants defined but loader rejects YAML
   - No YAML manifests found
   - Can remove support code

---

## Recommendations for Phase 2

1. **Verify no external projects use:**
   - Deprecated discovery system
   - Legacy manifest filenames
   - Deprecated schema fields

2. **Set migration deadline** if any external usage found

3. **Delete deprecated discovery directory** once verified unused

4. **Remove legacy filename support** from loaders and constants

5. **Remove YAML support** from registry and constants

---

## Conclusion

Phase 1 successfully removed high-confidence deprecated code without breaking any tests. The codebase is now cleaner with:
- 44 fewer lines of deprecated code
- Clearer deprecation notices
- Modern patterns in the frontend generator
- No misleading default exports

The remaining legacy code is well-documented and ready for Phase 2 removal once verified unused.

---

*Implementation completed by Legacy Code Cleanup Agent*  
*2026-04-30*
