## ADDED Requirements

### Requirement: Backend language selection

The CLI SHALL scaffold a Bun backend when `--type backend` is used without `--language`.
The CLI SHALL scaffold a Python FastAPI backend when `--type backend --language python` is used.
The CLI MUST reject an unknown language before creating the resource directory.
The CLI MUST reject `--language` on a resource type other than backend.

#### Scenario: Default backend stays Bun

- GIVEN a project with a stack `shop`
- WHEN the user runs `tdk resource orders-api --type backend --stack shop --yes`
- THEN `service.json` has `appType` backend and language `bun` or omitted-compatible Bun output
- AND the generated entry is a Hono app, not a Python app

#### Scenario: Opt-in Python backend

- GIVEN a project with a stack `shop`
- WHEN the user runs `tdk resource orders-api --type backend --language python --stack shop --yes`
- THEN `service.json` has `language` `python` and `healthCheckPath` `/health`
- AND the generated files include a FastAPI app and a Python Dockerfile
- AND the TDK CLI package dependencies do not include FastAPI

#### Scenario: Unknown language fails closed

- WHEN the user runs `tdk resource orders-api --type backend --language ruby --yes`
- THEN the command exits non-zero
- AND no resource directory is created
