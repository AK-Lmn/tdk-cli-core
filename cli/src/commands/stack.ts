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
import { discoverServices, getAllStacks, findProjectRoot } from '../utils/services.js';

export const stackCommand = new Command('stack')
  .description('Organize resources into stacks (groups)')
  .argument('[stack-name]', 'Stack name to assign to resources')
  .option('--list', 'List resources without a stack', false)
  .action(async (stackName, options) => {
    try {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error(chalk.red('Error: Could not find project root (no Tiltfile found).'));
        process.exit(1);
      }

      console.log(chalk.blue('TDK Stack Management\n'));

      // Discover all resources
      const allResources = discoverServices();

      if (allResources.length === 0) {
        console.log(chalk.yellow('No resources discovered. Make sure you\'re in a project with service.json files.'));
        return;
      }

      console.log(chalk.gray(`Found ${allResources.length} resources\n`));

      // Show existing stacks
      const existingStacks = getAllStacks(allResources);
      if (existingStacks.length > 0) {
        console.log(chalk.bold('Existing stacks:'));
        existingStacks.forEach(name => {
          const count = allResources.filter(s => s.stack === name).length;
          console.log(chalk.gray(`  - ${name} (${count} resource${count === 1 ? '' : 's'})`));
        });
        console.log();
      }

      // Find resources without a stack
      const resourcesWithoutStack = allResources.filter(s => !s.stack);

      if (options.list) {
        // Just list resources without stacks
        if (resourcesWithoutStack.length === 0) {
          console.log(chalk.green('All resources are already assigned to a stack!'));
          return;
        }

        console.log(chalk.bold(`${resourcesWithoutStack.length} resources without a stack:`));
        for (const resource of resourcesWithoutStack) {
          console.log(chalk.gray(`  - ${resource.name} (${resource.domain})`));
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
          validate: (input: string) => {
            if (!input.trim()) return 'Stack name is required';
            if (!/^[a-z0-9-]+$/.test(input)) return 'Use lowercase letters, numbers, and hyphens only';
            return true;
          }
        }]);
        targetStack = name;
      }

      // Find resources in a specific domain (optional filter)
      const domains = [...new Set(resourcesWithoutStack.map(s => s.domain))].sort();
      let resourcesToUpdate = resourcesWithoutStack;

      if (domains.length > 1) {
        const { filterByDomain } = await inquirer.prompt([{
          type: 'confirm',
          name: 'filterByDomain',
          message: 'Filter resources by domain?',
          default: false
        }]);

        if (filterByDomain) {
          const { selectedDomain } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedDomain',
            message: 'Select domain:',
            choices: domains
          }]);

          resourcesToUpdate = resourcesWithoutStack.filter(s => s.domain === selectedDomain);
        }
      }

      if (resourcesToUpdate.length === 0) {
        console.log(chalk.yellow('\nNo resources available to add to this stack.'));
        return;
      }

      // Let user select which resources to add
      const { selectedResources } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedResources',
        message: `Select resources to add to stack "${targetStack}":`,
        choices: resourcesToUpdate.map(s => ({
          name: `${s.name} (${s.domain})`,
          value: s.configPath,
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
      console.log(chalk.gray(`\nWill add "stack": "${targetStack}" to ${selectedResources.length} resource${selectedResources.length === 1 ? '' : 's'}.`));

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

      // Update the selected service.json files
      let updated = 0;
      for (const configPath of selectedResources) {
        try {
          const content = readFileSync(configPath, 'utf-8');
          const config = JSON.parse(content);

          // Add or update stack field
          config.stack = targetStack;

          // Write back with proper formatting
          const updatedContent = JSON.stringify(config, null, 2) + '\n';
          writeFileSync(configPath, updatedContent, 'utf-8');

          updated++;
          console.log(chalk.green(`  ✓ ${config.appName || configPath}`));
        } catch (err) {
          console.error(chalk.red(`  ✗ Failed to update ${configPath}: ${err}`));
        }
      }

      console.log();
      console.log(chalk.green(`Updated ${updated} resource${updated === 1 ? '' : 's'}.`));
      console.log(chalk.gray(`\nYou can now run: tdk up ${targetStack}`));

    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });

// Keep backward compatibility - export as initCommand too
export const initCommand = stackCommand;
