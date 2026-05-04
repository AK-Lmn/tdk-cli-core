import inquirer from 'inquirer';
import type { ValidationResult } from '../types/index.js';
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


