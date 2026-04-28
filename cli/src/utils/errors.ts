/**
 * Enhanced error messages with colors and suggestions
 */

import chalk from 'chalk';

interface ErrorContext {
  command?: string;
  resource?: string;
  stack?: string;
  port?: number;
}

export class TdkError extends Error {
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
export const Errors = {
  notInProject: () => new TdkError(
    'Not in a TDK project directory',
    [
      'Run `tdk project` to initialize a new project',
      'Make sure you have a Tiltfile in your project root',
      'Navigate to your project directory and try again'
    ]
  ),

  resourceNotFound: (name: string) => new TdkError(
    `Resource "${name}" not found`,
    [
      `Run \`tdk resources\` to see all available resources`,
      `Run \`tdk resource ${name}\` to create it`,
      'Check for typos in the resource name'
    ]
  ),

  stackNotFound: (name: string) => new TdkError(
    `Stack "${name}" not found`,
    [
      `Run \`tdk stacks\` to see all available stacks`,
      `Run \`tdk stack ${name}\` to create and assign resources`,
      'Check for typos in the stack name'
    ]
  ),

  portInUse: (port: number, resource?: string) => new TdkError(
    `Port ${port} is already in use${resource ? ` by "${resource}"` : ''}`,
    [
      'Run `tdk resources --ports` to see all port assignments',
      resource ? `Stop "${resource}" first with \`tdk down\`` : 'Stop the conflicting service',
      'Edit service.json to use a different port manually',
      'Check for zombie processes: lsof -i :' + port
    ]
  ),

  noResourcesToStack: () => new TdkError(
    'No resources available to assign to a stack',
    [
      'Run `tdk resource <name>` to create resources first',
      'Run `tdk resources --no-stack` to see unassigned resources',
      'All resources may already be assigned to a stack'
    ]
  ),

  masterConfigMissing: () => new TdkError(
    'Master configuration files are missing',
    [
      'Run `tdk project` to create TILT_RESOURCE_DEFAULTS.star and TILT_TECH_STACK.star',
      'These files control platform-wide settings like port ranges and tech stack'
    ]
  ),

  dockerNotRunning: () => new TdkError(
    'Docker daemon is not running',
    [
      'Start Docker Desktop (macOS/Windows)',
      'Run `sudo systemctl start docker` (Linux)',
      'Check Docker status: `docker info`'
    ]
  ),

  bunNotInstalled: () => new TdkError(
    'Bun runtime is not installed',
    [
      'Install Bun: `curl -fsSL https://bun.sh/install | bash`',
      'Add Bun to PATH: `export PATH="$HOME/.bun/bin:$PATH"`',
      'Restart your terminal after installation'
    ]
  ),

  tiltNotInstalled: () => new TdkError(
    'Tilt CLI is not installed',
    [
      'Install Tilt: `brew install tilt` (macOS)',
      'Or download from: https://docs.tilt.dev/install.html',
      'Verify with: `tilt version`'
    ]
  ),

  invalidResourceName: (name: string) => new TdkError(
    `Invalid resource name: "${name}"`,
    [
      'Use lowercase letters, numbers, and hyphens only',
      'Example: my-api, frontend-app, worker-queue',
      'Avoid special characters and spaces'
    ]
  ),

  invalidStackName: (name: string) => new TdkError(
    `Invalid stack name: "${name}"`,
    [
      'Use lowercase letters, numbers, and hyphens only (kebab-case)',
      'Example: identity-stack, payment-gateway, data-pipeline',
      'Keep names descriptive but concise'
    ]
  ),

  resourceAlreadyExists: (name: string) => new TdkError(
    `Resource "${name}" already exists`,
    [
      `Run \`tdk resources | grep ${name}\` to find it`,
      `Use a different name: \`tdk resource ${name}-v2\``,
      'Delete the existing resource first if you want to recreate it'
    ]
  ),

  serviceJsonInvalid: (path: string, reason: string) => new TdkError(
    `Invalid service.json at ${path}: ${reason}`,
    [
      'Check JSON syntax with: `cat ' + path + ' | jq .`',
      'Ensure all required fields are present (appName, stack, type)',
      'Run `tdk doctor` to check for configuration issues'
    ]
  ),

  dependencyNotMet: (dependency: string, version?: string) => new TdkError(
    `Required dependency "${dependency}"${version ? ` (v${version})` : ''} not found`,
    [
      `Install ${dependency}${version ? `@${version}` : ''}`,
      'Run `tdk doctor` for full environment check',
      'See README.md for setup instructions'
    ]
  ),

  noServicesDiscovered: () => new TdkError(
    'No services discovered in this directory',
    [
      'Make sure you are in a project with service.json files',
      'Run `tdk resources` to see discovered resources',
      'Check that your Tiltfile is in the project root',
      'Ensure services are in the expected directory structure'
    ]
  ),

  networkError: (url: string) => new TdkError(
    `Network error connecting to ${url}`,
    [
      'Check your internet connection',
      'Verify the URL is correct',
      'Check if a firewall or proxy is blocking the connection',
      'Try again in a few moments'
    ]
  ),

  permissionDenied: (path: string) => new TdkError(
    `Permission denied: ${path}`,
    [
      'Check file permissions: `ls -la ' + path + '`',
      'Run with appropriate permissions (avoid sudo)',
      'Check if the file is owned by another user'
    ]
  ),
};

// Helper to wrap async functions with error handling
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TdkError) {
      error.display();
      process.exit(error.exitCode);
    }
    
    // Handle specific error types
    const err = error as Error;
    const message = err.message.toLowerCase();
    
    if (message.includes('eaddrinuse') || message.includes('port')) {
      const portMatch = err.message.match(/:(\d+)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : undefined;
      Errors.portInUse(port || 0).display();
    } else if (message.includes('enoent') || message.includes('no such file')) {
      Errors.notInProject().display();
    } else if (message.includes('eacces') || message.includes('permission denied')) {
      Errors.permissionDenied(context?.resource || 'unknown').display();
    } else {
      console.error(chalk.red(`❌ ${err.message}`));
      if (context) {
        console.error(chalk.gray(`   Context: ${JSON.stringify(context)}`));
      }
    }
    
    process.exit(1);
  }
}
