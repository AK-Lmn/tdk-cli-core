import { readFileSync } from "node:fs";
import { join } from "node:path";
import { discoverResourcesFromRoot } from "./services.js";

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

export const POSTGRES_DEPENDENCY_NAMES = ["postgres", "database-management"] as const;

/** Default always_enabled_infra from the project template — includes database-management. */
const DEFAULT_ALWAYS_ENABLED_INFRA = ["database-management", "proxy"] as const;

const PHASE_KEYS = ["pre_alpha", "alpha", "beta", "out_of_scope"] as const;

export function isSharedPlatformPostgresDependency(name: string): boolean {
  return (POSTGRES_DEPENDENCY_NAMES as readonly string[]).includes(name);
}

interface ProjectJsonPhases {
  [phase: string]: { enabledStacks?: string[] } | undefined;
}

export interface SharedPlatformPostgresEvaluation {
  featureOn: boolean;
  /** Resource names whose dependsOn lists postgres or database-management. */
  dependsOnUsers: string[];
  willStart: boolean;
  reason: "feature" | "dependsOn" | "none";
  /** dependsOn entries that are NOT known services/stacks and NOT shared postgres names (typos). */
  unknownDependsOnNames: Array<{ resource: string; name: string }>;
}

function readProjectJson(projectRoot: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(join(projectRoot, ".tdk", "project.json"), "utf-8"));
  } catch {
    return undefined;
  }
}

/**
 * True when the database-management feature is on for this project:
 * any phases.*.enabledStacks entry includes database-management, OR the
 * effective always_enabled_infra (field or default) includes it.
 */
export function databaseManagementEnabled(projectRoot: string): boolean {
  const parsed = readProjectJson(projectRoot);
  if (!parsed) return false;

  const phases = (parsed.phases ?? {}) as ProjectJsonPhases;
  for (const phase of PHASE_KEYS) {
    const stacks = phases[phase]?.enabledStacks;
    if (Array.isArray(stacks) && stacks.includes("database-management")) {
      return true;
    }
  }

  const alwaysEnabled = parsed.always_enabled_infra ?? DEFAULT_ALWAYS_ENABLED_INFRA;
  return Array.isArray(alwaysEnabled) && alwaysEnabled.includes("database-management");
}

/** Known names for unknown-dependsOn detection: discovered services/stacks + project stacks/infra. */
function knownDependsonNames(projectRoot: string): Set<string> {
  const known = new Set<string>();
  for (const name of POSTGRES_DEPENDENCY_NAMES) known.add(name);

  for (const resource of discoverResourcesFromRoot(projectRoot)) {
    known.add(resource.name);
    if (resource.stack) known.add(resource.stack);
  }

  const parsed = readProjectJson(projectRoot);
  if (parsed) {
    const phases = (parsed.phases ?? {}) as ProjectJsonPhases;
    for (const phase of PHASE_KEYS) {
      const stacks = phases[phase]?.enabledStacks;
      if (Array.isArray(stacks)) {
        for (const stack of stacks) known.add(stack);
      }
    }
    const alwaysEnabled = parsed.always_enabled_infra ?? DEFAULT_ALWAYS_ENABLED_INFRA;
    if (Array.isArray(alwaysEnabled)) {
      for (const entry of alwaysEnabled) known.add(entry);
    }
  }
  return known;
}

/**
 * Evaluate whether shared platform Postgres will start for this project.
 *
 * willStart = featureOn OR any inspected project resource depends on either name.
 * Resource set is project scope (discoverResourcesFromRoot), NOT tdk up --only.
 */
export function evaluateSharedPlatformPostgres(
  projectRoot: string,
): SharedPlatformPostgresEvaluation {
  const featureOn = databaseManagementEnabled(projectRoot);
  const known = knownDependsonNames(projectRoot);

  const dependsOnUsers: string[] = [];
  const unknownDependsOnNames: Array<{ resource: string; name: string }> = [];

  for (const resource of discoverResourcesFromRoot(projectRoot)) {
    const deps = resource.config?.dependsOn ?? [];
    let usesSharedPostgres = false;
    for (const dep of deps) {
      if (isSharedPlatformPostgresDependency(dep)) {
        usesSharedPostgres = true;
        continue;
      }
      if (!known.has(dep)) {
        unknownDependsOnNames.push({ resource: resource.name, name: dep });
      }
    }
    if (usesSharedPostgres) {
      dependsOnUsers.push(resource.name);
    }
  }

  const willStart = featureOn || dependsOnUsers.length > 0;
  const reason: SharedPlatformPostgresEvaluation["reason"] = featureOn
    ? "feature"
    : dependsOnUsers.length > 0
      ? "dependsOn"
      : "none";

  return { featureOn, dependsOnUsers, willStart, reason, unknownDependsOnNames };
}
