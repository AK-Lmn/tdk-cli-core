/**
 * Shared constants for TDK CLI
 *
 * Consolidates duplicated constants across the codebase to prevent
 * drift and ensure consistency.
 */

/**
 * Optional infrastructure services
 * Used in config.ts enable-infra/disable-infra subcommands
 */
const OPTIONAL_INFRA_SERVICES = [
  'monitoring',
  'elk',
  'debezium',
  'golden_image',
] as const;

/**
 * Valid resource types for the resource command
 */
export const VALID_RESOURCE_TYPES = [
  'backend',
  'frontend',
  'worker',
] as const;

/**
 * Port range configuration by resource type
 * Centralized from resource.ts and platform-standards.ts
 */
export const PORT_RANGES = {
  frontend: { base: 3000, min: 3000, max: 3999 },
  backend: { base: 4000, min: 4000, max: 4999 },
  worker: { base: 6000, min: 6000, max: 6999 },
} as const;


