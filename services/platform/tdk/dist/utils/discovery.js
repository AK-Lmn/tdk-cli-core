/**
 * Stack discovery utilities
 *
 * Handles finding and parsing stack.master files from the filesystem.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { cwd } from 'node:process';
const STACK_MASTER_FILENAME = 'stack.master';
/**
 * Discover stack.master file by walking up directory tree
 *
 * @param startDir - Directory to start searching from (defaults to cwd)
 * @param explicitPath - Optional explicit path to stack.master
 * @returns StackDiscoveryResult or null if not found
 */
export function discoverStackMaster(startDir = cwd(), explicitPath) {
    // If explicit path provided, use it directly
    if (explicitPath) {
        const resolvedPath = resolve(explicitPath);
        if (!existsSync(resolvedPath)) {
            throw new Error(`Explicit stack path not found: ${explicitPath}`);
        }
        return loadStackMaster(resolvedPath);
    }
    // Walk up directory tree looking for stack.master
    let currentDir = resolve(startDir);
    const root = resolve('/');
    while (currentDir !== root) {
        const stackPath = join(currentDir, STACK_MASTER_FILENAME);
        if (existsSync(stackPath)) {
            return loadStackMaster(stackPath);
        }
        // Move up one directory
        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break; // Reached root
        }
        currentDir = parentDir;
    }
    // Check root directory as well
    const rootStackPath = join(root, STACK_MASTER_FILENAME);
    if (existsSync(rootStackPath)) {
        return loadStackMaster(rootStackPath);
    }
    return null;
}
/**
 * Load and parse a stack.master file
 *
 * @param path - Absolute path to stack.master file
 * @returns Parsed StackDiscoveryResult
 * @throws Error if file doesn't exist or contains invalid JSON
 */
export function loadStackMaster(path) {
    if (!existsSync(path)) {
        throw new Error(`stack.master not found: ${path}`);
    }
    let content;
    try {
        content = readFileSync(path, 'utf-8');
    }
    catch (err) {
        throw new Error(`Failed to read stack.master at ${path}: ${err}`);
    }
    let stack;
    try {
        stack = JSON.parse(content);
    }
    catch (err) {
        throw new Error(`Invalid JSON in stack.master at ${path}: ${err}`);
    }
    // Validate required fields
    if (!stack.name || typeof stack.name !== 'string') {
        throw new Error(`stack.master at ${path} missing required field: name`);
    }
    return {
        path,
        stack,
        directory: dirname(path)
    };
}
/**
 * Validate a stack.master object
 *
 * @param stack - StackMaster object to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateStackMaster(stack) {
    const errors = [];
    if (!stack || typeof stack !== 'object') {
        return ['Stack must be an object'];
    }
    const s = stack;
    // Check name
    if (!s.name || typeof s.name !== 'string') {
        errors.push('Field "name" is required and must be a string');
    }
    // Check exclude (optional)
    if (s.exclude !== undefined && !Array.isArray(s.exclude)) {
        errors.push('Field "exclude" must be an array if provided');
    }
    else if (s.exclude && !s.exclude.every(item => typeof item === 'string')) {
        errors.push('Field "exclude" must contain only strings');
    }
    return errors;
}
//# sourceMappingURL=discovery.js.map