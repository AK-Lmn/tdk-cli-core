# Design

## Context

TDK local orchestration registers a `postgres` Tilt resource only from the platform `database-management` stack feature. On `main` of this repo:

- `_load_database_management` in `engine/topologies/tilt/resources/infra-loader.star` returns immediately when `should_enable('database-management')` is false. When the feature is on, it ensures `services/platform/database-management/docker-compose.yml` (generating it if missing) and registers `dc_resource('postgres', ...)`.
- `_build_infra_dependencies` in `engine/topologies/tilt/resources/orchestrator/apply_compose_resource_registration.star` appends `postgres` to every service's `resource_deps` only when `should_enable('database-management')` is true.
- `_resolve_dependency_to_resource` maps a `dependsOn` short name through the services map, then a `-yaml` suffix, then stack/prefix matching, and finally returns `dep_name + '-yaml'` as a last resort. It has no special case for `postgres` or `database-management`.
- Manifest validation and `tdk doctor` accept `postgres` / `database-management` in `dependsOn` without reporting a missing service (the name is treated as known even when no Postgres resource exists). They do **not** report that Postgres will start because of that dependency.
- `tdk resource` still writes `"dependsOn": []` except when Prisma is enabled (which writes `["postgres"]`). That scaffold path is issue [#531](https://github.com/tdk-landscape/tdk-cli-core/issues/531) and is out of scope here.

Issue [#533](https://github.com/tdk-landscape/tdk-cli-core/pull/533) was closed without merging. Its proposed resolution (map both names to the Tilt `postgres` resource, drop the entry when the resource does not exist, Prisma scaffolding, doctor availability checks) is **not** on `main`. This spec must not cite #533 as shipped behavior. The source for the current path is [#531](https://github.com/tdk-landscape/tdk-cli-core/issues/531).

Problem on main: with `database-management` off, a manifest such as

```json
{ "name": "orders-api", "dependsOn": ["postgres"] }
```

is valid, accepted by verify/doctor, ignored at start: `tdk up` starts the service and does not start Postgres. With the feature on, Postgres starts because of the feature, not because of the dependency name.

Stakeholders: TDK CLI users writing `service.json` manifests; maintainers of the Starlark engine and CLI doctor/verify.

## Goals / Non-Goals

**Goals:**

- Make `dependsOn: ["postgres"]` and `dependsOn: ["database-management"]` a start signal for the **one shared platform database** when at least one **selected** resource lists either name.
- Reuse the existing platform Compose (`services/platform/database-management/docker-compose.yml`) and the existing `postgres` Tilt resource — no second image, port, or volume.
- Keep the dependent's Tilt edge on `postgres`, without adding a duplicate edge when `database-management` already carries it.
- Materialize platform files when starting Postgres because of a dependency, not only a Tilt edge (so `tdk up` does not wait on a resource with no compose).
- Make verify/doctor report Postgres-will-start because of that dependency; keep unknown names as errors.
- Bound the start signal to the current `tdk up` / resource selection.
- Ensure this path does **not** start Prisma or rewrite `featuresEnabled` when Prisma is not enabled.

**Non-Goals:**

- Prisma, migrators, `featuresEnabled`, or changing what `tdk resource` scaffolds (`dependsOn: []`). See #531.
- Per-service databases, custom Postgres images, or alternate host ports.
- Production deployment changes; this is local orchestration only.
- Changing how `database-management` itself starts Postgres when the feature is already on.

## Decisions

- **Decision: Both names mean the one shared platform database.** `postgres` and `database-management` resolve to the same Tilt resource (`postgres`) and the same platform Compose. Do not fall through to `postgres-yaml` for these two names. *Rationale:* #531 already documents the dual naming (feature name vs Tilt resource name); users should not need to know which surface they are on. *Alternative:* treat only `postgres` as special — rejected: leaves `database-management` as a silent no-op when the feature is off.
- **Decision: Start signal is "any selected resource depends on it," not "feature on."** If any resource in the current selection lists either name, Postgres starts even when `database-management` is off. If no selected resource lists either name and the feature is off, Postgres stays off. *Rationale:* the dependency is the user's explicit request for the database; the feature is a project-wide switch that may be off. *Alternative:* enable the project feature globally when any manifest lists the name — rejected: expands scope to every service in the project and blurs selection.
- **Decision: "Start Postgres" materializes platform files, then registers the existing resource.** Starting because of `dependsOn` must ensure `services/platform/database-management/docker-compose.yml` exists (same generation/path as `_ensure_database_management_compose` / `_load_database_management`) and register the existing `postgres` Tilt resource (same image, same host port, same network). *Rationale:* a Tilt edge without compose makes `tdk up` wait forever; a second compose/image/port fragments the shared database. *Alternative:* only add a resource_deps edge — rejected: nothing starts Postgres. *Alternative:* invent a new resource name (`postgres-dependency`) — rejected: breaks wait-on-`postgres` and duplicates infra.
- **Decision: Selection bound.** A `dependsOn` on a service this `tdk up` does not select MUST NOT start Postgres. *Rationale:* keep the signal honest to what is being brought up; avoid starting shared infra for services the run does not include. *Alternative:* scan the whole project regardless of selection — rejected: over-starts infra and surprises partial stacks.
- **Decision: Keep the edge; do not drop or double-add.** When Postgres exists (feature on or dependency-triggered), the selected resource's Tilt `resource_deps` includes `postgres` exactly once. Do not drop the entry when it is the reason Postgres should exist. When `database-management` already adds `postgres` via `_build_infra_dependencies`, do not append it again from `dependsOn`. When neither the feature nor a selected dependency starts Postgres, the existing no-`postgres`-resource path is unchanged (no wait on a missing name). *Rationale:* dropping the entry when it is the start reason is the bug; double edges are noise and break tests. *Alternative:* always rewrite manifests — rejected: no need; Tilt only needs the resolved edge.
- **Decision: Verify/doctor report the start reason.** When a selected resource depends on either name and Postgres will start (feature on, or this new dependency path), report that Postgres will start because of that dependency. Do not report `postgres` / `database-management` as missing services in that case. Unknown names (e.g. `postgress`) stay missing-service errors. *Rationale:* today verify/doctor accept the name silently and never say Postgres will start — the DX gap in #643. *Alternative:* only fail when Postgres would not start — rejected: leaves the user without the "it will start" signal when the path is valid.
- **Decision: Do not treat a Compose file alone as proof Postgres starts.** Availability for reporting and for the start path is the same predicate: feature on **or** a selected resource depends on either shared-DB name. A hand-written `services/platform/database-management/docker-compose.yml` with the feature off and no such `dependsOn` does not start Postgres (unchanged today). *Rationale:* Tilt skips `_load_database_management` when the feature is off, regardless of files on disk.
- **Decision: Implementation home.** Engine owns resolution + materialize + single edge + selection bound. CLI verify/doctor reuse the same predicate for reporting. `tdk up` selection is the existing resource-selection path; no new CLI surface. *Rationale:* one source of truth for "will Postgres start because of this run."
- **Decision: Prisma and other features are not started by this dependency.** Starting shared Postgres because of `dependsOn` MUST NOT enable, launch, or scaffold Prisma, migrators, or any other `featuresEnabled` entry. If `prisma` is not in `featuresEnabled`, this path starts Postgres only. Scaffold output from `tdk resource` stays `"dependsOn": []`. *Rationale:* #643 is only about `dependsOn` starting Postgres; coupling it to Prisma would blur #531 and risk accidental feature enablement. *Alternative:* auto-enable Prisma when Postgres starts — rejected: wrong signal, out of scope.
- **Decision: Expanded test matrix is part of the spec, not a follow-up.** The capability spec carries scenarios for feature on/off, both names, materialization, edge duplication, selection bound, verify/doctor agreement, typos/near-misses, no second DB/image/port, and Prisma-not-enabled non-start. Tasks require unit + CLI + manual coverage for those cases. *Rationale:* the bug is "valid manifest is ignored"; regression tests must pin every bound.

## Risks / Trade-offs

- **Feature already on + dependency also lists Postgres** → Edge and start path must converge on one `postgres` resource and one edge. Mitigate: idempotent registration (if `postgres` already in `resource_deps`, do not append) and reuse `_load_database_management` rather than a second loader.
- **Partial `tdk up` selection** → Starting Postgres for selected dependents is correct; starting it for unselected manifests is not. Mitigate: evaluate `dependsOn` only against resources in the current selection.
- **Compose materialization writes generated files into the project** → Same behavior as the existing feature path when the feature is on; new only when the feature is off. Mitigate: reuse the existing generator and path; document that generated files are TDK-owned.
- **Doctor/verify drift from engine** → Reporting "will start" while Tilt does not, or vice versa. Mitigate: shared predicate; cover both in tasks as one unit of work; require verify/doctor agreement tests.
- **Accidental Prisma enablement / side-start** → Starting Postgres must not imply Prisma. Mitigate: explicit non-goal + regression scenarios that Prisma jobs/services/`featuresEnabled` stay untouched when Prisma is not enabled.
- **Citing unmerged #533 as current** → Spec would describe behavior that does not exist on main. Mitigate: problem statement sourced from #531 + main code; #533 explicitly non-sourced.
- **Scope creep into #531 (Prisma scaffold / migrators)** → Mitigate: explicit non-goal; `tdk resource` output unchanged; tests pin non-start.

## Migration Plan

1. Implement engine resolution: map `postgres` / `database-management` in selected `dependsOn` to the shared `postgres` Tilt resource (no `postgres-yaml` fall-through for these names).
2. Implement start path: when a selected resource depends on either name and `database-management` is off, ensure platform Compose files under `services/platform/database-management` and register the existing `postgres` Tilt resource via the existing loader path.
3. Implement edge building: attach `postgres` to the selected resource exactly once; no drop when it is the start reason; no duplicate when feature already adds it.
4. Implement selection bound: only selected resources' `dependsOn` values trigger the start path.
5. Implement verify/doctor reporting with the same predicate; keep unknown-name errors; do not report these names as missing when the dependency is present.
6. Implement Prisma non-start guardrails: this path never enables or launches Prisma/migrators/`featuresEnabled` entries.
7. Tests: engine unit tests for resolution, materialize, single edge, feature-on/off, selection bound, Prisma non-start; CLI tests for verify/doctor messages, agreement, typo/near-miss errors, Prisma non-report; manual/e2e check that `tdk up` starts Postgres with feature off + `dependsOn: ["postgres"]` and the service waits on `postgres`, and that Prisma does not start when not enabled.
8. **Rollback:** revert the change; behavior returns to main (feature-only Postgres start; `dependsOn` names remain accepted no-ops when the feature is off). No schema or production rollback.

## Open Questions

- Should `tdk config verify` fail (non-zero) when a selected resource depends on either name but Postgres cannot be started, or only warn? Spec requires reporting "will start" on the valid path and errors only for unknown names; exit-code policy for other degraded cases can follow existing verify/doctor conventions.
- When the feature is off and a dependency triggers Postgres, should generated `services/platform/database-management/docker-compose.yml` be gitignored the same way TDK-generated files are, or always regenerated? Prefer the existing feature-path convention unless maintainers decide otherwise.
