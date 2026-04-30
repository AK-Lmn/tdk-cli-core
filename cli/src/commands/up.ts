/**
 * tdk up command
 *
 * Starts all services that belong to a specific stack, or all services
 * if no stack is specified.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { getResourcesForStack, stackExists, discoverResources, discoverStacks } from '../utils/services.js';
import { runTilt, buildTiltUpArgs, isTiltAvailable, findAvailablePort } from '../utils/tilt.js';

export const upCommand = new Command('up')
  .description('Start all services (optionally filtered by stack)')
  .alias('deploy')
  .argument('[stack-name]', 'Name of the stack to start (optional - runs all if omitted)')
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('--dry-run', 'Show what would be started without starting', false)
  .option('-f, --force', 'Kill existing Tilt process before starting', false)
  .action(async (stackName, options) => {
    try {
      // Check tilt is available
      if (!await isTiltAvailable()) {
        console.error(chalk.red('Error: tilt CLI not found. Make sure Tilt is installed.'));
        console.error(chalk.gray('See: https://docs.tilt.dev/install.html'));
        process.exit(1);
      }

      let servicesToStart: Awaited<ReturnType<typeof discoverResources>>;
      let stackDescription: string;

      if (stackName) {
        // Check if the stack exists
        if (!stackExists(stackName)) {
          console.error(chalk.red(`Error: Stack "${stackName}" not found.`));
          console.error(chalk.gray('\nTo see available stacks, run:'));
          console.error(chalk.gray('  tdk list'));
          console.error(chalk.gray('\nTo add services to this stack, edit their service.json and add:'));
          console.error(chalk.gray(`  "stack": "${stackName}"`));
          process.exit(1);
        }

          servicesToStart = getResourcesForStack(stackName);
        stackDescription = `stack "${stackName}"`;
      } else {
        // No stack specified - get all resources
        servicesToStart = discoverResources();
        const allStacks = discoverStacks();
        stackDescription = `all stacks (${allStacks.length} stacks, ${servicesToStart.length} services)`;
      }

      if (options.verbose) {
        console.log(chalk.gray(`Found ${servicesToStart.length} services in ${stackDescription}`));
      }

      const serviceNames = servicesToStart.map(s => s.name);

      console.log(chalk.blue(`Starting ${serviceNames.length} service${serviceNames.length === 1 ? '' : 's'} from ${stackDescription}...`));
      serviceNames.forEach(name => {
        console.log(chalk.gray(`  - ${name}`));
      });

      if (options.dryRun) {
        console.log(chalk.gray('\nDry run - not starting services.'));
        console.log(chalk.gray(`Would run: tilt up ${serviceNames.join(' ')}`));
        return;
      }

      // Handle force flag - kill existing Tilt if running
      if (options.force) {
        try {
          console.log(chalk.yellow('Force flag set - killing any existing Tilt processes...'));
          execSync('killall tilt 2>/dev/null || true', { shell: '/bin/sh', stdio: 'pipe' });
          // Give it a moment to fully shut down
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch {
          // Ignore errors from killall (e.g., no processes to kill)
        }
      }

      // Check if default port 10350 is available, auto-find next available if not
      const basePort = 10350;
      let port = basePort;
      
      // If TILT_PORT is already set in env, use that
      if (process.env.TILT_PORT) {
        port = parseInt(process.env.TILT_PORT, 10);
      } else {
        // Auto-detect available port
        const availablePort = await findAvailablePort(basePort, 10);
        if (availablePort && availablePort !== basePort) {
          port = availablePort;
          console.log(chalk.yellow(`⚠️  Port ${basePort} is already in use`));
          console.log(chalk.blue(`🔄 Auto-switching to port ${port}\n`));
        }
      }
      
      process.env.TILT_PORT = port.toString();

      // Build tilt up arguments (includes Tiltfile path)
      const tiltArgs = buildTiltUpArgs(serviceNames, {
        verbose: options.verbose,
        force: options.force
      });

      // Run tilt up
      console.log(chalk.gray('\nRunning tilt up...'));
      console.log(chalk.gray(`Using Tiltfile: .tdk/.tdk-out/Tiltfile`));
      console.log(chalk.gray(`Tilt UI: http://localhost:${port}/\n`));
      const result = await runTilt('up', tiltArgs, {
        verbose: options.verbose,
        inheritStdio: true  // Pass through tilt's output
      });

      if (result.exitCode !== 0) {
        console.error(chalk.red(`\ntilt up failed with exit code ${result.exitCode}`));
        process.exit(result.exitCode);
      }

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
