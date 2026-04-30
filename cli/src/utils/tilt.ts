/** Tilt command execution utilities */

import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import type { TiltCommandResult } from '../types/index.js';

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createConnection({ port, host: '127.0.0.1' }, () => {
      server.destroy();
      resolve(false);
    });

    server.on('error', () => {
      resolve(true);
    });
  });
}

export async function findAvailablePort(basePort: number = 10350, maxAttempts: number = 10): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
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

export async function isTiltAvailable(): Promise<boolean> {
  const result = await runTilt('version', [], { inheritStdio: false });
  return result.exitCode === 0;
}

import { findProjectRoot } from './paths.js';
import { join } from 'node:path';

export function getTiltfilePath(): string {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    throw new Error('Not in a TDK project (no .tdk/project.json found)');
  }
  
  return join(projectRoot, '.tdk', '.tdk-out', 'Tiltfile');
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
  const tiltfilePath = getTiltfilePath();
  args.push('-f', tiltfilePath);
  args.push(...serviceNames);
  
  if (options.verbose && !options.quiet) {
    args.push('--verbose');
  }
  
  if (options.watch) {
    args.push('--watch');
  }
  
  // Note: Tilt doesn't have a native --quiet flag, but we suppress output via stdio
  return args;
}

export function buildTiltDownArgs(
  options: {
    force?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  const tiltfilePath = getTiltfilePath();
  args.push('-f', tiltfilePath);

  if (options.force) {
    args.push('--force');
  }

  return args;
}
