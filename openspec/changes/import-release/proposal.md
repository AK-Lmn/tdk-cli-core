# Change: Ship the importer the runbook already claims

## Why
`@tdk-landscape/tdk-import@0.1.0` is on npm. The core runbook still points at a
separate PR, and a Procfile for Python or Ruby still produces no Dockerfile.
Today closes that gap: refuse what is not imported, and name the core release
the importer needs.

## What changes
- Confirm `0.1.0` is the Helm/Kustomize refusal, not a dry-run publish.
- Document the exact command and the core version it needs (`buildContext`).
- A non-Node Procfile either gets a Dockerfile or a clear skip. No silent half-service.
- Move the mid-file import in `cli/src/commands/__tests__/up.test.ts` to the top.

## Impact
- Affected: `docs/operator-runbook.md`, `tdk-import` readme, `up.test.ts`
- Out of scope: new languages, adopters, Windows `tdk up`, premium features

---

# Spec: published importer matches the refusal

### Requirement: Helm and Kustomize write nothing
`npx @tdk-landscape/tdk-import <dir>` MUST exit 2 when the directory has only a
Helm chart or Kustomize files. It MUST write no `service.json`. `--dry-run`
MUST print the plan and write nothing.

#### Scenario: Helm only
- GIVEN a directory with a Helm chart and no Compose, Dockerfile, package.json scripts, or Procfile
- WHEN the user runs the published 0.1.0 importer
- THEN the command exits 2
- AND the message names Helm as not imported
- AND no files are written

---

# Spec: core version pin

### Requirement: importer names the core it needs
The importer readme and `docs/operator-runbook.md` MUST say it needs a TDK
release that includes `buildContext` (tdk-cli-core#525). If that release is not
out, the runbook MUST say so. It MUST NOT tell the user to run `tdk up` on an
imported Compose service against an older core.

#### Scenario: core too old
- GIVEN core does not have `buildContext`
- WHEN a reader follows the import section
- THEN the page says the import cannot be started yet
- AND it names the pull request that adds `buildContext`

---

# Spec: non-Node Procfile

### Requirement: no Dockerfile means skipped, not started
A Procfile process whose command is not Node MUST be listed as skipped unless
the directory already has a Dockerfile or image for that process. The importer
MUST NOT write a `service.json` that `tdk up` cannot build.

#### Scenario: Python Procfile
- GIVEN a Procfile with `web: python app.py` and no Dockerfile
- WHEN the user runs the importer
- THEN that process is skipped
- AND the output says to add a Dockerfile or an image

---

# Spec: test file imports

### Requirement: imports stay at the top
`cli/src/commands/__tests__/up.test.ts` MUST import `parseTiltPort`,
`resolveTiltPort`, and `stopTiltForUp` in the top import block. No import
statement after a `vi.mock` call.

#### Scenario: file parses
- GIVEN the drift-gate suite is closed
- WHEN vitest loads `up.test.ts`
- THEN it does not report a parse error
