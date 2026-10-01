## ADDED Requirements

### Requirement: Backend resource generation keeps Bun as the existing default

`tdk resource --type backend` has always scaffolded a Bun + Hono service. This change MUST NOT redefine that default. The CLI SHALL keep producing the existing Bun + Hono starter when `--type backend` is used without `--language`. Interactive creation SHALL keep scaffolding Bun and SHALL NOT add a language picker. A missing `language` field on an existing backend `service.json` SHALL mean Bun. Discovery and `tdk up` MUST NOT rewrite that file only to insert `language`.

#### Scenario: Omitted language preserves the historical Bun backend

- **WHEN** a user creates a backend resource without specifying a language
- **THEN** the generated service is the existing Bun + Hono starter
- **AND** the command does not scaffold a Node.js app or a Python app

#### Scenario: Interactive creation does not ask for a language

- **WHEN** a user creates a backend resource interactively and does not pass `--language`
- **THEN** the CLI scaffolds the Bun + Hono starter
- **AND** it does not prompt for Node.js or Python

#### Scenario: Legacy backend metadata omits language

- **WHEN** TDK reads an existing backend `service.json` that has no `language` field
- **THEN** the service remains valid and is treated as the existing Bun backend
- **AND** `service.json` is not rewritten solely to insert `"language": "bun"`

### Requirement: Node.js is a chosen backend template

The CLI SHALL accept `--language node` on a backend resource as an explicit template choice. Node.js is not the default. The resolved id SHALL be persisted as `"language": "node"`. Matching SHALL be case-insensitive (`Node`, `node`, and `NODE` select `node`). The Node template SHALL be a TypeScript HTTP API on the Node.js runtime, with a `/health` route, a `package.json` that starts under `node`, and a Dockerfile whose base image is Node.js, not Bun. The TDK CLI runtime MUST NOT gain the generated service's dependencies.

#### Scenario: Explicit Node template is selected

- **WHEN** a user runs `tdk resource orders-api --type backend --language node --stack shop --yes`
- **THEN** the Node provider is used
- **AND** generated `service.json` contains `"language": "node"` and `"appType": "backend"`
- **AND** generated `service.json` contains `"healthCheckPath": "/health"`
- **AND** the generated start command runs on Node.js, not Bun

#### Scenario: Node template file set

- **WHEN** the Node provider scaffolds a backend
- **THEN** the resource includes a TypeScript entry that serves `/health`
- **AND** includes `package.json` with a Node start script and the template dependencies
- **AND** includes a Dockerfile based on a Node.js image
- **AND** does not include a Bun base image, `bunfig.toml`, or a Python app entry
- **AND** the `tdk` package dependencies do not include the generated service dependencies

#### Scenario: Node language match is case-insensitive

- **WHEN** a user runs `tdk resource orders-api --type backend --language Node --stack shop --yes`
- **THEN** the Node provider is used
- **AND** generated `service.json` contains `"language": "node"`

### Requirement: Python is a chosen backend template

The CLI SHALL accept `--language python` on a backend resource as an explicit template choice. Python is not the default. The resolved id SHALL be persisted as `"language": "python"`. Matching SHALL be case-insensitive. The Python template SHALL be a FastAPI app on Python 3.12, with `/health`, a `pyproject.toml`, a pytest smoke test, and a Dockerfile based on `python:3.12-slim`. The TDK CLI runtime MUST NOT gain FastAPI, uvicorn, or a Python dependency.

#### Scenario: Explicit Python template is selected

- **WHEN** a user runs `tdk resource orders-api --type backend --language python --stack shop --yes`
- **THEN** the Python provider is used
- **AND** generated `service.json` contains `"language": "python"`
- **AND** generated `service.json` contains `"healthCheckPath": "/health"`

#### Scenario: Python template file set

- **WHEN** the Python provider scaffolds a backend
- **THEN** the resource includes a FastAPI app that serves `/health`
- **AND** includes `pyproject.toml` pinning FastAPI and uvicorn
- **AND** includes a pytest file that requests `/health`
- **AND** includes a Dockerfile based on `python:3.12-slim`
- **AND** does not include `package.json`, a Bun image, or a Node image
- **AND** the `tdk` package dependencies do not include FastAPI or uvicorn

### Requirement: Language selection fails closed

The CLI SHALL resolve `--language` only through registered provider ids. The initial registered ids are `bun`, `node`, and `python`. The CLI MUST reject an unknown identifier before creating the resource directory. The CLI MUST reject `--language` on a resource type other than backend. The error MUST identify the valid resource type and registered ids.

#### Scenario: Unknown language is rejected before generation

- **WHEN** a user runs `tdk resource orders-api --type backend --language ruby --stack shop --yes`
- **THEN** the command exits non-zero
- **AND** the error lists the registered ids `bun`, `node`, and `python`
- **AND** no resource directory is created

#### Scenario: Language option is rejected for non-backend resources

- **WHEN** a user supplies `--language node` or `--language python` while creating a frontend, worker, bring-your-own, sdk, library, or migrator
- **THEN** the CLI returns an actionable error that the option applies only to backend resources
- **AND** does not create or modify the resource

### Requirement: Chosen templates keep the shared backend contract

Every backend provider SHALL use the shared backend metadata and local runtime contract: port allocation in 4000–4999, Traefik hostname, `healthCheckPath`, `dependsOn` boot order, and stack-slice selection via `tdk up <stack>`. Provider selection SHALL NOT fork those behaviors. The image and Tilt reload command MAY differ per language because Node.js and Python processes require different runtimes. This is an intentional difference from frontend providers, which share one Docker and nginx path.

#### Scenario: Node and Python use the same port and health contract

- **WHEN** a Node backend and a Python backend are generated in the same stack
- **THEN** each receives a port in 4000–4999
- **AND** each declares `healthCheckPath` `/health`
- **AND** each is routable through the existing Traefik hostname pattern
- **AND** `dependsOn` still controls boot order

#### Scenario: Images and reload commands stay language-specific

- **WHEN** Tilt generates local runtime config for a Node backend
- **THEN** the image is a Node.js image and the reload command is the Node start command
- **WHEN** Tilt generates local runtime config for a Python backend
- **THEN** the image is `python:3.12-slim` and the reload command runs uvicorn
- **AND** neither image is `oven/bun`

### Requirement: Registry and schema stay locked

The schema enum for `language` SHALL contain exactly the registered provider ids. A test MUST fail when the enum and registry differ. New resources created with an explicit `--language` SHALL persist the normalized selected id. `tdk config regenerate` SHALL keep rebuilding project-level master config only and SHALL NOT recreate resource source files.

#### Scenario: Schema rejects an unregistered language

- **WHEN** a backend `service.json` sets `language` to a value outside `bun`, `node`, and `python`
- **THEN** schema validation fails
- **AND** the resource is not started

#### Scenario: Regenerating project config does not rewrite the template

- **WHEN** a user runs `tdk config regenerate` after scaffolding a Node or Python backend
- **THEN** project-level master config is rebuilt
- **AND** the resource source files are left unchanged


### Requirement: Database provisioning status guarantees backend readiness

When database management is enabled for a stack, the database provisioner SHALL create or verify the database named by the backend's generated `DATABASE_URL` before that backend starts. The backend SHALL depend on the matching `provision-db-<stack>` resource and PostgreSQL. The provisioner MUST fail its update when the database cannot be created or verified; an updated Tilt status MUST NOT be treated as success while the target database is missing. This contract applies equally to Bun, Node.js, and Python providers.

#### Scenario: Stack database exists before the backend starts

- **GIVEN** the `shop` stack enables database management
- **WHEN** TDK starts a database-backed backend whose `DATABASE_URL` targets `tdk_example_shop`
- **THEN** `provision-db-shop` creates or verifies `tdk_example_shop` before the backend process starts
- **AND** the backend resource depends on that provisioner and PostgreSQL
- **AND** the API can connect to the configured database before serving requests

#### Scenario: Database provisioning cannot silently report success

- **GIVEN** PostgreSQL is available but the configured stack database does not exist
- **WHEN** the database provisioner cannot create or verify that database
- **THEN** the provisioner update fails with an actionable diagnostic
- **AND** Tilt does not report the provisioner as successfully updated
- **AND** the database-backed backend is not reported healthy

#### Scenario: Example E2E proves routed database-backed readiness

- **GIVEN** the default example is configured with the `shop` stack and database management
- **WHEN** the example E2E starts the stack
- **THEN** it verifies the configured database exists before checking backend readiness
- **AND** `GET /api/orders/health` through Traefik returns a successful response
- **AND** the existing routed order write/read path completes with the worker observing the order
- **AND** a missing database cannot be masked as a transient route probe or a successful provisioner update
