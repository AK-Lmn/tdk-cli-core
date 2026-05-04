import { createConnection } from 'node:net';
import { spawn } from 'node:child_process';
import type { DiscoveredResource, CreatableResourceType } from '../types/index.js';
import { PORT_RANGES } from './constants.js';

/**
 * Check if a port is available (not in use) using TCP connection test
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
 * Check if a port is in use by attempting to run lsof
 * Returns 'running' if port is in use, 'stopped' if available, 'unknown' if check failed
 */
export async function checkPortStatus(port: number): Promise<'running' | 'stopped' | 'unknown'> {
  return new Promise((resolve) => {
    const child = spawn('lsof', ['-Pi', `:${port}`, '-sTCP:LISTEN'], {
      timeout: 3000,
      stdio: 'pipe'
    });

    let hasOutput = false;

    child.stdout?.on('data', () => {
      hasOutput = true;
    });

    child.on('close', (code) => {
      // lsof returns 0 if it found something, 1 if nothing found
      if (code === 0) {
        resolve('running');
      } else {
        resolve(hasOutput ? 'running' : 'stopped');
      }
    });

    child.on('error', () => {
      resolve('unknown');
    });
  });
}

/**
 * Find an available port starting from basePort
 */
export async function findAvailablePort(
  basePort: number,
  maxAttempts: number = 10
): Promise<number | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

type PortAssignableResourceType = Extract<CreatableResourceType, 'backend' | 'frontend' | 'worker' | 'migrator'>;

export function getUsedPorts(resources: DiscoveredResource[]): Set<number> {
  const usedPorts = new Set<number>();
  for (const r of resources) {
    if (r.port && r.port > 0) {
      usedPorts.add(r.port);
    }
  }
  return usedPorts;
}

function findNextAvailablePort(
  usedPorts: Set<number>,
  range: { base: number; min: number; max: number }
): number | null {
  for (let port = range.base; port <= range.max; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  return null;
}

export function assignPort(
  resourceType: PortAssignableResourceType,
  existingResources: DiscoveredResource[]
): number {
  const usedPorts = getUsedPorts(existingResources);
  const portRange = PORT_RANGES[resourceType];

  const assignedPort = findNextAvailablePort(usedPorts, portRange);

  if (assignedPort === null) {
    throw new Error(
      `No available ports in range ${portRange.base}-${portRange.max}. ` +
      'Check TILT_RESOURCE_DEFAULTS.star for port configuration.'
    );
  }

  return assignedPort;
}
