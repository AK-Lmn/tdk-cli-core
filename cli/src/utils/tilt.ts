/**
 * Tilt command execution utilities
 * 
 * Handles running tilt CLI commands with proper output handling.
 */

import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import type { TiltCommandResult } from '../types/index.js';

/**
 * Check if a port is available (not in use)
 * 
 * @param port - Port number to check
 * @returns Promise resolving to boolean
 */
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

/**
 * Find next available port starting from base port
 * 
 * @param basePort - Starting port number
 * @param maxAttempts - Maximum ports to try
 * @returns Promise resolving to available port or null
 */
export async function findAvailablePort(basePort: number = 10350, maxAttempts: number = 10): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Execute a tilt command with given arguments
 * 
 * @param command - Tilt subcommand (up, down, etc.)
 * @param args - Arguments to pass to tilt
 * @param options - Execution options
 * @returns Promise resolving to command result
 */
export function runTilt(
  command: string,
  args: string[] = [],
  options: {
    verbose?: boolean;
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

/**
 * Check if tilt CLI is available
 * 
 * @returns Promise resolving to boolean
 */
export async function isTiltAvailable(): Promise<boolean> {
  try {
    const result = await runTilt('version', [], { inheritStdio: false });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

import { findProjectRoot as servicesFindProjectRoot } from './services.js';
import { join } from 'node:path';

/**
 * Get the path to the generated Tiltfile
 * 
 * @returns Path to Tiltfile
 */
export function getTiltfilePath(): string {
  const projectRoot = servicesFindProjectRoot();
  if (!projectRoot) {
    throw new Error('Not in a TDK project (no .tdk/project.json found)');
  }
  
  return join(projectRoot, '.tdk', '.tdk-out', 'Tiltfile');
}

/**
 * Build tilt up command arguments for specific services
 * 
 * @param serviceNames - Names of services to start
 * @param options - Additional options
 * @returns Array of arguments for tilt up
 */
export function buildTiltUpArgs(
  serviceNames: string[],
  options: {
    verbose?: boolean;
    force?: boolean;
    watch?: boolean;
  } = {}
): string[] {
  const args: string[] = [];
  const tiltfilePath = getTiltfilePath();
  args.push('-f', tiltfilePath);
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
