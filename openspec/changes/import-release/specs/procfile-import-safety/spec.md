## ADDED Requirements

### Requirement: no Dockerfile means skipped, not started
A Procfile process whose command is not Node MUST be listed as skipped unless the directory already has a Dockerfile or image for that process. The importer MUST NOT write a `service.json` that `tdk up` cannot build.

#### Scenario: Python Procfile
- **GIVEN** a Procfile with `web: python app.py` and no Dockerfile
- **WHEN** the user runs the importer
- **THEN** that process is skipped
- **AND** the output says to add a Dockerfile or an image
