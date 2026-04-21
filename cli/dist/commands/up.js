/**
 * tdk up command
 *
 * Starts all services that belong to a specific stack, or all services
 * if no stack is specified.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { getServicesForStack, stackExists, discoverServices, discoverStacks } from '../utils/services.js';
import { runTilt, buildTiltUpArgs, isTiltAvailable } from '../utils/tilt.js';
export const upCommand = new Command('up')
    .description('Start all services (optionally filtered by stack)')
    .alias('deploy')
    .argument('[stack-name]', 'Name of the stack to start (optional - runs all if omitted)')
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
        let servicesToStart;
        let stackDescription;
        if (stackName) {
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
            servicesToStart = getServicesForStack(stackName);
            stackDescription = `stack "${stackName}"`;
        }
        else {
            // No stack specified - get all services
            servicesToStart = discoverServices();
            const allStacks = discoverStacks();
            stackDescription = `all stacks (${allStacks.length} stacks, ${servicesToStart.length} services)`;
        }
        if (options.verbose) {
            console.log(chalk.gray(`Found ${servicesToStart.length} services in ${stackDescription}`));
        }
        const serviceNames = servicesToStart.map(s => s.name);
        console.log(chalk.blue(`Starting ${serviceNames.length} service${serviceNames.length === 1 ? '' : 's'} from ${stackDescription}...`));
        serviceNames.forEach(name => {
            console.log(chalk.gray(`  - ${name}`));
        });
        if (options.dryRun) {
            console.log(chalk.gray('\nDry run - not starting services.'));
            console.log(chalk.gray(`Would run: tilt up ${serviceNames.join(' ')}`));
            return;
        }
        // Build tilt up arguments
        const tiltArgs = buildTiltUpArgs(serviceNames, {
            verbose: options.verbose
        });
        // Run tilt up
        console.log(chalk.gray('\nRunning tilt up...'));
        const result = await runTilt('up', tiltArgs, {
            verbose: options.verbose,
            inheritStdio: true // Pass through tilt's output
        });
        if (result.exitCode !== 0) {
            console.error(chalk.red(`\ntilt up failed with exit code ${result.exitCode}`));
            process.exit(result.exitCode);
        }
    }
    catch (err) {
        console.error(chalk.red(`Error: ${err}`));
        process.exit(1);
    }
});
//# sourceMappingURL=up.js.map