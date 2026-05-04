import type { DiscoveredResource, DiscoveredStack } from '../types/index.js';
import { discoverResources, discoverStacks, getAllStacks } from './services.js';

/**
 * Discovery context that consolidates resource and stack discovery operations.
 * Prevents redundant filesystem scans by caching results within the same operation context.
 */
export interface DiscoveryContext {
  /** All discovered resources in the project */
  resources: DiscoveredResource[];
  /** All discovered stacks */
  stacks: DiscoveredStack[];
  /** Array of unique stack names */
  stackNames: string[];
  /** Resources that don't belong to any stack */
  unassignedResources: DiscoveredResource[];
  /** Map of stack name to resources in that stack */
  resourcesByStack: Map<string, DiscoveredResource[]>;
}

/**
 * Create a discovery context by scanning the project once.
 * This consolidates multiple discovery calls into a single operation.
 *
 * @returns A context object with all discovery results
 */
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

/**
 * Filter resources by stack name.
 * Uses the pre-computed context instead of re-scanning.
 *
 * @param context - The discovery context
 * @param stackName - Stack name to filter by
 * @returns Resources belonging to the stack
 */
export function getResourcesForStackFromContext(
  context: DiscoveryContext,
  stackName: string
): DiscoveredResource[] {
  return context.resourcesByStack.get(stackName) || [];
}

/**
 * Check if a stack exists in the discovery context.
 *
 * @param context - The discovery context
 * @param stackName - Stack name to check
 * @returns True if the stack exists
 */
export function stackExistsInContext(context: DiscoveryContext, stackName: string): boolean {
  return context.stackNames.includes(stackName);
}
