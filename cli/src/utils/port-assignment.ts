import type { DiscoveredResource } from '../types/index.js';
import { PORT_RANGES } from './constants.js';

/**
 * Collect all used ports from existing resources
 * @param resources - Array of discovered resources
 * @returns Set of port numbers that are already assigned
 */
export function getUsedPorts(resources: DiscoveredResource[]): Set<number> {
  const usedPorts = new Set<number>();
  for (const r of resources) {
    if (r.port && r.port > 0) {
      usedPorts.add(r.port);
    }
  }
  return usedPorts;
}

/**
 * Find the next available port in a given range
 * @param usedPorts - Set of ports that are already taken
 * @param range - Port range configuration with base, min, max
 * @returns The first available port or null if none found
 */
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

/**
 * Assign a port for a new resource based on its type
 * Centralizes port assignment logic for consistency
 *
 * @param resourceType - Type of resource (frontend, backend, worker, etc.)
 * @param existingResources - Current resources to check for port conflicts
 * @returns Assigned port number
 * @throws Error if no ports available in the range
 */
export function assignPort(
  resourceType: 'frontend' | 'backend' | 'worker' | 'migrator',
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


