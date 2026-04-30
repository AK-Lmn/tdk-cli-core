/**
 * Shared validation utilities for TDK CLI
 *
 * Consolidates validation logic that was previously duplicated
 * across resource.ts, stack.ts, and test files.
 */

import { VALID_RESOURCE_TYPES, OPTIONAL_INFRA_SERVICES } from './constants.js';

/**
 * Validates that a string is in kebab-case format
 *
 * @param value - The string to validate
 * @returns True if valid kebab-case, false otherwise
 */
function isKebabCase(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
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
    const result = context === 'resource'
      ? validateResourceName(input)
      : validateStackName(input);
    return result.valid ? true : result.error!;
  };
}
