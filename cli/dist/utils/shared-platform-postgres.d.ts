/**
 * Shared platform Postgres start predicate.
 *
 * Both names mean the one shared platform Postgres Tilt resource `postgres`.
 * The engine start path is selection-bounded (tdk up --only); verify/doctor
 * evaluate the project resource set they already inspect (no tdk up filter).
 * Both surfaces use this same predicate shape over their own resource set.
 *
 * Spec: openspec/changes/dependson-starts-platform-postgres
 */
export declare const POSTGRES_DEPENDENCY_NAMES: readonly ["postgres", "database-management"];
export declare function isSharedPlatformPostgresDependency(name: string): boolean;
export interface SharedPlatformPostgresEvaluation {
    featureOn: boolean;
    /** Resource names whose dependsOn lists postgres or database-management. */
    dependsOnUsers: string[];
    willStart: boolean;
    reason: "feature" | "dependsOn" | "none";
    /** dependsOn entries that are NOT known services/stacks and NOT shared postgres names (typos). */
    unknownDependsOnNames: Array<{
        resource: string;
        name: string;
    }>;
}
/**
 * True when the database-management feature is on for this project.
 *
 * Matches the generated Tiltfile's `should_enable('database-management')`:
 * 1. any phases.*.enabledStacks entry includes database-management, OR
 * 2. effective always_enabled_infra includes it — field when present,
 *    otherwise DEFAULT_ALWAYS_ENABLED_INFRA (same default the generator
 *    bakes into ALWAYS_ENABLED_INFRA; Tiltfile then returns
 *    RESOURCE_DEFAULTS.get(name, True) for those names).
 *
 * An omitted always_enabled_infra field is therefore feature-ON, not OFF.
 * Explicit field without database-management + no enabledStacks entry is OFF.
 */
export declare function databaseManagementEnabled(projectRoot: string): boolean;
/**
 * Evaluate whether shared platform Postgres will start for this project.
 *
 * willStart = featureOn OR any inspected project resource depends on either name.
 * Resource set is project scope (discoverResourcesFromRoot), NOT tdk up --only.
 */
export declare function evaluateSharedPlatformPostgres(projectRoot: string): SharedPlatformPostgresEvaluation;
//# sourceMappingURL=shared-platform-postgres.d.ts.map