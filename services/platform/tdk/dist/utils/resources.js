/**
 * Resource discovery utilities
 *
 * Discovers resources from the existing Tilt infrastructure.
 * Reads from .tilt/resource-snapshot.json or runs resource_snapshot.py
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { cwd } from 'node:process';
import { execSync } from 'node:child_process';
const SNAPSHOT_FILE = '.tilt/resource-snapshot.json';
const SNAPSHOT_SCRIPT = '.tilt-engine/topologies/tilt/discovery/resource_snapshot.py';
/**
 * Discover all resources from Tilt infrastructure
 *
 * First tries to read from .tilt/resource-snapshot.json
 * Falls back to running resource_snapshot.py if snapshot not found
 *
 * @returns Array of discovered resources
 */
export function discoverResources() {
    let snapshot = null;
    // Try to read existing snapshot
    const snapshotPath = resolve(cwd(), SNAPSHOT_FILE);
    if (existsSync(snapshotPath)) {
        try {
            const content = readFileSync(snapshotPath, 'utf-8');
            snapshot = JSON.parse(content);
        }
        catch {
            // Snapshot exists but is invalid, fall through to generate
        }
    }
    // If no valid snapshot, try to generate one
    if (!snapshot) {
        snapshot = generateSnapshot();
    }
    if (!snapshot || !snapshot.resources) {
        return [];
    }
    // Parse each resource.json file
    return snapshot.resources
        .map(parseResource)
        .filter((r) => r !== null);
}
/**
 * Generate a fresh snapshot by running resource_snapshot.py
 *
 * @returns Fresh snapshot or null if script fails
 */
function generateSnapshot() {
    const scriptPath = resolve(cwd(), SNAPSHOT_SCRIPT);
    if (!existsSync(scriptPath)) {
        // Try finding it relative to project root
        const projectRoot = findProjectRoot();
        if (projectRoot) {
            const altPath = join(projectRoot, SNAPSHOT_SCRIPT);
            if (existsSync(altPath)) {
                try {
                    const output = execSync(`python3 "${altPath}" --scan`, {
                        encoding: 'utf-8',
                        cwd: projectRoot
                    });
                    return JSON.parse(output);
                }
                catch {
                    return null;
                }
            }
        }
        return null;
    }
    try {
        const output = execSync(`python3 "${scriptPath}" --scan`, {
            encoding: 'utf-8',
            cwd: cwd()
        });
        return JSON.parse(output);
    }
    catch {
        return null;
    }
}
/**
 * Parse a resource.json file into DiscoveredResource
 *
 * @param resourceJsonPath - Path to resource.json file
 * @returns DiscoveredResource or null if parsing fails
 */
function parseResource(resourceJsonPath) {
    try {
        const content = readFileSync(resourceJsonPath, 'utf-8');
        const config = JSON.parse(content);
        const resourceDir = dirname(resourceJsonPath);
        const domain = config.domain || inferDomain(resourceJsonPath);
        const name = config.appName || inferName(resourceJsonPath);
        return {
            name,
            domain,
            path: resourceDir,
            configPath: resourceJsonPath,
            config,
            stack: config.stack
        };
    }
    catch {
        return null;
    }
}
/**
 * Infer domain from resource path
 *
 * Path format: resources/product/{domain}/{resource}/resource.json
 */
function inferDomain(resourceJsonPath) {
    const parts = resourceJsonPath.split('/');
    const domainIndex = parts.indexOf('resources');
    if (domainIndex >= 0 && parts.length > domainIndex + 2) {
        return parts[domainIndex + 2]; // resources/product/{domain}/...
    }
    return 'unknown';
}
/**
 * Infer resource name from path
 *
 * Path format: resources/product/{domain}/{resource}/resource.json
 */
function inferName(resourceJsonPath) {
    const parts = resourceJsonPath.split('/');
    const resourceJsonIndex = parts.indexOf('resource.json');
    if (resourceJsonIndex > 0) {
        return parts[resourceJsonIndex - 1]; // Parent directory name
    }
    return 'unknown';
}
/**
 * Find project root by looking for Tiltfile
 */
function findProjectRoot() {
    let currentDir = resolve(cwd());
    const root = resolve('/');
    while (currentDir !== root) {
        if (existsSync(join(currentDir, 'Tiltfile'))) {
            return currentDir;
        }
        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    return null;
}
/**
 * Get resources that belong to a specific stack.
 * Resources declare stack membership via their resource.json `stack` field.
 *
 * @param resources - All discovered resources
 * @param stackName - Name of the stack to filter by
 * @param excludePatterns - Optional glob patterns to exclude
 * @returns Resources belonging to the stack
 */
export function getResourcesForStack(resources, stackName, excludePatterns) {
    // Filter to resources that declare this stack
    let stackResources = resources.filter(r => r.stack === stackName);
    // Apply exclude patterns
    if (excludePatterns && excludePatterns.length > 0) {
        stackResources = stackResources.filter(r => !excludePatterns.some(pattern => matchesGlob(r.name, pattern)));
    }
    return stackResources;
}
/**
 * Check if a string matches a glob pattern
 * Simple glob matching: * matches any characters
 */
function matchesGlob(str, pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
}
/**
 * Get all unique stack names from discovered resources
 */
export function getAllStacks(resources) {
    const stacks = new Set();
    for (const resource of resources) {
        if (resource.stack) {
            stacks.add(resource.stack);
        }
    }
    return Array.from(stacks).sort();
}
//# sourceMappingURL=resources.js.map