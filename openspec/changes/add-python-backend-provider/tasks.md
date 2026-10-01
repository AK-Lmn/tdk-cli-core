## 1. Isolate the Bun backend starter

- [ ] 1.1 Add `cli/src/backend-languages/` with a provider type and registry. Default id `bun`.
- [ ] 1.2 Move Hono entry, package scripts, and Bun Dockerfile choices out of the generic backend path into the Bun provider.
- [ ] 1.3 Omitted `--language` still writes a Bun backend. New Bun resources persist `language: "bun"`. Existing manifests without the field stay valid and are not rewritten.
- [ ] 1.4 Fail before file writes on unknown `--language`, or on `--language` with a non-backend type.

## 2. Add the Python provider

- [ ] 2.1 Register `python`. Generate FastAPI app, `/health`, `pyproject.toml`, and a pytest smoke test.
- [ ] 2.2 Add `language` to `engine/schemas/service-schema.json` with `bun` and `python`. Schema and registry must match; add the same drift test the frontend enum uses.
- [ ] 2.3 Starlark: Python image and Tilt live-update at the existing generated paths. Bun templates unchanged.
- [ ] 2.4 CLI tests: Bun default file set, Python file set, persisted metadata, unknown id, non-backend rejection, legacy manifest still valid.

## 3. Docs

- [ ] 3.1 Document `tdk resource api --type backend --language python --stack shop` in `cli/README.md`.
- [ ] 3.2 Add a backend language provider guide modeled on `docs/frontend-framework-providers.md`.
- [ ] 3.3 State that `bring-your-own` remains the path for languages without a provider.
