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
 * True when the database-management feature is on for this project:
 * any phases.*.enabledStacks entry includes database-management, OR the
 * effective always_enabled_infra (field or default) includes it.
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