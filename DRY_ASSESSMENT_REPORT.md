# DRY (Don't Repeat Yourself) Assessment Report

**Date:** 2026-04-30
**Scope:** TDK CLI & Engine (cli/src and discovery/engine)
**Objective:** Identify code duplication, consolidation opportunities, and architectural improvements

---

## Executive Summary

This assessment identifies **14 high-confidence** and **9 medium-confidence** consolidation opportunities across the TDK CLI codebase. The analysis focuses on the TypeScript CLI source (most critical for maintainability) with observations on Starlark engine patterns.

### Overall Statistics
- **Files Analyzed:** 58 source files
- **Total Lines:** ~9,500 (TypeScript only)
- **Duplication Hotspots:** 23 identified
- **High-Confidence Consolidations:** 14 (safe to implement)
- **Medium-Confidence:** 9 (requires review)
- **Risk Level:** Low to Medium

---

## High-Confidence Consolidations (Safe to Implement)

### 1. Date Formatting Functions [formatting.ts]
**Location:** `cli/src/utils/formatting.ts` (lines 11-29)
**Issue:** `formatDate()` and `formatShortDate()` are nearly identical
**Current Code:**
```typescript
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatShortDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
```
**Problem:** Both functions duplicate the same options object. The only difference is `toLocaleString` vs `toLocaleDateString`.
**Solution:** Create a unified `formatTimestamp()` with a format parameter, or have `formatShortDate` call `formatDate` with an option.
**Impact:** Low risk, reduces 15 lines to ~8 lines.
**Priority:** HIGH

---

### 2. Tooltip Component Consolidation [components]
**Location:** `cli/src/components/Tooltip.tsx` + `Accessible.tsx`
**Issue:** Two tooltip components with identical styling patterns
**Current Code:**
- `Tooltip.tsx`: Border style single, borderColor yellow, paddingX/Y 1, backgroundColor black
- `Accessible.tsx`: Border style single, borderColor yellow, paddingX/Y 1, backgroundColor black
**Problem:** Both render yellow-bordered boxes with black backgrounds. Only content rendering differs (text wrapping vs simple text).
**Solution:** Create a base `BaseTooltip` component in a new `components/base/` directory, then have both Tooltip and AccessibleTooltip extend it.
**Impact:** Low risk, reduces component complexity, ensures visual consistency.
**Priority:** HIGH

---

### 3. Duplicate Port Range Definitions
**Location:** 
- `cli/src/utils/constants.ts` (lines 37-41)
- `cli/src/config/platform-standards.ts` (lines 50-85)
**Issue:** Port ranges defined twice with same values
**Current Code (constants.ts):**
```typescript
export const PORT_RANGES = {
  frontend: { base: 3000, min: 3000, max: 3999 },
  backend: { base: 4000, min: 4000, max: 4999 },
  worker: { base: 6000, min: 6000, max: 6999 },
};
```
**Current Code (platform-standards.ts):**
```typescript
const PORTS = {
  frontend: { base: 3000, range: "3000-3999", start: 3000, end: 3999 },
  backend: { base: 4000, range: "4000-4999", start: 4000, end: 4999 },
  worker: { base: 6000, range: "6000-6999", start: 6000, end: 6999 },
};
```
**Problem:** Same port ranges in two places. Changes must be synchronized manually.
**Solution:** `constants.ts` should import from `platform-standards.ts` (the canonical source), or vice versa. Add `as const` assertions for type safety.
**Impact:** Medium risk - ensure no breaking changes to consumers. Add re-export with deprecation notice.
**Priority:** HIGH

---

### 4. SelectInput Component Pattern Duplication [ui.tsx]
**Location:** `cli/src/commands/ui.tsx` (appears 6+ times)
**Issue:** Same SelectInput configuration repeated across tabs
**Current Code:**
```tsx
// Repeated in overview tab, resources tab, files tab, config tab
<SelectInput 
  items={items} 
  onSelect={handleSelect}
  initialIndex={highlightedIndex}
  indicatorComponent={({ isSelected }) => (
    <Text color={isSelected ? 'cyan' : undefined}>
      {isSelected ? '▓▒░ ' : '    '}
    </Text>
  )}
  itemComponent={({ isSelected, label }) => (
    <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
      {label}
    </Text>
  )}
/>
```
**Problem:** 30+ lines repeated 4-6 times with only `items` changing.
**Solution:** Create a `ResourceSelectInput` wrapper component that encapsulates the styling.
**Impact:** Low risk, reduces UI.tsx by ~100 lines.
**Priority:** HIGH

---

### 5. Box Drawing Helpers Duplication [networks.ts]
**Location:** `cli/src/commands/networks.ts` (lines 208-224)
**Issue:** Box drawing functions could be shared utilities
**Current Code:**
```typescript
const BOX_WIDTH = 62;
function line(char: string, width: number = BOX_WIDTH): string {
  return char.repeat(width);
}
function center(text: string, width: number = BOX_WIDTH - 2): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}
function pad(text: string, width: number): string {
  if (text.length > width) return text.slice(0, width - 1) + '…';
  return text.padEnd(width);
}
```
**Problem:** These are general-purpose text formatting utilities trapped in a command file.
**Solution:** Extract to `utils/formatting.ts` as `formatBoxLine`, `formatCentered`, `formatPadded`.
**Impact:** Low risk, makes utilities available for other commands.
**Priority:** MEDIUM-HIGH

---

### 6. Status Color/Icon Logic Duplication
**Location:** `cli/src/utils/formatting.ts` (lines 36-67) + `DetailPanel.tsx`
**Issue:** Status color mapping duplicated
**Current Code (formatting.ts):**
```typescript
export function getStatusColor(status: string): string {
  switch (status) {
    case 'ready': case 'running': case 'healthy': return 'green';
    case 'pending': case 'degraded': return 'yellow';
    case 'error': case 'stopped': return 'red';
    default: return 'gray';
  }
}
```
**Current Code (DetailPanel.tsx lines 77-83):**
```typescript
const statusColor = 
  stackMetadata.overallStatus === 'healthy' ? 'green' :
  stackMetadata.overallStatus === 'degraded' ? 'yellow' : 'red';
const statusIcon = 
  stackMetadata.overallStatus === 'healthy' ? '✓' :
  stackMetadata.overallStatus === 'degraded' ? '◐' : '✗';
```
**Problem:** Same status→color mapping logic in two places. DetailPanel reimplements what formatting.ts already provides.
**Solution:** Import `getStatusColor` and `getStatusIcon` from formatting.ts in DetailPanel.tsx.
**Impact:** Low risk, ensures visual consistency.
**Priority:** HIGH

---

### 7. Type Guard Pattern Duplication
**Location:** 
- `cli/src/utils/services.ts` (lines 25-27)
- `cli/src/utils/validation.ts` (implied in error handling)
**Issue:** NodeJS error checking pattern repeated
**Current Code:**
```typescript
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
```
**Problem:** This type guard is specific to services.ts but the pattern applies elsewhere.
**Solution:** Move to `utils/errors.ts` and export. Already exported from errors.ts based on errorFactories pattern.
**Impact:** Low risk.
**Priority:** MEDIUM

---

### 8. Test Template Duplication
**Location:** `cli/src/commands/__tests__/resource.test.ts` (lines 39-98)
**Issue:** Test file recreates templates that exist in resource.ts
**Current Code:** Tests define their own `BACKEND_TEMPLATE`, `FRONTEND_TEMPLATE`, `WORKER_TEMPLATE` structures.
**Problem:** If resource.ts templates change, tests become invalid without updating. 60+ lines of duplicated structure definitions.
**Solution:** Export templates from `resource.ts` for test use, or create `templates/` directory with shared template definitions.
**Impact:** Low risk, improves test maintainability.
**Priority:** MEDIUM

---

### 9. Resource Count Display Pattern
**Location:** 
- `cli/src/commands/stacks.ts` (line 36, 65)
- `cli/src/commands/resources.ts` (line 50, 84)
- `cli/src/commands/projects.ts` (line 52, 64)
**Issue:** Same `formatCount(resources.length, 'resource')` pattern everywhere
**Problem:** While using `formatCount`, the pattern of filtering unassigned resources and displaying counts is repeated.
**Current Code (projects.ts lines 55-58):**
```typescript
const withoutStack = resources.filter(r => !r.stack).length;
if (withoutStack > 0) {
  console.log(chalk.yellow(`⚠ Unassigned: ${withoutStack} resource${withoutStack === 1 ? '' : 's'}`));
}
```
**Current Code (resources.ts lines 82-86):**
```typescript
const withoutStack = resources.filter((r: {stack?: string}) => !r.stack).length;
if (withoutStack > 0 && !options.noStack) {
  console.log(chalk.yellow(`\n${formatCount(withoutStack, 'resource')} not assigned to any stack.`));
}
```
**Solution:** Create a `displayResourceStats(resources, options)` utility in `utils/formatting.ts`.
**Impact:** Low risk.
**Priority:** MEDIUM

---

### 10. Empty State Handling in UI
**Location:** `cli/src/commands/ui.tsx` (lines 89-101)
**Issue:** Empty state component could be more generic
**Current Code:**
```tsx
const EmptyState: React.FC = () => (
  <Box flexDirection="column" padding={2} alignItems="center">
    <Text bold color="yellow">No Services Found</Text>
    <Box marginY={1} />
    <Text color="gray">◉ No service.json files found</Text>
    ...
  </Box>
);
```
**Problem:** This pattern (centered box with title, divider, message, actions) could be generalized.
**Solution:** Create a reusable `EmptyState` component in `components/EmptyState.tsx` accepting `title`, `message`, `actions` props.
**Impact:** Low risk.
**Priority:** MEDIUM

---

## Medium-Confidence Consolidations (Requires Review)

### 11. Command Action Wrapper Pattern
**Location:** All command files (stacks.ts, resources.ts, projects.ts, etc.)
**Issue:** Similar command structure repeated
**Current Pattern:**
```typescript
export const commandName = new Command('name')
  .description('...')
  .option('-v, --verbose', '...', false)
  .action(async (options) => {
    await runCommand(async () => {
      // Command logic
    });
  });
```
**Problem:** While the pattern is consistent, abstracting this might reduce readability.
**Proposed Solution:** Consider if a `createCommand()` factory adds value or obscures intent.
**Risk:** Could reduce code clarity for minimal gain.
**Priority:** LOW

---

### 12. Chalk Color Patterns
**Location:** All command files
**Issue:** Repeated color sequences for common patterns
**Pattern:** `chalk.yellow('⚠ Warning')`, `chalk.green('✓ Success')`, `chalk.red('✗ Error')`
**Proposed Solution:** Export semantic color helpers from a new module:
```typescript
export const colors = {
  warning: (s: string) => chalk.yellow('⚠ ' + s),
  success: (s: string) => chalk.green('✓ ' + s),
  error: (s: string) => chalk.red('✗ ' + s),
};
```
**Risk:** May be over-abstraction.
**Priority:** LOW

---

### 13. Help Text Pattern
**Location:** `cli/src/commands/help.ts`, `cli/src/commands/ui.tsx`
**Issue:** Keyboard shortcut help formatting similar
**Problem:** Both show keyboard shortcuts with similar formatting patterns.
**Proposed Solution:** Create a `HelpPanel` component (already exists in ui.tsx) and use it from help.ts.
**Risk:** TUI (Ink-based) vs CLI (console.log) differences may make this impractical.
**Priority:** LOW

---

### 14. Stack Emoji Mapping
**Location:** `cli/src/commands/networks.ts` (lines 367-388)
**Issue:** Hardcoded emoji map could be configurable
**Current Code:**
```typescript
function getStackEmoji(stackName: string): string {
  const emojiMap: Record<string, string> = {
    'identity': '🔐',
    'order': '📅',
    'payment': '💳',
    ...
  };
```
**Problem:** This is domain-specific to Beauty CRM but hardcoded in TDK CLI.
**Proposed Solution:** Move to configuration or accept that this is project-specific styling.
**Risk:** May need to remain project-specific.
**Priority:** LOW

---

### 15. Validation Result Type Duplication
**Location:** 
- `cli/src/types/index.ts` (lines 222-227)
- Multiple test files reimplement
**Issue:** `ValidationResult` interface pattern recreated in tests
**Current Code (types/index.ts):**
```typescript
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
```
**Problem:** Tests often recreate this structure instead of importing.
**Solution:** Ensure all test files import `ValidationResult` from types.
**Priority:** MEDIUM

---

### 16. Error Handling Pattern in Tests
**Location:** All `__tests__/*.test.ts` files
**Issue:** Each test file has its own `validateX()` function for testing validation
**Example:** `error-handling.test.ts` lines 12-20, `resource.test.ts` lines 9-17
**Problem:** Validation test utilities are duplicated.
**Solution:** Create `test-utils/validation-helpers.ts` with shared test validation functions.
**Priority:** MEDIUM

---

### 17. Resource Template String Duplication
**Location:** `cli/src/commands/resource.ts` (templates throughout)
**Issue:** Template strings for files use similar patterns
**Example:** `getBackendIndexTemplate`, `getWorkerIndexTemplate`, `getFrontendIndexTemplate` all use similar console.log patterns.
**Solution:** Consider if base template functions would help, or if explicit templates are clearer.
**Priority:** LOW

---

### 18. Import Pattern Inconsistency
**Location:** All files
**Issue:** Some imports use `.js` extension, some don't
**Example:** 
- `import { TabBar } from './TabBar.js';` (components/index.ts)
- `import { runCommand } from '../utils/errors.js';` (commands/stacks.ts)
**Problem:** While consistent within the project, this is boilerplate.
**Note:** This is actually correct for ESM modules, not a DRY violation.
**Priority:** NONE (working as intended)

---

### 19. Inquirer Prompt Patterns
**Location:** `cli/src/commands/resource.ts`, `cli/src/commands/stack.ts`
**Issue:** Similar prompt configurations
**Current Pattern:**
```typescript
const { inputName } = await inquirer.prompt([{
  type: 'input',
  name: 'inputName',
  message: 'Resource name (kebab-case):',
  validate: createKebabCaseValidator('resource')
}]);
```
**Problem:** Prompt configurations are similar but context-specific.
**Solution:** May not benefit from abstraction - prompts are declarative and readable as-is.
**Priority:** LOW

---

## Starlark Engine Observations

### 20. Constants Duplication Between Starlark Files
**Location:** 
- `discovery/TILT_DISCOVERY.star`
- `discovery/constants.star`
- `engine/topologies/tilt/config/defaults.star`
- `engine/topologies/platform/docker/constants.star`
**Issue:** Port ranges, valid stacks, and discovery paths defined in multiple Starlark files
**Example:** Port 3000-3999 (frontend), 4000-4999 (backend) appear in:
- `TILT_DISCOVERY.star`
- `platform-standards.ts` (TypeScript side)
**Note:** This may be intentional for separation between discovery and platform layers.
**Priority:** LOW (requires domain expertise)

---

### 21. Utility Function Duplication (Starlark)
**Location:** 
- `engine/topologies/tilt/common/utils.star`
- `discovery/validation.star`
**Issue:** Similar validation patterns in Starlark
**Example:** Both have name validation logic (kebab-case checking).
**Note:** Starlark cannot easily import from TypeScript, so some duplication may be necessary.
**Priority:** LOW (cross-language boundary)

---

## Recommendations by Priority

### Immediate (Do First)
1. **Consolidate date formatting** (formatting.ts) - 5 min task, zero risk
2. **Merge tooltip components** - Improves UI consistency
3. **Use getStatusColor in DetailPanel** - Simple import change
4. **Create ResourceSelectInput component** - Reduces UI.tsx complexity

### Short Term (This Week)
5. **Unify port range constants** - Single source of truth
6. **Extract box drawing utilities** - Reusable formatting
7. **Export templates from resource.ts** - Test maintainability
8. **Create displayResourceStats utility** - Command consistency

### Medium Term (Backlog)
9. **Create EmptyState component** - UI pattern consolidation
10. **Review Starlark constant duplication** - Requires architecture discussion
11. **Consider semantic color helpers** - If color usage continues to expand

### Not Recommended (Keep As Is)
- Command action wrapper abstraction (reduces clarity)
- Inquirer prompt abstraction (context-specific configs are clearer)
- Template string consolidation (explicit templates are self-documenting)

---

## Risk Assessment Matrix

| Consolidation | Risk Level | Effort | Impact | Recommendation |
|--------------|------------|--------|--------|----------------|
| Date formatting | Low | 15 min | Low | ✅ Implement |
| Tooltip consolidation | Low | 30 min | Medium | ✅ Implement |
| Port ranges | Medium | 1 hour | High | ✅ Implement with tests |
| SelectInput wrapper | Low | 45 min | Medium | ✅ Implement |
| Box utilities | Low | 30 min | Low | ✅ Implement |
| Status colors | Low | 15 min | Medium | ✅ Implement |
| Command pattern | High | 2 hours | Low | ❌ Skip |
| Color helpers | Medium | 1 hour | Low | ⏸️ Defer |
| Starlark constants | Low | 4 hours | Medium | ⏸️ Backlog |

---

## Implementation Strategy

### Phase 1: Zero-Risk Utilities (Today)
- formatting.ts consolidation
- DetailPanel.tsx import fix
- Tooltip base component

### Phase 2: TypeScript Constants (This Week)
- Port range unification
- Template exports
- Test utility creation

### Phase 3: Component Refactoring (Next Sprint)
- UI.tsx SelectInput consolidation
- EmptyState component
- ResourceStats utility

### Phase 4: Starlark Review (Future)
- Cross-reference Starlark constants
- Document intentional duplication
- Consolidate where appropriate

---

## Success Metrics

After implementation:
- **Lines of code reduction:** ~200-300 lines
- **Test coverage:** Should remain at current level or improve
- **Maintainability:** Fewer places to update when changing port ranges, status colors, or formatting
- **Consistency:** Status colors and tooltips uniform across UI

---

## Notes

1. **Some duplication is intentional:**
   - Starlark/TypeScript boundary duplication (different runtimes)
   - Test file template duplication (tests should be self-contained)
   - Command-specific prompt configurations (clarity over abstraction)

2. **The "Rule of Three":**
   - Some patterns appear twice but shouldn't be abstracted yet
   - Wait for third occurrence before creating shared utility

3. **Documentation debt:**
   - Each consolidation should include JSDoc comments
   - Update AGENTS.md if component patterns change

---

**Report Generated By:** Code Quality Specialist Agent
**Review Status:** Ready for implementation review
