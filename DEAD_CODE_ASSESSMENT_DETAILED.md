# Dead Code Elimination Assessment

## Research Methodology
- Installed and configured knip (v6.9.0) for unused code detection
- Manual cross-reference verification of all exports
- Grep analysis for import/usage patterns across the entire codebase
- Excluded test files from dead code analysis

## Dead Code Findings

### HIGH CONFIDENCE - Safe to Remove

#### 1. Function: `getTiltResourceStatus` (services.ts → index.ts)
- **Location**: `cli/src/utils/services.ts` (lines 431-523)
- **Status**: Exported but NEVER used
- **Verification**: 
  - Exported from services.ts
  - Re-exported in index.ts
  - Zero imports across entire codebase
- **Action**: Remove function and re-export

#### 2. Type: `CLIOptions` (types/index.ts → index.ts)
- **Location**: `cli/src/types/index.ts` (lines 35-37)
- **Status**: Exported but NEVER used
- **Verification**:
  - Only appears in its definition and index.ts re-export
  - No imports or references anywhere
- **Action**: Remove type and re-export

#### 3. Error Factories - MASSIVE dead code cluster (errors.ts)
**16 out of 17 error factories are UNUSED** (only `tiltNotInstalled` is used):

Unused error factories (all defined but never called):
- `notInProject` - lines 35-42
- `resourceNotFound` - lines 44-51
- `stackNotFound` - lines 53-60
- `portInUse` - lines 62-70
- `noResourcesToStack` - lines 72-79
- `masterConfigMissing` - lines 81-87
- `dockerNotRunning` - lines 89-96
- `bunNotInstalled` - lines 98-105
- `invalidResourceName` - lines 116-123
- `invalidStackName` - lines 125-132
- `resourceAlreadyExists` - lines 134-141
- `serviceJsonInvalid` - lines 143-150
- `dependencyNotMet` - lines 152-159
- `noServicesDiscovered` - lines 161-169
- `networkError` - lines 171-179
- `permissionDenied` - lines 181-188

Used:
- `tiltNotInstalled` - lines 107-114 (used in up.ts, down.ts, ui.tsx)

**Lines of dead code: ~275 lines**

### MEDIUM CONFIDENCE - Review Required

#### 4. Type: `StackHealthStatus` (types/index.ts)
- Used only as a property type in `StackMetadata` interface
- Never imported or used directly
- Part of public API surface
- **Recommendation**: Keep (low risk, part of type hierarchy)

#### 5. Type: `TiltRuntimeStatus`, `TiltBuildStatus` (types/index.ts)
- Used only within `TiltResourceStatus` interface
- Never imported directly
- **Recommendation**: Keep (low risk, component types)

### DEPENDENCIES STATUS
- All package.json dependencies are actively used
- No unused dependencies found
- `@types/*` packages correctly correspond to runtime dependencies

### FALSE POSITIVES (knip incorrectly flagged)
- `tests/coverage_html/coverage_html_cb_dd2e7eb5.js` - Actually used by HTML coverage report
- `@types/react`, `chalk`, `commander`, `handlebars`, `ink`, `ink-select-input`, `inquirer`, `ora`, `react` - All actively imported and used

## Risk Assessment

| Item | Risk Level | Impact | Recommendation |
|------|-----------|--------|----------------|
| `getTiltResourceStatus` | LOW | None - completely unused | ✅ Remove |
| `CLIOptions` | LOW | None - completely unused | ✅ Remove |
| Error factories (16) | LOW-MEDIUM | Low - only internal code | ⚠️ Review each before removal |
| `StackHealthStatus` | LOW | Part of API | 🔒 Keep |
| `TiltRuntimeStatus` | LOW | Component type | 🔒 Keep |

## Implementation Plan

1. **Phase 1 - High Confidence** (safe to remove):
   - Remove `getTiltResourceStatus` function from services.ts
   - Remove `getTiltResourceStatus` re-export from index.ts
   - Remove `CLIOptions` type from types/index.ts
   - Remove `CLIOptions` re-export from index.ts

2. **Phase 2 - Medium Confidence** (review required):
   - Review unused error factories - may be intended for future use
   - Document kept error factories with TODOs if preserving

3. **Verification**:
   - Run typecheck to ensure no breakages
   - Run tests to confirm functionality intact
   - Manual code review of changes

## Estimated Impact
- **Lines to be removed**: ~50-60 lines (Phase 1) + ~275 lines (Phase 2 if approved)
- **Bundle size impact**: Minimal (tree-shaking likely removes unused code anyway)
- **API surface change**: Minor (removing unused exports)
- **Breaking change potential**: None (removing only unused items)
