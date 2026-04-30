/**
 * tdk stack command
 *
 * Organize resources (services) into logical stacks.
 * Stacks are groups of resources that can be started together with `tdk up <stack>`.
 * This modifies existing resource.json files to add a "stack" field.
 */

import { Command } from 'commander';
import { writeFileSync, readFileSync } from 'node:fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { discoverResources, getAllStacks } from '../utils/services.js';
import { requireProjectRoot, runCommand } from '../utils/errors.js';
import { createKebabCaseValidator } from '../utils/validation.js';
import { formatCount } from '../utils/formatting.js';

export const stackCommand = new Command('stack')
  .description('Organize resources into stacks (groups)')
  .argument('[stack-name]', 'Stack name to assign to resources')
  .option('--list', 'List resources without a stack', false)
  .action(async (stackName, options) => {
    await runCommand(async () => {
      requireProjectRoot();

      console.log(chalk.blue('TDK Stack Management\n'));

      // Discover all resources
      const allResources = discoverResources();

      if (allResources.length === 0) {
        console.log(chalk.yellow('No resources discovered. Make sure you\'re in a project with service.json files.'));
        return;
      }

      console.log(chalk.gray(`Found ${formatCount(allResources.length, 'resource')}\n`));

      // Show existing stacks
      const existingStacks = getAllStacks(allResources);
      if (existingStacks.length > 0) {
        console.log(chalk.bold('Existing stacks:'));
        existingStacks.forEach(name => {
          const count = allResources.filter(r => r.stack === name).length;
          console.log(chalk.gray(`  - ${name} (${formatCount(count, 'resource')})`));
        });
        console.log();
      }

      const resourcesWithoutStack = allResources.filter(r => !r.stack);

      if (options.list) {
        // Just list resources without stacks
        if (resourcesWithoutStack.length === 0) {
          console.log(chalk.green('All resources are already assigned to a stack!'));
          return;
        }

        console.log(chalk.bold(`${resourcesWithoutStack.length} resources without a stack:`));
        for (const resource of resourcesWithoutStack) {
          console.log(chalk.gray(`  - ${resource.name}`));
          console.log(chalk.gray(`    ${resource.configPath}`));
        }
        return;
      }

      // If no stack name provided, ask for it
      let targetStack = stackName;
      if (!targetStack) {
        const { name } = await inquirer.prompt([{
          type: 'input',
          name: 'name',
          message: 'Stack name (kebab-case recommended):',
          validate: createKebabCaseValidator('stack')
        }]);
        targetStack = name;
      }

      let resourcesToUpdate = resourcesWithoutStack;

      if (resourcesToUpdate.length === 0) {
        console.log(chalk.yellow('\nNo resources available to add to this stack.'));
        return;
      }

      // Let user select which resources to add
      const { selectedResources } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedResources',
        message: `Select resources to add to stack "${targetStack}":`,
        choices: resourcesToUpdate.map(r => ({
          name: r.name,
          value: r.configPath,
          checked: false
        })),
        validate: (input: string[]) => {
          if (input.length === 0) return 'Select at least one resource';
          return true;
        }
      }]);

      if (selectedResources.length === 0) {
        console.log(chalk.yellow('No resources selected. Exiting.'));
        return;
      }

      // Confirm
      console.log(chalk.gray(`\nWill add "stack": "${targetStack}" to ${formatCount(selectedResources.length, 'resource')}.`));

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed?',
        default: true
      }]);

      if (!confirm) {
        console.log(chalk.yellow('Cancelled.'));
        return;
      }

      let updated = 0;
      for (const configPath of selectedResources) {
        try {
          const content = readFileSync(configPath, 'utf-8');
          const config = JSON.parse(content);
          config.stack = targetStack;
          const updatedContent = JSON.stringify(config, null, 2) + '\n';
          writeFileSync(configPath, updatedContent, 'utf-8');

          updated++;
          console.log(chalk.green(`  ✓ ${config.appName || configPath}`));
        } catch (err) {
          console.error(chalk.red(`  ✗ Failed to update ${configPath}: ${err}`));
        }
      }

      console.log();
      console.log(chalk.green(`Updated ${formatCount(updated, 'resource')}.`));
      console.log(chalk.gray(`\nYou can now run: tdk up ${targetStack}`));
    });
  });
