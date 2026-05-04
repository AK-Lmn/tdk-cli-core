# Legacy Code Specialist Assessment Report

**Date:** 2026-05-04
**Agent:** Legacy Code Specialist Agent
**Scope:** TDK CLI codebase (`/private/var/www/2025/ollamar1/tdk-cli`)
**Status:** Assessment Complete - Implementation Required

---

## Executive Summary

**Legacy Code Health Score: 9/10** (Excellent - One minor issue found)

The TDK CLI codebase has already undergone extensive cleanup of deprecated code as documented in `cleanup-reports/07-deprecated-legacy-CRITICAL.md`. Most significant deprecated code (~2,800 lines) has already been removed by previous cleanup efforts.

**Current findings:** Only 1 minor legacy pattern remains that can be safely modernized.

---

## Legacy Code Inventory

### 1. Legacy CommonJS Pattern (MODERATE CONFIDENCE - Safe to Modernize)

#### 1.1 `createRequire` for JSON Import
**File:** `cli/src/cli.ts:24-25`

**Issue:** The code uses the legacy `createRequire` pattern from Node.js's CommonJS compatibility layer to import package.json. This is a transitional pattern from when ES modules were new and JSON imports weren't supported.

**Current Code:**
```typescript
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
```

**Why It's Legacy:**
- Node.js v18+ (and definitely v22 which this project uses) supports native JSON imports
- `createRequire` was a bridge solution during the ES modules transition period
- Native JSON imports are more standards-compliant and don't require the CommonJS compatibility layer

**Modern Replacement:**
```typescript
import pkg from '../package.json' with { type: 'json' };
```

**Action:** Replace `createRequire` pattern with native JSON import assertion.

---

## Categorization

### MODERNIZE (High Confidence)

| Issue | File | Lines | Rationale |
|-------|------|-------|-----------|
| createRequire pattern | cli.ts | 24-25 | Node.js v22 supports native JSON imports |

### ALREADY REMOVED (Previous Cleanups)

| Issue | File | Status |
|-------|------|--------|
| Inline validateResourceType | error-handling.test.ts | Already removed |
| Inline validatePortForType | error-handling.test.ts | Already removed |
| Inline validateManifest | error-handling.test.ts | Already removed |
| Deprecated discovery system | engine/topologies/tilt/discovery/ | Already removed |
| Legacy manifest filename | platform-computing-provisioner.manifest.json | Already removed |

### KEEP (Active/Required Code)

| Pattern | Location | Justification |
|---------|----------|---------------|
| GitHub registry fallback | upgrade.ts:86-96 | Active reliability pattern for npm→GitHub failover |
| Multiple status check methods | networks.ts:118-181 | Operational resilience - HTTP, port, Docker checks |
| X10/SGR mouse protocol | ui.tsx:280-331 | Terminal compatibility - SGR 1006 is modern standard |

---

## Risk Assessment

| Change | Risk Level | Verification |
|--------|------------|--------------|
| JSON import modernization | **LOW** | Standard ES2022 feature, fully supported in Node.js v22 |
| Import assertion syntax | **LOW** | `with { type: 'json' }` is the standard syntax |

---

## Implementation Plan

### Phase 1: Modernize JSON Import
1. Remove `createRequire` import
2. Replace with native JSON import using import assertion
3. Verify TypeScript compilation passes
4. Run full test suite

### Phase 2: Verification
1. Run `npm test` to verify all tests pass
2. Verify CLI still reads version correctly
3. Check TypeScript compilation with `npx tsc --noEmit`

---

## Expected Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| CommonJS patterns | 1 | 0 | -1 |
| Import statements | 2 (createRequire + require) | 1 (import) | -1 |
| Code clarity | Good | Better | Improved |

---

## Safety Checklist

- [x] Node.js v22 supports import assertions
- [x] TypeScript 5.0+ supports import assertions
- [x] No external consumers affected
- [x] No breaking changes to CLI behavior
- [x] Same functionality with cleaner syntax

---

## Implementation Notes

The `createRequire` pattern at line 24-25 in cli.ts:
```typescript
// BEFORE (Legacy):
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// AFTER (Modern):
import pkg from '../package.json' with { type: 'json' };
```

This change:
- Removes dependency on CommonJS compatibility layer
- Uses standard ES module syntax
- Is natively supported by Node.js v22
- Maintains identical functionality

---

*Assessment completed. Ready for implementation phase.*
