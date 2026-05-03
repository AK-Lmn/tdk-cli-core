import chalk from 'chalk';
import { findProjectRoot } from './paths.js';
import { isTiltAvailable } from './tilt.js';

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

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

/**
 * Wrapper that combines runCommand with Tilt availability check.
 * Consolidates the common pattern of checking Tilt before running a command.
 *
 * @param action - The async action to execute
 * @param options - Optional configuration for verbose output
 * @returns The result of the action, or never if an error occurs
 */
export async function withTiltCheck<T>(
  action: () => Promise<T>,
  options?: { verbose?: boolean }
): Promise<T | never> {
  if (!await isTiltAvailable()) {
    errorFactories.tiltNotInstalled().display();
    process.exit(1);
  }
  return runCommand(action, options);
}

/**
 * Display an error message and exit with a specific code.
 * Consolidates the common pattern of error display + process exit.
 *
 * @param message - The error message to display
 * @param exitCode - The exit code (defaults to 1)
 */
export function showErrorAndExit(message: string, exitCode: number = 1): never {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(exitCode);
}
