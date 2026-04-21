/**
 * Tilt command execution utilities
 *
 * Handles running tilt CLI commands with proper output handling.
 */
import { spawn } from 'node:child_process';
/**
 * Execute a tilt command with given arguments
 *
 * @param command - Tilt subcommand (up, down, etc.)
 * @param args - Arguments to pass to tilt
 * @param options - Execution options
 * @returns Promise resolving to command result
 */
export function runTilt(command, args = [], options = {}) {
    return new Promise((resolve) => {
        const tiltArgs = [command, ...args];
        if (options.verbose) {
            console.log(`Executing: tilt ${tiltArgs.join(' ')}`);
        }
        const child = spawn('tilt', tiltArgs, {
            stdio: options.inheritStdio ? 'inherit' : 'pipe',
            shell: false
        });
        let stdout = '';
        let stderr = '';
        if (!options.inheritStdio) {
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
        }
        child.on('close', (code) => {
            resolve({
                exitCode: code ?? 0,
                stdout,
                stderr
            });
        });
        child.on('error', (err) => {
            if (options.verbose) {
                console.error('Failed to spawn tilt:', err);
            }
            resolve({
                exitCode: 1,
                stdout,
                stderr: stderr || err.message
            });
        });
    });
}
/**
 * Check if tilt CLI is available
 *
 * @returns Promise resolving to boolean
 */
export async function isTiltAvailable() {
    try {
        const result = await runTilt('version', [], { inheritStdio: false });
        return result.exitCode === 0;
    }
    catch {
        return false;
    }
}
/**
 * Build tilt up command arguments for specific services
 *
 * @param serviceNames - Names of services to start
 * @param options - Additional options
 * @returns Array of arguments for tilt up
 */
export function buildTiltUpArgs(serviceNames, options = {}) {
    const args = [];
    // Add service names as arguments
    args.push(...serviceNames);
    if (options.verbose) {
        args.push('--verbose');
    }
    if (options.watch) {
        args.push('--watch');
    }
    return args;
}
/**
 * Build tilt down command arguments
 *
 * @param options - Additional options
 * @returns Array of arguments for tilt down
 */
export function buildTiltDownArgs(options = {}) {
    const args = [];
    if (options.force) {
        args.push('--force');
    }
    return args;
}
//# sourceMappingURL=tilt.js.map