## 1. Verify published importer contract

- [ ] 1.1 Inspect the published 0.1.0 behavior for Helm/Kustomize-only directories and dry-run; align implementation if it does not meet the refusal spec.
- [ ] 1.2 Ensure unsupported Helm/Kustomize input reports the unsupported type, exits 2, and writes no `service.json`.
- [ ] 1.3 Ensure `--dry-run` prints the plan without writing files.

## 2. Gate importer documentation on core support

- [ ] 2.1 Determine whether a TDK core release containing `buildContext` is available and record its version or that it is not released yet.
- [ ] 2.2 Update the importer README with the exact import command and the required core release containing `buildContext` (tdk-cli-core#525).
- [ ] 2.3 Update `docs/operator-runbook.md` with the same command and prerequisite; if unavailable, state that importing cannot be started and do not direct users to run against an older core.

## 3. Handle Procfile services without build instructions

- [ ] 3.1 Skip non-Node Procfile processes that have no matching Dockerfile or image, and tell the user to add one.
- [ ] 3.2 Confirm generated `service.json` contains no skipped process that `tdk up` cannot build.

## 4. Correct test imports

- [ ] 4.1 Move `parseTiltPort`, `resolveTiltPort`, and `stopTiltForUp` imports into the top import block of `cli/src/commands/__tests__/up.test.ts`, before all `vi.mock` calls.
