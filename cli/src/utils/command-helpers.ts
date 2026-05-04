import inquirer from 'inquirer';
import type { DiscoveredResource, DiscoveredStack, ValidationResult } from '../types/index.js';
import { showCancelled } from './formatting.js';
import { showErrorAndExit } from './errors.js';

/**
 * Prompt user for confirmation before proceeding with an action.
 *
 * @param message - The confirmation message to display
 * @param defaultValue - Default value for the prompt (default: true)
 * @returns Promise resolving to true if confirmed, false if cancelled
 */
export async function confirmAction(message: string, defaultValue = true): Promise<boolean> {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message,
    default: defaultValue
  }]);

  if (!confirm) {
    showCancelled();
  }

  return confirm;
}

/**
 * Assert that a validation result is valid, otherwise exit with error.
 * Type guard that narrows the validation result.
 *
 * @param validation - The validation result to check
 * @param exitCode - Exit code to use if validation fails (default: 1)
 * @throws Never returns if validation fails (process exits)
 */
export function assertValid(
  validation: ValidationResult,
  exitCode: number = 1
): asserts validation is { valid: true } {
  if (!validation.valid) {
    showErrorAndExit(validation.error ?? 'Validation failed', exitCode);
  }
}

/**
 * Filter resources by stack name.
 *
 * @param resources - Array of resources to filter
 * @param stackName - Stack name to filter by
 * @returns Filtered array of resources belonging to the stack
 */
export function filterResourcesByStack(
  resources: DiscoveredResource[],
  stackName: string
): DiscoveredResource[] {
  return resources.filter(r => r.stack === stackName);
}

/**
 * Get unique stack names from a list of resources.
 *
 * @param resources - Array of resources
 * @returns Sorted array of unique stack names
 */
export function extractStackNames(resources: DiscoveredResource[]): string[] {
  const stacks = new Set<string>();
  for (const resource of resources) {
    if (resource.stack) {
      stacks.add(resource.stack);
    }
  }
  return Array.from(stacks).sort();
}

/**
 * Get resources that are not assigned to any stack.
 *
 * @param resources - Array of resources
 * @returns Array of unassigned resources
 */
export function getUnassignedResources(resources: DiscoveredResource[]): DiscoveredResource[] {
  return resources.filter(r => !r.stack);
}

/**
 * Group resources by their stack assignment.
 *
 * @param resources - Array of resources
 * @returns Map of stack name to array of resources
 */
export function groupResourcesByStack(
  resources: DiscoveredResource[]
): Map<string, DiscoveredResource[]> {
  const groups = new Map<string, DiscoveredResource[]>();

  for (const resource of resources) {
    if (resource.stack) {
      const stackResources = groups.get(resource.stack) || [];
      stackResources.push(resource);
      groups.set(resource.stack, stackResources);
    }
  }

  return groups;
}

/**
 * Check if dry run mode is enabled and print what would happen.
 *
 * @param options - Options object containing dryRun flag
 * @param description - Description of what would happen
 * @param command - The command that would be executed
 * @returns True if dry run mode (caller should return), false if should proceed
 */
export function handleDryRun(
  options: { dryRun?: boolean },
  description: string,
  command: string
): boolean {
  if (options.dryRun) {
    console.log(`Dry run - ${description}`);
    console.log(`Would run: ${command}`);
    return true;
  }
  return false;
}

// ============================================================================
// Prompt Factory Functions
// Standardized inquirer prompt patterns to reduce duplication
// ============================================================================

/**
 * Create a confirmation prompt configuration.
 * Use with inquirer.prompt([confirmPrompt(message, defaultValue)])
 */
export function confirmPrompt(message: string, defaultValue = true): inquirer.Question {
  return {
    type: 'confirm',
    name: 'confirm',
    message,
    default: defaultValue
  };
}

/**
 * Create a text input prompt with kebab-case validation.
 * Use with inquirer.prompt([kebabCasePrompt(message, context)])
 */
export function kebabCasePrompt(
  message: string,
  context: 'resource' | 'stack'
): inquirer.Question {
  return {
    type: 'input',
    name: 'inputName',
    message,
    validate: createKebabCaseValidator(context)
  };
}

/**
 * Prompt for confirmation with standardized cancellation handling.
 * Returns true if confirmed, false if cancelled (and shows cancelled message).
 */
export async function promptConfirm(message: string, defaultValue = true): Promise<boolean> {
  const { confirm } = await inquirer.prompt([confirmPrompt(message, defaultValue)]);
  if (!confirm) {
    showCancelled();
  }
  return confirm;
}
