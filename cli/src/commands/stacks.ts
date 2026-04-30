/**
 * tdk stacks command
 *
 * Lists all unique stacks discovered from service.json files across the project.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { discoverStacks, discoverResources, getAllStacks } from '../utils/services.js';
import { runCommand } from '../utils/errors.js';
import { formatCount } from '../utils/formatting.js';

export const stacksCommand = new Command('stacks')
  .description('List all stacks and their resources')
  .alias('ls')  // Keep 'tdk ls' as shorthand
  .option('-v, --verbose', 'Show detailed information about each stack', false)
  .option('--services', 'Include list of services in each stack', false)
  .action(async (options) => {
    await runCommand(async () => {
      const services = discoverResources();
      const stackNames = getAllStacks(services);

      if (stackNames.length === 0) {
        console.log(chalk.yellow('No stacks found.'));
        console.log(chalk.gray('\nTo create a stack, use:'));
        console.log(chalk.gray('  tdk stack <stack-name>'));
        console.log(chalk.gray('\nOr create a new resource with a stack:'));
        console.log(chalk.gray('  tdk resource --stack <stack-name>'));
        return;
      }

      if (options.verbose || options.services) {
        // Detailed output
        const stacks = discoverStacks();

        console.log(chalk.blue(`Found ${formatCount(stacks.length, 'stack')}:\n`));

        for (const stack of stacks) {
          console.log(chalk.bold(`${stack.name}`));
          console.log(chalk.gray(`  ${stack.description}`));

          if (options.services) {
            console.log(chalk.gray('  Services:'));
            for (const service of stack.resources) {
              console.log(chalk.gray(`    - ${service.name}`));
            }
          }

          console.log(); // Empty line between stacks
        }
      } else {
        // Simple output
        console.log(chalk.blue(`Found ${formatCount(stackNames.length, 'stack')}:\n`));

        for (const name of stackNames) {
          const stackServices = services.filter((s: {stack?: string}) => s.stack === name);
          console.log(chalk.bold(`  ${name}`));
          console.log(chalk.gray(`    ${formatCount(stackServices.length, 'service')}`));
        }

        console.log(chalk.gray('\nRun with --verbose for more details, or --services to see all services in each stack.'));
      }
    });
  });
