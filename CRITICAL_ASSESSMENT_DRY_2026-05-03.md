# DRY Implementation Assessment

**Date:** 2026-05-03  
**Scope:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src`  
**File Types:** TypeScript (.ts, .tsx)

---

## Executive Summary

This assessment identifies code duplications in the TDK CLI codebase and provides recommendations for consolidation. The focus is on **high-confidence** consolidations that genuinely reduce complexity without creating "utility hell."

---

## Findings

### 1. **HIGH** - Duplicate Package.json Template Logic

**Files:**
- `commands/resource.ts` (lines 90-114)
- `commands/__tests__/resource.test.ts` (lines 125-188)

**Duplicate Code:**
```typescript
// In resource.ts
function createPackageJson(name: string, type: string) {
  const isFrontend = type === 'frontend';
  return {
    name: `@project/${name}`,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: isFrontend ? 'vite' : 'bun run --watch src/index.ts',
      build: isFrontend ? 'tsc && vite build' : 'tsc',
      ...
    },
    dependencies: {
      ...(isFrontend ? {} : { hono: '^4.0.0' }),
    },
    ...
  };
}

// In resource.test.ts - nearly identical inline object
const packageJson = {
  name: `@project/${name}`,
  version: '0.0.1',
  ...
};
```

**Severity:** High  
**DRY Violation:** Same template logic duplicated in tests and implementation  
**Recommended Approach:** 
- Export `createPackageJson` from resource.ts or a templates.ts module
- Update tests to use the actual function  
**Confidence:** High

---

### 2. **HIGH** - Duplicate Service.json Template Logic

**Files:**
- `commands/resource.ts` (lines 69-88, TYPE_SPECIFIC object)
- `commands/__tests__/resource.test.ts` (lines 37-95)

**Duplicate Code:**
- Backend service.json structure defined twice
- Frontend service.json structure defined twice  
- Worker service.json structure defined twice

**Severity:** High  
**DRY Violation:** Same template objects in both production and test code  
**Recommended Approach:**
- Export `createServiceJson` and `TYPE_SPECIFIC` from resource.ts
- Import in tests and verify against actual templates
**Confidence:** High

---

### 3. **HIGH** - Similar Exec Check Pattern in Doctor Commands

**Files:**
- `commands/doctor.ts` (lines 8-60)

**Duplicate Code:**
```typescript
// Pattern repeated 3 times with only name/command varying
function checkDocker(): CheckResult {
  try {
    execSync("docker ps", { stdio: "pipe" });
    return { name: "Docker", didPass: true, message: "..." };
  } catch {
    return { name: "Docker", didPass: false, message: "...", fix: "..." };
  }
}

function checkTilt(): CheckResult { ...same pattern... }
function checkDockerCompose(): CheckResult { ...same pattern... }
```

**Severity:** High  
**DRY Violation:** Identical try/catch structure repeated  
**Recommended Approach:**
- Create a `createExecCheck()` factory that takes command, name, messages
- Reduces 3 functions to simple configuration objects  
**Confidence:** High

---

### 4. **HIGH** - Duplicate Port Assignment Logic

**Files:**
- `commands/resource.ts` (lines 459-480)
- `utils/services.ts` (discoverResources and port handling)

**Duplicate Code:**
- Collecting used ports from resources
- Finding next available port in range
- PORT_RANGES usage pattern

**Severity:** High  
**DRY Violation:** Port assignment logic should be centralized  
**Recommended Approach:**
- Create `assignPort(resourceType: string, existingResources: DiscoveredResource[]): number` in utils
- Use in resource.ts and anywhere ports need assignment
**Confidence:** High

---

### 5. **MEDIUM** - Chalk Color Output Patterns

**Files:**
- `commands/up.ts` - dry-run messages (lines 56-58)
- `commands/down.ts` - dry-run messages (lines 14-16)
- `commands/networks.ts` - status messages
- Multiple other commands

**Duplicate Code:**
```typescript
console.log(chalk.gray('Dry run - not starting resources.'));
console.log(chalk.gray(`Would run: tilt up ${serviceNames.join(' ')}`));

// In down.ts:
console.log(chalk.gray('Dry run - not stopping resources.'));
console.log(chalk.gray('Would run: tilt down'));
```

**Severity:** Medium  
**DRY Violation:** Similar dry-run message pattern  
**Recommended Approach:**
- Could create `printDryRun(action: string, command: string)` utility
- But this is borderline - may not reduce complexity  
**Confidence:** Medium

---

### 6. **MEDIUM** - Project Root Check Pattern

**Files:**
- `commands/networks.ts` (lines 194-199)
- `commands/resource.ts` (uses requireProjectRoot)
- Various commands using `requireProjectRoot()`

**Duplicate Code:**
```typescript
const projectRoot = findProjectRoot();
if (!projectRoot) {
  console.error(chalk.red('❌ Not in a TDK project directory'));
  process.exit(1);
}
```

**Severity:** Medium  
**DRY Violation:** Some commands use requireProjectRoot, others inline the check  
**Recommended Approach:**
- Use `requireProjectRoot()` consistently across all commands
- Already exists in utils/errors.ts  
**Confidence:** High (for unifying usage)

---

### 7. **MEDIUM** - Stack Resource Count Logic

**Files:**
- `commands/stacks.ts` (lines 44-49)
- `commands/projects.ts` (lines 58-61)
- `commands/stack.ts` (lines 33-34)

**Duplicate Code:**
```typescript
// Count resources per stack
const count = resources.filter(r => r.stack === name).length;
// Or variations of this pattern
```

**Severity:** Medium  
**DRY Violation:** Same filtering logic repeated  
**Recommended Approach:**
- Create `countResourcesInStack(resources, stackName)` utility
- Export from utils/services.ts  
**Confidence:** Medium

---

### 8. **LOW** - Console Output Section Headers

**Files:**
- `commands/resource.ts` - lines 501-553
- `commands/project.ts` - lines 225-242

**Duplicate Code:**
- Pattern: `console.log(chalk.blue('📁 Creating directory structure...'));`
- File generation progress messages

**Severity:** Low  
**DRY Violation:** Visual progress indicators are similar  
**Recommended Approach:**
- Not recommended for consolidation - these are context-specific UI patterns
- Forcing abstraction would create "utility hell"  
**Confidence:** Low

---

### 9. **HIGH** - File Writing Pattern with JSON Stringify

**Files:**
- `commands/resource.ts` (lines 506-553)
- `commands/project.ts` (lines 226)
- `generator/template-engine.ts` (lines 300)

**Duplicate Code:**
```typescript
writeFileSync(
  resolve(fullPath, 'service.json'),
  JSON.stringify(serviceJson, null, 2) + '\n',
  'utf-8'
);
// Similar pattern for package.json, tsconfig.json, etc.
```

**Severity:** High  
**DRY Violation:** Same write pattern with JSON stringify + newline  
**Recommended Approach:**
- Create `writeJsonFile(path, data)` utility in utils  
- Consistent formatting and error handling  
**Confidence:** High

---

### 10. **MEDIUM** - Type Guard Pattern for ResourceType

**Files:**
- `commands/resource.ts` (lines 26-28)
- `utils/validation.ts` - has similar patterns

**Duplicate Code:**
```typescript
function isCreatableResourceType(type: string): type is CreatableResourceType {
  return (CREATABLE_RESOURCE_TYPES as readonly string[]).includes(type);
}
```

**Severity:** Medium  
**DRY Violation:** Type checking pattern could be generalized  
**Recommended Approach:**
- Create generic `isInArray<T>(value: string, array: readonly T[]): value is T`  
- Or use the existing `includes()` from validation.ts  
**Confidence:** Medium

---

## Summary

| Priority | Finding | Confidence | Action |
|----------|---------|------------|--------|
| High | Package.json template duplication | High | Consolidate |
| High | Service.json template duplication | High | Consolidate |
| High | Doctor exec check pattern | High | Consolidate |
| High | Port assignment logic | High | Consolidate |
| High | File writing pattern | High | Consolidate |
| Medium | Project root check pattern | High | Unify usage |
| Medium | Stack resource count | Medium | Consider |
| Medium | Type guard pattern | Medium | Consider |
| Low | Console output headers | Low | Skip |

---

## Recommended Implementation Order

1. **Port Assignment Utility** (`utils/port-assignment.ts`)
2. **File Writing Utility** (`utils/file-helpers.ts`)
3. **Doctor Check Factory** (`commands/doctor.ts` internal refactor)
4. **Template Exports** (`commands/resource.ts` exports)
5. **Consistent requireProjectRoot usage**

---

**Assessment completed by:** Code Deduplication Specialist  
**Date:** 2026-05-03
