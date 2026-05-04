import inquirer from 'inquirer';
import type { DiscoveredResource, DiscoveredStack, ValidationResult } from '../types/index.js';
import { showCancelled } from './formatting.js';
import { showErrorAndExit } from './errors.js';

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

export function assertValid(
  validation: ValidationResult,
  exitCode: number = 1
): asserts validation is { valid: true } {
  if (!validation.valid) {
    showErrorAndExit(validation.error ?? 'Validation failed', exitCode);
  }
}

export function filterResourcesByStack(
  resources: DiscoveredResource[],
  stackName: string
): DiscoveredResource[] {
  return resources.filter(r => r.stack === stackName);
}

export function extractStackNames(resources: DiscoveredResource[]): string[] {
  const stacks = new Set<string>();
  for (const resource of resources) {
    if (resource.stack) {
      stacks.add(resource.stack);
    }
  }
  return Array.from(stacks).sort();
}

export function getUnassignedResources(resources: DiscoveredResource[]): DiscoveredResource[] {
  return resources.filter(r => !r.stack);
}

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


