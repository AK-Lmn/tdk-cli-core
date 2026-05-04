import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { TiltCommandResult } from '../types/index.js';
import { findProjectRoot } from './paths.js';
import { isPortAvailable, findAvailablePort as findAvailablePortInternal } from './port-assignment.js';

export { isPortAvailable };

/**
 * Find an available port for Tilt UI, starting from basePort
 */
export async function findAvailablePort(basePort: number = 10350, maxAttempts: number = 10): Promise<number | null> {
  return findAvailablePortInternal(basePort, maxAttempts);
}

export function runTilt(
  command: string,
  args: string[] = [],
  options: {
    verbose?: boolean;
    quiet?: boolean;
    inheritStdio?: boolean;
  } = {}
): Promise<TiltCommandResult> {
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
      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }
    
    child.on('close', (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr
      });
    });

    child.on('error', (err) => {
      // Avoid unhandled rejection by resolving with error details
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

export async function isTiltAvailable(): Promise<boolean> {
  const result = await runTilt('version', [], { inheritStdio: false });
  return result.exitCode === 0;
}

export function getTiltfilePath(): string {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new Error('Not in a TDK project (no .tdk/project.json found)');
  }
  
  return join(projectRoot, '.tdk', '.tdk-out', 'Tiltfile');
}

function addTiltfilePath(args: string[]): void {
  const tiltfilePath = getTiltfilePath();
  args.push('-f', tiltfilePath);
}

export function buildTiltUpArgs(
  serviceNames: string[],
  options: {
    verbose?: boolean;
    quiet?: boolean;
    force?: boolean;
    watch?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  addTiltfilePath(args);
  args.push(...serviceNames);

  if (options.verbose && !options.quiet) {
    args.push('--verbose');
  }

  if (options.watch) {
    args.push('--watch');
  }

  return args;
}

export function buildTiltDownArgs(
  options: {
    force?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  addTiltfilePath(args);

  if (options.force) {
    args.push('--force');
  }

  return args;
}
