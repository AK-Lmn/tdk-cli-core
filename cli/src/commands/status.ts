import { Command } from 'commander';
import chalk from 'chalk';
import { createDiscoveryContext } from '../utils/discovery-context.js';
import { isTiltAvailable, runTilt, getTiltfilePath } from '../utils/tilt.js';
import { runCommand } from '../utils/errors.js';
import { formatCount } from '../utils/formatting.js';

export const statusCommand = new Command('status')
  .description('Show status of resources and stacks')
  .option('-v, --verbose', 'Show detailed information', false)
  .option('--stacks', 'Show stack information (default)', true)
  .option('--resources', 'Show all discovered resources', false)
  .option('--tilt', 'Show tilt resource status', false)
  .action(async (options) => {
    await runCommand(async () => {
      const tiltAvailable = await isTiltAvailable();

      console.log(chalk.blue('TDK Status\n'));
      console.log(chalk.bold('Tilt:'), tiltAvailable ? chalk.green('available') : chalk.red('not found'));

      if (!tiltAvailable) {
        console.log(chalk.gray('  Install Tilt: https://docs.tilt.dev/install.html'));
      }

      console.log();

      const discovery = createDiscoveryContext();
      console.log(chalk.bold('Resources:'), `${discovery.resources.length} discovered`);
      console.log(chalk.bold('Stacks:'), `${discovery.stacks.length} defined`);

      if (discovery.stacks.length > 0) {
        for (const stack of discovery.stacks) {
          const resourcesInStack = stack.resources.length;
          console.log(chalk.gray(`  - ${stack.name}: ${formatCount(resourcesInStack, 'resource')}`));

          if (options.verbose) {
            for (const resource of stack.resources) {
              console.log(chalk.gray(`      ${resource.name}`));
            }
          }
        }
      }

      if (discovery.unassignedResources.length > 0) {
        console.log();
        console.log(chalk.yellow(`${formatCount(discovery.unassignedResources.length, 'resource')} not in any stack:`));

        if (options.verbose) {
          for (const resource of discovery.unassignedResources) {
            console.log(chalk.gray(`  - ${resource.name}`));
          }
        }
      }

      if (options.tilt && tiltAvailable) {
        console.log();
        console.log(chalk.blue('Tilt Resources:'));

        const tiltfilePath = getTiltfilePath();
        const result = await runTilt('get', ['-f', tiltfilePath, 'resources'], { inheritStdio: false });

        if (result.exitCode === 0) {
          console.log(result.stdout || chalk.gray('  No active tilt resources'));
        } else {
          console.log(chalk.gray('  Could not retrieve tilt resource status'));
        }
      }

      console.log();
      console.log(chalk.gray('Run "tdk list-stacks" to see all stacks.'));
      console.log(chalk.gray('Run "tdk up <stack-name>" to start a stack.'));
    });
  });
