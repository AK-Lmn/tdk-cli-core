import { execSync } from "node:child_process";
import type { CheckResult } from "../types/index.js";
import { type ExecAsync } from "./exec-async.js";
export declare function checkResourcePackageJson(projectRoot?: string): CheckResult;
export declare function checkServiceUrlPorts(projectRoot?: string): CheckResult;
export declare function checkFrontendBackendUrls(projectRoot?: string): CheckResult;
export declare function checkNatsBroker(projectRoot?: string): CheckResult;
interface TiltProcess {
    pid: number;
    root: string;
}
export declare function parseTiltProcesses(psOutput: string): TiltProcess[];
export declare function checkTiltInstances(projectRoot?: string, exec?: typeof execSync): CheckResult;
export declare function checkDockerNetworkCapacity(exec?: ExecAsync): Promise<CheckResult>;
/**
 * A resource that enables `prisma` needs the shared Postgres. TDK only starts it while the
 * `database-management` stack feature is enabled, and nothing else says so: the service would
 * build, start and fail on its first query.
 */
export declare function checkPrismaPostgres(projectRoot?: string): CheckResult;
/**
 * `dependsOn` names are matched leniently by the engine, and a name that matches nothing falls
 * back to a "<name>-yaml" resource that does not exist. Report those up front. The engine
 * accepts a resource name, a stack, a name prefix (`identity` for `identity-management-backend`),
 * and the shared Postgres under either of its two names.
 */
export declare function checkDependsOnTargets(projectRoot?: string): CheckResult;
export {};
//# sourceMappingURL=doctor-wiring.d.ts.map