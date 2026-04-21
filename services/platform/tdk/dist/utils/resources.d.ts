/**
 * Resource discovery utilities
 *
 * Discovers resources from the existing Tilt infrastructure.
 * Reads from .tilt/resource-snapshot.json or runs resource_snapshot.py
 */
import type { DiscoveredResource } from '../types/index.js';
/**
 * Discover all resources from Tilt infrastructure
 *
 * First tries to read from .tilt/resource-snapshot.json
 * Falls back to running resource_snapshot.py if snapshot not found
 *
 * @returns Array of discovered resources
 */
export declare function discoverResources(): DiscoveredResource[];
/**
 * Get resources that belong to a specific stack.
 * Resources declare stack membership via their resource.json `stack` field.
 *
 * @param resources - All discovered resources
 * @param stackName - Name of the stack to filter by
 * @param excludePatterns - Optional glob patterns to exclude
 * @returns Resources belonging to the stack
 */
export declare function getResourcesForStack(resources: DiscoveredResource[], stackName: string, excludePatterns?: string[]): DiscoveredResource[];
/**
 * Get all unique stack names from discovered resources
 */
export declare function getAllStacks(resources: DiscoveredResource[]): string[];
//# sourceMappingURL=resources.d.ts.map