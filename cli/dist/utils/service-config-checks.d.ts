import type { CheckResult, DiscoveredResource } from "../types/index.js";
/** A dependsOn that is not a list of service names cannot be followed, so say so instead of failing later. */
export declare function checkDependsOnShape(projectRoot?: string, resources?: DiscoveredResource[]): CheckResult;
/** Services that wait on each other can never both start. A dependsOn name that is not a service is left to the unknown-name check. */
export declare function checkCircularDependencies(projectRoot?: string, resources?: DiscoveredResource[]): CheckResult;
/**
 * Everything `flisk config verify` reports about one service.json's own fields (Docker-safe names, field types, line breaks,
 * route paths), applied before `flisk up` starts anything. Without it a bad value passed `flisk up` and stopped inside Tilt
 * ("repository name must be lowercase", "string has no .get field or method"). A missing schemaVersion or required field is
 * left out: old projects keep working without them, and `flisk config migrate` adds the version.
 */
export declare function checkServiceFields(projectRoot?: string, resources?: DiscoveredResource[]): CheckResult;
/**
 * A custom `dockerfile` (relative to the service, or to its `buildContext`) that does not exist stops the Tiltfile with
 * "CUSTOM DOCKERFILE NOT FOUND" (discovery/manifest/loading.star), after `flisk up` has said yes.
 */
export declare function checkCustomDockerfiles(projectRoot?: string, resources?: DiscoveredResource[]): CheckResult;
/** A port outside 1-65535 can never be bound, and `flisk up` would otherwise find out only when Docker fails. */
export declare function checkServicePorts(projectRoot?: string, resources?: DiscoveredResource[]): CheckResult;
/**
 * A service.json with no schemaVersion is how every project began, so this is a warning: it keeps working, and only
 * `flisk config migrate` writes the field. A version this flisk does not know is reported the same way, with a different fix.
 */
export declare function checkSchemaVersions(projectRoot?: string, strict?: boolean, resources?: DiscoveredResource[]): CheckResult;
/** Prints the schemaVersion warning once. It never stops anything: the project keeps working as it is. */
export declare function warnSchemaVersions(projectRoot: string, resources?: DiscoveredResource[]): void;
/**
 * Runs before anything starts (also under --dry-run, like the drift gate): duplicate service names, circular
 * dependsOn and invalid ports exit with 1 and say which file, which field, and how to fix it.
 */
export declare function enforceServiceConfigGate(projectRoot: string, options?: {
    onInvalid?: (message: string) => void;
    resources?: DiscoveredResource[];
}, exit?: (code: number) => never): void;
