/**
 * Stack discovery utilities
 *
 * Handles finding and parsing stack.master files from the filesystem.
 */
import type { StackDiscoveryResult } from '../types/index.js';
/**
 * Discover stack.master file by walking up directory tree
 *
 * @param startDir - Directory to start searching from (defaults to cwd)
 * @param explicitPath - Optional explicit path to stack.master
 * @returns StackDiscoveryResult or null if not found
 */
export declare function discoverStackMaster(startDir?: string, explicitPath?: string): StackDiscoveryResult | null;
/**
 * Load and parse a stack.master file
 *
 * @param path - Absolute path to stack.master file
 * @returns Parsed StackDiscoveryResult
 * @throws Error if file doesn't exist or contains invalid JSON
 */
export declare function loadStackMaster(path: string): StackDiscoveryResult;
/**
 * Validate a stack.master object
 *
 * @param stack - StackMaster object to validate
 * @returns Array of validation errors (empty if valid)
 */
export declare function validateStackMaster(stack: unknown): string[];
//# sourceMappingURL=discovery.d.ts.map