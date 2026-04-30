/**
 * tdk resources command
 *
 * Lists all resources (services) discovered from service.json files.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { discoverResources } from '../utils/services.js';
import { requireProjectRoot, runCommand } from '../utils/errors.js';
import { formatCount } from '../utils/formatting.js';

export const resourcesCommand = new Command('resources')
  .description('List all resources (services) in the project')
  .option('-v, --verbose', 'Show detailed information about each resource', false)
  .option('-s, --stack <stack>', 'Filter resources by stack name')
  .option('--no-stack', 'Show only resources without a stack')
  .option('--ports', 'Show port assignments', false)
  .action(async (options) => {
    await runCommand(async () => {
      requireProjectRoot();

      const allResources = discoverResources();

      if (allResources.length === 0) {
        console.log(chalk.yellow('No resources found.'));
        console.log(chalk.gray('\nTo create a resource:'));
        console.log(chalk.gray('  tdk resource <name>'));
        return;
      }

      let resources = allResources;

      if (options.stack) {
        resources = resources.filter(r => r.stack === options.stack);
        if (resources.length === 0) {
          console.log(chalk.yellow(`No resources found in stack "${options.stack}".`));
          return;
        }
      }

      if (options.noStack) {
        resources = resources.filter(r => !r.stack);
        if (resources.length === 0) {
          console.log(chalk.green('All resources are assigned to a stack!'));
          return;
        }
      }

      console.log(chalk.blue(`Found ${formatCount(resources.length, 'resource')}:\n`));

      if (options.verbose || options.ports) {
        for (const resource of resources) {
          console.log(chalk.bold(`${resource.name}`));

          if (resource.stack) {
            console.log(chalk.gray(`  Stack: ${resource.stack}`));
          } else {
            console.log(chalk.yellow(`  Stack: (not assigned)`));
          }

          if (options.ports && resource.port) {
            console.log(chalk.gray(`  Port: ${resource.port}`));
          }

          if (options.verbose) {
            console.log(chalk.gray(`  Type: ${resource.type || 'unknown'}`));
            console.log(chalk.gray(`  Path: ${resource.configPath}`));
          }

          console.log();
        }
      } else {
        for (const resource of resources) {
          const stackInfo = resource.stack ? chalk.gray(` [${resource.stack}]`) : chalk.yellow(' [no stack]');
          console.log(`  ${resource.name}${stackInfo}`);
        }

        console.log(chalk.gray('\nRun with --verbose for more details or --ports to see port assignments.'));
      }

      const withoutStack = resources.filter((r: {stack?: string}) => !r.stack).length;
      if (withoutStack > 0 && !options.noStack) {
        console.log(chalk.yellow(`\n${formatCount(withoutStack, 'resource')} not assigned to any stack.`));
        console.log(chalk.gray('Run "tdk resources --no-stack" to see them, or "tdk stack" to assign them.'));
      }
    });
  });
