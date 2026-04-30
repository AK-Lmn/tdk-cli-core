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

