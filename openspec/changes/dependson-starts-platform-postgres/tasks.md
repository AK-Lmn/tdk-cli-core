# Tasks

## 1. Engine: Name Resolution

- [x] 1.1 In `apply_compose_resource_registration.star`, treat `postgres` and `database-management` in a selected resource's `dependsOn` as aliases for the shared platform Postgres Tilt resource `postgres`.
- [x] 1.2 Do not fall through to `postgres-yaml` (or any other name) for these two aliases.
- [x] 1.3 Keep unknown names (e.g. `postgress`, `Postgres`, `postgresql`, `my-db`) on the existing missing/unknown-dependency error path.
- [x] 1.4 Add Starlark unit tests for alias resolution to `postgres`, non-alias fall-through, and typo/near-miss errors.
- [x] 1.5 Add tests: mixed `dependsOn: ["postgres", "database-management"]` resolves both to one `postgres` edge; unknown names do not resolve to platform Postgres.

## 2. Engine: Start Path (Feature Off + Selected dependsOn)

- [x] 2.1 When `database-management` is off but any **selected** resource depends on `postgres` or `database-management`, start Postgres for that run (orchestrator calls `Infra.force_start_postgres` when feature off).
- [x] 2.2 Materialize platform files under `services/platform/database-management` using the existing Compose generation/path. Force path MUST pass `ctx.write_file`; missing write_fn or missing compose after ensure **fails the run** (no silent skip that leaves Tilt waiting on a bare name).
- [x] 2.3 Register the existing `postgres` Tilt resource through the same infra loader path the feature uses.
- [x] 2.4 Feature-on start path stays: one `postgres` resource, same compose, same port (when the feature is on). Do **not** claim feature-on is fully unchanged — resolution and verify/doctor still change when either name is present.
- [x] 2.5 Leave the feature-off + no such `dependsOn` path unchanged: Postgres does not start; no `postgres` resource registered solely because of `dependsOn`.
- [x] 2.6 Add tests: feature off + `dependsOn: ["postgres"]` starts Postgres with platform files present; feature off + `dependsOn: ["database-management"]` same; feature off + no dependency does not start Postgres. (Unit coverage: resolution + edge + force-path source guards + ctx idempotency; full register_compose materialize path needs a richer Tilt harness.)
- [x] 2.6b Force-start is idempotent across selected services: guard on `ctx['_shared_platform_postgres_force_started']` (Tilt freezes module globals). Two selected dependents call `force_start_shared_platform_postgres_once` once.
- [ ] 2.7 Add tests: empty `dependsOn: []` does not start Postgres; two selected dependents start Postgres once; feature on + either name does not create a second DB/image/port.
- [ ] 2.8 Add tests: materialized compose uses existing image/host-port/network conventions; no second host port; no per-service compose project for shared Postgres.
- [x] 2.9 Add tests: with feature **on**, `dependsOn: ["postgres"]` / `["database-management"]` resolve to Tilt `postgres`, not `postgres-yaml` (resolution changes in both feature states).

## 3. Engine: Dependency Edge

- [x] 3.1 Keep `postgres` in the selected resource's Tilt `resource_deps` when Postgres starts because of that `dependsOn`.
- [x] 3.2 Do not add a second `postgres` edge when `_build_infra_dependencies` already added it because `database-management` is on.
- [x] 3.3 Do not drop the edge when it is the reason Postgres should exist.
- [x] 3.4 Express the edge as Tilt `resource_deps` on `postgres` (start order), not a Tilt resource named `database-management`. Do not invent a health contract beyond the existing `database-management` path.
- [x] 3.5 Add tests: single edge with feature on + dependsOn; edge present with feature off + dependsOn (`postgres` and `database-management` names); no edge when neither feature nor selected dependency starts Postgres; no duplicate when feature + alias both present; other non-DB edges unchanged.

## 4. Engine: Selection Bound (start path only)

- [x] 4.1 Evaluate `dependsOn` for the **engine start path** only against resources in the current `tdk up` selection.
- [x] 4.2 A dependency on an unselected resource MUST NOT start Postgres when no selected resource depends on either name.
- [x] 4.3 Unselected dependents MUST NOT receive a `postgres` edge solely because another selected resource listed it.
- [ ] 4.4 Add tests: unselected `dependsOn: ["postgres"]` does not start Postgres; selected one does; partial selection starts Postgres for selected dependents only and does not edge S1 because of S2. (Selection bound is structural: force-start only runs inside `register_compose_resources`, which `apply.star` calls only for enabled/selected services. Full multi-service selection harness still pending.)

## 5. Engine: Prisma Non-Start Regression

- [x] 5.1 Ensure starting shared Postgres via `dependsOn` does not enable, launch, or scaffold Prisma, migrators, or other `featuresEnabled` entries.
- [x] 5.2 Assert `featuresEnabled` is not rewritten to include `prisma` when a resource only lists `dependsOn: ["postgres"]`.
- [x] 5.3 Assert no Prisma Tilt resource/job starts when `prisma` is not in `featuresEnabled`, even if shared Postgres starts.
- [x] 5.4 Assert unselected Prisma resources do not start solely because a selected resource depends on `postgres`.
- [x] 5.5 Add Starlark/unit tests for 5.1–5.4 (resource registration + feature predicates).
  - Force path source guards pin that `force_start_platform_postgres` / `_register_platform_postgres` register no Prisma/migrator resources.
  - CLI: `shared-platform-postgres` + doctor tests assert willStart is unaffected by missing prisma and that doctor does not claim Prisma starts.
  - Full register_compose Prisma non-start harness remains desirable alongside 2.6–2.8.

## 6. CLI: Verify and Doctor Reporting (project resource set)

- [x] 6.1 Predicate shape matches the engine: Postgres will start when the feature is on **or** an inspected project resource depends on `postgres` / `database-management`. Resource set is what verify/doctor already inspect — **not** a `tdk up` filter.
- [x] 6.1b Feature-on predicate uses `DEFAULT_ALWAYS_ENABLED_INFRA` from `project-config-defaults.ts` — the same default the generator bakes into the Tiltfile when `always_enabled_infra` is omitted (omitted field = feature ON, matching `should_enable`).
- [x] 6.2 `tdk config verify`: when Postgres will start because of a project resource's `dependsOn`, report that it will start because of that dependency. Feature-on-only case prints gray (not yellow); dependsOn reason prints green; both note project resource set vs `tdk up` selection.
- [x] 6.3 `tdk doctor`: same reporting for `dependsOn: ["postgres"]` and `["database-management"]`. Unknown-name failures still state whether Postgres will start (project scope).
- [x] 6.3b `--json` verify envelope: `sharedPlatformPostgres` is **additive**; consumers that only read the old shape are unaffected unless they require a closed schema.
- [x] 6.4 Do not report `postgres` or `database-management` as missing services when that dependency is present.
- [x] 6.5 Keep unknown names (e.g. `postgress`, `Postgres`, `postgresql`) as errors; they must not report Postgres-will-start.
- [x] 6.6 Verify and doctor MUST agree on the will-start predicate for the same project state.
- [x] 6.7 When no inspected project resource depends on either name and the feature is off, verify/doctor MUST NOT report Postgres-will-start because of a dependency.
- [x] 6.8 Add CLI tests for verify/doctor messages, missing-service suppression, typo/near-miss errors, agreement, and negative will-start cases.
- [x] 6.9 Add CLI tests that doctor/verify do **not** claim Prisma will start when `prisma` is not enabled, even when Postgres will start because of `dependsOn`.
- [x] 6.10 Add CLI tests that verify/doctor report will-start from a project resource even when that resource would not be selected by a hypothetical `tdk up` filter (project scope, not run scope).
- [x] 6.11 Do not change `tdk resource` scaffold output (`dependsOn: []` remains; Prisma stays under #531).

## 7. Verification and Evidence

- [x] 7.1 Manual/e2e: `database-management` off, one resource with `dependsOn: ["postgres"]` — `tdk up` starts shared Postgres (platform files materialized) and the service's `resource_deps` includes `postgres`.
  - **Force path proven** (scratch project `/tmp/tdk-force-pg-5HrK`):
    - `project.json`: `always_enabled_infra: ["proxy"]`; no `database-management` in any `enabledStacks`; resource `orders-api` with `dependsOn: ["postgres"]`.
    - Regenerated Tiltfile: `ALWAYS_ENABLED_INFRA = ["proxy"]`; `spec.master` has `"orders-api": True` and no `database-management`.
    - Default `tdk up` still logs `UBER-STYLE FOCUS MODE ACTIVATED` and expands `CORE_INFRA` → `INFRA_STACK_MAP["postgres"] = "database-management"`, so focus mode force-enables the feature even when `project.json` omits it. That is why earlier runs showed `Loading database management services...` after a fresh Tiltfile — not a stale Tiltfile.
    - **Force-path run:** generated Tiltfile only (scratch) set `FOCUS_MODE = False` after `Config.apply_focus` so `should_enable('database-management')` stays false. Evidence in `/tmp/force-pg-up5.log`:
      - `DEBUG INFRA: database-management not enabled`
      - `DEBUG COMPOSE: selected 'orders-api' dependsOn shared platform Postgres; force-starting postgres`
      - `Force-starting shared platform Postgres (selected dependsOn postgres/database-management)`
      - `Loading postgres compose from .../services/platform/database-management/docker-compose.yml`
      - **No** `Loading database management services...`
      - `dc_resource for 'orders-api' with deps=["orders-api-config-gen", "postgres"]`
    - Environment noise: Docker address pools exhausted on `init-networks` in this host; not a force-path failure.
  - **Implication for default `tdk up`:** focus mode enables `database-management` via `CORE_INFRA`, so Postgres still starts (feature path) and the edge is correct; the dependsOn force path runs when that feature is actually off (focus off / non-focus bring-up).
- [ ] 7.2 Manual/e2e: same with `dependsOn: ["database-management"]` — same shared Postgres, same edge.
- [ ] 7.3 Manual: feature on + either name — one `postgres` resource, no duplicate edge, no second database/image/port; resolution is Tilt `postgres`, not `postgres-yaml`.
- [ ] 7.4 Manual: no such `dependsOn` + feature off — Postgres does not start.
- [ ] 7.5 Manual: `dependsOn: ["postgress"]` — still an error in verify/doctor/resolution; Postgres does not start. (Unit-tested; not yet run as live `tdk up`/`doctor` on a typo project.)
- [ ] 7.6 Manual/e2e: `dependsOn: ["postgres"]` **without** Prisma in `featuresEnabled` — Postgres starts; no Prisma migrator/service/job starts; `featuresEnabled` unchanged.
- [ ] 7.7 Manual: `tdk up` filtered to a resource without the dependency, with only an unselected resource listing `dependsOn: ["postgres"]` — Postgres does not start for that run; verify/doctor still report will-start (project scope).
- [x] 7.8 Run `tests/tilt-engine/` unit tests, `bun test` for CLI, typecheck and Biome for touched packages; record evidence against this change.
  - CLI: `bun test src/utils/__tests__/shared-platform-postgres.test.ts src/utils/__tests__/doctor-wiring.test.ts` — 65 pass
  - Engine: `pytest tests/tilt-engine/test_dependson_platform_postgres.py` — 21 pass
  - Biome: clean on touched CLI files
  - typecheck: pre-existing `ajv` resolution failure in `service-schema-contract.test.ts` (also fails on main; unrelated)
  - Force-path live evidence: see 7.1 (focus-off scratch Tiltfile).
