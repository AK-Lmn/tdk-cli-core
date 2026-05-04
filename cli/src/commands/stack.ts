import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createDiscoveryContext, clearDiscoveryCache } from '../utils/discovery-context.js';
import { requireProjectRoot, runCommand } from '../utils/errors.js';
import { createKebabCaseValidator } from '../utils/validation.js';
import { formatCount, showCommandHeader, showAllSatisfyCondition } from '../utils/formatting.js';
import { confirmAction } from '../utils/command-helpers.js';
import { writeJsonFile } from '../utils/file-helpers.js';

export const stackCommand = new Command('stack')
  .description('Organize resources into stacks (groups)')
  .argument('[stack-name]', 'Stack name to assign to resources')
  .option('--list', 'List resources without a stack', false)
  .action(async (stackName, options) => {
    await runCommand(async () => {
      requireProjectRoot();

      showCommandHeader('Stack Management');

      const discovery = createDiscoveryContext();

      if (discovery.resources.length === 0) {
        console.log(chalk.yellow('No resources discovered. Make sure you\'re in a project with service.json files.'));
        return;
      }

      console.log(chalk.gray(`Found ${formatCount(discovery.resources.length, 'resource')}\n`));

      if (discovery.stackNames.length > 0) {
        console.log(chalk.bold('Existing stacks:'));
        for (const name of discovery.stackNames) {
          const count = discovery.resourcesByStack.get(name)?.length || 0;
          console.log(chalk.gray(`  - ${name} (${formatCount(count, 'resource')})`));
        }
        console.log();
      }

      if (options.list) {
        if (discovery.unassignedResources.length === 0) {
          showAllSatisfyCondition('resources', 'already assigned to a stack');
          return;
        }

        console.log(chalk.bold(`${discovery.unassignedResources.length} resources without a stack:`));
        for (const resource of discovery.unassignedResources) {
          console.log(chalk.gray(`  - ${resource.name}`));
          console.log(chalk.gray(`    ${resource.configPath}`));
        }
        return;
      }

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

      let resourcesToUpdate = discovery.unassignedResources;

      if (resourcesToUpdate.length === 0) {
        console.log(chalk.yellow('\nNo resources available to add to this stack.'));
        return;
      }

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

      console.log(chalk.gray(`\nWill add "stack": "${targetStack}" to ${formatCount(selectedResources.length, 'resource')}.`));

      const confirmed = await confirmAction('Proceed?', true);
      if (!confirmed) {
        return;
      }

      // Clear cache since we're about to modify resources
      clearDiscoveryCache();

      let updated = 0;
      for (const configPath of selectedResources) {
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        config.stack = targetStack;
        writeJsonFile(configPath, config);

        updated++;
        console.log(chalk.green(`  ✓ ${config.appName || configPath}`));
      }

      console.log();
      console.log(chalk.green(`Updated ${formatCount(updated, 'resource')}.`));
      console.log(chalk.gray(`\nYou can now run: tdk up ${targetStack}`));
    });
  });
