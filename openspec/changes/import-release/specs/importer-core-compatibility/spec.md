## ADDED Requirements

### Requirement: importer names the core it needs
The importer README and `docs/operator-runbook.md` MUST say the importer requires a TDK release that includes `buildContext` (tdk-cli-core#525). If that release is not out, the runbook MUST say so. It MUST NOT tell the user to run `tdk up` on an imported Compose service against an older core.

#### Scenario: core too old
- **GIVEN** core does not have `buildContext`
- **WHEN** a reader follows the import section
- **THEN** the page says the import cannot be started yet
- **AND** it names the pull request that adds `buildContext`
