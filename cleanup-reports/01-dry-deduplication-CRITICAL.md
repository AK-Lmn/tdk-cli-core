# DRY Deduplication Critical Assessment Report

**Date:** 2025-01-30  
**Agent:** Subagent 1 - The DRY Deduplicator  
**Scope:** TDK CLI codebase at /private/var/www/2025/ollamar1/tdk-cli  

---

## Executive Summary

After comprehensive analysis of the TDK CLI codebase (28 source files, ~4,500 lines of code), I identified **15 distinct duplication patterns** across severity levels. The codebase shows good modularization in some areas but has significant duplication in error handling, validation logic, output formatting, and project discovery patterns.

---

## HIGH SEVERITY (Immediate Action Required)

### 1. Duplicate Resource/Stack Listing Logic (commands/resources.ts, commands/stacks.ts, commands/projects.ts)
**Location:** 
- `commands/resources.ts` lines 24-40, 66-69
- `commands/stacks.ts` lines 24-58
- `commands/projects.ts` lines 43-63

**Issue:** All three commands implement nearly identical filtering and display logic for resources and stacks:
```typescript
// resources.ts (lines 24-40)
if (options.stack) {
  resources = resources.filter(r => r.stack === options.stack);
  if (resources.length === 0) {
    showEmptyState('stack-services', ` in stack "${options.stack}"`);
    return;
  }
}

// stacks.ts (similar pattern)
const stackServiceMap = new Map<string, number>();
for (const s of services) {
  if (s.stack) {
    stackServiceMap.set(s.stack, (stackServiceMap.get(s.stack) || 0) + 1);
  }
}
```

**Impact:** High - Maintenance burden, inconsistent behavior risk
**Recommendation:** Create `ResourceListRenderer` utility class in `utils/formatting.ts`

---

### 2. Duplicate Project Root Validation with Different Error Handling
**Location:**
- `commands/project.ts` lines 60-66
- `commands/config.ts` lines 18-23, 148-152
- `commands/resources.ts` lines 14-15
- `commands/networks.ts` lines 198-203
- `utils/errors.ts` lines 69-77 (requireProjectRoot)

**Issue:** Five different patterns for checking project root:
```typescript
// Pattern 1: Using requireProjectRoot (errors.ts)
const projectRoot = requireProjectRoot(); // exits on failure

// Pattern 2: Manual check with console.error (networks.ts)
if (!projectRoot) {
  console.error(chalk.red('❌ Not in a TDK project directory'));
  process.exit(1);
}

// Pattern 3: Throw error
if (!projectRoot) {
  throw new Error('Not in a TDK project');
}
```

**Impact:** High - Inconsistent user experience, exit code inconsistency
**Recommendation:** Standardize on `requireProjectRoot()` utility

---

### 3. Duplicate Port Range Definitions
**Location:**
- `utils/constants.ts` lines 43-47 (PORT_RANGES)
- `config/platform-standards.ts` lines 27-60 (PORTS)

**Issue:** Two sources of truth for port ranges:
```typescript
// constants.ts
export const PORT_RANGES = {
  frontend: { base: 3000, min: 3000, max: 3999 },
  backend: { base: 4000, min: 4000, max: 4999 },
  worker: { base: 6000, min: 6000, max: 6999 },
} as const;

// platform-standards.ts  
const PORTS = {
  frontend: { base: 3000, range: "3000-3999", start: 3000, end: 3999 },
  backend: { base: 4000, range: "4000-4999", start: 4000, end: 4999 },
  // ... plus additional ranges not in constants.ts
} as const;
```

**Impact:** Critical - Risk of port assignment conflicts
**Recommendation:** Consolidate into single source of truth in `constants.ts`

---

### 4. Duplicate File Check Patterns
**Location:**
- `commands/doctor.ts` lines 62-87 (checkMasterConfigs)
- `commands/projects.ts` lines 23-40
- `commands/project.ts` lines 71-93

**Issue:** Three implementations checking for TILT_RESOURCE_DEFAULTS.star and TILT_TECH_STACK.star:
```typescript
// doctor.ts
const defaultsPath = resolve(process.cwd(), "TILT_RESOURCE_DEFAULTS.star");
const techStackPath = resolve(process.cwd(), "TILT_TECH_STACK.star");

// projects.ts (checks in project root)
const defaultsPath = resolve(projectRoot, 'TILT_RESOURCE_DEFAULTS.star');
const techStackPath = resolve(projectRoot, 'TILT_TECH_STACK.star');

// project.ts (checks in .tdk/.tdk-out/)
const allFilesExist = MASTER_CONFIG_FILES
  .every(f => existsSync(join(projectRoot, '.tdk', '.tdk-out', f)));
```

**Impact:** High - Different locations checked in different commands
**Recommendation:** Create `ProjectConfigChecker` utility

---

## MEDIUM SEVERITY (Should Address)

### 5. Duplicate Console Output Patterns
**Location:** Throughout multiple command files

**Issue:** Repeated chalk styling patterns:
```typescript
// Pattern appears 20+ times across files:
console.log(chalk.blue('Some header'));
console.log(chalk.green('✓ Success message'));
console.log(chalk.red('✗ Error message'));
console.log(chalk.gray('  Indented detail'));
console.log(chalk.yellow('⚠️ Warning'));
```

**Impact:** Medium - Visual inconsistency risk, hard to change branding
**Recommendation:** Create `OutputLogger` utility with methods like `logger.header()`, `logger.success()`

---

### 6. Duplicate Kebab-Case Validation
**Location:**
- `utils/validation.ts` lines 10-12, 14-25, 27-41
- `commands/resource.ts` lines 350-367 (implicit via validateResourceName)

**Issue:** Three related but separate validation functions:
```typescript
function isKebabCase(value: string): boolean  // internal
export function validateResourceName(name: string): ValidationResult  // resource-specific
export function createKebabCaseValidator(context: 'resource' | 'stack')  // factory
```

**Impact:** Medium - Could be unified into single validator with options
**Recommendation:** Consolidate into `validateName()` with options object

---

### 7. Duplicate Error Message Extraction
**Location:**
- `utils/errors.ts` lines 12-14 (getErrorMessage)
- `commands/upgrade.ts` lines 30-33, 49-51 (inline getErrorMessage usage)
- `utils/services.ts` lines 49-51, 220, 278-280, 304-306 (inline err handling)

**Issue:** `getErrorMessage()` exists but many places still use inline patterns:
```typescript
// services.ts
console.warn(`Warning: Could not read directory ${dir}: ${getErrorMessage(err)}`);

// But also:
const errorCode = isNodeError(err) ? err.code : undefined;
if (errorCode !== 'ENOENT') {
  console.warn(`Warning: ...: ${getErrorMessage(err)}`);
}
```

**Impact:** Medium - Minor inconsistency
**Recommendation:** Ensure all error logging uses `getErrorMessage()`

---

### 8. Duplicate Package.json Reading Pattern
**Location:**
- `commands/version.ts` lines 6-10
- `commands/upgrade.ts` lines 54-63

**Issue:** Both files read package.json using nearly identical code:
```typescript
// version.ts
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));

// upgrade.ts
const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
```

**Impact:** Low-Medium - Could be centralized
**Recommendation:** Create `getPackageVersion()` utility

---

### 9. Duplicate "No Items Found" Handling
**Location:**
- `utils/formatting.ts` lines 145-163 (showEmptyState)
- `commands/resources.ts` lines 19-22, 28-30, 36-39
- `commands/stacks.ts` lines 17-20
- `commands/stack.ts` lines 22-25, 42-45

**Issue:** Some places use `showEmptyState()`, others inline the logic:
```typescript
// formatting.ts (good)
showEmptyState('resources');

// stack.ts (inline duplication)
if (resourcesToUpdate.length === 0) {
  console.log(chalk.yellow('\nNo resources available to add to this stack.'));
  return;
}
```

**Impact:** Medium - Inconsistent empty state UX
**Recommendation:** Replace all inline empty state handling with `showEmptyState()`

---

### 10. Duplicate Resource Type Checking
**Location:**
- `commands/resource.ts` lines 26-28 (isCreatableResourceType)
- `utils/constants.ts` lines 19-26 (VALID_RESOURCE_TYPES)
- `types/index.ts` lines 49 (ResourceType union)

**Issue:** Type information exists in multiple places:
```typescript
// constants.ts
export const VALID_RESOURCE_TYPES: ResourceType[] = ['backend', 'frontend', ...];

// resource.ts
const CREATABLE_RESOURCE_TYPES = ['backend', 'frontend', 'worker'] as const;
function isCreatableResourceType(type: string): type is CreatableResourceType {
  return (CREATABLE_RESOURCE_TYPES as readonly string[]).includes(type);
}
```

**Impact:** Medium - Type drift risk
**Recommendation:** Derive creatable types from constants using TypeScript utilities

---

## LOW SEVERITY (Nice to Have)

### 11. Duplicate Template Generation Patterns
**Location:**
- `commands/resource.ts` lines 91-248 (inline templates)
- `generator/template-engine.ts` (Handlebars templates)

**Issue:** Resource templates are hardcoded in resource.ts but the project has a template engine system

**Impact:** Low - Templates work fine, just inconsistent approach
**Recommendation:** Consider migrating resource templates to Handlebars

---

### 12. Duplicate Signal Handler Patterns
**Location:**
- `commands/resource.ts` lines 311-319 (worker template)
- `utils/tilt.ts` lines 30-83 (runTilt process handling)

**Issue:** Graceful shutdown patterns appear in generated code and runtime

**Impact:** Low - Generated code vs runtime code
**Recommendation:** No action needed, different use cases

---

### 13. Duplicate Format Count Logic
**Location:**
- `utils/formatting.ts` lines 4-10 (formatCount with pluralize)
- `services.ts` line 139 (inline pluralization)

**Issue:** One inline pluralization in services.ts:
```typescript
// services.ts line 139
description: `${stackResources.length} resource${stackResources.length === 1 ? '' : 's'}`,
```

**Impact:** Low - Single occurrence
**Recommendation:** Replace with `formatCount()`

---

### 14. Duplicate Discovery Configuration
**Location:**
- `utils/constants.ts` lines 53-71 (SKIP_DIRECTORIES)
- `config/platform-standards.ts` lines 97-110 (FILEWATCH_IGNORES)

**Issue:** Similar but not identical lists:
```typescript
// constants.ts
SKIP_DIRECTORIES = ['node_modules', '.git', '.tilt', ... 20 items]

// platform-standards.ts
FILEWATCH_IGNORES = ['node_modules', 'dist', 'build', ... 11 items]
```

**Impact:** Low - Different purposes, some overlap
**Recommendation:** Document the distinction, consider extracting shared entries

---

### 15. Duplicate Emoji/Icon Definitions
**Location:**
- `utils/constants.ts` lines 92-103 (STACK_EMOJIS)
- `utils/formatting.ts` lines 102-107 (getStatusIcon)

**Issue:** Two different emoji/icon mapping systems

**Impact:** Low - Different use cases
**Recommendation:** No action needed

---

## Implementation Plan

### Phase 1: Critical (HIGH severity) - Must Fix
1. Consolidate PORT_RANGES into single source of truth
2. Create ProjectConfigChecker utility for file existence checks
3. Standardize all project root validation to use `requireProjectRoot()`
4. Create ResourceListRenderer utility for listing commands

### Phase 2: Medium Priority
5. Create OutputLogger utility for consistent console output
6. Consolidate kebab-case validation functions
7. Standardize empty state handling with `showEmptyState()`
8. Create getPackageVersion() utility

### Phase 3: Low Priority / Future
9. Document SKIP_DIRECTORIES vs FILEWATCH_IGNORES distinction
10. Consider migrating resource templates to template engine

---

## Files Modified (Expected)

| File | Changes |
|------|---------|
| `utils/constants.ts` | Remove duplicate PORT_RANGES, export single source |
| `config/platform-standards.ts` | Import PORT_RANGES from constants |
| `utils/errors.ts` | Ensure all error handling uses getErrorMessage() |
| `commands/resources.ts` | Use standardized listing utility |
| `commands/stacks.ts` | Use standardized listing utility |
| `commands/projects.ts` | Use ProjectConfigChecker |
| `commands/networks.ts` | Use requireProjectRoot() |
| `commands/doctor.ts` | Use ProjectConfigChecker |
| `commands/config.ts` | Use requireProjectRoot() consistently |
| `commands/version.ts` | Use getPackageVersion() utility |
| `commands/upgrade.ts` | Use getPackageVersion() utility |
| `utils/services.ts` | Use formatCount() instead of inline |
| `commands/resource.ts` | Use consolidated validation |

---

## Testing Requirements

After each change:
1. Run `npm test` to ensure tests pass
2. Run `npm run typecheck` to verify TypeScript
3. Manual test affected commands:
   - `tdk resources` (filtering, empty states)
   - `tdk stacks` (listing)
   - `tdk projects` (config checking)
   - `tdk doctor` (config validation)
   - `tdk resource` (validation)

---

## Summary

The TDK CLI codebase has 15 identified duplication patterns ranging from critical (port range conflicts) to low (minor code style). The highest priority fixes involve:

1. **Data consistency**: PORT_RANGES duplication could cause port assignment conflicts
2. **User experience**: Inconsistent error handling and empty states
3. **Maintainability**: Scattered listing logic and validation functions

Estimated effort: 2-3 hours for Phase 1 (critical), 2 hours for Phase 2 (medium), 1 hour for Phase 3 (low).

---

**Report Generated By:** Subagent 1 (The DRY Deduplicator)  
**Next Steps:** Proceed with Phase 1 implementation
