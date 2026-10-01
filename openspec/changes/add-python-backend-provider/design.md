## Context

Backend scaffolding is inline in `cli/src/commands/resource.ts` and assumes Bun, Hono, a TypeScript entry, and a Bun Dockerfile. Frontend frameworks already use a provider registry (`cli/src/frontend-frameworks`) plus Starlark templates. Python should follow that seam instead of another special case in `resource.ts`.

`bring-your-own` already wraps an existing Dockerfile or image and must stay the escape hatch for Go, Java, and legacy services.

## Goals / Non-Goals

**Goals:**

- Keep Bun/Hono the default. Omitted `language` means `bun`.
- Reject an unknown `--language` before any files are written.
- Generate a service that answers `/health` and is reachable through the existing Traefik hostname.
- Live-update Python source on save via Tilt, without changing Bun live-update.
- Document the provider contract so the next language copies Python, not `resource.ts`.

**Non-Goals:**

- Changing the default language or migrating existing Bun resources.
- Adding Go, Java, or a second Python framework in this change.
- Prisma, NATS, or Verdaccio wiring for Python.
- A Python dependency in the CLI package.
- Replacing `bring-your-own`.

## Decisions

### Provider id `python`, framework FastAPI

One id: `python`. The starter is FastAPI + uvicorn, because it has a small ASGI app, a real `/health`, and reload support. Persist `language: "python"` and `framework: "fastapi"` so a later provider (for example Flask) can share the language without a second flag now.

Alternative considered: stdlib `http.server`. Smaller image, worse match for a service teams will extend.

### Same flag shape as frontend `--framework`

`--language` is only valid with `--type backend`. Using it with `frontend`, `worker`, or `bring-your-own` fails before writes. Interactive create still defaults to Bun and does not prompt.

Alternative considered: `--type python`. That splits the resource type enum and duplicates port range, stack, and health behavior.

### Shared contract, language-owned files

Shared generator owns `service.json` fields TDK already reads (`appName`, `appType`, `stack`, `port`, `healthCheckPath`, `dependsOn`), port allocation in 4000–4999, Traefik route, and health-gated boot order.

Python provider owns `pyproject.toml`, `src/main.py`, `tests/test_health.py`, and the Python Dockerfile stages. Starlark owns the Tilt `live_update` sync and the uvicorn reload command, written under the existing generated-config paths. Do not emit a second Compose file.

Base image: `python:3.12-slim`. No Bun in that image.

### CLI runtime stays language-neutral

Generated `pyproject.toml` pins FastAPI and uvicorn. The CLI package does not depend on them. Tests assert file contents, not a running interpreter, unless the existing CI job already has Python.

## Risks / Trade-offs

- Extracting the Bun starter while adding a branch can change Bun output. Capture current Bun file set in a test first.
- Uvicorn reload inside Tilt can miss file events on some Docker Desktop setups. Document the sync path and fall back to a container restart trigger if live reload is unreliable.
- FastAPI as the only Python framework will be called lock-in again. The id split (`language` vs `framework`) leaves room for a second provider without a schema break.

## Migration Plan

1. Extract the Bun starter behind the provider registry without changing omitted-language output.
2. Add the Python provider, schema enum, and generator.
3. Document the command and the non-goal list.

Rollback is a revert. Already generated services do not need a migration.

## Open Questions

None for this change. Worker support for Python is out of scope. A Python migrator resource is out of scope.
