## 1. CLI Duplicate — Audit & Verify

- [ ] 1.1 Confirm `beauty-crm/cli/` is not listed in `beauty-crm/package.json` workspaces
- [ ] 1.2 Confirm no CI/CD or scripts reference `beauty-crm/cli/` as a build path
- [ ] 1.3 Verify `beauty-crm/cli/package.json` name is `@tdk/cli` (not `@beauty-crm/cli`)
- [ ] 1.4 Verify `tdk-cli/cli/` has superset of files vs `beauty-crm/cli/` (extra features, fixes)
- [ ] 1.5 Check `beauty-crm/bun.lock` does NOT lock `@tdk/cli` to a `file:cli` path
- [ ] 1.6 Check `.tilt-engine/` and `Tiltfile` for any references to `beauty-crm/cli/`

## 2. CLI Duplicate — Remove & Symlink

- [ ] 2.1 Remove `beauty-crm/cli/` directory (all contents)
- [ ] 2.2 Create symlink: `beauty-crm/cli/ → ../tdk-cli/cli/`
- [ ] 2.3 Verify symlink resolves correctly: `ls -la beauty-crm/cli/` shows it pointing to `../tdk-cli/cli/`
- [ ] 2.4 Verify `tdk` command still works from `beauty-crm/` directory

## 3. AI Config — Audit Current State

- [ ] 3.1 Catalog all AI assistant configs in `beauty-crm/`:
  - Directories: `.claude/`, `.cursor/`, `.continue/`, `.roo/`, `.serena/`, `.agents/`, `.augment/`, `.kiro/`
  - Root files: `CLAUDE.md`, `.cursorrules`, `.windsurfrules`, `.roomodes`, `.augment-guidelines`
- [ ] 3.2 Identify content overlap:
  - Extract `.cursorrules` — compare to `CLAUDE.md` (likely 32-line subset)
  - Extract `.windsurfrules` — compare to `CLAUDE.md` (likely superset)
  - Extract `.augment-guidelines` — compare to `CLAUDE.md`
- [ ] 3.3 Check if `.roo/rules/` contains unique content not in `CLAUDE.md`
- [ ] 3.4 Check if `.cursor/mcp.json` contains unique MCP server configs

## 4. AI Config — Consolidate

- [ ] 4.1 Remove `.cursorrules` (redundant with `CLAUDE.md`)
- [ ] 4.2 Remove `.windsurfrules` (redundant with `CLAUDE.md`)
- [ ] 4.3 Remove `.augment-guidelines` (redundant with `CLAUDE.md`)
- [ ] 4.4 Remove `.roomodes` (Roo can read modes from `.roo/rules/`)
- [ ] 4.5 Keep all AI assistant directories in place (each reads from its own native path):
  - `.cursor/`, `.continue/`, `.roo/`, `.serena/`, `.agents/`, `.augment/`, `.kiro/`
- [ ] 4.6 Add a comment header to each assistant's main config pointing to `CLAUDE.md`:
  - `.cursor/mcp.json` → `# SEE CLAUDE.md FOR PROJECT CONTEXT`
  - `.roo/rules/` → README referencing `CLAUDE.md`
  - Others as needed

## 5. AI Config — Documentation

- [ ] 5.1 Add section to `beauty-crm/CONTRIBUTING.md` or `CLAUDE.md`:
  - `CLAUDE.md` is the canonical source of truth for AI project context
  - `.claude/` is the primary AI skills directory
  - Each AI assistant keeps its own directory format and path
- [ ] 5.2 Keep `.cursor/rules/` in place (native Cursor format, won't read from elsewhere)
- [ ] 5.3 Verify `identity/`, `platform/`, `tdk-cli/` don't need AI configs (scope boundary)

## 6. Verification

- [ ] 6.1 Run `git status` to review all changes
- [ ] 6.2 Verify symlink: `ls -la beauty-crm/cli/ && node beauty-crm/cli/bin/tdk.js --version`
- [ ] 6.3 Verify no broken references: `grep -r "beauty-crm/cli" --include="*.{ts,js,json,sh,yml,yaml}" -l`
- [ ] 6.4 Verify CLAUDE.md is still loadable by Claude Code
- [ ] 6.5 Ask team to test their preferred AI assistant still works after consolidation
