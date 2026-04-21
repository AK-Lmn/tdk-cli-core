/**
 * tdk watch command
 *
 * Starts all services in a stack and watches for changes (equivalent to tilt up --watch).
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getServicesForStack, stackExists } from '../utils/services.js';
import { runTilt, buildTiltUpArgs, isTiltAvailable } from '../utils/tilt.js';

export const watchCommand = new Command('watch')
  .description('Start all services in a stack and watch for changes')
  .argument('<stack-name>', 'Name of the stack to watch')
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('--dry-run', 'Show what would be started without starting', false)
  .action(async (stackName, options) => {
    try {
      // Check tilt is available
      if (!await isTiltAvailable()) {
        console.error(chalk.red('Error: tilt CLI not found. Make sure Tilt is installed.'));
        console.error(chalk.gray('See: https://docs.tilt.dev/install.html'));
        process.exit(1);
      }

      // Check if the stack exists
      if (!stackExists(stackName)) {
        console.error(chalk.red(`Error: Stack "${stackName}" not found.`));
        console.error(chalk.gray('\nTo see available stacks, run:'));
        console.error(chalk.gray('  tdk list'));
        console.error(chalk.gray('\nTo add services to this stack, edit their service.json and add:'));
        console.error(chalk.gray(`  "stack": "${stackName}"`));
        process.exit(1);
      }

      // Get services that belong to this stack
      const stackServices = getServicesForStack(stackName);

      if (options.verbose) {
        console.log(chalk.gray(`Found ${stackServices.length} services in stack "${stackName}"`));
      }

      const serviceNames = stackServices.map(s => s.name);

      console.log(chalk.blue(`Starting ${serviceNames.length} service${serviceNames.length === 1 ? '' : 's'} from stack "${stackName}" with watch mode...`));
      serviceNames.forEach(name => {
        console.log(chalk.gray(`  - ${name}`));
      });

      if (options.dryRun) {
        console.log(chalk.gray('\nDry run - not starting services.'));
        console.log(chalk.gray(`Would run: tilt up ${serviceNames.join(' ')} --watch`));
        return;
      }

      // Build tilt up arguments with watch flag
      const tiltArgs = buildTiltUpArgs(serviceNames, {
        verbose: options.verbose,
        watch: true
      });

      // Run tilt up with watch
      console.log(chalk.gray('\nRunning tilt up --watch...'));
      const result = await runTilt('up', tiltArgs, {
        verbose: options.verbose,
        inheritStdio: true  // Pass through tilt's output
      });

      if (result.exitCode !== 0) {
        console.error(chalk.red(`\ntilt up --watch failed with exit code ${result.exitCode}`));
        process.exit(result.exitCode);
      }

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
