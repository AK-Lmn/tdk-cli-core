/**
 * tdk stacks command
 *
 * Lists all unique stacks discovered from service.json files across the project.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { discoverStacks, discoverResources, getAllStacks } from '../utils/services.js';

export const stacksCommand = new Command('stacks')
  .description('List all stacks and their resources')
  .alias('ls')  // Keep 'tdk ls' as shorthand
  .option('-v, --verbose', 'Show detailed information about each stack', false)
  .option('--services', 'Include list of services in each stack', false)
  .action(async (options) => {
    try {
      const resources = discoverResources();
      const stackNames = getAllStacks(resources);

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

        console.log(chalk.blue(`Found ${stacks.length} stack${stacks.length === 1 ? '' : 's'}:\n`));

        for (const stack of stacks) {
          console.log(chalk.bold(`${stack.name}`));
          console.log(chalk.gray(`  ${stack.description}`));

          if (options.services) {
            console.log(chalk.gray('  Resources:'));
            for (const resource of stack.resources) {
              console.log(chalk.gray(`    - ${resource.name}`));
            }
          }

          console.log(); // Empty line between stacks
        }
      } else {
        // Simple output
        console.log(chalk.blue(`Found ${stackNames.length} stack${stackNames.length === 1 ? '' : 's'}:\n`));

        for (const name of stackNames) {
          const stackResources = resources.filter(r => r.stack === name);
          console.log(chalk.bold(`  ${name}`));
          console.log(chalk.gray(`    ${stackResources.length} resource${stackResources.length === 1 ? '' : 's'}`));
        }

        console.log(chalk.gray('\nRun with --verbose for more details, or --services to see all resources in each stack.'));
      }

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });
