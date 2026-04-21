/**
 * tdk init command
 *
 * Interactive command to add a "stack" field to service.json files.
 * This helps organize services into logical groups for development.
 */
import { Command } from 'commander';
import { writeFileSync, readFileSync } from 'node:fs';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { discoverServices, getAllStacks, findProjectRoot } from '../utils/services.js';
export const initCommand = new Command('init')
    .description('Add stack field to service.json files (interactive)')
    .argument('[stack-name]', 'Stack name to assign to services')
    .option('--list', 'List services without a stack', false)
    .action(async (stackName, options) => {
    try {
        const projectRoot = findProjectRoot();
        if (!projectRoot) {
            console.error(chalk.red('Error: Could not find project root (no Tiltfile found).'));
            process.exit(1);
        }
        console.log(chalk.blue('TDK Stack Initialization\n'));
        // Discover all services
        const allServices = discoverServices();
        if (allServices.length === 0) {
            console.log(chalk.yellow('No services discovered. Make sure you\'re in a project with service.json files.'));
            return;
        }
        console.log(chalk.gray(`Found ${allServices.length} services\n`));
        // Show existing stacks
        const existingStacks = getAllStacks(allServices);
        if (existingStacks.length > 0) {
            console.log(chalk.bold('Existing stacks:'));
            existingStacks.forEach(name => {
                const count = allServices.filter(s => s.stack === name).length;
                console.log(chalk.gray(`  - ${name} (${count} service${count === 1 ? '' : 's'})`));
            });
            console.log();
        }
        // Find services without a stack
        const servicesWithoutStack = allServices.filter(s => !s.stack);
        if (options.list) {
            // Just list services without stacks
            if (servicesWithoutStack.length === 0) {
                console.log(chalk.green('All services are already assigned to a stack!'));
                return;
            }
            console.log(chalk.bold(`${servicesWithoutStack.length} services without a stack:`));
            for (const service of servicesWithoutStack) {
                console.log(chalk.gray(`  - ${service.name} (${service.domain})`));
                console.log(chalk.gray(`    ${service.configPath}`));
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
                    validate: (input) => {
                        if (!input.trim())
                            return 'Stack name is required';
                        if (!/^[a-z0-9-]+$/.test(input))
                            return 'Use lowercase letters, numbers, and hyphens only';
                        return true;
                    }
                }]);
            targetStack = name;
        }
        // Find services in a specific domain (optional filter)
        const domains = [...new Set(servicesWithoutStack.map(s => s.domain))].sort();
        let servicesToUpdate = servicesWithoutStack;
        if (domains.length > 1) {
            const { filterByDomain } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'filterByDomain',
                    message: 'Filter services by domain?',
                    default: false
                }]);
            if (filterByDomain) {
                const { selectedDomain } = await inquirer.prompt([{
                        type: 'list',
                        name: 'selectedDomain',
                        message: 'Select domain:',
                        choices: domains
                    }]);
                servicesToUpdate = servicesWithoutStack.filter(s => s.domain === selectedDomain);
            }
        }
        if (servicesToUpdate.length === 0) {
            console.log(chalk.yellow('\nNo services available to add to this stack.'));
            return;
        }
        // Let user select which services to add
        const { selectedServices } = await inquirer.prompt([{
                type: 'checkbox',
                name: 'selectedServices',
                message: `Select services to add to stack "${targetStack}":`,
                choices: servicesToUpdate.map(s => ({
                    name: `${s.name} (${s.domain})`,
                    value: s.configPath,
                    checked: false
                })),
                validate: (input) => {
                    if (input.length === 0)
                        return 'Select at least one service';
                    return true;
                }
            }]);
        if (selectedServices.length === 0) {
            console.log(chalk.yellow('No services selected. Exiting.'));
            return;
        }
        // Confirm
        console.log(chalk.gray(`\nWill add "stack": "${targetStack}" to ${selectedServices.length} service${selectedServices.length === 1 ? '' : 's'}.`));
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
        for (const configPath of selectedServices) {
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
            }
            catch (err) {
                console.error(chalk.red(`  ✗ Failed to update ${configPath}: ${err}`));
            }
        }
        console.log();
        console.log(chalk.green(`Updated ${updated} service${updated === 1 ? '' : 's'}.`));
        console.log(chalk.gray(`\nYou can now run: tdk up ${targetStack}`));
    }
    catch (err) {
        console.error(chalk.red(`Error: ${err}`));
        process.exit(1);
    }
});
//# sourceMappingURL=init.js.map