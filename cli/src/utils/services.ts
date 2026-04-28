/**
 * Resource discovery utilities
 *
 * Discovers resources by scanning the filesystem for service.json files.
 * Stacks are discovered dynamically - no stack.master files needed.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { cwd } from 'node:process';
import { execSync } from 'node:child_process';
import type { DiscoveredResource, ResourceConfig, DiscoveredStack } from '../types/index.js';
import type { FileType } from '../components/FileTree.js';

const RESOURCE_JSON_FILENAME = 'service.json';



/**
 * Find the project root by looking for .tdk/project.json
 */
export function findProjectRoot(startDir: string = cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = resolve('/');

  while (currentDir !== root) {
    // Check for new TDK project structure (.tdk/project.json)
    if (existsSync(join(currentDir, '.tdk', 'project.json'))) {
      return currentDir;
    }

    // Legacy: Check for Tiltfile in root (deprecated)
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
      } else if (entry.isFile() && entry.name === RESOURCE_JSON_FILENAME) {
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
 * Parse a service.json file into DiscoveredResource
 */
function parseResource(serviceJsonPath: string): DiscoveredResource | null {
  try {
    const content = readFileSync(serviceJsonPath, 'utf-8');
    const config = JSON.parse(content) as ResourceConfig;

    // Validate required fields (appName is required)
    if (!config.appName) {
      return null;
    }

    const resourceDir = dirname(serviceJsonPath);

    return {
      name: config.appName,
      path: resourceDir,
      configPath: serviceJsonPath,
      config,
      stack: config.stack || config.domain, // Support both new and legacy field
    };
  } catch {
    return null;
  }
}

/**
 * @deprecated Use parseResource instead
 */
function parseService(serviceJsonPath: string): DiscoveredResource | null {
  return parseResource(serviceJsonPath);
}

/**
 * Discover all resources from the project
 *
 * Scans the filesystem for service.json files and parses them.
 *
 * @param options - Discovery options
 * @returns Array of discovered resources
 */
export function discoverResources(): DiscoveredResource[] {
  const projectRoot = findProjectRoot();

  if (!projectRoot) {
    throw new Error('Could not find project root (no Tiltfile found). Make sure you\'re in a root project.');
  }

  // Find all service.json files
  const serviceJsonPaths = findServiceJsonFiles(projectRoot);

  // Parse each service.json file
  const resources = serviceJsonPaths
    .map(path => parseResource(path))
    .filter((r): r is DiscoveredResource => r !== null);

  return resources;
}

/**
 * @deprecated Use discoverResources instead
 */
export function discoverServices(): DiscoveredResource[] {
  return discoverResources();
}

/**
 * Get all unique stack names from discovered resources
 *
 * @returns Array of unique stack names, sorted alphabetically
 */
export function getAllStacks(resources?: DiscoveredResource[]): string[] {
  const resourcesToScan = resources || discoverResources();
  const stacks = new Set<string>();

  for (const resource of resourcesToScan) {
    if (resource.stack) {
      stacks.add(resource.stack);
    }
  }

  return Array.from(stacks).sort();
}

/**
 * @deprecated Use getAllStacks(resources) instead
 */
export function getAllStacksFromServices(services?: DiscoveredResource[]): string[] {
  return getAllStacks(services);
}

/**
 * Discover all stacks with their associated resources
 *
 * @param options - Discovery options
 * @returns Array of discovered stacks with resources
 */
export function discoverStacks(): DiscoveredStack[] {
  const resources = discoverResources();
  const stackMap = new Map<string, DiscoveredResource[]>();

  // Group resources by stack
  for (const resource of resources) {
    if (resource.stack) {
      if (!stackMap.has(resource.stack)) {
        stackMap.set(resource.stack, []);
      }
      stackMap.get(resource.stack)!.push(resource);
    }
  }

  // Build DiscoveredStack objects
  const stacks: DiscoveredStack[] = [];
  for (const [name, stackResources] of stackMap) {
    stacks.push({
      name,
      description: `${stackResources.length} resource${stackResources.length === 1 ? '' : 's'}`,
      resources: stackResources,
      resourceCount: stackResources.length,
    });
  }

  // Sort by name
  return stacks.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get resources that belong to a specific stack.
 *
 * @param stackName - Name of the stack to filter by
 * @returns Resources belonging to the stack
 */
export function getResourcesForStack(stackName: string): DiscoveredResource[] {
  const allResources = discoverResources();
  return allResources.filter(r => r.stack === stackName);
}

/**
 * @deprecated Use getResourcesForStack instead
 */
export function getServicesForStack(stackName: string): DiscoveredResource[] {
  return getResourcesForStack(stackName);
}

/**
 * Check if a stack exists (has any resources)
 *
 * @param stackName - Name of the stack to check
 * @returns True if the stack has at least one resource
 */
export function stackExists(stackName: string): boolean {
  const resources = getResourcesForStack(stackName);
  return resources.length > 0;
}

// =============================================================================
// METADATA COLLECTION & CACHING
// =============================================================================

interface MetadataCache {
  resources: Map<string, ResourceMetadata>;
  stacks: Map<string, StackMetadata>;
  lastUpdated: number;
}

const CACHE_TTL = 5000; // 5 seconds

const metadataCache: MetadataCache = {
  resources: new Map(),
  stacks: new Map(),
  lastUpdated: 0,
};

export interface ResourceMetadata {
  name: string;
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

  /**
   * @deprecated Use stack instead
   */
  domain?: string;
}

/**
 * @deprecated Use ResourceMetadata instead
 */
export type ServiceMetadata = ResourceMetadata;

export interface StackMetadata {
  name: string;
  resourceCount: number;
  createdAt: string;
  lastModified: string;
  resources: ResourceMetadata[];
  overallStatus: 'healthy' | 'degraded' | 'error' | 'unknown';

  /**
   * @deprecated Use resourceCount instead
   */
  serviceCount?: number;
  /**
   * @deprecated Use resources instead
   */
  services?: ResourceMetadata[];
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
  metadataCache.resources.clear();
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
 * Get resource metadata from filesystem
 */
export function getResourceMetadata(resource: DiscoveredResource): ResourceMetadata {
  const cacheKey = resource.configPath;
  
  if (isCacheValid() && metadataCache.resources.has(cacheKey)) {
    return metadataCache.resources.get(cacheKey)!;
  }

  const resourceDir = resource.path;
  
  // Get timestamps from service.json
  let createdAt = new Date().toISOString();
  let lastModified = createdAt;
  try {
    const stats = statSync(resource.configPath);
    createdAt = stats.mtime.toISOString();
    lastModified = stats.mtime.toISOString();
  } catch {
    // Use defaults
  }

  // Check for autogenerated files
  const autogeneratedFiles = discoverAutogeneratedFiles(resourceDir);

  // Check for specific files
  const hasDockerfile = existsSync(join(resourceDir, 'Dockerfile'));
  const hasTiltfile = existsSync(join(resourceDir, 'Tiltfile'));
  const hasDockerCompose = existsSync(join(resourceDir, 'docker-compose.yml')) || 
                          existsSync(join(resourceDir, 'docker-compose.yaml'));

  // Determine resource type from name
  let type: 'frontend' | 'backend' | 'lib' = 'backend';
  if (resource.name.includes('frontend')) {
    type = 'frontend';
  } else if (resource.name.includes('sdk') || resource.name.includes('lib') || resource.name.includes('infra')) {
    type = 'lib';
  }

  const metadata: ResourceMetadata = {
    name: resource.name,
    stack: resource.stack,
    type,
    port: resource.config?.port,
    createdAt,
    lastModified,
    dependencies: resource.config?.dependencies || resource.config?.internalDependencies || [],
    hasDockerfile,
    hasTiltfile,
    hasDockerCompose,
    autogeneratedFiles,
    status: 'unknown', // Will be updated by Tilt status
  };

  // Update cache
  metadataCache.resources.set(cacheKey, metadata);
  metadataCache.lastUpdated = Date.now();

  return metadata;
}

/**
 * @deprecated Use getResourceMetadata instead
 */
export function getServiceMetadata(service: DiscoveredResource): ResourceMetadata {
  return getResourceMetadata(service);
}

/**
 * Discover autogenerated files in a resource directory
 */
export function discoverAutogeneratedFiles(resourceDir: string): AutogeneratedFile[] {
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
    const filePath = join(resourceDir, pattern);
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
  const prismaDir = join(resourceDir, 'prisma');
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

  // Collect metadata for all resources in stack
  const resourcesMetadata = stack.resources.map(r => getResourceMetadata(r));

  // Find earliest creation time
  const timestamps = resourcesMetadata.map(r => new Date(r.createdAt).getTime());
  const earliestTimestamp = Math.min(...timestamps);
  const latestTimestamp = Math.max(...timestamps);

  // Calculate overall status (placeholder - would query Tilt in real implementation)
  const totalResources = resourcesMetadata.length;
  const readyCount = resourcesMetadata.filter(() => Math.random() > 0.3).length; // Placeholder
  
  let overallStatus: StackMetadata['overallStatus'] = 'unknown';
  if (totalResources > 0) {
    const ratio = readyCount / totalResources;
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
    resourceCount: resourcesMetadata.length,
    createdAt: new Date(earliestTimestamp).toISOString(),
    lastModified: new Date(latestTimestamp).toISOString(),
    resources: resourcesMetadata,
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
