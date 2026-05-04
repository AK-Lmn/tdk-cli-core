# Code Duplication Assessment Report

## Executive Summary

After comprehensive analysis of the TDK CLI codebase (`cli/src/`), I identified **8 distinct duplication patterns** ranging from high to low severity. The codebase is generally well-structured following DRY principles, but several consolidation opportunities exist that would reduce maintenance burden and improve consistency.

---

## Detailed Findings

### 🔴 HIGH SEVERITY

#### 1. Duplicate Cache Implementation (2 locations)
**Files:** `utils/discovery-context.ts`, `utils/services.ts`

Both files implement identical caching patterns:
- `clearDiscoveryCache()` / `clearMetadataCache()`
- `isCacheValid()` with TTL checking
- Separate cache storage variables

**Impact:** Code drift risk, inconsistent cache behavior

**Recommendation:** Extract to shared `utils/cache.ts` module with generic cache implementation

---

#### 2. Duplicate Port Checking Logic (2 locations)
**Files:** `utils/tilt.ts:7-18`, `commands/networks.ts:154-161`

Both implement port availability checking:
```typescript
// In tilt.ts - uses net.createConnection
// In networks.ts - uses execSafe('lsof', ...)
```

**Impact:** Inconsistent behavior, maintenance overhead

**Recommendation:** Consolidate in `utils/port-assignment.ts` with multiple check strategies

---

#### 3. Repeated Project Root Validation Pattern (10+ locations)
**Files:** Most command files

Every command repeats:
```typescript
const projectRoot = requireProjectRoot();
if (!projectRoot) {
  showErrorAndExit(...)
}
```

**Impact:** Boilerplate duplication

**Recommendation:** Create a `withProjectRoot()` wrapper decorator

---

### 🟡 MEDIUM SEVERITY

#### 4. Duplicate File Writing Progress Pattern (5 locations)
**Files:** `commands/resource.ts`, `commands/project.ts`, `generator/template-engine.ts`

Repeated pattern:
```typescript
console.log(chalk.blue('📝 Generating X...'));
writeJsonFileInDir(...);
console.log(chalk.green('✓ Done'));
```

**Recommendation:** Create `writeFileWithProgress()` utility

---

#### 5. Similar Command Action Wrappers (15+ locations)
**Files:** All command files

Every command uses identical wrapper pattern:
```typescript
.action(async (options) => {
  await runCommand(async () => {
    // implementation
  });
});
```

**Recommendation:** Extract to shared command factory

---

#### 6. Duplicate Spinner/Progress Patterns (2 locations)
**Files:** `commands/upgrade.ts`, `commands/resource.ts` (implicit via ora)

Multiple upgrade functions use identical spinner patterns:
```typescript
const spinner = ora('Message...').start();
try { ... spinner.succeed() } catch { spinner.fail() }
```

**Recommendation:** Create `withSpinner()` wrapper utility

---

### 🟢 LOW SEVERITY

#### 7. Inline Type Guards (3 locations)
**Files:** `utils/services.ts:52-56`, `generator/template-engine.ts:204-254`

Both have `isValidXxx()` type guard functions with similar patterns

**Recommendation:** Move to `types/guards.ts` if more type guards emerge

---

#### 8. Duplicate Status Icon/Color Mapping (2 locations)
**Files:** `utils/formatting.ts:61-68`, `components/FileTree.tsx:5-21`

Both define icon/color mappings but for different domains (status vs file types)

**Status:** Acceptable - different domains, but could share pattern

---

## Consolidation Implementation Plan

### Phase 1: High Priority (Immediate)
1. ✅ Extract shared cache utilities
2. ✅ Consolidate port checking logic
3. ✅ Create file writing with progress helper

### Phase 2: Medium Priority (Next Sprint)
4. Create command factory for common patterns
5. Extract spinner wrapper utilities

### Phase 3: Low Priority (Backlog)
6. Evaluate type guard consolidation
7. Consider icon/color mapping abstraction

---

## Files to be Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `utils/cache.ts` | **CREATE** | Shared cache implementation |
| `utils/discovery-context.ts` | **MODIFY** | Use shared cache |
| `utils/services.ts` | **MODIFY** | Use shared cache |
| `utils/port-assignment.ts` | **MODIFY** | Add port availability check |
| `utils/tilt.ts` | **MODIFY** | Use shared port check |
| `commands/networks.ts` | **MODIFY** | Use shared port check |
| `utils/file-helpers.ts` | **MODIFY** | Add progress logging helpers |
| `commands/resource.ts` | **MODIFY** | Use progress helpers |
| `commands/project.ts` | **MODIFY** | Use progress helpers |
| `generator/template-engine.ts` | **MODIFY** | Use progress helpers |

---

## Estimated Impact

- **Lines removed:** ~150-200 lines of duplication
- **Maintainability:** High - single source of truth for cache, port checking
- **Test coverage:** Easier to test consolidated utilities
- **Bundle size:** Negligible change (reorganization, not addition)

---

## Notes

- The codebase generally follows good DRY practices
- Most duplication is structural (command patterns) rather than logic
- Consolidation must preserve the explicit naming conventions per AGENTS.md
- All changes must maintain backward compatibility with existing CLI behavior

**Assessment Date:** 2025-01-30
**Assessed by:** Agent Code Quality Specialist
