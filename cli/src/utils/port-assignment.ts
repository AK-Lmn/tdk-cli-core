import type { DiscoveredResource, CreatableResourceType } from '../types/index.js';
import { PORT_RANGES } from './constants.js';

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
