import type { DiscoveredResource, DiscoveredStack } from '../types/index.js';
import { discoverResources, discoverStacks, getAllStacks } from './services.js';

export interface DiscoveryContext {
  resources: DiscoveredResource[];
  stacks: DiscoveredStack[];
  stackNames: string[];
  unassignedResources: DiscoveredResource[];
  resourcesByStack: Map<string, DiscoveredResource[]>;
}

export function createDiscoveryContext(): DiscoveryContext {
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

  return {
    resources,
    stacks,
    stackNames,
    unassignedResources,
    resourcesByStack,
  };
}
