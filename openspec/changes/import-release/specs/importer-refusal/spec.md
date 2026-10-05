## ADDED Requirements

### Requirement: Helm and Kustomize write nothing
The published `npx @tdk-landscape/tdk-import <dir>` command MUST exit 2 when the directory has only a Helm chart or Kustomize files. It MUST write no `service.json`. `--dry-run` MUST print the plan and write nothing.

#### Scenario: Helm only
- **GIVEN** a directory with a Helm chart and no Compose, Dockerfile, package.json scripts, or Procfile
- **WHEN** the user runs the published 0.1.0 importer
- **THEN** the command exits 2
- **AND** the message names Helm as not imported
- **AND** no files are written

#### Scenario: Dry-run does not write
- **GIVEN** a directory containing only unsupported Helm or Kustomize deployment files
- **WHEN** the user runs the importer with `--dry-run`
- **THEN** the importer prints its plan
- **AND** no files are written
