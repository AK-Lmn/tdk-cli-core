## Context

The published importer, its README, the core operator runbook, and a CLI test file need to agree on the current import boundary and compatible core release. The change spans importer behavior/documentation and the core repository's runbook and test suite.

## Goals / Non-Goals

**Goals:**
- Make the published 0.1.0 importer's refusal behavior explicit and safe.
- State the exact importer invocation and the first TDK core release that supports `buildContext`.
- Ensure non-Node Procfile processes are emitted only when the importer can describe a buildable service.
- Keep the `up.test.ts` imports in a valid top-level import block.

**Non-Goals:**
- Add language support, adopter onboarding, Windows `tdk up`, or premium features.
- Change the importer release beyond documenting what 0.1.0 does, unless implementation reveals its behavior does not meet the stated contract.

## Decisions

- Treat import recognition and refusal as a published CLI contract: unsupported Helm/Kustomize-only inputs exit with status 2, explain the unsupported input, and do not create output files. Dry-run reports a plan without writing.
- Document the importer command alongside a release prerequisite. The runbook must gate use on a core release containing `buildContext`; until that release exists, it must say importing cannot be started and identify tdk-cli-core#525.
- Filter non-Node Procfile entries that have neither a Dockerfile nor an image. Report the skip and the remedy, and do not serialize an unbuildable service.
- Keep the three named helper imports in the test file's initial import block, before any `vi.mock` calls.

## Risks / Trade-offs

- [The 0.1.0 published package may differ from the checked-in importer source] → Verify the release behavior and make README wording precise about the published version.
- [The availability of a core release containing `buildContext` can change] → State the actual release status at implementation time and avoid instructions that use older core releases.
- [Procfile command classification may misidentify a runtime] → Restrict this rule to commands identified as non-Node and preserve existing Dockerfile/image-backed process support.
