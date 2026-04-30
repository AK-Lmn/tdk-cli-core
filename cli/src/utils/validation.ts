/** Shared validation utilities for TDK CLI */

import { OPTIONAL_INFRA_SERVICES, VALID_RESOURCE_TYPES } from './constants.js';

/**
 * Regex pattern for kebab-case validation (lowercase letters, numbers, hyphens)
 */
const KEBAB_CASE_REGEX = /^[a-z0-9-]+$/;

/**
 * Validates that a string is in kebab-case format
 *
 * @param value - The string to validate
 * @returns True if valid kebab-case, false otherwise
 */
function isKebabCase(value: string): boolean {
  return KEBAB_CASE_REGEX.test(value);
}

/**
 * Validates a resource name and returns a detailed result
 *
 * @param name - The resource name to validate
 * @returns Validation result with optional error
 */
export function validateResourceName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Resource name is required' };
  }
  if (!isKebabCase(name)) {
    return {
      valid: false,
      error: 'Use lowercase letters, numbers, and hyphens only',
    };
  }
  return { valid: true };
}

/**
 * Creates an inquirer validation function for kebab-case input
 *
 * @param context - What is being validated ('resource' or 'stack')
 * @returns Validation function for inquirer prompts
 */
export function createKebabCaseValidator(context: 'resource' | 'stack') {
  return (input: string): true | string => {
    if (!input.trim()) {
      return context === 'resource'
        ? 'Resource name is required'
        : 'Stack name is required';
    }
    if (!isKebabCase(input)) {
      return context === 'resource'
        ? 'Use lowercase letters, numbers, and hyphens only'
        : 'Use kebab-case (lowercase, numbers, hyphens only)';
    }
    return true;
  };
}

/**
 * Validates an optional infrastructure service name
 *
 * @param service - The service name to validate
 * @returns Validation result with optional error
 */
export function validateOptionalInfraService(service: string): { valid: boolean; error?: string } {
  if (OPTIONAL_INFRA_SERVICES.includes(service as typeof OPTIONAL_INFRA_SERVICES[number])) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `Invalid service. Must be one of: ${OPTIONAL_INFRA_SERVICES.join(', ')}`,
  };
}

/**
 * Validates a resource type
 *
 * @param type - The resource type to validate
 * @returns Validation result with optional error
 */
export function validateResourceType(type: string): { valid: boolean; error?: string } {
  if (VALID_RESOURCE_TYPES.includes(type as typeof VALID_RESOURCE_TYPES[number])) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `Invalid resource type: ${type}. Must be one of: ${VALID_RESOURCE_TYPES.join(', ')}`,
  };
}
