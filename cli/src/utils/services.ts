/**
 * Service discovery utilities
 *
 * Discovers services by scanning the filesystem for service.json files.
 * Stacks are discovered dynamically - no stack.master files needed.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { cwd } from 'node:process';
import { execSync } from 'node:child_process';
import type { DiscoveredService, ServiceConfig, DiscoveredStack } from '../types/index.js';
import type { FileType } from '../components/FileTree.js';

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
 * @param options - Discovery options
 * @returns Array of discovered services
 */
export function discoverServices(options?: { preAlphaOnly?: boolean }): DiscoveredService[] {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    throw new Error('Could not find project root (no Tiltfile found). Make sure you\'re in a Beauty CRM project.');
  }

  // Find all service.json files
  const serviceJsonPaths = findServiceJsonFiles(projectRoot);

  // Parse each service.json file
  let services = serviceJsonPaths
    .map(path => parseService(path))
    .filter((s): s is DiscoveredService => s !== null);

  // Filter by pre-alpha status if requested
  if (options?.preAlphaOnly) {
    services = services.filter(s => s.config?.preAlpha !== false);
    // Services without preAlpha field default to true (existing behavior)
  }

  return services;
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
 * @param options - Discovery options
 * @returns Array of discovered stacks with services
 */
export function discoverStacks(options?: { preAlphaOnly?: boolean }): DiscoveredStack[] {
  const services = discoverServices(options);
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

// =============================================================================
// METADATA COLLECTION & CACHING
// =============================================================================

interface MetadataCache {
  services: Map<string, ServiceMetadata>;
  stacks: Map<string, StackMetadata>;
  lastUpdated: number;
}

const CACHE_TTL = 5000; // 5 seconds

const metadataCache: MetadataCache = {
  services: new Map(),
  stacks: new Map(),
  lastUpdated: 0,
};

export interface ServiceMetadata {
  name: string;
  domain: string;
  stack?: string;
  type: 'frontend' | 'backend' | 'lib';
  port?: number;
  createdAt: string;
  lastModified: string;
  dependencies: string[];
  hasDockerfile: boolean;
  hasTiltfile: boolean;
  hasDockerCompose: boolean;
  autogeneratedFiles: AutogeneratedFile[];
  status: 'ready' | 'pending' | 'error' | 'unknown';
}

export interface StackMetadata {
  name: string;
  serviceCount: number;
  createdAt: string;
  lastModified: string;
  services: ServiceMetadata[];
  overallStatus: 'healthy' | 'degraded' | 'error' | 'unknown';
}

export interface AutogeneratedFile {
  name: string;
  path: string;
  type: FileType;
  size: number;
  lastModified: string;
}

/**
 * Clear metadata cache (useful for forcing refresh)
 */
export function clearMetadataCache(): void {
  metadataCache.services.clear();
  metadataCache.stacks.clear();
  metadataCache.lastUpdated = 0;
}

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return Date.now() - metadataCache.lastUpdated < CACHE_TTL;
}

/**
 * Detect file type based on filename and content
 */
function detectFileType(filename: string, content?: string): FileType {
  if (filename === 'Dockerfile' || filename.startsWith('docker-compose')) {
    return 'docker';
  }
  if (filename === 'Tiltfile' || filename.endsWith('.star')) {
    return 'tilt';
  }
  if (filename === 'vite.config.ts' || filename === 'tsconfig.json' || filename === 'package.json') {
    return 'config';
  }
  if (filename === 'schema.prisma' || filename.includes('migration')) {
    return 'prisma';
  }
  // Check for TDK markers in content
  if (content) {
    const firstLines = content.split('\n').slice(0, 10).join('\n');
    if (firstLines.includes('GENERATED BY TDK') || firstLines.includes('AUTOGENERATED')) {
      return 'generated';
    }
  }
  return 'unknown';
}

/**
 * Get service metadata from filesystem
 */
export function getServiceMetadata(service: DiscoveredService): ServiceMetadata {
  const cacheKey = service.configPath;
  
  if (isCacheValid() && metadataCache.services.has(cacheKey)) {
    return metadataCache.services.get(cacheKey)!;
  }

  const serviceDir = service.path;
  
  // Get timestamps from service.json
  let createdAt = new Date().toISOString();
  let lastModified = createdAt;
  try {
    const stats = statSync(service.configPath);
    createdAt = stats.mtime.toISOString();
    lastModified = stats.mtime.toISOString();
  } catch {
    // Use defaults
  }

  // Check for autogenerated files
  const autogeneratedFiles = discoverAutogeneratedFiles(serviceDir);

  // Check for specific files
  const hasDockerfile = existsSync(join(serviceDir, 'Dockerfile'));
  const hasTiltfile = existsSync(join(serviceDir, 'Tiltfile'));
  const hasDockerCompose = existsSync(join(serviceDir, 'docker-compose.yml')) || 
                          existsSync(join(serviceDir, 'docker-compose.yaml'));

  // Determine service type from name
  let type: 'frontend' | 'backend' | 'lib' = 'backend';
  if (service.name.includes('frontend')) {
    type = 'frontend';
  } else if (service.name.includes('sdk') || service.name.includes('lib') || service.name.includes('infra')) {
    type = 'lib';
  }

  const metadata: ServiceMetadata = {
    name: service.name,
    domain: service.domain || 'unknown',
    stack: service.stack,
    type,
    port: service.config?.port,
    createdAt,
    lastModified,
    dependencies: service.config?.dependencies || service.config?.internalDependencies || [],
    hasDockerfile,
    hasTiltfile,
    hasDockerCompose,
    autogeneratedFiles,
    status: 'unknown', // Will be updated by Tilt status
  };

  // Update cache
  metadataCache.services.set(cacheKey, metadata);
  metadataCache.lastUpdated = Date.now();

  return metadata;
}

/**
 * Discover autogenerated files in a service directory
 */
export function discoverAutogeneratedFiles(serviceDir: string): AutogeneratedFile[] {
  const files: AutogeneratedFile[] = [];
  const autogeneratedPatterns = [
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'Tiltfile',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.build.json',
  ];

  for (const pattern of autogeneratedPatterns) {
    const filePath = join(serviceDir, pattern);
    if (existsSync(filePath)) {
      try {
        const stats = statSync(filePath);
        const content = readFileSync(filePath, 'utf-8');
        
        files.push({
          name: pattern,
          path: filePath,
          type: detectFileType(pattern, content),
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        });
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // Check prisma directory for schema
  const prismaDir = join(serviceDir, 'prisma');
  if (existsSync(prismaDir)) {
    try {
      const entries = readdirSync(prismaDir);
      for (const entry of entries) {
        if (entry === 'schema.prisma' || entry.includes('migration')) {
          const filePath = join(prismaDir, entry);
          const stats = statSync(filePath);
          files.push({
            name: `prisma/${entry}`,
            path: filePath,
            type: 'prisma',
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
          });
        }
      }
    } catch {
      // Skip if prisma dir can't be read
    }
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get aggregated metadata for a stack
 */
export function getStackMetadata(stack: DiscoveredStack): StackMetadata {
  const cacheKey = stack.name;
  
  if (isCacheValid() && metadataCache.stacks.has(cacheKey)) {
    return metadataCache.stacks.get(cacheKey)!;
  }

  // Collect metadata for all services in stack
  const servicesMetadata = stack.services.map(s => getServiceMetadata(s));

  // Find earliest creation time
  const timestamps = servicesMetadata.map(s => new Date(s.createdAt).getTime());
  const earliestTimestamp = Math.min(...timestamps);
  const latestTimestamp = Math.max(...timestamps);

  // Calculate overall status (placeholder - would query Tilt in real implementation)
  const totalServices = servicesMetadata.length;
  const readyCount = servicesMetadata.filter(() => Math.random() > 0.3).length; // Placeholder
  
  let overallStatus: StackMetadata['overallStatus'] = 'unknown';
  if (totalServices > 0) {
    const ratio = readyCount / totalServices;
    if (ratio > 0.9) {
      overallStatus = 'healthy';
    } else if (ratio > 0.5) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'error';
    }
  }

  const metadata: StackMetadata = {
    name: stack.name,
    serviceCount: servicesMetadata.length,
    createdAt: new Date(earliestTimestamp).toISOString(),
    lastModified: new Date(latestTimestamp).toISOString(),
    services: servicesMetadata,
    overallStatus,
  };

  // Update cache
  metadataCache.stacks.set(cacheKey, metadata);
  metadataCache.lastUpdated = Date.now();

  return metadata;
}

/**
 * Query Tilt for resource runtime status
 */
export interface TiltResourceStatus {
  runtimeStatus: 'running' | 'pending' | 'error' | 'unknown';
  buildStatus: 'ok' | 'error' | 'in_progress' | 'unknown';
  lastBuildTime: string | null;
  currentBuildTime: string | null;
  available: boolean;
}

export function getTiltResourceStatus(resourceName: string): TiltResourceStatus {
  const defaultStatus: TiltResourceStatus = {
    runtimeStatus: 'unknown',
    buildStatus: 'unknown',
    lastBuildTime: null,
    currentBuildTime: null,
    available: false,
  };

  try {
    // Try to query Tilt for resource status
    const output = execSync(`tilt get resource ${resourceName} -o json`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const resource = JSON.parse(output);
    const status = resource?.status;

    if (!status) {
      return defaultStatus;
    }

    // Map Tilt status to our status format
    const runtimeStatus = status.runtimeStatus?.toLowerCase() || 'unknown';
    const buildStatus = status.buildStatus?.toLowerCase() || 'unknown';

    return {
      runtimeStatus: ['running', 'pending', 'error'].includes(runtimeStatus) 
        ? runtimeStatus as TiltResourceStatus['runtimeStatus']
        : 'unknown',
      buildStatus: ['ok', 'error', 'in_progress'].includes(buildStatus)
        ? buildStatus as TiltResourceStatus['buildStatus']
        : 'unknown',
      lastBuildTime: status.lastBuildTime || null,
      currentBuildTime: status.currentBuildTime || null,
      available: true,
    };
  } catch {
    // Tilt not available or resource not found
    return defaultStatus;
  }
}
