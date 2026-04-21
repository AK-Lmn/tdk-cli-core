/**
 * LDK (Local Development Kit) Type Definitions
 *
 * Types for service discovery and stack management.
 * Stacks are discovered dynamically from service.json files - no stack.master needed.
 */

/**
 * Represents a discovered service from the Tilt infrastructure
 */
export interface DiscoveredService {
  /** Service name (from appName in service.json or directory name) */
  name: string;

  /** Domain the service belongs to (optional, defaults to 'unknown') */
  domain?: string;

  /** Full path to service directory */
  path: string;

  /** Path to service.json file */
  configPath: string;

  /** Parsed service.json content */
  config?: ServiceConfig;

  /**
   * The stack this service belongs to (from service.json).
   * Each service can belong to exactly one stack.
   */
  stack?: string;
}

/**
 * Partial service.json structure (only fields LDK cares about)
 */
export interface ServiceConfig {
  appName: string;
  appType: 'backend' | 'frontend' | 'library' | 'sdk' | 'worker' | 'migrator';
  domain?: string;
  port?: number;
  replicas?: number;
  runtime: string;
  features?: string[];
  internalDependencies?: string[];
  dependencies?: string[];
  /**
   * The stack this service belongs to.
   * Each service belongs to exactly one stack.
   * Example: "booking-flow"
   */
  stack?: string;
  /**
   * Whether this service is enabled for deployment.
   * Disabled services are shown in the UI but marked as disabled.
   * Services without this field default to enabled (true).
   */
  enabled?: boolean;
}

/**
 * Represents a discovered stack (aggregated from services)
 */
export interface DiscoveredStack {
  /** Stack name */
  name: string;

  /** Human-readable description (derived from services or metadata) */
  description?: string;

  /** Services that belong to this stack */
  services: DiscoveredService[];

  /** Number of services in the stack */
  serviceCount: number;

  /** Domains covered by this stack */
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
