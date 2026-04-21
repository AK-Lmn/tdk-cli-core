/**
 * Service discovery utilities
 *
 * Discovers services by scanning the filesystem for service.json files.
 * Stacks are discovered dynamically - no stack.master files needed.
 */
import type { DiscoveredService, DiscoveredStack } from '../types/index.js';
/**
 * Find the project root by looking for Tiltfile
 */
export declare function findProjectRoot(startDir?: string): string | null;
/**
 * Discover all services from the project
 *
 * Scans the filesystem for service.json files and parses them.
 *
 * @returns Array of discovered services
 */
export declare function discoverServices(): DiscoveredService[];
/**
 * Get all unique stack names from discovered services
 *
 * @returns Array of unique stack names, sorted alphabetically
 */
export declare function getAllStacks(services?: DiscoveredService[]): string[];
/**
 * Discover all stacks with their associated services
 *
 * @returns Array of discovered stacks with services
 */
export declare function discoverStacks(): DiscoveredStack[];
/**
 * Get services that belong to a specific stack.
 *
 * @param stackName - Name of the stack to filter by
 * @returns Services belonging to the stack
 */
export declare function getServicesForStack(stackName: string): DiscoveredService[];
/**
 * Check if a stack exists (has any services)
 *
 * @param stackName - Name of the stack to check
 * @returns True if the stack has at least one service
 */
export declare function stackExists(stackName: string): boolean;
//# sourceMappingURL=services.d.ts.map