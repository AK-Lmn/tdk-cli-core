import type { DiscoveredResource, DiscoveredStack, DiscoveryContext } from '../types/index.js';
import { discoverResources, discoverStacks, getAllStacks } from './services.js';

// Cache for memoizing discovery context within a session
let cachedContext: DiscoveryContext | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 1000; // 1 second TTL

export function clearDiscoveryCache(): void {
  cachedContext = null;
  cacheTimestamp = 0;
}

function isCacheValid(): boolean {
  return cachedContext !== null && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

/**
 * Create a discovery context with all resource and stack information.
 * Results are memoized for 1 second to avoid redundant filesystem scans.
 */
export function createDiscoveryContext(forceRefresh = false): DiscoveryContext {
  if (!forceRefresh && isCacheValid() && cachedContext) {
    return cachedContext;
  }

  const resources = discoverResources();
  const stacks = discoverStacks();
  const stackNames = getAllStacks(resources);

  const unassignedResources = resources.filter(r => !r.stack);

  const resourcesByStack = new Map<string, DiscoveredResource[]>();
  for (const resource of resources) {
    if (resource.stack) {
      const stackResources = resourcesByStack.get(resource.stack) || [];
      stackResources.push(resource);
      resourcesByStack.set(resource.stack, stackResources);
    }
  }

  const context: DiscoveryContext = {
    resources,
    stacks,
    stackNames,
    unassignedResources,
    resourcesByStack,
  };

  // Update cache
  cachedContext = context;
  cacheTimestamp = Date.now();

  return context;
}
