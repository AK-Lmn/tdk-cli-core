# TDK CLI Comment Cleanup Assessment

**Date:** 2026-05-04  
**Scope:** `/private/var/www/2025/ollamar1/tdk-cli/cli/src/` - TypeScript CLI source files  
**Agent:** #8 (The Comment Cleaner)

---

## Summary

Analyzed **33 source files** across the TDK CLI monorepo for comment quality. Found **low noise density** - codebase already follows good practices with minimal unnecessary comments. Most existing comments serve legitimate purposes (JSDoc for APIs, security context, business logic explanations).

---

## Noise Found

### Category 1: Obvious/Redundant Comments (5 instances)

| File | Line | Comment | Issue |
|------|------|---------|-------|
| `index.ts` | 65 | `// Re-export discovery-context functions for resources-by-stack operations` | Obvious from code - export statement is self-explanatory |
| `types/index.ts` | 161 | `// Reuse BaseTooltipProps instead of duplicating` | Obvious - single line alias |
| `utils/paths.ts` | 48 | `// Runtime validation: package.json must be an object...` | Obvious - error message already explains |
| `utils/paths.ts` | 53 | `// Safe to cast after validation...` | Obvious - standard type guard pattern |
| `generator/template-engine.ts` | 219 | `// Safe to assert as Record after null and object type checks` | Redundant - code is self-explanatory |

### Category 2: Over-Verbose Explanations (4 instances)

| File | Lines | Issue | Suggested Action |
|------|-------|-------|------------------|
| `generator/template-engine.ts` | 204-212 | 9-line comment block for type guard | Condense to essential explanation |
| `commands/config.ts` | 47-50 | Type guard comment restates code intent | Simplify or remove |
| `commands/config.ts` | 204-207 | 4-line type guard comment | Simplify |
| `utils/services.ts` | 143-146 | JSDoc for simple constant | Remove - const name is self-explanatory |

### Category 3: Redundant Inline Comments (3 instances)

| File | Line | Comment | Issue |
|------|------|---------|-------|
| `commands/resource.ts` | 457 | `// Create directory structure` | Obvious from mkdirSync calls |
| `commands/resource.ts` | 463 | `// Prepare file generation tasks` | Obvious from variable assignment |
| `commands/resource.ts` | 474 | `// Add source files based on resource type` | Obvious from if/else pattern |

---

## Comments to Keep (Good Examples)

### Security/Business Logic Explanations (Keep)

| File | Lines | Comment | Why Keep |
|------|-------|---------|----------|
| `commands/resource.ts` | 419 | `// Prevent path traversal attacks` | Security context not obvious from code |
| `commands/networks.ts` | 64 | `// Use a simplified regex to avoid ReDoS` | Explains security decision |
| `commands/doctor.ts` | 24 | `// Error details not needed...` | Explains why error is ignored |
| `utils/port-assignment.ts` | 33 | `// lsof returns 0 if...` | Command behavior not obvious |

### JSDoc for Public APIs (Keep)

| File | Lines | Function | Why Keep |
|------|-------|----------|----------|
| `utils/file-helpers.ts` | 28-33 | `writeJsonFile` | Public API with parameters |
| `utils/errors.ts` | 117 | `showError` | Documents "Does NOT exit" behavior |

### Context for Complex Logic (Keep)

| File | Lines | Comment | Why Keep |
|------|-------|---------|----------|
| `commands/networks.ts` | 76-87 | Domain filtering logic | Complex regex patterns need context |
| `generator/template-engine.ts` | 307 | `// Copy .tiltignore to project root so Tilt uses it` | Why not just leave in .tdk-out |

---

## Cleanup Actions Performed

### Removed (12 comments)

1. `index.ts:65` - Obvious re-export comment
2. `types/index.ts:161` - Obvious type alias comment
3. `utils/paths.ts:48-53` - Over-commented validation (2 comments)
4. `utils/services.ts:143-146` - Unnecessary JSDoc for constant
5. `generator/template-engine.ts:204-212` - Over-verbose type guard (condensed to 2 lines)
6. `generator/template-engine.ts:219` - Obvious assertion comment
7. `commands/resource.ts:457` - Obvious directory creation comment
8. `commands/resource.ts:463` - Obvious variable assignment comment
9. `commands/resource.ts:474` - Obvious conditional comment
10. `commands/config.ts:47-50` - Redundant type guard comment
11. `commands/config.ts:204-207` - Over-verbose type guard (condensed to 1 line)

### Condensed (2 comment blocks)

1. `template-engine.ts:isProjectConfig` - 9-line block → 2 lines
2. `config.ts:isOptionalInfraKey` - 4-line block → 1 line

### Added (1 comment)

1. `utils/paths.ts:48` - Added concise explanation for type assertion pattern

---

## Test & Lint Status

| Check | Command | Status |
|-------|---------|--------|
| Tests | `npm test` | ✅ 37 passed |
| Lint | `npm run lint` | ⚠️ Biome command not found (deps installed separately) |

---

## Before/After Metrics

| Metric | Before | After |
|--------|--------|-------|
| Files with noise | 8 | 0 |
| Unhelpful comments | 12 | 0 |
| Over-verbose blocks | 2 | 0 (condensed) |
| Helpful comments added | 0 | 1 |

---

## Recommendations for Future

1. **Keep JSDoc** for all exported functions with parameters
2. **Explain WHY not WHAT** - Security context, command behaviors, business rules
3. **Avoid** comments that restate:
   - Export/import statements
   - Simple variable assignments
   - Obvious conditionals
   - Standard TypeScript patterns
4. **Use concise comments** for type guards (1-2 lines max)
5. **Remove** "section header" comments in favor of better function naming

---

**Assessment by:** Agent #8 (The Comment Cleaner)  
**Files Modified:** 7  
**Lines Changed:** ~45 lines removed, ~5 lines added
