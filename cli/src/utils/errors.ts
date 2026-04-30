/** Enhanced error messages with colors and suggestions */

import chalk from 'chalk';
import { findProjectRoot } from './paths.js';

class TdkError extends Error {
  public suggestions: string[];
  public exitCode: number;

  constructor(
    message: string,
    suggestions: string[] = [],
    exitCode: number = 1
  ) {
    super(message);
    this.name = 'TdkError';
    this.suggestions = suggestions;
    this.exitCode = exitCode;
  }

  display(): void {
    console.error(chalk.red(`❌ ${this.message}`));

    if (this.suggestions.length > 0) {
      console.error(chalk.yellow('\n💡 Suggestions:'));
      this.suggestions.forEach(s => {
        console.error(chalk.cyan(`   → ${s}`));
      });
    }
  }
}

// Common error factories
export const errorFactories = {
  tiltNotInstalled: () => new TdkError(
    'Tilt CLI is not installed',
    [
      'Install Tilt: `brew install tilt` (macOS)',
      'Or download from: https://docs.tilt.dev/install.html',
      'Verify with: `tilt version`'
    ]
  ),
};

export function requireProjectRoot(): string {
  const projectRoot = findProjectRoot();
  if (!projectRoot) {
    console.error(chalk.red('Error: Could not find project root (no Tiltfile found).'));
    console.error(chalk.gray('Run this from within a project that has a Tiltfile.'));
    process.exit(1);
  }
  return projectRoot;
}

function handleCommandError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`Error: ${message}`));
  process.exit(1);
}

export async function runCommand<T>(
  action: () => Promise<T>,
  options?: { verbose?: boolean }
): Promise<T | never> {
  try {
    return await action();
  } catch (err) {
    if (options?.verbose && err instanceof Error) {
      console.error(chalk.gray(err.stack || ''));
    }
    return handleCommandError(err);
  }
}
