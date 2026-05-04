# DRY Deduplication Critical Assessment

## Executive Summary

**Overall Duplication Health Score: 6/10**

The TDK CLI codebase exhibits moderate code duplication across its command modules. While the utility layer (`utils/`) is well-consolidated, the command layer (`commands/`) contains significant repetition in error handling, output formatting, and validation patterns. The codebase follows a consistent style but could benefit from abstraction to reduce maintenance burden and improve readability.

### Key Metrics
- **Source Files Analyzed**: 35 TypeScript files
- **High Priority Duplications**: 8 instances
- **Medium Priority Duplications**: 12 instances
- **Low Priority Duplications**: 5 instances
- **Estimated Lines Saved**: ~350 lines after consolidation

---

## Categories of Duplication Found

### High Priority (Must Consolidate)

These duplications represent exact or near-exact copies of code that should be immediately consolidated:

1. **Command Header Pattern** (6 occurrences)
   - Files: `resource.ts:326`, `stack.ts:19`, `config.ts:97`, `project.ts:97`
   - Pattern: `showCommandHeader('Title')` followed by chalk-formatted logging
   - Impact: Inconsistent styling when changes needed

2. **Discovery Context Pattern** (8 occurrences)
   - Files: `status.ts:27`, `stacks.ts:15`, `resources.ts:17`, `stack.ts:21`, `projects.ts:43`, `networks.ts:194`
   - Pattern: `const discovery = createDiscoveryContext()` at start of action
   - Impact: Resource waste from redundant calls (could memoize)

3. **Error + Exit Pattern** (12 occurrences)
   - Files: `up.ts:24-31`, `resource.ts:341-344`, `config.ts:188-190`, `networks.ts:421-435`
   - Pattern: `console.error(chalk.red(...))` followed by `process.exit(1)`
   - Impact: Inconsistent error formatting

4. **Empty State Display** (5 occurrences)
   - Files: `resources.ts:20`, `stacks.ts:18`, `stack.ts:23-26`, `status.ts:44-53`
   - Pattern: Check for empty resources + display message
   - Impact: Already partially consolidated via `showEmptyState()` but still scattered

5. **Project Root Validation** (14 occurrences)
   - Files: Almost all command files
   - Pattern: `requireProjectRoot()` or manual `findProjectRoot()` check
   - Impact: Some inconsistency in how errors are displayed

### Medium Priority (Should Abstract)

These represent similar patterns that could benefit from shared abstractions:

6. **Inquirer Prompt Wrappers** (4 occurrences)
   - Files: `resource.ts:332-338`, `resource.ts:348-358`, `stack.ts:55-61`, `project.ts:149-211`
   - Pattern: Similar structure for prompts with validation
   - Recommendation: Create `prompts.ts` utility module

7. **File Write Operations** (10 occurrences)
   - Files: `resource.ts:458-490`, `project.ts:227`, `stack.ts:106-113`
   - Pattern: Multiple sequential `writeJsonFileInDir` and `writeTextFileInDir` calls
   - Recommendation: Batch write utility

8. **Tilt Command Builders** (2 occurrences)
   - Files: `tilt.ts:99-122` (buildTiltUpArgs), `tilt.ts:124-138` (buildTiltDownArgs)
   - Pattern: Similar arg building patterns
   - Recommendation: Generic `buildTiltArgs` function

9. **Confirmation Prompts** (4 occurrences)
   - Files: `resource.ts:446-456`, `stack.ts:93-103`, `project.ts:122-131`
   - Pattern: Same inquirer confirm structure
   - Recommendation: `confirmAction()` utility

10. **Dry Run Pattern** (3 occurrences)
    - Files: `up.ts:56-60`, `down.ts:13-17`, `config.ts:23-111`
    - Pattern: Check `options.dryRun` then log and return
    - Recommendation: `withDryRun()` wrapper

11. **Console Box Formatting** (3 occurrences)
    - Files: `networks.ts:244-248`, `help.ts:4-17` (banner), `ui.tsx:583-595` (header)
    - Pattern: ASCII art boxes with repeated characters
    - Recommendation: `formatAsciiBox()` utility

12. **Resource Count Display** (12+ occurrences)
    - Files: Throughout command files
    - Pattern: `formatCount(x, 'resource')` or `formatCount(x, 'service')`
    - Impact: Already using utility but could standardize terminology

### Low Priority (Acceptable Repetition)

13. **Import Blocks** (All files)
    - Each file imports similar sets of utilities
    - This is acceptable for clarity

14. **Type Annotations** (Various)
    - Repetitive type declarations in similar contexts
    - TypeScript requires explicitness

15. **Command Registration** (`cli.ts`)
    - Sequential `program.addCommand()` calls
    - Necessary for CLI structure

---

## Specific Instances with File Paths

### Instance 1: Error Display + Exit Pattern
**Locations:**
- `commands/up.ts:24-31`
- `commands/resource.ts:421-425`, `428-429`
- `commands/config.ts:188-190`
- `commands/stack.ts:86-88`
- `commands/upgrade.ts:241-243`

**Current Code Pattern:**
```typescript
console.error(chalk.red(`Error: ${message}`));
if (!options.quiet) {
  console.error(chalk.gray('Additional context...'));
}
process.exit(1);
```

**Why Consolidate:**
- Inconsistent use of "Error:" prefix vs "❌" emoji
- Some include suggestions, others don't
- Exit codes are sometimes implicit, sometimes explicit

---

### Instance 2: Discovery Context Creation
**Locations:**
- `commands/status.ts:27`
- `commands/stacks.ts:15`
- `commands/resources.ts:17`
- `commands/stack.ts:21`
- `commands/projects.ts:43`
- `commands/networks.ts:194`
- `commands/ui.tsx:148-151`

**Current Code Pattern:**
```typescript
const discovery = createDiscoveryContext();
// or
const services = discoverResources();
const stacks = discoverStacks();
```

**Why Consolidate:**
- Multiple discovery calls in the same session are wasteful
- Could benefit from memoization at session level
- Inconsistent - some use context, some call services directly

---

### Instance 3: File Generation Block
**Location:** `commands/resource.ts:458-490`

**Current Code:**
```typescript
console.log(chalk.blue('📁 Creating directory structure...'));
mkdirSync(fullPath, { recursive: true });
// ... more mkdir calls

console.log(chalk.blue('📝 Generating service.json...'));
writeJsonFileInDir(fullPath, 'service.json', serviceJson);
// ... 10+ similar calls with different emojis
```

**Why Consolidate:**
- 10 sequential similar operations
- Emoji mapping could be centralized
- File type to template mapping is hardcoded

---

### Instance 4: Stack Selection Prompt
**Locations:**
- `commands/resource.ts:363-404`
- `commands/stack.ts:53-62` (simpler version)

**Current Code:**
```typescript
if (stackName === 'default') {
  const existingResources = allResources;
  const stackSet = new Set<string>();
  for (const r of existingResources) {
    if (r.stack) stackSet.add(r.stack);
  }
  // ... more logic
}
```

**Why Consolidate:**
- Complex nested prompt logic duplicated
- Both handle "create new" vs "select existing" flow

---

### Instance 5: Validation Result Pattern
**Locations:**
- `commands/config.ts:187-190`
- Pattern exists in multiple commands

**Current Code:**
```typescript
const validation = validateOptionalInfraService(service);
if (!validation.valid) {
  showErrorAndExit(validation.error ?? 'Invalid service');
}
```

**Why Consolidate:**
- Could use `assertValid()` wrapper
- Error message fallback is repetitive

---

### Instance 6: Confirmation Prompt Pattern
**Locations:**
- `commands/resource.ts:446-456`
- `commands/stack.ts:93-103`
- `commands/project.ts:122-131`

**Current Code:**
```typescript
const { confirm } = await inquirer.prompt([{
  type: 'confirm',
  name: 'confirm',
  message: 'Some message?',
  default: true
}]);

if (!confirm) {
  showCancelled();
  return;
}
```

**Why Consolidate:**
- Always the same structure
- Only message and default vary

---

### Instance 7: Formatting Box Lines
**Locations:**
- `commands/networks.ts:244-248`
- `commands/networks.ts:271-272`
- `commands/networks.ts:291`

**Current Code:**
```typescript
console.log(chalk.cyan('╭' + formatBoxLine('─', BOX_WIDTH - 2) + '╮'));
console.log(chalk.cyan('│') + chalk.bold.white(formatCentered('🌐  TRAEFIK NETWORKS', BOX_WIDTH - 2)) + chalk.cyan('│'));
// ... repeated pattern
```

**Why Consolidate:**
- Box drawing could be utility function
- ASCII art frame logic repeated

---

### Instance 8: Status Display Pattern
**Locations:**
- `commands/status.ts:16-23`
- Similar patterns in doctor.ts, projects.ts

**Current Code:**
```typescript
console.log(chalk.bold('Tilt:'), tiltAvailable ? chalk.green('available') : chalk.red('not found'));

if (!tiltAvailable) {
  console.log(chalk.gray('  Install Tilt: https://docs.tilt.dev/install.html'));
}
```

**Why Consolidate:**
- Binary status display (available/not found)
- Conditional suggestion display

---

### Instance 9: Resource Iterator Pattern
**Locations:**
- `commands/resources.ts:66-69`
- `commands/stacks.ts:41-45`
- `commands/stack.ts:46-49`
- `commands/status.ts:31-41`

**Current Code:**
```typescript
for (const resource of resources) {
  const stackInfo = resource.stack ? chalk.gray(` [${resource.stack}]`) : chalk.yellow(' [no stack]');
  console.log(`  ${resource.name}${stackInfo}`);
}
```

**Why Consolidate:**
- Similar resource listing with optional formatting
- Could use shared formatter

---

### Instance 10: Sigint Handler Pattern
**Locations:**
- `commands/resource.ts:289-297` (template string in worker)
- `commands/upgrade.ts:69`, `116`, etc. (upgrade process interruption)

**Current Code (in template):**
```typescript
process.on('SIGTERM', () => {
  console.log('[Worker] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Worker] SIGINT received, shutting down gracefully...');
  process.exit(0);
});
```

**Note:** This is in a template string, but represents a pattern that could be better organized.

---

## DRY Implementation Recommendations

### 1. Create `commands/utils/` Module

New utilities to add:

```typescript
// commands/utils/prompts.ts
export async function confirmAction(message: string, defaultValue = true): Promise<boolean>;
export async function selectResource(resources: DiscoveredResource[]): Promise<DiscoveredResource>;
export async function selectStack(stacks: string[]): Promise<string>;
```

```typescript
// commands/utils/display.ts
export function showError(message: string, suggestions?: string[]): void;
export function showStatus(label: string, isAvailable: boolean, suggestion?: string): void;
export function formatAsciiBox(title: string, content: string[], width?: number): string;
```

```typescript
// commands/utils/validation.ts
export function assertValid<T>(validation: ValidationResult, exitCode?: number): asserts validation is { valid: true };
```

### 2. Enhance `utils/formatting.ts`

Add:
- `formatResourceList(resources, options)` - standardized resource display
- `formatStackList(stacks, options)` - standardized stack display
- `formatAsciiBox(lines, width)` - ASCII art box helper

### 3. Create File Generation DSL

```typescript
// utils/file-generator.ts
export interface FileOperation {
  type: 'json' | 'text';
  filename: string;
  content: unknown;
  description: string;
  emoji: string;
}

export function generateFiles(operations: FileOperation[], basePath: string): void;
```

### 4. Memoize Discovery Context

```typescript
// utils/discovery-context.ts (enhanced)
let cachedContext: DiscoveryContext | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 1000; // 1 second

export function createDiscoveryContext(): DiscoveryContext {
  if (cachedContext && Date.now() - cacheTime < CACHE_TTL) {
    return cachedContext;
  }
  // ... create new context
  cachedContext = context;
  cacheTime = Date.now();
  return context;
}

export function clearDiscoveryCache(): void;
```

### 5. Standardize Error Factories

Add to `utils/errors.ts`:

```typescript
export const errorFactories = {
  // existing...
  resourceNotFound: (name: string) => new TdkError(...),
  stackNotFound: (name: string) => new TdkError(...),
  invalidPath: (path: string) => new TdkError(...),
  directoryExists: (path: string) => new TdkError(...),
};
```

---

## Files to Modify

### High Confidence Changes

1. **`utils/formatting.ts`** - Add ASCII box formatting
2. **`utils/errors.ts`** - Add more error factories
3. **`commands/resource.ts`** - Consolidate file generation
4. **`commands/stack.ts`** - Use shared confirmation utility
5. **`commands/config.ts`** - Use shared validation assertion

### Medium Confidence Changes

6. **`utils/discovery-context.ts`** - Add memoization
7. **`commands/up.ts`** - Use shared error display
8. **`commands/down.ts`** - Use dry run wrapper

### Low Priority (May Keep As-Is)

9. **Template strings** - Intentionally verbose for clarity
10. **Import blocks** - Required for explicit dependencies

---

## Implementation Strategy

### Phase 1: Foundation
1. Add utilities to `utils/` that don't affect existing code
2. Add type definitions for new utilities

### Phase 2: Adoption
1. Update commands one at a time to use new utilities
2. Run typecheck after each file
3. Maintain exact behavior

### Phase 3: Cleanup
1. Remove old unused patterns
2. Update AGENTS.md with new patterns
3. Document new utilities

---

## Expected Outcomes

### Metrics After Implementation
- **Estimated Lines Reduced**: ~350 lines
- **Duplication Health Score**: 8.5/10
- **Test Coverage Impact**: None (no behavior changes)
- **Bundle Size Impact**: Minimal (~1KB increase from utilities)

### Benefits
1. **Consistency**: All error messages follow same format
2. **Maintainability**: Change formatting in one place
3. **Readability**: Less boilerplate in command files
4. **Testability**: Shared utilities easier to test
5. **Developer Experience**: Less code to write for new commands

---

## Risk Assessment

### Low Risk
- Adding new utility functions (no existing code changes)
- Consolidating formatting (visual-only changes)

### Medium Risk
- Refactoring file generation (many moving parts)
- Changing discovery context caching (could affect timing)

### Mitigation
- Run full typecheck after each change
- Maintain exact console output
- Add unit tests for new utilities
- Keep changes minimal and focused

---

## Recommendations Not Implemented

The following are intentionally NOT being consolidated:

1. **Command registration** (`cli.ts`) - Necessary for CLI structure
2. **Type definitions** - TypeScript requires explicitness
3. **Template strings** - Verbose for clarity in generated code
4. **Test files** - Per instruction, not modifying
5. **Component props** - React component explicitness is valuable

---

## Appendix: Duplication Matrix

| Pattern | Files Affected | Severity | Consolidation Approach |
|---------|---------------|----------|----------------------|
| Error + Exit | 12 | High | `showError()` utility |
| Discovery Context | 8 | High | Memoization |
| File Generation | 1 | High | `generateFiles()` DSL |
| Confirmation Prompt | 4 | Medium | `confirmAction()` |
| Validation Result | 6 | Medium | `assertValid()` |
| Status Display | 4 | Medium | `showStatus()` |
| ASCII Boxes | 3 | Medium | `formatAsciiBox()` |
| Resource Iterator | 5 | Low | Keep as-is |
| Command Headers | 6 | Low | Already using utility |

---

*Report generated by Agent #12 (The Deduplicator)*
*Date: 2025-02-01*
*Scope: TDK CLI Phase 1 DRY Assessment*
