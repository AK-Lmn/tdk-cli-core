import chalk from 'chalk';
import { findProjectRoot } from './paths.js';

/**
 * Extract a human-readable error message from an unknown error value.
 * Handles Error objects, strings, and any other type safely.
 *
 * @param err - The error value (unknown type from catch blocks)
 * @returns A string representation of the error
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Log a verbose message if TDK_VERBOSE environment variable is set.
 * Automatically extracts error messages from Error objects.
 *
 * @param message - The base message to log
 * @param err - Optional error to append to the message
 */
export function logVerbose(message: string, err?: unknown): void {
  if (process.env.TDK_VERBOSE) {
    const errMsg = err !== undefined ? `: ${getErrorMessage(err)}` : '';
    console.warn(chalk.gray(`${message}${errMsg}`));
  }
}

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
  console.error(chalk.red(`Error: ${getErrorMessage(err)}`));
  process.exit(1);
}

export async function runCommand<T>(
  action: () => Promise<T>,
  options?: { verbose?: boolean }
): Promise<T | never> {
  try {
    return await action();
  } catch (err: unknown) {
    if (options?.verbose && err instanceof Error) {
      console.error(chalk.gray(err.stack || ''));
    }
    return handleCommandError(err);
  }
}
