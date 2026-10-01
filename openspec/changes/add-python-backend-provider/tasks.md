## 1. Preserve the existing Bun backend

- [ ] 1.1 Add `cli/src/backend-languages/` with a provider type and registry. Keep `DEFAULT_BACKEND_LANGUAGE` set to `bun`.
- [ ] 1.2 Move the existing Hono entry, package scripts, and Bun Dockerfile choices into the Bun provider without changing omitted-language output.
- [ ] 1.3 Capture today's Bun file set in a test before extraction and keep that test green afterward.
- [ ] 1.4 Keep legacy backend `service.json` files without `language` valid; discovery and `tdk up` must not rewrite them only to insert the field.
- [ ] 1.5 Keep interactive creation on Bun without prompting for a language.
- [ ] 1.6 Reject unknown `--language` values and use on non-backend types before writing files. Match registered ids case-insensitively.

## 2. Add the Node.js chosen template

- [ ] 2.1 Register `node`. Generate a TypeScript `/health` entry, a Node `package.json` start script, and a Node Dockerfile. Do not use a Bun base image.
- [ ] 2.2 Persist `"language": "node"` when `--language node` is selected.
- [ ] 2.3 Add Starlark Node image and Tilt reload behavior at the existing generated paths; leave Bun templates unchanged.
- [ ] 2.4 Test the Node file set, case-insensitive `Node`, absence of a Bun image, and that the CLI package does not gain service-template dependencies.

## 3. Add the Python chosen template

- [ ] 3.1 Register `python`. Generate a FastAPI app, `/health`, `pyproject.toml`, and a pytest smoke test.
- [ ] 3.2 Add `language` to `engine/schemas/service-schema.json` with `bun`, `node`, and `python`. Add a drift test so schema ids and registry ids stay identical.
- [ ] 3.3 Add Starlark Python image and Tilt live-update behavior at the existing generated paths; leave Bun templates unchanged.
- [ ] 3.4 Test Python output, persisted metadata, case-insensitive selection, unknown id rejection, non-backend rejection, and legacy manifest compatibility.
- [ ] 3.5 Verify FastAPI, uvicorn, and Python service dependencies are not added to the TDK CLI package.

## 4. Make database readiness truthful and verify the default example

- [ ] 4.1 Reproduce the failed example E2E: `orders-api` waits on `tdk_example_shop`, `/api/orders/health` returns 404, and Tilt reports `provision-db-shop` updated while the database is absent.
- [ ] 4.2 Trace the `DATABASE_URL` name, `provision-db-<stack>` target, and backend `resource_deps`; guarantee they identify the same database and that provisioning runs before the backend.
- [ ] 4.3 Make database provisioning fail when the database cannot be created or verified. A successful Tilt update must mean the configured database exists and accepts a connection.
- [ ] 4.4 Extend the default example E2E to assert the stack database exists, routed `/api/orders/health` returns success, and the existing API/worker write/read path completes.
- [ ] 4.5 Keep health probes from treating a backend as ready until its required database is available; confirm the request does not fall through to Traefik's 404 response after startup.

## 5. Document the provider contract

- [ ] 5.1 Add `docs/backend-language-providers.md` modeled on `docs/frontend-framework-providers.md`, covering the file map, provider registration, shared-versus-owned responsibilities, the Docker/reload exception, and a one-provider-per-implementation-PR checklist.
- [ ] 5.2 Link the backend guide from `CONTRIBUTING.md`.
- [ ] 5.3 Document `tdk resource api --type backend --language node --stack shop` and the Python equivalent in `cli/README.md`; state that omitting `--language` keeps the existing Bun default.
- [ ] 5.4 State that `bring-your-own` remains the path for languages without a provider.
