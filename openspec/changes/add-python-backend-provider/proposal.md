## Why

Greenfield `tdk resource --type backend` always scaffolds a Bun + Hono service. Teams that want a Python API must use `bring-your-own` and write the Dockerfile, health check, and Tilt sync themselves. That makes Python a second-class local service even though the runtime contract is already Docker + Tilt + a health URL.

## What Changes

- Add an opt-in Python backend provider. Bun/Hono remains the default for `--type backend` and for existing manifests.
- Select it with `tdk resource <name> --type backend --language <language> --stack <stack>`. Persist `language: "python"` on the new `service.json`.
- Generate a runnable FastAPI service: `pyproject.toml`, app entry, `/health`, multi-stage Dockerfile, and Tilt live-update that reloads the process without a full image rebuild.
- Do not add Python, FastAPI, or uvicorn to the TDK CLI runtime. Generated files belong only to the resource.
- Keep ports, Traefik, health-checked boot order, and stack slices shared with Bun backends.

## Capabilities

### New Capabilities

- `backend-language-providers`: Language-specific backend scaffolding behind the shared backend service contract.

### Modified Capabilities

None. Language selection is part of the new capability. `bring-your-own` is unchanged.

## Impact

- Affected code: `cli/src/commands/resource.ts`, a new backend-language provider module, Starlark Docker/Tilt generators for the Python image and sync, `engine/schemas/service-schema.json`, CLI tests.
- Affected docs: `cli/README.md`, a short provider guide next to the frontend framework guide.
- Existing Bun backends are not rewritten. `tdk config regenerate` still does not recreate resource source.
