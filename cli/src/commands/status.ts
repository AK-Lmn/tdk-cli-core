/**
 * tdk status command
 *
 * Shows the current status of services and stacks.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { discoverStacks, discoverServices } from '../utils/services.js';
import { isTiltAvailable, runTilt } from '../utils/tilt.js';

export const statusCommand = new Command('status')
  .description('Show status of services and stacks')
  .option('-v, --verbose', 'Show detailed information', false)
  .option('--stacks', 'Show stack information (default)', true)
  .option('--services', 'Show all discovered services', false)
  .option('--tilt', 'Show tilt resource status', false)
  .action(async (options) => {
    try {
      // Check tilt availability
      const tiltAvailable = await isTiltAvailable();

      console.log(chalk.blue('TDK Status\n'));

      // Show tilt status
      console.log(chalk.bold('Tilt:'), tiltAvailable ? chalk.green('available') : chalk.red('not found'));

      if (!tiltAvailable) {
        console.log(chalk.gray('  Install Tilt: https://docs.tilt.dev/install.html'));
      }

      console.log();

      // Discover services
      const services = discoverServices();
      console.log(chalk.bold('Services:'), `${services.length} discovered`);

      // Show stacks
      const stacks = discoverStacks();
      console.log(chalk.bold('Stacks:'), `${stacks.length} defined`);

      if (stacks.length > 0) {
        for (const stack of stacks) {
          const servicesInStack = stack.services.length;
          console.log(chalk.gray(`  - ${stack.name}: ${servicesInStack} service${servicesInStack === 1 ? '' : 's'}`));

          if (options.verbose) {
            for (const service of stack.services) {
              console.log(chalk.gray(`      ${service.name} (${service.domain})`));
            }
          }
        }
      }

      // Show services without stacks
      const servicesWithoutStack = services.filter(s => !s.stack);
      if (servicesWithoutStack.length > 0) {
        console.log();
        console.log(chalk.yellow(`${servicesWithoutStack.length} service${servicesWithoutStack.length === 1 ? '' : 's'} not in any stack:`));

        if (options.verbose) {
          for (const service of servicesWithoutStack) {
            console.log(chalk.gray(`  - ${service.name} (${service.domain})`));
          }
        }
      }

      // Show tilt resource status if requested
      if (options.tilt && tiltAvailable) {
        console.log();
        console.log(chalk.blue('Tilt Resources:'));

        const result = await runTilt('get', ['resources'], { inheritStdio: false });

        if (result.exitCode === 0) {
          console.log(result.stdout || chalk.gray('  No active tilt resources'));
        } else {
          console.log(chalk.gray('  Could not retrieve tilt resource status'));
        }
      }

      console.log();
      console.log(chalk.gray('Run "tdk list-stacks" to see all stacks.'));
      console.log(chalk.gray('Run "tdk up <stack-name>" to start a stack.'));

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
