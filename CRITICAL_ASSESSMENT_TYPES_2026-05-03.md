# Type Consolidation Assessment - TDK CLI

**Date:** 2026-05-03  
**Scope:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src`  
**Agent:** Type Consolidation Specialist

---

## Summary

Analyzed 47 source files across the CLI codebase to identify type consolidation opportunities. Found **6 high-confidence** issues requiring consolidation, **4 medium-confidence** recommendations, and **3 low-confidence** suggestions.

---

## High Confidence Issues (Must Fix)

### 1. Duplicate `CreatableResourceType` Definition

**Locations:**
- `src/types/index.ts:55`
- `src/commands/resource.ts:21`

**Current Definitions:**

```typescript
// types/index.ts:55-64
export type CreatableResourceType = 'backend' | 'frontend' | 'worker';
export function isCreatableResourceType(value: unknown): value is CreatableResourceType {
  return typeof value === 'string' && ['backend', 'frontend', 'worker'].includes(value);
}

// commands/resource.ts:20-30
export const CREATABLE_RESOURCE_TYPES = ['backend', 'frontend', 'worker'] as const;
export type CreatableResourceType = Extract<ResourceType, typeof CREATABLE_RESOURCE_TYPES[number]>;
export function isCreatableResourceType(type: string): type is CreatableResourceType {
  return (CREATABLE_RESOURCE_TYPES as readonly string[]).includes(type);
}
```

**Issue Category:** DUPLICATE

**Problem:**
- Two different type definitions with the same name
- Two different type guard implementations
- `commands/resource.ts` definition is more type-safe (uses `Extract<>` and const assertion)
- `types/index.ts` definition has a more robust type guard (handles `unknown`)

**Recommended Consolidation:**
Move the type-safe version with const assertion to `types/index.ts` and remove from `commands/resource.ts`:

```typescript
// types/index.ts
export const CREATABLE_RESOURCE_TYPES = ['backend', 'frontend', 'worker'] as const;
export type CreatableResourceType = Extract<ResourceType, typeof CREATABLE_RESOURCE_TYPES[number]>;
export function isCreatableResourceType(type: unknown): type is CreatableResourceType {
  return typeof type === 'string' && (CREATABLE_RESOURCE_TYPES as readonly string[]).includes(type);
}
```

**Confidence:** HIGH

---

### 2. `StatusCategory` Type Not Exported from `types/index.ts`

**Location:** `src/utils/formatting.ts:54`

**Current Definition:**
```typescript
type StatusCategory = 'success' | 'error' | 'warning' | 'unknown';
```

**Issue Category:** SCATTERED

**Problem:**
- Type is used by multiple exported functions (`getStatusColor`, `getStatusIcon`, `colorizeByStatus`)
- Cannot be imported by consumers who want type safety
- Functions accept `StatusValue` but internally use `StatusCategory`

**Recommended Consolidation:**
Move to `types/index.ts` and export:

```typescript
export type StatusCategory = 'success' | 'error' | 'warning' | 'unknown';
```

Update `formatting.ts` to import from types.

**Confidence:** HIGH

---

### 3. Component Prop Types Not Exported

**Locations:**
- `src/components/TabBar.tsx:20` - `TabBarProps`
- `src/components/DetailPanel.tsx:6` - `DetailPanelProps`
- `src/components/ResourceTable.tsx:6` - `ResourceTableProps`

**Current Definitions:**
```typescript
// TabBar.tsx
interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  compact?: boolean;
}

// DetailPanel.tsx
interface DetailPanelProps {
  stack: DiscoveredStack | null;
  service: DiscoveredResource | null;
  stackMetadata?: StackMetadata | null;
  visible: boolean;
}

// ResourceTable.tsx
interface ResourceTableProps {
  resources: ResourceMetadata[];
  maxWidth?: number;
}
```

**Issue Category:** SCATTERED

**Problem:**
- Component prop types are defined locally but not exported
- Consumers cannot use these types for wrapper components or testing
- Pattern is inconsistent with `TooltipProps` which IS exported from types

**Recommended Consolidation:**
Export all component prop types from `types/index.ts`:

```typescript
// types/index.ts - UI Component Types section
export interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  compact?: boolean;
}

export interface DetailPanelProps {
  stack: DiscoveredStack | null;
  service: DiscoveredResource | null;
  stackMetadata?: StackMetadata | null;
  visible: boolean;
}

export interface ResourceTableProps {
  resources: ResourceMetadata[];
  maxWidth?: number;
}
```

Update components to import from types instead of local definitions.

**Confidence:** HIGH

---

### 4. `BaseTooltipProps` vs `TooltipProps` Inconsistency

**Locations:**
- `src/components/BaseTooltip.tsx:4-19` - `BaseTooltipProps`
- `src/types/index.ts:155-160` - `TooltipProps`

**Current Definitions:**
```typescript
// BaseTooltip.tsx
interface BaseTooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  maxWidth?: number;
  wrapText?: boolean;
  prefix?: string;
  marginTop?: number;
}

// types/index.ts
export interface TooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  maxWidth?: number;
}
```

**Issue Category:** INCONSISTENT

**Problem:**
- `TooltipProps` in types/index.ts is a subset of `BaseTooltipProps`
- `Accessible` component uses `TooltipProps` from types but passes to `BaseTooltip`
- Type safety is compromised when extra props are used

**Recommended Consolidation:**
Update `TooltipProps` in types/index.ts to match `BaseTooltipProps`:

```typescript
export interface TooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  maxWidth?: number;
  wrapText?: boolean;
  prefix?: string;
  marginTop?: number;
}
```

Update `BaseTooltip.tsx` to import from types.

**Confidence:** HIGH

---

### 5. Missing `ResourceSelectInputProps` in types/index.ts

**Location:** `src/components/ResourceSelectInput.tsx:6-13`

**Current Definition:**
```typescript
interface ResourceSelectInputProps {
  items: SelectItem[];
  onSelect: (item: SelectItem) => void;
  highlightedIndex: number;
}
```

**Issue Category:** SCATTERED

**Problem:**
- Component prop type is not exported
- Cannot be used for wrapper components or testing

**Recommended Consolidation:**
Add to `types/index.ts`:

```typescript
export interface ResourceSelectInputProps {
  items: SelectItem[];
  onSelect: (item: SelectItem) => void;
  highlightedIndex: number;
}
```

Update component to import from types.

**Confidence:** HIGH

---

### 6. `Tab` Interface Should Be Exported

**Location:** `src/components/TabBar.tsx:6-10`

**Current Definition:**
```typescript
interface Tab {
  id: TabId;
  label: string;
  shortcut: string;
}
```

**Issue Category:** SCATTERED

**Problem:**
- Internal interface used for `TABS` constant
- Could be useful for consumers who want to customize tabs
- Consistency with exported `TabId`

**Recommended Consolidation:**
Add to `types/index.ts`:

```typescript
export interface Tab {
  id: TabId;
  label: string;
  shortcut: string;
}
```

Update `TabBar.tsx` to import from types.

**Confidence:** HIGH

---

## Medium Confidence Issues (Should Consider)

### 7. Local Types That Could Be Shared

**Locations:**
- `src/utils/services.ts:147` - `MetadataCache`
- `src/generator/template-engine.ts:19` - `GeneratorContext`
- `src/commands/upgrade.ts:10` - `InstallInfo`

**Issue Category:** SCATTERED (Intentionally Local)

**Assessment:**
These types are currently intentionally local because they are internal implementation details. However, they could be promoted to shared types if:
- Testing needs access to these types
- Other modules need to interact with these structures
- Documentation generation needs complete type coverage

**Recommended Action:** Leave as-is for now. Promote if needed for testing or external integration.

**Confidence:** MEDIUM

---

### 8. Template String Types in `commands/resource.ts`

**Location:** `src/commands/resource.ts:253-259`

**Current Definition:**
```typescript
interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority?: number;
  timestamp?: string;
}
```

**Issue Category:** SCATTERED (Template Only)

**Assessment:**
This type is embedded in a template string (`getWorkerIndexTemplate`). It's not actual TypeScript code but part of generated worker source. It should remain in the template.

**Recommended Action:** No change needed.

**Confidence:** MEDIUM

---

## Low Confidence Issues (Document Only)

### 9. `FileTreeProps` Component Props

**Location:** `src/components/FileTree.tsx:5-9`

**Current Definition:**
```typescript
interface FileTreeProps {
  nodes: FileNode[];
  onSelect?: (node: FileNode) => void;
  selectedPath?: string;
}
```

**Issue Category:** SCATTERED

**Assessment:**
This is a purely presentational component. The props are unlikely to be needed elsewhere.

**Recommended Action:** Leave as-is. Document only.

**Confidence:** LOW

---

### 10. Test File Interfaces

**Locations:**
- `src/commands/__tests__/error-handling.test.ts:118` - `ManifestResult`

**Issue Category:** SCATTERED (Test Only)

**Assessment:**
Test-specific interfaces should remain in test files for isolation.

**Recommended Action:** No change needed.

**Confidence:** LOW

---

## Implementation Plan

### Phase 1: Fix Duplicate Types (High Priority)
1. Consolidate `CreatableResourceType` in `types/index.ts`
2. Remove duplicate from `commands/resource.ts`
3. Update imports

### Phase 2: Export Component Props (High Priority)
1. Add `TabBarProps`, `DetailPanelProps`, `ResourceTableProps`, `ResourceSelectInputProps`, `Tab` to `types/index.ts`
2. Update components to import from types
3. Update component index exports

### Phase 3: Fix StatusCategory (High Priority)
1. Add `StatusCategory` to `types/index.ts`
2. Update `formatting.ts` to import it
3. Update all functions that use it

### Phase 4: Fix TooltipProps (High Priority)
1. Update `TooltipProps` to match `BaseTooltipProps`
2. Update `BaseTooltip.tsx` to import from types
3. Verify `Accessible.tsx` still works

---

## Files Modified (Expected)

| File | Change Type |
|------|-------------|
| `src/types/index.ts` | Add new exports, update existing |
| `src/commands/resource.ts` | Remove duplicate type definition |
| `src/components/TabBar.tsx` | Import props from types |
| `src/components/DetailPanel.tsx` | Import props from types |
| `src/components/ResourceTable.tsx` | Import props from types |
| `src/components/ResourceSelectInput.tsx` | Import props from types |
| `src/components/BaseTooltip.tsx` | Import props from types |
| `src/utils/formatting.ts` | Import StatusCategory from types |
| `src/components/index.ts` | Export additional types |

---

## Verification Steps

1. Run `cd cli && bun run typecheck` to ensure no type errors
2. Run `cd cli && bun run build` to ensure project compiles
3. Verify all imports resolve correctly
4. Check that no duplicate type names remain

---

## Risk Assessment

**Risk Level:** LOW

All changes are:
- Type-only changes (no runtime behavior modification)
- Moving existing definitions (not changing semantics)
- Adding exports (backward compatible)
- Following existing patterns in the codebase

**Rollback Strategy:**
Git history preserves all original definitions. Can revert individual commits if issues arise.

---

*Assessment generated by Type Consolidation Specialist*
*2026-05-03*
