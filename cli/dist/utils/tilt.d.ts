/**
 * Tilt command execution utilities
 *
 * Handles running tilt CLI commands with proper output handling.
 */
import type { TiltCommandResult } from '../types/index.js';
/**
 * Execute a tilt command with given arguments
 *
 * @param command - Tilt subcommand (up, down, etc.)
 * @param args - Arguments to pass to tilt
 * @param options - Execution options
 * @returns Promise resolving to command result
 */
export declare function runTilt(command: string, args?: string[], options?: {
    verbose?: boolean;
    inheritStdio?: boolean;
}): Promise<TiltCommandResult>;
/**
 * Check if tilt CLI is available
 *
 * @returns Promise resolving to boolean
 */
export declare function isTiltAvailable(): Promise<boolean>;
/**
 * Get the path to the generated Tiltfile
 *
 * @returns Path to Tiltfile
 */
export declare function getTiltfilePath(): string;
/**
 * Build tilt up command arguments for specific services
 *
 * @param serviceNames - Names of services to start
 * @param options - Additional options
 * @returns Array of arguments for tilt up
 */
export declare function buildTiltUpArgs(serviceNames: string[], options?: {
    verbose?: boolean;
    force?: boolean;
    watch?: boolean;
}): string[];
/**
 * Build tilt down command arguments
 *
 * @param options - Additional options
 * @returns Array of arguments for tilt down
 */
export declare function buildTiltDownArgs(options?: {
    force?: boolean;
}): string[];
//# sourceMappingURL=tilt.d.ts.map