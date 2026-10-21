import { spawn } from "node:child_process";
/** Picks the first frontend URL out of the `flisk up` output, if it printed one. */
export declare function findFrontendUrl(output: string): string | undefined;
export type StackOutcome = {
    /** True when the stack came up and its services are healthy. */
    ok: boolean;
    /** The message from the stack when it did not come up. */
    error?: string;
    /** Everything the stack printed, kept for the failure message. */
    raw: string;
};
/** Reads the `{schemaVersion, data, errors}` envelope `flisk up --json` prints when it is done. */
export declare function parseStackEnvelope(output: string): StackOutcome | undefined;
/**
 * Starts the stack quietly and reports when it is ready.
 *
 * `flisk up --json` prints one JSON object when the stack is up (or has failed) and keeps
 * Tilt's own build logs out of the way, so the caller can show a progress line instead of
 * thousands of Docker and Traefik lines. The stack keeps running in the background.
 */
export declare function runStackQuiet(binPath: string, cwd: string, env?: NodeJS.ProcessEnv, spawnFn?: typeof spawn): Promise<StackOutcome>;
