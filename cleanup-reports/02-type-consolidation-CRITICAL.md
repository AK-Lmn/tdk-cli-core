# Type Definition Consolidation - Critical Assessment

**Date:** 2025-01-30  
**Agent:** #11 (The API Harmonizer)  
**Scope:** TDK CLI Type System (`cli/src/types/index.ts` and all consuming files)

---

## Executive Summary

**Overall Type System Health Score: 7.5/10**

The TDK CLI type system is reasonably well-organized with most shared types properly centralized in `cli/src/types/index.ts`. However, there are several areas for improvement:

- **Strengths:**
  - Core types are well-defined and consistently named (PascalCase, no redundant suffixes)
  - Good separation between domain types (resources, stacks) and UI types
  - Proper use of TypeScript strict types and discriminated unions
  - Type exports in `cli/src/index.ts` follow explicit patterns

- **Weaknesses:**
  - `TooltipProps` interface is defined twice with different signatures (lines 151-159 and 275-285)
  - `DiscoveryContext` type is local to `discovery-context.ts` but used by multiple consumers
  - Missing `export type` pattern in component imports in some files
  - Unused local type definitions that could be shared

---

## Type Duplication Categories

### Category A: Exact Duplicates with Different Signatures

| Type Name | Location 1 | Location 2 | Issue |
|-----------|------------|------------|-------|
| `TooltipProps` | `types/index.ts:151-159` | `types/index.ts:275-285` | Same name, different properties. First has `wrapText`, `prefix`, `marginTop`. Second has only `maxWidth`. |

### Category B: Types That Should Be Shared But Are Local

| Type Name | Current Location | Recommended Location | Reason |
|-----------|-----------------|---------------------|---------|
| `DiscoveryContext` | `utils/discovery-context.ts:4-10` | `types/index.ts` | Used by UI command and potentially other consumers. Should be shared. |

### Category C: Local Types That Can Stay Local

| Type Name | Location | Reason |
|-----------|----------|--------|
| `MetadataCache` | `utils/services.ts:147-151` | Internal implementation detail of caching system |
| `PackageInfo` | `utils/paths.ts:28-32` | Internal helper for package.json reading |
| `InstallInfo` | `commands/upgrade.ts:12-16` | Local type for upgrade detection |
| `GeneratorContext` | `generator/template-engine.ts:14-33` | Template engine internal context |
| `PortAssignableResourceType` | `utils/port-assignment.ts:4` | Local extraction from CreatableResourceType |

---

## Specific Type Issues (Detailed Analysis)

### Issue #1: Duplicate TooltipProps Interfaces (HIGH PRIORITY)
**Location:** `cli/src/types/index.ts`

```typescript
// Lines 151-159 (First definition)
export interface TooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  maxWidth?: number;
  wrapText?: boolean;
  prefix?: string;
  marginTop?: number;
}

// Lines 275-285 (Second definition - different properties)
export interface TooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  maxWidth?: number;
}
```

**Problem:** TypeScript will use the second definition, effectively hiding the first. The `BaseTooltip` component expects `wrapText`, `prefix`, `marginTop` but the simplified `TooltipProps` doesn't have them.

**Fix Strategy:**
- Rename first to `BaseTooltipProps` (already done on line 253)
- Keep second as `TooltipProps` (simplified version)
- Remove duplicate definition at lines 151-159
- Update imports to use correct type

**Files to Update:**
- `types/index.ts` - Remove duplicate
- `components/Accessible.tsx` - Uses `TooltipProps`, imports correctly

### Issue #2: Missing export type Pattern (MEDIUM PRIORITY)
**Location:** `cli/src/commands/ui.tsx:17`

```typescript
import {
  TabBar, type TabId, DetailPanel, ResourceTable, FileTree,
  AccessibleTooltip, TOOLTIPS, ResourceSelectInput
} from '../components/index.js';
```

**Problem:** While this uses the correct pattern, the `components/index.ts` file doesn't export `TabId` properly:

```typescript
// components/index.ts lines 10-12
export type {
  TabId,
} from '../types/index.js';
```

This is correct, but `TabId` is being imported both from types and components. The import in `ui.tsx` line 17 imports `TabBar, type TabId` from components, but `TabId` should come from types directly.

**Fix Strategy:**
- Import `TabId` directly from `../types/index.js` in `ui.tsx`
- Remove `type TabId` from components barrel export (it's a type, not a component)

### Issue #3: DiscoveryContext Not Shared (MEDIUM PRIORITY)
**Location:** `cli/src/utils/discovery-context.ts:4-10`

```typescript
export interface DiscoveryContext {
  resources: DiscoveredResource[];
  stacks: DiscoveredStack[];
  stackNames: string[];
  unassignedResources: DiscoveredResource[];
  resourcesByStack: Map<string, DiscoveredResource[]>;
}
```

**Problem:** This type is exported but not from the central types location. It's used by:
- `commands/ui.tsx` (indirectly via `createDiscoveryContext()`)
- Potentially test files

**Fix Strategy:**
- Move `DiscoveryContext` to `types/index.ts`
- Keep the function `createDiscoveryContext()` in `discovery-context.ts`
- Update imports if any direct type imports exist

### Issue #4: Missing Type Exports in index.ts (LOW PRIORITY)
**Location:** `cli/src/index.ts`

The following types are defined but not exported from the main index:
- `JsonArray` (line 100)
- `JsonObject` (line 101)
- `Tab` (line 139)
- `BaseTooltipProps` (line 253)
- `LoadingScreenProps` (line 290)
- `ErrorScreenProps` (line 301)
- `HelpPanelProps` (line 312)

**Note:** These may be intentional if they're component-specific. However, since they're in the shared types file, they should probably be exported.

### Issue #5: Unused Type Imports (LOW PRIORITY)
**Location:** `cli/src/commands/ui.tsx:12`

```typescript
import type { DiscoveredResource, DiscoveredStack, ResourceMetadata, StackMetadata, ResourceType, SelectItem, FileNode, LoadingScreenProps, ErrorScreenProps, HelpPanelProps } from '../types/index.js';
```

**Problem:** `ResourceType` is imported but not used in the file.

### Issue #6: Component Props Redundancy (LOW PRIORITY)
**Location:** `types/index.ts:168-177`

```typescript
export interface ResourceTableProps {
  resources: ResourceMetadata[];
  maxWidth?: number;
}

export interface ResourceSelectInputProps {
  items: SelectItem[];
  onSelect: (item: SelectItem) => void;
  highlightedIndex: number;
}
```

**Assessment:** These are component-specific props. They can stay in the types file since they're used by multiple components and the UI command.

### Issue #7: StatusValue Type Too Permissive (LOW PRIORITY)
**Location:** `types/index.ts:215-227`

```typescript
export type StatusValue =
  | ResourceStatus
  | StackHealthStatus
  | TiltRuntimeStatus
  | ServiceUrl['status']
  | 'active'
  | 'failed'
  | 'critical'
  | 'stopped'
  | 'starting'
  | 'building'
  | string
  | undefined;
```

**Problem:** The `string` and `undefined` at the end make this effectively `string | undefined`, which defeats the purpose of the specific literal types above.

**Fix Strategy:**
- Remove `string` from the union (it already covers all cases via the specific types)
- Keep `undefined` as it's used for optional status display
- Or create two versions: strict and permissive

---

## Consolidation Strategy

### Types to Keep in `types/index.ts` (Current Status: GOOD)

✅ **Domain Types:**
- `DiscoveredResource`
- `ResourceConfig`
- `DiscoveredStack`
- `ResourceMetadata`
- `StackMetadata`
- `AutogeneratedFile`
- `ResourceStatus`
- `StackHealthStatus`
- `ResourceType`
- `CreatableResourceType`
- `TiltRuntimeStatus`
- `TiltBuildStatus`
- `TiltResourceStatus`
- `FileType`
- `TiltCommandResult`

✅ **Project Config Types:**
- `ProjectConfig`
- `ProjectStackDefinition`
- `ProjectOptionalInfra`
- `ProjectDiscovery`

✅ **Utility Types:**
- `JsonValue`
- `JsonArray`
- `JsonObject`
- `ValidationResult`
- `CheckResult`
- `ServiceUrl`
- `SelectItem`
- `StatusValue`
- `StatusCategory`

✅ **UI Types (keep centralized):**
- `TabId`
- `Tab`
- `TabBarProps`
- `FileNode`
- `FileTreeProps`
- `BaseTooltipProps`
- `TooltipProps`
- `DetailPanelProps`
- `ResourceTableProps`
- `ResourceSelectInputProps`
- `LoadingScreenProps`
- `ErrorScreenProps`
- `HelpPanelProps`

### Types to Add to `types/index.ts`

🔧 **From `discovery-context.ts`:**
- `DiscoveryContext` - Move here, keep function in original file

### Types to Remove from `types/index.ts`

❌ **Duplicate:**
- `TooltipProps` at lines 151-159 (keep the one at 275-285, or merge)

### Naming Standardization

✅ **Already Following AGENTS.md Conventions:**
- PascalCase for all interfaces and types
- No `Interface` or `Type` suffixes
- Descriptive, semantic names
- Boolean properties use prefixes: `is-*`, `has-*`, `can-*`, `did-*`

### Export Pattern Recommendations

**Current Pattern in `cli/src/index.ts` (GOOD):**
```typescript
export type {
  DiscoveredResource,
  DiscoveredStack,
  // ... types
} from './types/index.js';

export {
  CREATABLE_RESOURCE_TYPES,
  isCreatableResourceType,
} from './types/index.js';
```

**Recommended for Components in `cli/src/components/index.ts`:**
```typescript
// Remove type exports from components barrel
// Types should be imported directly from types/index.js
export { TabBar } from './TabBar.js';
export { DetailPanel } from './DetailPanel.js';
// ... components only
```

---

## Implementation Priority

### Phase 1: HIGH CONFIDENCE (Must Do)

1. **Remove duplicate `TooltipProps`** (Issue #1)
   - Remove lines 151-159 from types/index.ts
   - Keep lines 275-285 (simplified version)
   - `BaseTooltipProps` at 253 already has full signature

2. **Move `DiscoveryContext` to types/index.ts** (Issue #3)
   - Add to types/index.ts
   - Remove from discovery-context.ts

3. **Add missing type exports to index.ts** (Issue #4)
   - Add `JsonArray`, `JsonObject`, `Tab`, `BaseTooltipProps`, `LoadingScreenProps`, `ErrorScreenProps`, `HelpPanelProps`

### Phase 2: MEDIUM CONFIDENCE (Should Do)

4. **Clean up unused imports** (Issue #5)
   - Remove `ResourceType` from ui.tsx imports

5. **Fix StatusValue type** (Issue #7)
   - Remove `string` from union

6. **Remove type re-export from components/index.ts** (Issue #2)
   - Keep components barrel clean

### Phase 3: LOW CONFIDENCE (Could Do)

7. **Audit all type imports** for consistency
8. **Add JSDoc comments** to all exported types
9. **Consider splitting types/index.ts** into domain-specific files if it grows beyond 400 lines

---

## Risk Assessment

| Change | Risk Level | Files Affected | Test Impact |
|--------|------------|----------------|-------------|
| Remove duplicate TooltipProps | LOW | 1 type file | None (second definition was shadowing first) |
| Move DiscoveryContext | LOW | 2 files | None (type-only change) |
| Add exports to index.ts | LOW | 1 file | None (adds exports, doesn't remove) |
| Clean up imports | LOW | 1 file | None (unused import) |
| Fix StatusValue | MEDIUM | 1 type file, check formatting.ts | None (string was making it permissive anyway) |
| Remove component type re-export | LOW | 2 files | None (import pattern change only) |

---

## Files to Modify

### Primary Changes
1. `cli/src/types/index.ts` - Remove duplicate, add DiscoveryContext, add exports
2. `cli/src/index.ts` - Add missing type exports
3. `cli/src/utils/discovery-context.ts` - Remove DiscoveryContext interface
4. `cli/src/commands/ui.tsx` - Clean up imports
5. `cli/src/components/index.ts` - Remove type re-exports

### Verification Files (Check After Changes)
- `cli/src/components/Accessible.tsx` - Uses TooltipProps
- `cli/src/components/BaseTooltip.tsx` - Uses BaseTooltipProps
- `cli/src/utils/formatting.ts` - Uses StatusValue

---

## Acceptance Criteria

- [ ] No duplicate type definitions with same name
- [ ] All shared types are exported from `cli/src/index.ts`
- [ ] Type check passes (`tsc --noEmit`)
- [ ] No test files modified (as per requirements)
- [ ] All imports use `export type` pattern correctly
- [ ] `DiscoveryContext` is in shared types location

---

## Post-Implementation Verification Commands

```bash
cd /private/var/www/2025/ollamar1/tdk-cli/cli
npm run typecheck        # Verify no type errors
npm run lint            # Verify no lint errors
npm run build           # Verify build succeeds
```

---

## Summary

The TDK CLI type system is in good shape overall. The main issues are:

1. **One duplicate interface** (TooltipProps) that needs consolidation
2. **One type** (DiscoveryContext) that should be in shared location
3. **Missing exports** for types already defined
4. **Minor import cleanup** needed

Total estimated effort: **1-2 hours**  
Confidence level for success: **HIGH (95%)**

---

*Assessment completed by Agent #11 (The API Harmonizer)*  
*Based on AGENTS.md guidelines and TypeScript best practices*
