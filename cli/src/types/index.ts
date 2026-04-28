/**
 * TDK (Tilt Development Kit) Type Definitions
 *
 * Types for resource discovery and stack management.
 * Stacks are discovered dynamically from service.json files - no stack.master needed.
 */

/**
 * Represents a discovered resource from the Tilt infrastructure
 */
export interface DiscoveredResource {
  /** Resource name (from appName in service.json or directory name) */
  name: string;

  /** Full path to resource directory */
  path: string;

  /** Path to service.json file */
  configPath: string;

  /** Parsed service.json content */
  config?: ResourceConfig;

  /**
   * The stack this resource belongs to (from service.json).
   * Each resource can belong to exactly one stack.
   */
  stack?: string;

  /** Resource port (extracted from config for convenience) */
  port?: number;

  /** Resource type (extracted from config for convenience) */
  type?: string;
}

/**
 * @deprecated Use DiscoveredResource instead
 */
export type DiscoveredService = DiscoveredResource;

/**
 * Partial service.json structure (only fields TDK cares about)
 */
export interface ResourceConfig {
  appName: string;
  appType: 'backend' | 'frontend' | 'library' | 'sdk' | 'worker' | 'migrator';
  stack?: string;
  port?: number;
  replicas?: number;
  runtime: string;
  features?: string[];
  internalDependencies?: string[];
  dependencies?: string[];
  /**
   * Whether this resource is enabled for deployment.
   * Disabled resources are shown in the UI but marked as disabled.
   * Resources without this field default to enabled (true).
   */
  enabled?: boolean;
  /**
   * Base path for Traefik routing.
   * Used to construct the public URL: http://{host}/{basePath}
   * Example: "/identity-management"
   */
  basePath?: string;
  /**
   * Backend resource name this frontend connects to.
   */
  backendName?: string;

  /**
   * @deprecated Use stack instead
   */
  domain?: string;
}

/**
 * @deprecated Use ResourceConfig instead
 */
export type ServiceConfig = ResourceConfig;

/**
 * Represents a discovered stack (aggregated from resources)
 */
export interface DiscoveredStack {
  /** Stack name */
  name: string;

  /** Human-readable description (derived from resources or metadata) */
  description?: string;

  /** Resources that belong to this stack */
  resources: DiscoveredResource[];

  /** Number of resources in the stack */
  resourceCount: number;
}

/**
 * @deprecated Use resources and resourceCount instead
 */
export interface LegacyDiscoveredStack extends DiscoveredStack {
  /** @deprecated Use resources instead */
  services: DiscoveredResource[];
  /** @deprecated Use resourceCount instead */
  serviceCount: number;
  /** @deprecated Not used anymore */
  domains: string[];
}

/**
 * Options passed to CLI commands
 */
export interface CLIOptions {
  /** Enable verbose output */
  verbose?: boolean;
}

/**
 * Result of executing a tilt command
 */
export interface TiltCommandResult {
  /** Exit code from tilt process */
  exitCode: number;

  /** stdout output */
  stdout: string;

  /** stderr output */
  stderr: string;
}
