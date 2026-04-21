/**
 * Service discovery utilities
 *
 * Discovers services by scanning the filesystem for service.json files.
 * Stacks are discovered dynamically - no stack.master files needed.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { cwd } from 'node:process';
import type { DiscoveredService, ServiceConfig, DiscoveredStack } from '../types/index.js';

const SERVICE_JSON_FILENAME = 'service.json';

/**
 * Find the project root by looking for Tiltfile
 */
export function findProjectRoot(startDir: string = cwd()): string | null {
  let currentDir = resolve(startDir);
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
 * Recursively scan directory for service.json files
 */
function findServiceJsonFiles(dir: string, maxDepth: number = 5, currentDepth: number = 0): string[] {
  const results: string[] = [];

  if (currentDepth > maxDepth) {
    return results;
  }

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common non-service directories
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }

        // Recursively scan subdirectories
        results.push(...findServiceJsonFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.isFile() && entry.name === SERVICE_JSON_FILENAME) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory not accessible, skip it
  }

  return results;
}

/**
 * Check if a directory should be skipped during scanning
 */
function shouldSkipDirectory(name: string): boolean {
  const skipPatterns = [
    'node_modules',
    '.git',
    '.tilt',
    '.tilt-engine',
    'dist',
    'build',
    '.prisma',
    '.turbo',
    'coverage',
    'tmp',
    'temp',
    '__tests__',
    'test',
    'tests',
    '.github',
    '.vscode',
    'docs',
  ];

  return skipPatterns.includes(name) || name.startsWith('.');
}

/**
 * Parse a service.json file into DiscoveredService
 */
function parseService(serviceJsonPath: string): DiscoveredService | null {
  try {
    const content = readFileSync(serviceJsonPath, 'utf-8');
    const config = JSON.parse(content) as ServiceConfig;

    // Validate required fields (appName is required, domain is optional)
    if (!config.appName) {
      return null;
    }

    const serviceDir = dirname(serviceJsonPath);

    return {
      name: config.appName,
      domain: config.domain || 'unknown',
      path: serviceDir,
      configPath: serviceJsonPath,
      config,
      stack: config.stack,
    };
  } catch {
    return null;
  }
}

/**
 * Discover all services from the project
 *
 * Scans the filesystem for service.json files and parses them.
 *
 * @returns Array of discovered services
 */
export function discoverServices(): DiscoveredService[] {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    throw new Error('Could not find project root (no Tiltfile found). Make sure you\'re in a Beauty CRM project.');
  }

  // Find all service.json files
  const serviceJsonPaths = findServiceJsonFiles(projectRoot);

  // Parse each service.json file
  return serviceJsonPaths
    .map(path => parseService(path))
    .filter((s): s is DiscoveredService => s !== null);
}

/**
 * Get all unique stack names from discovered services
 *
 * @returns Array of unique stack names, sorted alphabetically
 */
export function getAllStacks(services?: DiscoveredService[]): string[] {
  const servicesToScan = services || discoverServices();
  const stacks = new Set<string>();

  for (const service of servicesToScan) {
    if (service.stack) {
      stacks.add(service.stack);
    }
  }

  return Array.from(stacks).sort();
}

/**
 * Discover all stacks with their associated services
 *
 * @returns Array of discovered stacks with services
 */
export function discoverStacks(): DiscoveredStack[] {
  const services = discoverServices();
  const stackMap = new Map<string, DiscoveredService[]>();

  // Group services by stack
  for (const service of services) {
    if (service.stack) {
      if (!stackMap.has(service.stack)) {
        stackMap.set(service.stack, []);
      }
      stackMap.get(service.stack)!.push(service);
    }
  }

  // Build DiscoveredStack objects
  const stacks: DiscoveredStack[] = [];
  for (const [name, stackServices] of stackMap) {
    const domains = [...new Set(stackServices.map(s => s.domain).filter(Boolean))].sort() as string[];

    stacks.push({
      name,
      description: `${stackServices.length} service${stackServices.length === 1 ? '' : 's'}`,
      services: stackServices,
      serviceCount: stackServices.length,
      domains,
    });
  }

  // Sort by name
  return stacks.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get services that belong to a specific stack.
 *
 * @param stackName - Name of the stack to filter by
 * @returns Services belonging to the stack
 */
export function getServicesForStack(stackName: string): DiscoveredService[] {
  const allServices = discoverServices();
  return allServices.filter(s => s.stack === stackName);
}

/**
 * Check if a stack exists (has any services)
 *
 * @param stackName - Name of the stack to check
 * @returns True if the stack has at least one service
 */
export function stackExists(stackName: string): boolean {
  const services = getServicesForStack(stackName);
  return services.length > 0;
}
